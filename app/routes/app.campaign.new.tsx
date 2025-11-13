import { useState, useCallback, useEffect, useRef } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
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
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  useSubmit,
  useNavigate,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import { DeleteIcon } from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker } from "@shopify/app-bridge/actions";
import { Modal, TitleBar, SaveBar } from "@shopify/app-bridge-react";
import { useAppBridge } from "../components/AppBridgeProvider";
import PreviewDesign from "app/components/PreviewDesign";
import type { CampaignFields, DesignFields } from "../types/type";
import {
  GET_COLLECTION_PRODUCTS,
  GET_SHOP,
  GET_SHOP_WITH_PLAN,
  isShopifyPaymentsEnabled,
} from "app/graphql/queries/shop";
import {
  // GET_PRODUCTS_WITH_PREORDER,
  GET_PRODUCTS_WITH_PREORDER_WITH_CAMPAIGNID,
} from "app/graphql/mutation/metafields";
import type { CampaignType } from "@prisma/client";
import { formatCurrency } from "app/helper/currencyFormatter";
import { formatDate } from "app/utils/formatDate";
import CampaignForm from "app/components/CampaignForm";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import {
  CampaignSchema,
  DesignSchema,
} from "app/utils/validator/zodValidateSchema";
import "../tailwind.css";
import { createCampaign } from "app/helper/campaignHelper";
import { PreviewComponent } from "app/components/PreviewComponent";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP_WITH_PLAN);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const plusStore = data.data.shop.plan.shopifyPlus;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");
  const shopDomain = session.shop;
  const isStoreExist = await isStoreRegistered(shopDomain);
  if (!isStoreExist) {
    return Response.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }
  const shopifyPaymentsEnabled = await isShopifyPaymentsEnabled(shopDomain);
  const storeCurrency = data.data.shop.currencyCode;

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

  return json({
    success: true,
    shopId,
    plusStore,
    shopifyPaymentsEnabled,
    storeCurrency,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const formData = await request.formData();
    const intent = formData.get("intent");
    let admin;
    let shopId;
    try {
      const auth = await authenticate.admin(request);
      admin = auth.admin;
      const { session } = await authenticate.admin(request);
      const shopDomain = session.shop;
      const response = await admin.graphql(GET_SHOP);
      const data = await response.json();
      shopId = data.data.shop.id;

      const isStoreExist = await isStoreRegistered(shopDomain);
      if (!isStoreExist) {
        return Response.json(
          { success: false, error: "Store not found" },
          { status: 404 },
        );
      }
    } catch (err) {
      console.error("Admin authentication failed:", err);
      return json({ error: "Admin authentication failed" }, { status: 500 });
    }

    switch (intent) {
      case "create-campaign":
      case "SAVE": {
        const campaign = await createCampaign(formData, admin, shopId);
        return Response.json({
          success: campaign.success,
          campaignId: campaign.campaignId,
        });
      }

      case "productsWithPreorder": {
        let productIds = JSON.parse(formData.get("products") as string);

        productIds = productIds.map((product: any) => product.variantId);

        const response = await admin.graphql(
          GET_PRODUCTS_WITH_PREORDER_WITH_CAMPAIGNID,
          {
            variables: { ids: productIds },
          },
        );
        const data = await response.json();

        const productsWithPreorder = data.data.nodes.map((product: any) => ({
          id: product.id,
          title: product.title,
          campaignId: product?.metafield?.value,
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
  let { prod, shopId, plusStore, shopifyPaymentsEnabled, storeCurrency } =
    useLoaderData<typeof loader>() as {
      prod: any[];
      shopId: string;
      plusStore: boolean;
      shopifyPaymentsEnabled: boolean;
      storeCurrency: string;
    };
  const { productsWithPreorder } = useActionData<typeof action>() ?? {
    productsWithPreorder: [],
  };

  const actionData = useActionData<typeof action>();
  // const navigation = useNavigation();
  // const [collectionProducts, setCollectionProducts] = useState(prod);
  const submit = useSubmit();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<number>(0);
  const [productTagInput, setProductTagInput] = useState<string>("");
  const [customerTagInput, setCustomerTagInput] = useState<string>("");
  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(Date.now()),
    end: new Date(Date.now()),
    duePaymentDate: new Date(Date.now()),
    campaignEndDate: new Date(Date.now()),
    fullfillmentSchedule: new Date(Date.now()),
  });

  const initialDates = useRef(selectedDates);
  const [popoverActive, setPopoverActive] = useState({
    duePaymentDate: false,
    fullfillmentSchedule: false,
    campaignEndDate: false,
  });
  const [warningPopoverActive, setWarningPopoverActive] =
    useState<boolean>(false);
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
  const [campaignData, setCampaignData] = useState<CampaignFields>({
    campaignName: "",
    campaignType: "ALLWAYS",
    productTags: ["Preorder"],
    customerTags: ["Preorder-Customer"],
    preOrderNoteKey: "Note",
    preOrderNoteValue: "Preorder",
    buttonText: "Preorder",
    shippingMessage: "Ship as soon as possible",
    partialPaymentPercentage: "10",
    paymentMode: "partial",
    partialPaymentType: "percent",
    duePaymentType: 2,
    campaignEndTime: "00:00",
    fulfilmentMode: "UNFULFILED",
    scheduledFullfillmentType: 1,
    scheduledDays: "0",
    paymentAfterDays: "0",
    fullPaymentText: "Full Payment",
    partialPaymentText: "Partial Payment",
    partialPaymentInfoText:
      "Pay {payment} now and {remaining} will be charged on {date}",
    discountType: "PERCENTAGE",
    discountValue: 0,
    getPaymentsViaValtedPayments: shopifyPaymentsEnabled,
  });
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
  const initialCampaignData = useRef<CampaignFields>(campaignData);
  const designFieldsRef = useRef<DesignFields>(designFields);

  const [activeButtonIndex, setActiveButtonIndex] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [hasCollectionFetched, setHasCollectionFetched] =
    useState<boolean>(false);
  const [noProductWarning, setNoProductWarning] = useState<boolean>(false);
  const [errors, setErrors] = useState<string[]>([]);

  const [buttonLoading, SetButtonLoading] = useState({
    add: false,
    remove: false,
    cancel: false,
    addAll: false,
    publish: false,
    draft: false,
  });
  const [saveBarVisible, setSaveBarVisible] = useState(false);

  // const formattedText = campaignData.partialPaymentInfoText
  //   .replace("{payment}", `$3.92`)
  //   .replace("{remaining}", `$35.28`)
  //   .replace(
  //     "{date}",
  //     formatDate(selectedDates.duePaymentDate.toLocaleDateString()),
  //   );

  useEffect(() => {
    if (actionData?.success) {
      shopify.saveBar.hide("my-save-bar");
      shopify.toast.show("Saved successfully");
      SetButtonLoading((prev): any =>
        Object.fromEntries(Object.keys(prev).map((key) => [key, false])),
      );
      setIsSubmitting(false);
      navigate("/app");
    }
  }, [actionData]);

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

  const handleCampaignDataChange = <K extends keyof CampaignFields>(
    field: K,
    value: CampaignFields[K],
  ) => {
    setCampaignData((prevData) => ({
      ...prevData,
      [field]: value,
    }));

    if (field === "campaignEndTime" || field === "campaignEndDate") {
      const timeStr = value as string;
      setSelectedDates((prev) => {
        const date = prev.campaignEndDate;
        const [hours, minutes] = timeStr.split(":").map(Number);
        const finalUtc = new Date(
          Date.UTC(
            date.getUTCFullYear(),
            date.getUTCMonth(),
            date.getUTCDate(),
            hours || 0,
            minutes || 0,
          ),
        );
        return { ...prev, campaignEndDate: finalUtc };
      });
    }
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
    if (!range?.start) return;

    const utcDate = new Date(
      Date.UTC(
        range.start.getFullYear(),
        range.start.getMonth(),
        range.start.getDate(),
      ),
    );

    const [hours, minutes] = campaignData.campaignEndTime
      .split(":")
      .map(Number);
    const finalUtc = new Date(
      Date.UTC(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth(),
        utcDate.getUTCDate(),
        hours || 0,
        minutes || 0,
      ),
    );

    setSelectedDates((prev) => ({ ...prev, [field]: finalUtc }));
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
      handleCampaignDataChange(
        "discountType",
        index === 0 ? "PERCENTAGE" : "FIXED",
      );
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
    const { valid } = validateForm();
    if (!valid) return;

    if (selectedProducts.length === 0) {
      setNoProductWarning(true);
      setTimeout(() => {
        setNoProductWarning(false);
      }, 5000);
      return;
    }
    handleClick("publish");
    setNoProductWarning(false);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("intent", "create-campaign");

    formData.append(
      "name",
      campaignData.campaignName !== ""
        ? campaignData.campaignName
        : `Campaign ${formatedDate}`,
    );

    formData.append("shopId", shopId);
    formData.append(
      "depositPercent",
      String(campaignData.partialPaymentPercentage),
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
    formData.append(
      "discountValue",
      String(campaignData.discountValue),
    );
    formData.append("orderTags", JSON.stringify(campaignData.productTags));
    formData.append("customerTags", JSON.stringify(campaignData.customerTags));

    formData.append(
      "getDueByValt",
      String(campaignData.getPaymentsViaValtedPayments),
    );
    formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));
    formData.append(
      "collectionMode",
      campaignData.duePaymentType === 1 ? "DAYS_AFTER" : "EXACT_DATE",
    );
    formData.append("paymentAfterDays", String(campaignData.paymentAfterDays));
    formData.append(
      "balanceDueDate",
      selectedDates.duePaymentDate.toISOString(),
    );
    formData.append(
      "scheduledFulfilmentType",
      campaignData.scheduledFullfillmentType === 1
        ? "DAYS_AFTER"
        : "EXACT_DATE",
    );
    formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
    formData.append(
      "fulfilmentDate",
      selectedDates.fullfillmentSchedule.toISOString(),
    );
    formData.append("preOrderNoteKey", campaignData.preOrderNoteKey);
    formData.append("preOrderNoteValue", campaignData.preOrderNoteValue);
    formData.append("fullPaymentText", campaignData.fullPaymentText);
    formData.append("partialPaymentText", campaignData.partialPaymentText);
    formData.append(
      "partialPaymentInfoText",
      campaignData.partialPaymentInfoText,
    );

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
      if (
        productsWithPreorder[i]?.campaignId &&
        productsWithPreorder[i]?.campaignId !== "null"
      ) {
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
    if (prod && prod?.campaignId && prod?.campaignId !== "null") {
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
  }

  useEffect(() => {
    if (prod && prod.length > 0 && !hasCollectionFetched) {
      setSelectedProducts(prod);
      setHasCollectionFetched(true);
    }
  }, [prod, hasCollectionFetched]);

  const validateForm = (): { valid: boolean; messages: string[] } => {
    const campaignResult: any = CampaignSchema.safeParse(campaignData);
    const designResult: any = DesignSchema.safeParse(designFields);

    const collectErrors = (obj: any) => {
      let messages: string[] = [];
      for (const key in obj) {
        if (Array.isArray(obj[key]?._errors)) {
          messages.push(...obj[key]._errors);
        }
        if (typeof obj[key] === "object" && obj[key] !== null) {
          messages.push(...collectErrors(obj[key]));
        }
      }
      return messages;
    };

    let errorMessages: string[] = [];

    if (!campaignResult.success) {
      const formatted = campaignResult.error.format();
      errorMessages = [...errorMessages, ...collectErrors(formatted)];
    }

    if (!designResult.success) {
      const formattedDesign = designResult.error.format();
      errorMessages = [...errorMessages, ...collectErrors(formattedDesign)];
    }

    setErrors(errorMessages);
    return { valid: errorMessages.length === 0, messages: errorMessages };
  };

  const handleSave = () => {
    const { valid } = validateForm();
    if (!valid) return;

    if (selectedProducts.length == 0) {
      setNoProductWarning(true);
      setTimeout(() => {
        setNoProductWarning(false);
      }, 5000);
      return;
    }
    handleClick("draft");
    setNoProductWarning(false);
    // shopify.saveBar.hide("my-save-bar");
    setIsSubmitting(true);
    SetButtonLoading((prev) => ({ ...prev, draft: true }));
    // setSaveBarVisible(false);

    const formData = new FormData();
    formData.append("intent", "SAVE");

    formData.append(
      "name",
      campaignData.campaignName !== ""
        ? campaignData.campaignName
        : `Campaign ${formatedDate}`,
    );
    formData.append("shopId", shopId);
    formData.append(
      "depositPercent",
      String(campaignData.partialPaymentPercentage),
    );
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
    formData.append(
      "discountValue",
      String(campaignData.discountValue),
    );
    formData.append("orderTags", JSON.stringify(campaignData.productTags));
    formData.append("customerTags", JSON.stringify(campaignData.customerTags));
    formData.append(
      "getDueByValt",
      String(campaignData.getPaymentsViaValtedPayments),
    );
    formData.append("fulfilmentmode", String(campaignData.fulfilmentMode));
    formData.append(
      "scheduledFulfilmentType",
      campaignData.scheduledFullfillmentType === 1
        ? "DAYS_AFTER"
        : "EXACT_DATE",
    );
    formData.append("fulfilmentDaysAfter", String(campaignData.scheduledDays));
    formData.append(
      "fulfilmentDate",
      selectedDates.fullfillmentSchedule.toISOString(),
    );
    formData.append("preOrderNoteKey", campaignData.preOrderNoteKey);
    formData.append("preOrderNoteValue", campaignData.preOrderNoteValue);
    formData.append("fullPaymentText", campaignData.fullPaymentText);
    formData.append("partialPaymentText", campaignData.partialPaymentText);
    formData.append(
      "partialPaymentInfoText",
      campaignData.partialPaymentInfoText,
    );

    submit(formData, { method: "post" });
  };

  const handleDiscard = () => {
    console.log("Discarding");
    shopify.saveBar.hide("my-save-bar");
    setCampaignData({ ...initialCampaignData.current });
    setDesignFields({ ...designFieldsRef.current });
    setSelectedProducts([]);
    setSelectedDates({ ...initialDates.current });
    setErrors([]);

    setSaveBarVisible(false);
  };

  useEffect(() => {
    if (isSubmitting) return;
    const hasUnsavedChanges =
      JSON.stringify(designFields) !==
        JSON.stringify(designFieldsRef.current) ||
      JSON.stringify(campaignData) !==
        JSON.stringify(initialCampaignData.current) ||
      selectedProducts.length > 0 ||
      JSON.stringify(selectedDates) !== JSON.stringify(initialDates.current);

    if (hasUnsavedChanges && !saveBarVisible) {
      shopify.saveBar.show("my-save-bar");
      setSaveBarVisible(true);
    } else if (!hasUnsavedChanges && saveBarVisible) {
      shopify.saveBar.hide("my-save-bar");
      setSaveBarVisible(false);
    }
  }, [
    designFields,
    selectedProducts,
    campaignData,
    selectedDates,
    saveBarVisible,
    isSubmitting,
  ]);

  useEffect(() => {
    setSaveBarVisible(false);
  }, []);

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Create Preorder Campaign"
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
          disabled: buttonLoading.draft || buttonLoading.publish,
        }}
        secondaryActions={[
          {
            content: "Save as Draft",
            onAction: () => {
              handleSave();
            },
            loading: buttonLoading.draft,
            disabled: buttonLoading.draft || buttonLoading.publish,
          },
        ]}
      >
        <SaveBar id="my-save-bar">
          <button
            variant="primary"
            onClick={handleSave}
            loading={
              buttonLoading.draft ? "" : buttonLoading.publish ? "" : false
            }
            disabled={isSubmitting}
          ></button>
          <button onClick={handleDiscard} disabled={isSubmitting}></button>
        </SaveBar>
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />
        {errors.length > 0 && (
          <Banner title="Please fix the following errors" tone="critical">
            <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
              {errors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </Banner>
        )}
        {noProductWarning && errors.length === 0 && (
          <Banner
            title="Cannot save campaign"
            tone="warning"
            onDismiss={() => setNoProductWarning(false)}
          >
            You must select at least one product before saving your campaign.
          </Banner>
        )}

        <form method="post" onSubmit={handleSubmit}>
          <div
            style={{ display: "flex", justifyContent: "flex-end", margin: 2 }}
          ></div>
          <div className="form-parent  gap-5 md:flex justify-between m-3">
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
              <div style={{ flex: 1 }} className="left">
                <PreviewDesign
                  designFields={designFields}
                  setDesignFields={setDesignFields}
                  setTabSelected={setSelected}
                />
              </div>
            )}

            {/* right */}
            {(selected === 0 || selected === 1) && (
              <div
                style={{ flex: 1, marginLeft: 5, gap: 20, marginRight: 0 }}
                className="right mt-10 md:mt-0"
              >
                {/* preview */}
                <PreviewComponent
                  campaignData={campaignData}
                  designFields={designFields}
                  selectedDates={selectedDates}
                  formatDate={formatDate}
                />
                {/*  */}
              </div>
            )}
          </div>

          <div className="flex md:hidden justify-end mt-3">

          {selected === 1 && <div className=" flex md:hidden justify-start mt-5 mb-5 mr-3">
            <Button onClick={() => setSelected(selected - 1)} variant="secondary">
              Back
            </Button>
          </div>}

          { (selected === 0 || selected === 1 )&& <div className=" flex md:hidden justify-end mt-5 mb-5">
            <Button onClick={() =>{ setSelected(selected + 1)
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
            
          } variant="primary">
              Next
            </Button>
          </div>}
          </div>
        </form>

        {selected === 2 && (
          <div className="m-2 mb-5" >
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
                        Add Products to Preorder
                      </Text>
                    </div>
                    <div style={{ display:"flex",textAlign: "center" }}>
                      <Text as="p" variant="bodySm">
                        Products and variants that are added will be prepared
                        for preorder after the campaign is published
                      </Text>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <ButtonGroup fullWidth>
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

                <Card>
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
                        <Button
                          onClick={() => {
                            setSelectedProducts([]);
                          }}
                        >
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
                          {campaignData.campaignType !== 'IN_STOCK' && (
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
                                : product.inventory ?? '0'} 
                            </td>
                            {campaignData.campaignType !== 'IN_STOCK' && (
                              <td
                                style={{
                                  padding: "8px",
                                  borderBottom: "1px solid #eee",
                                  width: "100px",
                                }}
                              >
                                <TextField
                                  type="text"
                                  min={0}
                                  label="Inventory limit"
                                  labelHidden
                                  autoComplete="off"
                                  value={
                                    campaignData.campaignType ===
                                    ("IN_STOCK" as CampaignType)
                                      ? product.variantInventory
                                        ? product.variantInventory
                                        : product.inventory
                                      : product?.maxUnit.toString()
                                  }
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
                              {formatCurrency(product.variantPrice, storeCurrency??'USD')}
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
            <div style={{margin:10}}>
            <InlineStack align="end" gap={"100"}>
              <ButtonGroup>
                <Button onClick={handleSave} 
                loading={buttonLoading.draft}
                disabled={buttonLoading.draft || buttonLoading.publish}
                >Save as Draft</Button>
                <Button onClick={handleSubmit} 
                loading={buttonLoading.publish}
                disabled={buttonLoading.publish || buttonLoading.draft}
                variant="primary">Publish</Button>
              </ButtonGroup>
            </InlineStack>
            </div>
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
