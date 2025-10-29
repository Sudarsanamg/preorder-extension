import { useState, useCallback, useEffect } from "react";
import type {
  LoaderFunctionArgs,
  ActionFunctionArgs} from "@remix-run/node";
import {
  json,
  redirect,
} from "@remix-run/node";
import {
  AppProvider,
  Button,
  ButtonGroup,
  Text,
  TextField,
  Page,
  RadioButton,
  Card,
  Icon,
  Tabs,
  Banner,
  InlineStack,
  
  Spinner,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  useSubmit,
  useNavigate,
  useActionData,
  useLoaderData,
  useNavigation,
} from "@remix-run/react";
import {
  DeleteIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker } from "@shopify/app-bridge/actions";
import { Modal, TitleBar, SaveBar } from "@shopify/app-bridge-react";
import {
  createPreorderCampaign,
  addProductsToCampaign,
  updateCampaignStatus,
} from "../models/campaign.server";
import { useAppBridge } from "../components/AppBridgeProvider";
import PreviewDesign from "app/components/PreviewDesign";
import type { CampaignFields, DesignFields } from "../types/type";
import {
  GET_COLLECTION_PRODUCTS,
  GET_SHOP_WITH_PLAN,
  isShopifyPaymentsEnabled,
} from "app/graphql/queries/shop";
import {
  GET_PRODUCTS_WITH_PREORDER,
  SET_PREORDER_METAFIELDS,
} from "app/graphql/mutation/metafields";
import { createSellingPlan } from "app/services/sellingPlan.server";
import { CREATE_CAMPAIGN } from "../graphql/mutation/metaobject";
import { applyDiscountToVariants } from "app/helper/applyDiscountToVariants";
import type {
  DiscountType,
  Fulfilmentmode,
  scheduledFulfilmentType,
} from "@prisma/client";
import { formatCurrency } from "app/helper/currencyFormatter";
import { formatDate } from "app/utils/formatDate";
import { allowOutOfStockForVariants } from "app/graphql/mutation/sellingPlan";
import CampaignForm from "app/components/CampaignForm";
import { isStoreRegistered } from "app/helper/isStoreRegistered";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin ,session} = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP_WITH_PLAN);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const plusStore = data.data.shop.plan.shopifyPlus;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const shopDomain = session.shop;
  const isStoreExist = await isStoreRegistered(shopDomain);
    if(!isStoreExist){
      return Response.json({ success: false, error: "Store not found" }, { status: 404 });
    }
  const shopifyPaymentsEnabled = await isShopifyPaymentsEnabled(shopDomain);

  switch (intent) {
    case "fetchProductsInCollection": {
      const collectionId = url.searchParams.get("collectionId");

      try {
        const response = await admin.graphql(GET_COLLECTION_PRODUCTS, {
          variables: { id: collectionId },
        });

        const resData: any = (await response.json)
          ? await response.json()
          : response;

        const prod = resData.data.collection.products.edges.flatMap(
          (edge: any) => {
            const node = edge.node;

            return node.variants.edges.map((v: any) => ({
              productId: node.id,
              productTitle: node.title,
              handle: node.handle,
              productImage: node.images.edges[0]?.node?.url || null, 
              variantId: v.node.id,
              variantTitle: v.node.displayName,
              variantPrice: v.node.price,
              variantInventory: v.node.inventoryQuantity,
              maxUnit: 0,
            }));
          },
        );

        return json({ prod });
      } catch (error) {
        console.error(error);
      }
    }
  }

  return json({ success: true, shopId, plusStore ,shopifyPaymentsEnabled });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent");
    let admin;
    try {
      const auth = await authenticate.admin(request);
      admin = auth.admin;
      const { session } = await authenticate.admin(request);
      const shopDomain = session.shop;
      const isStoreExist = await isStoreRegistered(shopDomain);
      if(!isStoreExist){
        return Response.json({ success: false, error: "Store not found" }, { status: 404 });
      }

    } catch (err) {
      console.error("Admin authentication failed:", err);
      return json({ error: "Admin authentication failed" }, { status: 500 });
    }

    switch (intent) {
      case "create-campaign":
      case "SAVE": {
        const campaign = await createPreorderCampaign({
          name: formData.get("name") as string,
          shopId: formData.get("shopId") as string,
          depositPercent: Number(formData.get("depositPercent")),
          balanceDueDate: new Date(formData.get("balanceDueDate") as string),
          refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
          releaseDate: formData.get("campaignEndDate")
            ? new Date(formData.get("campaignEndDate") as string)
            : undefined,
          orderTags: JSON.parse((formData.get("orderTags") as string) || "[]"),
          customerTags: JSON.parse(
            (formData.get("customerTags") as string) || "[]",
          ),
          discountType: formData.get("discountType") as DiscountType,
          discountPercent: Number(formData.get("discountPercentage") || "0"),
          discountFixed: Number(formData.get("flatDiscount") || "0"),
          campaignType: Number(formData.get("campaignType")),
          getDueByValt: formData.get("getDueByValt") == "true" ? true : false,
          totalOrders: 0,
          fulfilmentmode: formData.get("fulfilmentmode") as Fulfilmentmode,
          scheduledFulfilmentType: formData.get(
            "scheduledFulfilmentType",
          ) as scheduledFulfilmentType,
          fulfilmentDaysAfter: Number(formData.get("fulfilmentDaysAfter")),
          fulfilmentExactDate: new Date(
            formData.get("fulfilmentDate") as string,
          ),
          paymentType: formData.get("paymentMode") as string ,
          campaignEndDate: new Date(formData.get("campaignEndDate") as string),
        });

        const products = JSON.parse(
          (formData.get("products") as string) || "[]",
        );

        if (products.length > 0) {
          await addProductsToCampaign(campaign.id, products ,formData.get("shopId") as string);

          // -------------------------------
          // PREORDER METAFIELDS UPDATE
          // -------------------------------
          const metafields = products.flatMap((product: any) => [
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: String(campaign.id),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "preorder",
              type: "boolean",
              value: intent === "SAVE" ? "false" : "true",
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "preorder_end_date",
              type: "date_time",
              value: new Date(
                formData.get("campaignEndDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "deposit_percent",
              type: "number_integer",
              value: String(formData.get("depositPercent") || "0"),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "balance_due_date",
              type: "date",
              value: new Date(
                formData.get("balanceDueDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "preorder_max_units",
              type: "number_integer",
              value: String(product?.maxUnit || "0"),
            },
            {
              ownerId: product.variantId,
              namespace: "custom",
              key: "preorder_units_sold",
              type: "number_integer",
              value: "0",
            },
          ]);

          const productMetafields = products.flatMap((product: any) => [
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: String(campaign.id),
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "preorder",
              type: "boolean",
              value: intent === "SAVE" ? "false" : "true",
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "preorder_end_date",
              type: "date_time",
              value: new Date(
                formData.get("campaignEndDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "deposit_percent",
              type: "number_integer",
              value: String(formData.get("depositPercent") || "0"),
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "balance_due_date",
              type: "date",
              value: new Date(
                formData.get("balanceDueDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "preorder_max_units",
              type: "number_integer",
              value: String(product?.maxUnit || "0"),
            },
            {
              ownerId: product.productId,
              namespace: "custom",
              key: "preorder_units_sold",
              type: "number_integer",
              value: "0",
            },
          ]);
          // if (intent !== "SAVE") {
          try {
            await admin.graphql(SET_PREORDER_METAFIELDS, {
              variables: { metafields },
            });

            await admin.graphql(SET_PREORDER_METAFIELDS, {
              variables: { metafields: productMetafields },
            });
          } catch (err) {
            console.error("GraphQL mutation failed:", err);
            throw err;
          }
        }
        // }

        if (intent !== "SAVE") {
          const discountType = formData.get("discountType") as DiscountType;

          const varientIds = products.map((p: any) => p.variantId);
          await applyDiscountToVariants(
            admin,
            varientIds,
            discountType,
            Number(formData.get("discountPercentage") || 0),
            Number(formData.get("flatDiscount") || 0),
          );

          await createSellingPlan(
            admin,
            formData.get("paymentMode") as "partial" | "full",
            products,
            formData,
            {
              fulfillmentMode: formData.get("fulfilmentmode") as Fulfilmentmode,
              collectionMode: formData.get(
                "collectionMode",
              ) as scheduledFulfilmentType,
              fulfillmentDate: new Date(
                formData.get("fulfilmentDate") as string,
              ).toISOString(),
              customDays: Number(formData.get("paymentAfterDays") as string),
              balanceDueDate: new Date(
                formData.get("balanceDueDate") as string,
              ).toISOString(),
            },
          );
          if (
            formData.get("campaignType") == "1" ||
            formData.get("campaignType") == "2"
          ) {
            allowOutOfStockForVariants(admin, products);
          }

        }

        const designFields = JSON.parse(formData.get("designFields") as string);
        const campaignFields = [
          {
            key: "object",
            value: JSON.stringify({
              campaignData: {
                campaign_id: String(campaign.id),
                name: (formData.get("name") as string) || "Untitled Campaign",
                status: "publish",
                button_text:
                  (formData.get("buttonText") as string) || "Preorder",
                shipping_message:
                  (formData.get("shippingMessage") as string) ||
                  "Ship as soon as possible",
                payment_type: (formData.get("paymentMode") as string) || "Full",
                payment_schedule: {
                  type: formData.get(
                    "collectionMode",
                  ) as scheduledFulfilmentType,
                  value:
                    (formData.get(
                      "collectionMode",
                    ) as scheduledFulfilmentType) === "DAYS_AFTER"
                      ? formData.get("paymentAfterDays")
                      : new Date(
                          formData.get("balanceDueDate") as string,
                        ).toISOString(),
                },
                ppercent: String(formData.get("depositPercent") || "0"),
                paymentduedate: new Date(
                  (formData.get("balanceDueDate") as string) || Date.now(),
                ).toISOString(),
                campaign_end_date: new Date(
                  (formData.get("campaignEndDate") as string) || Date.now(),
                ).toISOString(),
                discount_type:
                  (formData.get("discountType") as string) || "none",
                discountpercent:
                  (formData.get("discountPercentage") as string) || "0",
                discountfixed: (formData.get("flatDiscount") as string) || "0",
                campaigntags: JSON.parse(
                  (formData.get("orderTags") as string) || "[]",
                ).join(","),
                campaigntype: String(formData.get("campaignType") as string),
                fulfillment: {
                  type: formData.get("fulfilmentmode") as Fulfilmentmode,
                  schedule: {
                    type: formData.get("scheduledFulfilmentType") as scheduledFulfilmentType ,
                    value: formData.get("scheduledFulfilmentType") as scheduledFulfilmentType  === "DAYS_AFTER" ? formData.get("fulfilmentDaysAfter")  : new Date(formData.get("fulfilmentDate") as string).toISOString(),
                  },
                },
              },
              designFields: {
                ...designFields,
              },
            }),
          },
        ];

        const response = await admin.graphql(CREATE_CAMPAIGN, {
          variables: {
            fields: [
              { key: "campaign_id", value: String(campaign.id) },
              ...campaignFields,
            ],
          },
        });

        const result = await response.json();
        console.log("campaign Metaobject:", JSON.stringify(result, null, 2));

        await updateCampaignStatus(
          campaign.id,
          intent === "SAVE" ? "DRAFT" : "PUBLISHED",
        );

        return redirect("/app");
      }

      case "productsWithPreorder": {
        let productIds = JSON.parse(formData.get("products") as string);

        productIds = productIds.map((product: any) => product.variantId);

        const response = await admin.graphql(GET_PRODUCTS_WITH_PREORDER, {
          variables: { ids: productIds },
        });
        const data = await response.json();

        const productsWithPreorder = data.data.nodes.map((product: any) => ({
          id: product.id,
          title: product.title,
          preorder: product?.metafield?.value == "true",
        }));

        return json({ productsWithPreorder });
      }

      default:
        console.warn("Unknown intent:", intent);
        return json({ error: "Unknown intent" }, { status: 400 });
    }
  } catch (err) {
    console.error("Action failed:", err);
    return json({ error: "Unexpected error occurred" }, { status: 500 });
  }
};

export default function Newcampaign() {
  let { prod, shopId, plusStore ,shopifyPaymentsEnabled } = useLoaderData<typeof loader>() as {
    prod: any[];
    shopId: string;
    plusStore: boolean;
    shopifyPaymentsEnabled: boolean;
  };
  const { productsWithPreorder } = useActionData<typeof action>() ?? {
    productsWithPreorder: [],
  };
  const navigation = useNavigation();
  // const [collectionProducts, setCollectionProducts] = useState(prod);
  const submit = useSubmit();
  const navigate = useNavigate();
  const [selected, setSelected] = useState(0);
  const [productTagInput, setProductTagInput] = useState("");
  const [customerTagInput, setCustomerTagInput] = useState("");
  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
    duePaymentDate: new Date(),
    campaignEndDate: new Date(),
    fullfillmentSchedule: new Date(),
  });
  const [popoverActive, setPopoverActive] = useState({
    duePaymentDate: false,
    fullfillmentSchedule: false,
    campaignEndDate: false,
  });
  const [warningPopoverActive, setWarningPopoverActive] = useState(false);
  const [productRadio, setproductRadio] = useState("option1");
  const [selectedProducts, setSelectedProducts] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignEndPicker, setCampaignEndPicker] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selected: { start: new Date(), end: new Date() },
    popoverActive: false,
    inputValue: new Date().toLocaleDateString(),
  });
  const [campaignData,setCampaignData] = useState<CampaignFields>({
    campaignName:"",
    campaignType:2,
    productTags:["Preorder"],
    customerTags:[
    "Preorder-Customer",
  ],
  preOrderNoteKey:"Note",
  preOrderNoteValue:"Preorder",
  buttonText:"Preorder",
  shippingMessage:"Ship as soon as possible",
  partialPaymentPercentage:"10",
  paymentMode:"partial",
  partialPaymentType:"percent",
  duePaymentType:2,
  campaignEndTime:"00:00",
  fulfilmentMode:"UNFULFILED",
  scheduledFullfillmentType:1,
  scheduledDays:"0",
  paymentAfterDays:"0",
  fullPaymentText:"Full Payment",
  partialPaymentText:"Partial Payment",
  partialPaymentInfoText:"Pay {payment} now and {remaining} will be charged on {date}",
  discountType:"PERCENTAGE",
  discountPercentage:0,
  flatDiscount:0,
  getPaymentsViaValtedPayments:shopifyPaymentsEnabled
  })
  const [designFields, setDesignFields] = useState<DesignFields>({
    messageFontSize: "16",
    messageColor: "#000000",
    fontFamily: "Helvetica",
    buttonStyle: "single",
    buttonBackgroundColor: "#000000",
    gradientDegree: "0",
    gradientColor1: "#000000",
    gradientColor2: "#000000",
    borderSize: "3",
    borderColor: "#000000",
    spacingIT: "10",
    spacingIB: "10",
    spacingOT: "10",
    spacingOB: "10",
    borderRadius: "5",
    preorderMessageColor: "#000000",
    buttonFontSize: "16",
    buttonTextColor: "#ffffff",
  });
  
  const [activeButtonIndex, setActiveButtonIndex] = useState(0);
  
  
  const payment = 3.92;
  const remaining = 35.28;
  const [loading, setLoading] = useState(false);
  const [buttonLoading, SetButtonLoading] = useState({
    add: false,
    remove: false,
    cancel: false,
    addAll: false,
    publish: false,
    draft: false,
  });
  const [saveBarVisible, setSaveBarVisible] = useState(false);

  const formattedText = campaignData.partialPaymentInfoText
    .replace("{payment}", `$${payment}`)
    .replace("{remaining}", `$${remaining}`)
    .replace(
      "{date}",
      formatDate(selectedDates.duePaymentDate.toLocaleDateString()),
    );

  const handleClick = async (action: string) => {
    SetButtonLoading((prev: any) => ({ ...prev, [action]: !prev[action] }));
  };

  const handleCampaignEndMonthChange = useCallback(
    (newMonth: any, newYear: any) => {
      setCampaignEndPicker((prev) => ({
        ...prev,
        month: newMonth,
        year: newYear,
      }));
    },
    [],
  );

const handleCampaignDataChange = <K extends keyof CampaignFields>(field: K, value: CampaignFields[K]) => {
  setCampaignData((prevData) => ({
    ...prevData,
    [field]: value
  }));
};

  const openResourcePicker = () => {
    shopify.modal.hide("my-modal");

    const picker = ResourcePicker.create(appBridge, {
      resourceType:
        productRadio === "option1"
          ? ResourcePicker.ResourceType.Product
          : ResourcePicker.ResourceType.Collection,
      options: {
        selectMultiple: true,
        initialSelectionIds: selectedProducts.map((v: any) => ({
          id: v.productId,
          variants: [{ id: v.variantId }],
        })),
      },
    });

    picker.subscribe(ResourcePicker.Action.SELECT, async (payload) => {
      if (productRadio === "option1") {
        const products = payload.selection.flatMap((p: any) =>
          p.variants.map((v: any) => ({
            productId: p.id,
            productImage: p.images?.[0]?.originalSrc,
            variantId: v.id,
            variantTitle: v.displayName,
            variantPrice: v.price,
            variantInventory: v.inventoryQuantity,
            maxUnit: 0,
          })),
        );

        setSelectedProducts(products);
      } else {
        await fetchProductsInCollection(payload.selection[0].id);
      }
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
  };


  const selectAllProducts = async () => {
    const res = await fetch("/api/products");
    const allVariants = await res.json();
    setSelectedProducts(allVariants);
    handleClick("addAll");
  };

  const togglePopover = useCallback((field: string) => {
    setPopoverActive((prev: any) => ({
      ...prev,
      [field]: !prev[field],
    }));
  }, []);

  const handleMonthChange = useCallback((newMonth: any, newYear: any) => {
    setMonthYear({ month: newMonth, year: newYear });
  }, []);

 

  const handleDateChange = (field: string, range: any) => {
    const localDate = new Date(
      range.start.getFullYear(),
      range.start.getMonth(),
      range.start.getDate(),
    );
    setSelectedDates((prev) => ({ ...prev, [field]: localDate }));
    setPopoverActive((prev) => ({ ...prev, [field]: false }));
  };

  const tabs = [
    {
      id: "content",
      content: "Content",
      panelID: "content-content",
    },
    {
      id: "design",
      content: "Design",
      panelID: "design-content",
    },
    {
      id: "add-products",
      content: "Add Products",
      panelID: "add-products-content",
    },
  ];

  const filteredProducts = selectedProducts?.filter((product: any) =>
    product?.variantTitle.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleRemoveProduct(id: any) {
    setSelectedProducts((prev: any) =>
      prev.filter((product: any) => product.variantId !== id),
    );
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      const newTags = [...campaignData.productTags, productTagInput.trim()];
      setProductTagInput("");
      handleCampaignDataChange("productTags", newTags);
      event.preventDefault();
    }
  };

  const handleKeyDownCustomerTag = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && customerTagInput.trim() !== "") {
      const newTags = [...campaignData.customerTags, customerTagInput.trim()];
      handleCampaignDataChange("customerTags", newTags);
      setCustomerTagInput("");
      event.preventDefault();
    }
  };

  const handleButtonClick = useCallback(
    (index: number) => {
      if (activeButtonIndex === index) return;
      setActiveButtonIndex(index);
      handleCampaignDataChange("discountType",index === 0 ? "PERCENTAGE" : "FIXED");
    },
    [activeButtonIndex],
  );

  const formatedDate = ` ${new Date()
    .toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
    .replace(",", "")}`;

  
  const handleSubmit = () => {
  setLoading(true);
  handleClick("publish")
  shopify.saveBar.hide("my-save-bar");
  setSaveBarVisible(false);

  const formData = new FormData();
  formData.append("intent", "create-campaign");

  formData.append(
    "name",
    campaignData.campaignName !== "" 
      ? campaignData.campaignName 
      : `Campaign ${formatedDate}`,
  );

  formData.append("shopId", shopId);
  formData.append("depositPercent", String(campaignData.partialPaymentPercentage));
  formData.append("refundDeadlineDays", "0");

  formData.append(
    "campaignEndDate",
    selectedDates.campaignEndDate.toISOString(),
  );

  formData.append("products", JSON.stringify(selectedProducts));
  formData.append("campaignType", String(campaignData.campaignType));
  formData.append("buttonText", String(campaignData.buttonText));
  formData.append("shippingMessage", String(campaignData.shippingMessage));
  formData.append("paymentMode", String(campaignData.paymentMode));

  formData.append("designFields", JSON.stringify(designFields));
  formData.append("discountType", campaignData.discountType);
  formData.append("discountPercentage", String(campaignData.discountPercentage));
  formData.append("flatDiscount", String(campaignData.flatDiscount));

  formData.append("orderTags", JSON.stringify(campaignData.productTags));
  formData.append("customerTags", JSON.stringify(campaignData.customerTags));

  formData.append("getDueByValt", String(campaignData.getPaymentsViaValtedPayments));
  formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));

  // Payment collection mode
  formData.append(
    "collectionMode",
    campaignData.duePaymentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
  );
  formData.append("paymentAfterDays", String(campaignData.paymentAfterDays));
  formData.append(
    "balanceDueDate",
    selectedDates.duePaymentDate.toISOString(),
  );

  // Fulfilment scheduling
  formData.append(
    "scheduledFulfilmentType",
    campaignData.scheduledFullfillmentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
  );
  formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
  formData.append(
    "fulfilmentDate",
    selectedDates.fullfillmentSchedule.toISOString(),
  );

  // Preorder-specific fields
  formData.append("preOrderNoteKey", campaignData.preOrderNoteKey);
  formData.append("preOrderNoteValue", campaignData.preOrderNoteValue);
  formData.append("fullPaymentText", campaignData.fullPaymentText);
  formData.append("partialPaymentText", campaignData.partialPaymentText);
  formData.append("partialPaymentInfoText", campaignData.partialPaymentInfoText);

  submit(formData, { method: "post" });
};


  const handleMaxUnitChange = (id: string, value: number) => {
    setSelectedProducts((prev: any) =>
      prev.map((product: any) =>
        product.variantId === id ? { ...product, maxUnit: value } : product,
      ),
    );
  };

  const appBridge = useAppBridge();

  useEffect(() => {
    if (selectedProducts.length > 0) {
      const formData = new FormData();
      formData.append("intent", "productsWithPreorder");
      formData.append("products", JSON.stringify(selectedProducts));

      submit(formData, { method: "post" });
    }
  }, [selectedProducts]);

  useEffect(() => {
    let flag = false;
    if (!productsWithPreorder) return;
    for (let i = 0; i < productsWithPreorder.length; i++) {
      if (productsWithPreorder[i]?.preorder == true) {
        flag = true;
        break;
      }
    }

    if (flag) {
      setWarningPopoverActive(true);
    } else {
      setWarningPopoverActive(false);
    }
  }, [productsWithPreorder]);

  const handleDuplication = (id: any) => {
    const prod = productsWithPreorder?.find(
      (product: any) => product.id === id,
    );
    if (prod && prod.preorder == true) {
      return true;
    }

    return false;
  };

  function handleRemoveTag(index: number): void {
    const updatedTags = [...campaignData.productTags];
    updatedTags.splice(index, 1);
   handleCampaignDataChange("productTags", updatedTags);
  }

  function handleRemoveCustomerTag(index: number) {
    const updatedTags = [...campaignData.customerTags];
    updatedTags.splice(index, 1);
    handleCampaignDataChange("customerTags", updatedTags);
  }

  async function fetchProductsInCollection(id: string) {
    submit(
      { intent: "fetchProductsInCollection", collectionId: id },
      { method: "get" },
    );
    if (prod) {
      setSelectedProducts(prod);
    }
  }

  const handleSave = () => {
  // setLoading(true);
  handleClick("draft");

  const formData = new FormData();
  formData.append("intent", "SAVE");

  formData.append(
    "name",
    campaignData.campaignName !== ""
      ? campaignData.campaignName
      : `Campaign ${formatedDate}`,
  );
  formData.append("shopId", shopId);
  formData.append("depositPercent", String(campaignData.partialPaymentPercentage));
  formData.append(
    "balanceDueDate",
    selectedDates.duePaymentDate.toISOString(),
  );
  formData.append("refundDeadlineDays", "0");
  formData.append(
    "campaignEndDate",
    selectedDates.campaignEndDate.toISOString(),
  );

  formData.append("products", JSON.stringify(selectedProducts));
  formData.append("campaignType", String(campaignData.campaignType));
  formData.append("buttonText", String(campaignData.buttonText));
  formData.append("shippingMessage", String(campaignData.shippingMessage));
  formData.append("paymentMode", String(campaignData.paymentMode));
  formData.append("designFields", JSON.stringify(designFields));
  formData.append("discountType", campaignData.discountType);
  formData.append("discountPercentage", String(campaignData.discountPercentage));
  formData.append("flatDiscount", String(campaignData.flatDiscount));
  formData.append("orderTags", JSON.stringify(campaignData.productTags));
  formData.append("customerTags", JSON.stringify(campaignData.customerTags));
  formData.append("getDueByValt", String(campaignData.getPaymentsViaValtedPayments));
  formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));

  // Scheduled fulfillment
  formData.append(
    "scheduledFulfilmentType",
    campaignData.scheduledFullfillmentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
  );
  formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
  formData.append(
    "fulfilmentDate",
    selectedDates.fullfillmentSchedule.toISOString(),
  );

  // Preorder-related fields
  formData.append("preOrderNoteKey", campaignData.preOrderNoteKey);
  formData.append("preOrderNoteValue", campaignData.preOrderNoteValue);
  formData.append("fullPaymentText", campaignData.fullPaymentText);
  formData.append("partialPaymentText", campaignData.partialPaymentText);
  formData.append("partialPaymentInfoText", campaignData.partialPaymentInfoText);

  submit(formData, { method: "post" });

  shopify.saveBar.hide("my-save-bar");
  setSaveBarVisible(false);
};

  const handleDiscard = () => {
    console.log("Discarding");
    shopify.saveBar.hide("my-save-bar");
    setSaveBarVisible(false);
  };

  useEffect(() => {
    shopify.saveBar.show("my-save-bar");
    setSaveBarVisible(true);
  }, [
    designFields,
    selectedProducts,
    campaignData,
   
  ]);

  useEffect(() => {
    setSaveBarVisible(false);
  }, []);

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Create Preorder Campaign"
        titleMetadata={
          <div>{navigation.state !== "idle" && <Spinner size="small" />}</div>
        }
        backAction={{
          content: "Back",
          onAction: () => {
            console.log(saveBarVisible, "saveBarVisible");
            if (saveBarVisible) {
              shopify.saveBar.leaveConfirmation();
            } else {
              navigate("/app");
            }
          },
        }}
        primaryAction={{
          content: "Publish",
          onAction: handleSubmit,
          loading: buttonLoading.publish,
        }}
        secondaryActions={[
          {
            content: "Save as Draft",
            onAction: ()=>{
              handleSave()
            },
            loading: buttonLoading.draft,
          }
        ]}
      >
        <SaveBar id="my-save-bar">
          <button variant="primary" onClick={handleSave}></button>
          <button onClick={handleDiscard}></button>
        </SaveBar>
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

        <form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value="create-campaign" />
          <input
            type="hidden"
            name="products"
            value={JSON.stringify(selectedProducts)}
          />
          <input type="hidden" name="name" value={campaignData.campaignName} />
          <input
            type="hidden"
            name="depositPercent"
            value={String(campaignData.partialPaymentPercentage)}
          />
          <input
            type="hidden"
            name="balanceDueDate"
            value={String(selectedDates.duePaymentDate)}
          />
          <input type="hidden" name="refundDeadlineDays" value="0" />
          {/* <input
            type="hidden"
            name="campaignEndDate"
            value={campaignData.campaignEndDate.toISOString()}
          /> */}
          <input
            type="hidden"
            name="designFields"
            value={JSON.stringify(designFields)}
          />
          <input
            type="hidden"
            name="campaignType"
            value={JSON.stringify(campaignData.campaignType)}
          />

          <div
            style={{ display: "flex", justifyContent: "flex-end", margin: 2 }}
          >
            {/* <button
              type="submit"
              style={{
                backgroundColor: "black",
                color: "white",
                padding: 5,
                borderRadius: 5,
              }}
            >
              Publish
            </button> */}
          </div>
          {/* <SaveBar id="my-save-bar">
            <button variant="primary" onClick={handleSave}></button>
            <button onClick={handleDiscard}></button>
          </SaveBar> */}
          <div
            style={{
              display: "flex",
              position: "relative",
              paddingBottom: 20,
              paddingTop: 20,
            }}
          >
            {/* left */}
            {selected === 0 && (
              <CampaignForm
                campaignData={campaignData}
                handleCampaignDataChange={handleCampaignDataChange}
                handleRemoveTag={handleRemoveTag}
                handleRemoveCustomerTag={handleRemoveCustomerTag}
                selectedDates={selectedDates}
                handleDateChange={handleDateChange}
                togglePopover={togglePopover}
                popoverActive={popoverActive}
                handleMonthChange={handleMonthChange}
                handleCampaignEndMonthChange={handleCampaignEndMonthChange}
                campaignEndPicker={campaignEndPicker}
                month={month}
                year={year}
                plusStore={plusStore}
                setSelected={setSelected}
                setProductTagInput={setProductTagInput}
                setCustomerTagInput={setCustomerTagInput}
                handleKeyDown={handleKeyDown}
                handleKeyDownCustomerTag={handleKeyDownCustomerTag}
                productTagInput={productTagInput}
                customerTagInput={customerTagInput}
                formatDate={formatDate}
                activeButtonIndex={activeButtonIndex}
                handleButtonClick={handleButtonClick}
                shopifyPaymentsEnabled={shopifyPaymentsEnabled}
              />
            )}
            {selected === 1 && (
              <div style={{ flex: 1 }}>
                <PreviewDesign
                  designFields={designFields}
                  setDesignFields={setDesignFields}
                  setTabSelected={setSelected}
                />
              </div>
            )}

            {/* right */}
            {(selected === 0 || selected === 1) && (
              <div style={{ flex: 1, marginLeft: 20, gap: 20 }}>
                {/* preview */}
                <div style={{ position: "sticky", top: 20, gap: 20 }}>
                  <Card>
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Text as="h4" variant="headingSm">
                        Preview
                      </Text>
                    </div>
                    <div style={{}}>
                      <Text as="h1" variant="headingLg">
                        White T-shirt
                      </Text>
                      <div style={{ marginTop: 10 }}>
                        <InlineStack gap="200">
                          <Text as="h1" variant="headingMd">
                            {campaignData.discountPercentage === 0 &&
                            campaignData.flatDiscount === 0 ? (
                              <Text as="h1" variant="headingLg">
                                $499.00
                              </Text>
                            ) : (
                              <Text as="h1" variant="headingLg">
                                {activeButtonIndex === 0 &&
                                campaignData.discountPercentage !== 0
                                  ? "$" +
                                    (
                                      499.0 -
                                      (499.0 *
                                        campaignData.discountPercentage) /
                                        100
                                    ).toFixed(2)
                                  : 499.0 - campaignData.flatDiscount > 0
                                    ? "$" + (499.0 - campaignData.flatDiscount)
                                    : "$" + 0}
                              </Text>
                            )}
                          </Text>
                          {campaignData.discountPercentage === 0 &&
                          campaignData.flatDiscount === 0 ? null : (
                            <Text
                              as="h1"
                              variant="headingMd"
                              textDecorationLine="line-through"
                            >
                              $499.00
                            </Text>
                          )}
                        </InlineStack>
                      </div>
                    </div>
                    <div style={{ marginTop: 10, marginBottom: 20 }}>
                      <Text as="h1" variant="headingSm">
                        Size
                      </Text>
                      <div style={{ display: "flex", gap: 10 }}>
                        {/* Inactive (Small) */}
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: "6px 12px",
                            minWidth: "80px",
                            textAlign: "center",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ color: "black", fontWeight: 500 }}>
                            Small
                          </span>
                        </div>

                        {/* Active (Medium) */}
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: "6px 12px",
                            minWidth: "80px",
                            textAlign: "center",
                            backgroundColor: "black",
                            cursor: "pointer",
                          }}
                        >
                          <span style={{ color: "white", fontWeight: 500 }}>
                            Medium
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        marginTop: designFields.spacingOT + "px",
                        marginBottom: designFields.spacingOB + "px",
                      }}
                    >
                      <div
                        style={{
                          // height: 50,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor:
                            designFields.buttonStyle === "single"
                              ? designFields.buttonBackgroundColor
                              : "black",
                          background:
                            designFields.buttonStyle === "gradient"
                              ? `linear-gradient(${designFields.gradientDegree}deg, ${designFields.gradientColor1}, ${designFields.gradientColor2})`
                              : "black",
                          borderRadius: designFields.borderRadius + "px",
                          // marginTop: "auto",
                          borderColor: designFields.borderColor,
                          borderWidth: designFields.borderSize + "px",
                          borderStyle: "solid",
                          paddingTop: designFields.spacingIT + "px",
                          paddingBottom: designFields.spacingIB + "px",
                        }}
                      >
                        <span
                          style={{
                            color: designFields.buttonTextColor,
                            fontWeight: "bold",
                            fontSize: designFields.buttonFontSize + "px",
                          }}
                        >
                          {campaignData.buttonText}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "center",
                        padding: 5,
                      }}
                    >
                      <Text as="h1" variant="headingMd">
                        <h3
                          style={{
                            display: "flex",
                            justifyContent: "center",
                            fontFamily:
                              designFields.fontFamily !== ""
                                ? designFields.fontFamily
                                : "Helvetica Neue",
                            fontSize:
                              designFields.messageFontSize !== ""
                                ? designFields.messageFontSize + "px"
                                : "16px",
                            color: designFields.preorderMessageColor,
                          }}
                        >
                          {campaignData.shippingMessage}
                        </h3>
                      </Text>
                    </div>
                    {campaignData.paymentMode === "partial" && (
                      <div
                        style={{ display: "flex", justifyContent: "center" }}
                      >
                        <Text as="h1" variant="headingMd">
                          {formattedText}
                        </Text>
                      </div>
                    )}
                  </Card>
                  <div style={{ marginTop: 10 }}>
                    <Card>
                      <div style={{ padding: 3, textAlign: "center" }}>
                        <Text as="p" variant="headingSm">
                          CART, CHECKOUT, EMAIL PREVIEW
                        </Text>
                      </div>
                      <div style={{ display: "flex", gap: 25 }}>
                        <div>
                          <img
                            src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg"
                            alt=""
                            height={80}
                          />
                        </div>
                        <div>
                          <p style={{ fontWeight: "bold", fontSize: "16px" }}>
                            Baby Pink T-shirt
                          </p>
                          {campaignData.paymentMode === "partial" ? (
                            <p>{campaignData.partialPaymentText}</p>
                          ) : (
                            <p>{campaignData.fullPaymentText}</p>
                          )}
                          <p>
                            {campaignData.preOrderNoteKey} :{" "}
                            {campaignData.preOrderNoteValue}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </div>
              </div>
            )}
          </div>
        </form>

        {selected === 2 && (
          <div>
            {selectedProducts.length === 0 && (
              <div>
                <Card padding={"3200"}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      flexDirection: "column",
                      gap: "12px",
                    }}
                  >
                    <div>
                      <Text as="p" variant="headingSm">
                        Add products to Preorder
                      </Text>
                    </div>
                    <div>
                      <Text as="p" variant="bodySm">
                        Products and variants that are added will be prepared
                        for preorder after the campaign is published
                      </Text>
                    </div>
                    <div>
                      <ButtonGroup>
                        <Button onClick={() => shopify.modal.show("my-modal")}>
                          Add Specific Product
                        </Button>
                        <Button
                          variant="primary"
                          loading={buttonLoading.addAll}
                          onClick={() => {
                            handleClick("addAll");
                            selectAllProducts();
                          }}
                        >
                          Add All Products
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                </Card>
                <div style={{ marginTop: 20 }}>
                  <Banner
                    title="Product inventory settings updates"
                    tone="info"
                  >
                    <p>
                      <strong>
                        “Continue selling when out of stock”, “Track quantity”
                      </strong>{" "}
                      are enabled for products above. After campaign is
                      published, we continuously monitor products to ensure they
                      always comply with campaign conditions.
                    </p>
                  </Banner>
                </div>
              </div>
            )}
            {selectedProducts.length > 0 && (
              <div>
                {warningPopoverActive && (
                  <div style={{ padding: "8px" }}>
                    <Banner
                      title="Some of the products are assigned to multiple campaigns"
                      tone="warning"
                    >
                      <p>
                        Highlighted products are assigned to multiple Preorder
                        campaigns. When publishing this campaign products will
                        be removed from other campaigns.
                      </p>
                    </Banner>
                  </div>
                )}
                <Card >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "10px",
                    }}
                  >
                    <div>
                      <TextField
                        label="Search products"
                        labelHidden
                        value={searchTerm}
                        onChange={setSearchTerm}
                        autoComplete="off"
                        placeholder="Search by product name"
                      />
                    </div>
                    <div>
                      <ButtonGroup>
                        <Button onClick={openResourcePicker}>
                          Add More Products
                        </Button>
                        <Button onClick={() => setSelectedProducts([])}>
                          Remove all Products
                        </Button>
                      </ButtonGroup>
                    </div>
                  </div>
                  <div style={{ overflowX: "auto" }}>
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            Image
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            Product
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            Inventory
                          </th>
                          {campaignData.campaignType !== 3 && (
                            <th
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              Inventory limit
                            </th>
                          )}
                          <th
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            Price
                          </th>
                          <th
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product: any) => (
                          <tr
                            key={product.variantId}
                            style={{
                              backgroundColor: handleDuplication(
                                product.variantId,
                              )
                                ? "#ea9898ff"
                                : "",
                            }}
                          >
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              <img
                                src={product.productImage || product.image}
                                alt={product.variantTitle}
                                style={{
                                  width: 50,
                                  height: 50,
                                  objectFit: "cover",
                                }}
                              />
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              {product.variantTitle}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              {product.variantInventory
                                ? product.variantInventory
                                : product.inventory}
                            </td>
                            {campaignData.campaignType !== 3 && (
                              <td
                                style={{
                                  padding: "8px",
                                  borderBottom: "1px solid #eee",
                                  width: "100px",
                                }}
                              >
                                <TextField
                                  type="number"
                                  min={0}
                                  value={product?.maxUnit?.toString()}
                                  onChange={(value) =>
                                    handleMaxUnitChange(
                                      product.variantId,
                                      Number(value),
                                    )
                                  }
                                />
                              </td>
                            )}
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              {formatCurrency(product.variantPrice, "USD")}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                cursor: "pointer",
                              }}
                            >
                              <div
                                onClick={() => {
                                  handleRemoveProduct(product.variantId);
                                }}
                              >
                                <Icon source={DeleteIcon} />
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            )}
            <Modal id="my-modal">
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 10,
                }}
              >
                <div>
                  <RadioButton
                    label="Specific Product"
                    checked={productRadio === "option1"}
                    id="option1"
                    onChange={() => setproductRadio("option1")}
                  />
                </div>

                <div>
                  <RadioButton
                    label="Collection"
                    checked={productRadio === "option2"}
                    id="option2"
                    onChange={() => setproductRadio("option2")}
                  />
                </div>
              </div>
              <TitleBar title="Add Products">
                <button variant="primary" onClick={openResourcePicker}>
                  Continue
                </button>
                <button onClick={() => shopify.modal.hide("my-modal")}>
                  Cancel
                </button>
              </TitleBar>
            </Modal>
          </div>
        )}
        {/* </div> */}
      </Page>
    </AppProvider>
  );
}
