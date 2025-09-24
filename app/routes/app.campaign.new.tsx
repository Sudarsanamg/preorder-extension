import { useState, useCallback, useEffect } from "react";
import {
  LoaderFunctionArgs,
  ActionFunctionArgs,
  json,
  redirect,
} from "@remix-run/node";
import {
  AppProvider,
  Button,
  ButtonGroup,
  BlockStack,
  Text,
  TextField,
  Page,
  LegacyStack,
  RadioButton,
  Card,
  DatePicker,
  Popover,
  Icon,
  Tabs,
  Banner,
  InlineStack,
  Checkbox,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  useSubmit,
  useNavigate,
  useFetcher,
  useActionData,
  Link,
  useLoaderData,
} from "@remix-run/react";
import {
  DiscountIcon,
  CalendarCheckIcon,
  DeleteIcon,
  CashDollarIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker, Redirect } from "@shopify/app-bridge/actions";
import { Modal, TitleBar, SaveBar } from "@shopify/app-bridge-react";
import {
  createPreorderCampaign,
  addProductsToCampaign,
  getAllProducts,
  updateCampaignStatus,
} from "../models/campaign.server";
import { useAppBridge } from "../components/AppBridgeProvider";
import PreviewDesign from "app/components/PreviewDesign";
import type { DesignFields } from "../types/type";
import {
  GET_COLLECTION_PRODUCTS,
  GET_SHOP_WITH_PLAN,
} from "app/graphql/queries/shop";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP_WITH_PLAN);
  const data = await response.json();
  const storeId = data.data.shop.id;
  const plusStore = data.data.shop.plan.shopifyPlus;
  const url = new URL(request.url);
  const intent = url.searchParams.get("intent");

  switch (intent) {
    case "fetchProductsInCollection": {
      const collectionId = url.searchParams.get("collectionId");

      try {
        const response = await admin.graphql(GET_COLLECTION_PRODUCTS, {
          variables: { id: collectionId },
        });

        const res = await response.json();

        const prod = res.data.collection.products.edges.map((edge: any) => {
          const node = edge.node;

          const totalInventory = node.variants.edges.reduce(
            (sum: number, v: any) => sum + (v.node.inventoryQuantity || 0),
            0,
          );

          return {
            id: node.id,
            title: node.title,
            handle: node.handle,
            image: node.images.edges[0]?.node?.src || null,
            price: node.variants.edges[0]?.node?.price || null,
            totalInventory,
          };
        });
        return json({ prod });
      } catch (error) {
        console.log(error);
      }
    }
  }

  return json({ success: true, storeId, plusStore });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("Action hitted**************************");

  try {
    const formData = await request.formData();
    const intent = formData.get("intent");
    console.log("Intent:", intent);

    // -------------------------------
    // ADMIN AUTHENTICATION
    // -------------------------------
    let admin;
    try {
      const auth = await authenticate.admin(request);
      admin = auth.admin;
      console.log("Admin authenticated successfully");
    } catch (err) {
      console.error("Admin authentication failed:", err);
      return json({ error: "Admin authentication failed" }, { status: 500 });
    }

    // -------------------------------
    // HANDLE INTENT
    // -------------------------------
    switch (intent) {
      case "create-campaign": {
        const campaign = await createPreorderCampaign({
          name: formData.get("name") as string,
          storeId: formData.get("storeId") as string,
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
          discountType: formData.get("discountType") as string,
          discountPercent: Number(formData.get("discountPercentage") || "0"),
          discountFixed: Number(formData.get("flatDiscount") || "0"),
          campaignType: Number(formData.get("campaignType")),
          getDueByValt: formData.get("getDueByValt") === "true",
          totalOrders: 0,
        });

        const products = JSON.parse(
          (formData.get("products") as string) || "[]",
        );

        if (products.length > 0) {
          await addProductsToCampaign(campaign.id, products);

          // -------------------------------
          // PREORDER METAFIELDS UPDATE
          // -------------------------------
          const mutation = `
            mutation setPreorderMetafields($metafields: [MetafieldsSetInput!]!) {
              metafieldsSet(metafields: $metafields) {
                metafields {
                  id
                  namespace
                  key
                  type
                  value
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;

          const metafields = products.flatMap((product) => [
            {
              ownerId: product.id,
              namespace: "custom",
              key: "campaign_id",
              type: "single_line_text_field",
              value: String(campaign.id),
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "preorder",
              type: "boolean",
              value: "true",
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "release_date",
              type: "date",
              value: "2025-08-30",
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "preorder_end_date",
              type: "date_time",
              value: new Date(
                formData.get("campaignEndDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "deposit_percent",
              type: "number_integer",
              value: String(formData.get("depositPercent") || "0"),
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "balance_due_date",
              type: "date",
              value: new Date(
                formData.get("balanceDueDate") as string,
              ).toISOString(),
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "preorder_max_units",
              type: "number_integer",
              value: String(product?.maxUnit || "0"),
            },
            {
              ownerId: product.id,
              namespace: "custom",
              key: "preorder_units_sold",
              type: "number_integer",
              value: "0",
            },
          ]);

          try {
            const response = await admin.graphql(mutation, {
              variables: { metafields },
            });
            console.log("GraphQL response:", response);
          } catch (err) {
            console.error("GraphQL mutation failed:", err);
            throw err;
          }
        }

        // if the payment option is partial

        if (formData.get("paymentMode") === "partial") {
          const discountType = formData.get("discountType");

          let CREATE_SELLING_PLAN = ``;
          if (discountType == "none") {
            CREATE_SELLING_PLAN = `
  mutation CreateSellingPlan($productIds: [ID!]!, $percentage: Float!, $days: String!) {
    sellingPlanGroupCreate(
      input: {
        name: "Deposit Pre-order"
        merchantCode: "pre-order-deposit"
        options: ["Pre-order"]
        sellingPlansToCreate: [
          {
            name: "Deposit, balance later"
            category: PRE_ORDER
            options: ["Deposit, balance later"]
            billingPolicy: {
              fixed: {
                checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
                remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
                remainingBalanceChargeTimeAfterCheckout: $days
              }
            }
            deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
            inventoryPolicy: { reserve: ON_FULFILLMENT }
          }
        ]
      }
      resources: { productIds: $productIds }
    ) {
      sellingPlanGroup {
        id
        sellingPlans(first: 1) {
          edges {
            node { id }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
          } else if (discountType == "percentage") {
            CREATE_SELLING_PLAN = `
  mutation CreateSellingPlan($productIds: [ID!]!, $percentage: Float!, $days: String! , $discountPercentage: Float!) {
    sellingPlanGroupCreate(
      input: {
        name: "Deposit Pre-order"
        merchantCode: "pre-order-deposit"
        options: ["Pre-order"]
        sellingPlansToCreate: [
          {
            name: "Deposit, balance later"
            category: PRE_ORDER
            options: ["Deposit, balance later"]
            billingPolicy: {
              fixed: {
                checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
                remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
                remainingBalanceChargeTimeAfterCheckout: $days
              }
            }
            deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
            inventoryPolicy: { reserve: ON_FULFILLMENT }
            pricingPolicies: [
            {
              fixed: {
                adjustmentType: PERCENTAGE
                adjustmentValue: { percentage: $discountPercentage }
              }
            }
          ]
          }
        ]
      }
      resources: { productIds: $productIds }
    ) {
      sellingPlanGroup {
        id
        sellingPlans(first: 1) {
          edges {
            node { id }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
          } else if (discountType == "flat") {
            CREATE_SELLING_PLAN = `
  mutation CreateSellingPlan($productIds: [ID!]!, $percentage: Float!, $days: String! , $fixedValue: Decimal!) {
    sellingPlanGroupCreate(
      input: {
        name: "Deposit Pre-order"
        merchantCode: "pre-order-deposit"
        options: ["Pre-order"]
        sellingPlansToCreate: [
          {
            name: "Deposit, balance later"
            category: PRE_ORDER
            options: ["Deposit, balance later"]
            billingPolicy: {
              fixed: {
                checkoutCharge: { type: PERCENTAGE, value: { percentage: $percentage } }
                remainingBalanceChargeTrigger: TIME_AFTER_CHECKOUT
                remainingBalanceChargeTimeAfterCheckout: $days
              }
            }
            deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
            inventoryPolicy: { reserve: ON_FULFILLMENT }
            pricingPolicies: [
            {
              fixed: {
                adjustmentType: FIXED_AMOUNT
                adjustmentValue: { fixedValue: $fixedValue }
              }
            }
          ]
            
          }
        ]
      }
      resources: { productIds: $productIds }
    ) {
      sellingPlanGroup {
        id
        sellingPlans(first: 1) {
          edges {
            node { id }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;
          }

          const productIds = products.map((p) => p.id);

          try {
            let res;
            if (discountType == "none") {
              res = await admin.graphql(CREATE_SELLING_PLAN, {
                variables: {
                  productIds,
                  percentage: Number(formData.get("depositPercent")),
                  days: "P7D",
                },
              });
            } else if (discountType == "percentage") {
              res = await admin.graphql(CREATE_SELLING_PLAN, {
                variables: {
                  productIds,
                  percentage: Number(formData.get("depositPercent")),
                  days: "P7D",
                  discountPercentage: Number(
                    formData.get("discountPercentage"),
                  ),
                },
              });
            } else if (discountType == "flat") {
              res = await admin.graphql(CREATE_SELLING_PLAN, {
                variables: {
                  productIds,
                  percentage: Number(formData.get("depositPercent")),
                  days: "P7D",
                  fixedValue: (formData.get("flatDiscount") ?? "0").toString(),
                },
              });
            }

            res = await res.json();
            console.log(res, "res >>>>>>>>>>>>>>>>>>>>>> SGP");
          } catch (error) {
            console.log("error: >>>>>>>>>>>>>>>>>>>>>>", error);
          }
        } else {
          const discountType = formData.get("discountType");
          let CREATE_SELLING_PLAN = ``;

          if (discountType === "none") {
            CREATE_SELLING_PLAN = `
      mutation CreateSellingPlan($productIds: [ID!]!) {
        sellingPlanGroupCreate(
          input: {
            name: "Full Payment Pre-order"
            merchantCode: "pre-order-full"
            options: ["Pre-order"]
            sellingPlansToCreate: [
              {
                name: "Pay full upfront"
                category: PRE_ORDER
                options: ["Full payment"]
                billingPolicy: {
                  fixed: {
                    checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
                     remainingBalanceChargeTrigger: NO_REMAINING_BALANCE
                  }
                }
                deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
                inventoryPolicy: { reserve: ON_FULFILLMENT }
              }
            ]
          }
          resources: { productIds: $productIds }
        ) {
          sellingPlanGroup { id }
          userErrors { field message }
        }
      }
    `;
          } else if (discountType === "percentage") {
            CREATE_SELLING_PLAN = `
      mutation CreateSellingPlan($productIds: [ID!]!, $discountPercentage: Float!) {
        sellingPlanGroupCreate(
          input: {
            name: "Full Payment Pre-order"
            merchantCode: "pre-order-full"
            options: ["Pre-order"]
            sellingPlansToCreate: [
              {
                name: "Pay full upfront"
                category: PRE_ORDER
                options: ["Full payment"]
                billingPolicy: {
                  fixed: {
                    checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
                     remainingBalanceChargeTrigger: NO_REMAINING_BALANCE
                  }
                }
                deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
                inventoryPolicy: { reserve: ON_FULFILLMENT }
                pricingPolicies: [
                  {
                    fixed: {
                      adjustmentType: PERCENTAGE
                      adjustmentValue: { percentage: $discountPercentage }
                    }
                  }
                ]
              }
            ]
          }
          resources: { productIds: $productIds }
        ) {
          sellingPlanGroup { id }
          userErrors { field message }
        }
      }
    `;
          } else if (discountType === "flat") {
            CREATE_SELLING_PLAN = `
      mutation CreateSellingPlan($productIds: [ID!]!, $fixedValue: Decimal!) {
        sellingPlanGroupCreate(
          input: {
            name: "Full Payment Pre-order"
            merchantCode: "pre-order-full"
            options: ["Pre-order"]
            sellingPlansToCreate: [
              {
                name: "Pay full upfront"
                category: PRE_ORDER
                options: ["Full payment"]
                billingPolicy: {
                  fixed: {
                    checkoutCharge: { type: PERCENTAGE, value: { percentage: 100 } }
                     remainingBalanceChargeTrigger: NO_REMAINING_BALANCE
                  }
                }
                deliveryPolicy: { fixed: { fulfillmentTrigger: UNKNOWN } }
                inventoryPolicy: { reserve: ON_FULFILLMENT }
                pricingPolicies: [
                  {
                    fixed: {
                      adjustmentType: FIXED_AMOUNT
                      adjustmentValue: { amount: $fixedValue }
                    }
                  }
                ]
              }
            ]
          }
          resources: { productIds: $productIds }
        ) {
          sellingPlanGroup { id }
          userErrors { field message }
        }
      }
    `;
          }

          const productIds = products.map((p) => p.id);

          try {
            const response = await admin.graphql(CREATE_SELLING_PLAN, {
              variables:
                discountType === "percentage"
                  ? {
                      productIds,
                      discountPercentage: Number(
                        formData.get("discountPercentage"),
                      ),
                    }
                  : discountType === "flat"
                    ? {
                        productIds,
                        fixedValue: (
                          formData.get("flatDiscount") ?? "0"
                        ).toString(),
                      }
                    : { productIds },
            });

            const data = await response.json();
            console.log(
              JSON.stringify(data, null, 2),
              "res >>>>>>>>>>>>>>>>>>>>>> SGP in full payment",
            );
          } catch (error) {
            console.log("error: >>>>>>>>>>>>>>>>>>>>>>", error);
          }
        }

        const designFields = JSON.parse(formData.get("designFields") as string);
        console.log(designFields, "designFields >>>>>>>>>>>>>>>>>>>>>>");

        const fields = [
          {
            key: "object",
            value: JSON.stringify({
              ...designFields,
              campaign_id: campaign.id,
            }),
          },
        ];

        const mutation = `
  mutation CreateDesignSettings($fields: [MetaobjectFieldInput!]!) {
    metaobjectCreate(
      metaobject: {
        type: "design_settings",
        fields: $fields,
        capabilities: {
          publishable: { status: ACTIVE }
        }
      }
    ) {
      metaobject {
        id
        handle
        fields {
          key
          value
        }
        capabilities {
          publishable {
            status
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

        const campaign_mutation = `
  mutation CreateCampaign($fields: [MetaobjectFieldInput!]!) {
    metaobjectCreate(
      metaobject: {
        type: "preordercampaign",
        fields: $fields,
        capabilities: {
          publishable: {
            status: ACTIVE
          }
        }
      }
    )
    {
      metaobject {
        id
        handle
        capabilities {
          publishable {
            status
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  `;

        try {
          const response = await admin.graphql(mutation, {
            variables: {
              fields: [
                {
                  key: "campaign_id",
                  value: String(campaign.id),
                },

                ...fields,
              ],
            },
          });

          const result = await response.json();
          console.log("design Metaobject:", JSON.stringify(result, null, 2));

          const campaignFields = [
            {
              key: "object",
              value: JSON.stringify({
                campaign_id: String(campaign.id),
                name: (formData.get("name") as string) || "Untitled Campaign",
                status: "publish",
                button_text:
                  (formData.get("buttonText") as string) || "Preorder",
                shipping_message:
                  (formData.get("shippingMessage") as string) ||
                  "Ship as soon as possible",
                payment_type: (formData.get("paymentMode") as string) || "Full",
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
              }),
            },
          ];

          const campaign_response = await admin.graphql(campaign_mutation, {
            variables: {
              fields: [
                { key: "campaign_id", value: String(campaign.id) },
                ...campaignFields,
              ],
            },
          });

          const parsedCampaignResponse = await campaign_response.json();
          console.log(
            parsedCampaignResponse,
            "parsedResponse >>>>>>>>>>>>>>>>>>>>>>",
          );
          console.log(
            "store meta Metaobject //////:",
            JSON.stringify(parsedCampaignResponse, null, 2),
          );
        } catch (error) {
          console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>", error);
        }

        await updateCampaignStatus(campaign.id, "PUBLISHED");

        return redirect("/app");
      }

      case "productsWithPreorder": {
        let productIds = JSON.parse(formData.get("products") as string);
        const query = `
    query getProductsMetafields($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on Product {
          id
          title
          metafield(namespace: "custom", key: "preorder") {
            value
          }
        }
      }
    }
  `;

        productIds = productIds.map((product) => product.id);

        const response = await admin.graphql(query, {
          variables: { ids: productIds },
        });
        const data = await response.json();

        const productsWithPreorder = data.data.nodes.map((product: any) => ({
          id: product.id,
          title: product.title,
          preorder: product?.metafield?.value === "true", // Shopify stores metafield values as strings
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
  const { prod, storeId, plusStore } = useLoaderData<typeof loader>();
  const { productsWithPreorder } = useActionData<typeof action>() ?? {
    productsWithPreorder: [],
  };
  const submit = useSubmit();
  const navigate = useNavigate();
  const [campaignName, setCampaignName] = useState("");
  const [selected, setSelected] = useState(0);
  const [productTagInput, setProductTagInput] = useState("");
  const [customerTagInput, setCustomerTagInput] = useState("");
  const [productTags, setProductTags] = useState<string[]>([]);
  const [customerTags, setCustomerTags] = useState<string[]>([]);
  const [preOrderNoteKey, setPreOrderNoteKey] = useState("Note");
  const [preOrderNoteValue, setPreOrderNoteValue] = useState("Preorder");
  const [selectedOption, setSelectedOption] = useState(2);
  const [buttonText, setButtonText] = useState("Preorder");
  const [shippingMessage, setShippingMessage] = useState(
    "Ship as soon as possible",
  );
  const [partialPaymentPercentage, setPartialPaymentPercentage] =
    useState("10");
  const [paymentMode, setPaymentMode] = useState("partial");
  const [partialPaymentType, setPartialPaymentType] = useState("percent");
  const [duePaymentType, setDuePaymentType] = useState(2);
  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });
  const [popoverActive, setPopoverActive] = useState(false);
  const [warningPopoverActive, setWarningPopoverActive] = useState(false);
  const [DueDateinputValue, setDueDateInputValue] = useState(
    new Date().toLocaleDateString(),
  );
  const [productRadio, setproductRadio] = useState("option1");
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState(new Date());
  const [campaignEndPicker, setCampaignEndPicker] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selected: { start: new Date(), end: new Date() },
    popoverActive: false,
    inputValue: new Date().toLocaleDateString(),
  });
  const [campaignEndTime, setCampaignEndTime] = useState("");
  const [productAddType, setProductAddType] = useState("specific");
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
  const [fullPaymentText, setFullPaymentText] = useState("Pay in Full");
  const [partialPaymentText, setPartialPaymentText] =
    useState("Partial payment");
  const [partialPaymentInfoText, setPartialPaymentInfoText] = useState(
    "Pay {payment} now and {remaining} will be charged on {date}",
  );
  const [activeButtonIndex, setActiveButtonIndex] = useState(-1);
  const [discountType, setDiscountType] = useState("none");
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [flatDiscount, setFlatDiscount] = useState(0);
  const [getPaymentsViaValtedPayments, setGetPaymentsViaValtedPayments] =
    useState(plusStore);
  const payment = 3.92;
  const remaining = 35.28;
  const [loading, setLoading] = useState(false);

  const formattedText = partialPaymentInfoText
    .replace("{payment}", `$${payment}`)
    .replace("{remaining}", `$${remaining}`)
    .replace("{date}", DueDateinputValue);

  const handleCampaignEndDateChange = useCallback((range) => {
    setCampaignEndPicker((prev) => ({
      ...prev,
      selected: range,
      inputValue:
        range && range.start
          ? range.start.toLocaleDateString()
          : prev.inputValue,
      popoverActive: false,
    }));
    if (range && range.start) {
      setCampaignEndDate(range.start);
    }
  }, []);

  const handleCampaignEndMonthChange = useCallback((newMonth, newYear) => {
    setCampaignEndPicker((prev) => ({
      ...prev,
      month: newMonth,
      year: newYear,
    }));
  }, []);

  const toggleCampaignEndPopover = useCallback(
    () =>
      setCampaignEndPicker((prev) => ({
        ...prev,
        popoverActive: !prev.popoverActive,
      })),
    [],
  );

  const handleCampaignEndTimeChange = useCallback((value) => {
    setCampaignEndTime(value);
  }, []);

  const openResourcePicker = () => {
    shopify.modal.hide("my-modal");

    const picker = ResourcePicker.create(appBridge, {
      resourceType:
        productRadio === "option1"
          ? ResourcePicker.ResourceType.Product
          : ResourcePicker.ResourceType.Collection,
      options: {
        selectMultiple: true,
        initialSelectionIds: selectedProducts.map((p) => ({ id: p.id })),
      },
    });

    picker.subscribe(ResourcePicker.Action.SELECT, async (payload) => {
      if (productRadio === "option1") {
        setSelectedProducts(payload.selection);
        console.log(payload.selection);
      } else {
        await fetchProductsInCollection(payload.selection[0].id);
        // setSelectedProducts(products);
      }
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
  };

  const selectAllProducts = async () => {
    const res = await fetch("/api/products");
    const allProducts = await res.json();
    console.log(allProducts, "**********************All products fetched");
    setSelectedProducts(allProducts);
  };

  const togglePopover = useCallback(
    () => setPopoverActive((active) => !active),
    [],
  );

  const handleMonthChange = useCallback((newMonth, newYear) => {
    setMonthYear({ month: newMonth, year: newYear });
  }, []);

  const handleDateChange = useCallback((range) => {
    setSelectedDates(range);
    if (range && range.start) {
      setDueDateInputValue(range.start.toLocaleDateString());
    }
    setPopoverActive(false);
  }, []);

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

  const filteredProducts = selectedProducts?.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleRemoveProduct(id: any) {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      setProductTags((prev) => [...prev, productTagInput.trim()]);
      setProductTagInput("");
      event.preventDefault();
    }
  };

  const handleKeyDownCustomerTag = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && customerTagInput.trim() !== "") {
      setCustomerTags((prev) => [...prev, customerTagInput.trim()]);
      setCustomerTagInput("");
      event.preventDefault();
    }
  };

  const handleButtonClick = useCallback(
    (index: number) => {
      if (activeButtonIndex === index) return;
      setActiveButtonIndex(index);
      setDiscountType(index === 0 ? "percentage" : "flat");
    },
    [activeButtonIndex],
  );

  const handleSubmit = () => {
    // if (
    //   !campaignName ||
    //   !partialPaymentPercentage ||
    //   !DueDateinputValue ||
    //   selectedProducts.length === 0
    // ) {
    //   alert("Please fill all required fields and add at least one product.");
    //   return;
    // }

    console.log("function hit");
    setLoading(true);
    const formData = new FormData();
    formData.append("intent", "create-campaign");
    formData.append("name", campaignName);
    formData.append("storeId", storeId);
    formData.append("depositPercent", String(partialPaymentPercentage));
    formData.append("balanceDueDate", DueDateinputValue);
    formData.append("refundDeadlineDays", "0");
    formData.append("campaignEndDate", campaignEndDate.toISOString());
    formData.append("products", JSON.stringify(selectedProducts));
    formData.append("campaignType", String(selectedOption));
    formData.append("buttonText", String(buttonText));
    formData.append("shippingMessage", String(shippingMessage));
    formData.append("paymentMode", String(paymentMode));
    formData.append("designFields", JSON.stringify(designFields));
    formData.append("discountType", discountType);
    formData.append("discountPercentage", String(discountPercentage));
    formData.append("flatDiscount", String(flatDiscount));
    formData.append("orderTags", JSON.stringify(productTags));
    formData.append("customerTags", JSON.stringify(customerTags));
    formData.append("campaignType", String(selectedOption));
    formData.append("getDueByValt", String(getPaymentsViaValtedPayments));

    submit(formData, { method: "post" });
  };

  useEffect(() => {
    console.log(selectedProducts);
  }, [selectedProducts]);

  const handleMaxUnitChange = (id: string, value: number) => {
    setSelectedProducts((prev: any) =>
      prev.map((product) =>
        product.id === id
          ? { ...product, maxUnit: value } // add/update maxUnit
          : product,
      ),
    );
  };

  const appBridge = useAppBridge();

  const handleSave = () => {
    console.log("Saving");
    shopify.saveBar.hide("my-save-bar");
  };

  const handleDiscard = () => {
    console.log("Discarding");
    shopify.saveBar.hide("my-save-bar");
  };

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
      if (productsWithPreorder[i].preorder == true) {
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
    const updatedTags = [...productTags];
    updatedTags.splice(index, 1);
    setProductTags(updatedTags);
  }

  function handleRemoveCustomerTag(index: number) {
    const updatedTags = [...customerTags];
    updatedTags.splice(index, 1);
    setCustomerTags(updatedTags);
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

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Create Preorder campaign"
        backAction={{
          content: "Back",
          onAction: () => navigate("/app"),
        }}
        primaryAction={{
          content: "Publish",
          onAction: handleSubmit,
          loading: loading,
        }}
      >
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />

        <form method="post" onSubmit={handleSubmit}>
          <input type="hidden" name="intent" value="create-campaign" />
          <input
            type="hidden"
            name="products"
            value={JSON.stringify(selectedProducts)}
          />
          <input type="hidden" name="name" value={campaignName} />
          <input
            type="hidden"
            name="depositPercent"
            value={String(partialPaymentPercentage)}
          />
          <input
            type="hidden"
            name="balanceDueDate"
            value={DueDateinputValue}
          />
          <input type="hidden" name="refundDeadlineDays" value="0" />
          <input
            type="hidden"
            name="campaignEndDate"
            value={campaignEndDate.toISOString()}
          />
          <input
            type="hidden"
            name="designFields"
            value={JSON.stringify(designFields)}
          />
          <input
            type="hidden"
            name="campaignType"
            value={JSON.stringify(selectedOption)}
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
          <SaveBar id="my-save-bar">
            <button variant="primary" onClick={handleSave}></button>
            <button onClick={handleDiscard}></button>
          </SaveBar>
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
              <div style={{ flex: 1 }}>
                <Card>
                  <BlockStack>
                    <Text as="h1" variant="headingLg">
                      New Campaign
                    </Text>
                  </BlockStack>
                  <TextField
                    id="campaignName"
                    label="Campaign Name"
                    placeholder="Enter campaign name"
                    autoComplete="off"
                    value={campaignName}
                    onChange={setCampaignName}
                  />
                  <div style={{ marginTop: 6 }}>
                    <p>This is only visible for you</p>
                  </div>
                  <div>
                    <Text as="h4" variant="headingSm">
                      Preorder
                    </Text>
                  </div>
                  {/* <LegacyStack vertical> */}
                  <RadioButton
                    label="Show Preorder when product is out of stock"
                    checked={selectedOption === 1}
                    id="preorder"
                    name="preorder"
                    onChange={() => {
                      setSelectedOption(1);
                    }}
                  />
                  {selectedOption === 1 && (
                    <ol>
                      <li>
                        The Preorder button appears when stock reaches 0 and
                        switches to "Add to cart" once inventory is replenished.
                      </li>
                      <li>
                        When the campaign is active, the app enables "Continue
                        selling when out of stock" and "Track quantity".
                      </li>
                    </ol>
                  )}
                  <RadioButton
                    label="Always show Preorder button"
                    checked={selectedOption === 2}
                    id="always-preorder"
                    name="always-preorder"
                    onChange={() => {
                      setSelectedOption(2);
                    }}
                  />
                  {selectedOption === 2 && (
                    <ol>
                      <li>
                        The Preorder button is displayed at all times,
                        regardless of stock.
                      </li>
                      <li>
                        When the campaign is active, the app enables "Continue
                        selling when out of stock" and "Track quantity".
                      </li>
                    </ol>
                  )}
                  <RadioButton
                    label="Show Preorder only when product in stock"
                    checked={selectedOption === 3}
                    id="back-in-stock"
                    name="back-in-stock"
                    onChange={() => {
                      setSelectedOption(3);
                    }}
                  />
                  {selectedOption === 3 && (
                    <ol>
                      <li>
                        The Preorder button appears when stock is available and
                        disappears when stock reaches 0 (switching to “Sold
                        out”).
                      </li>
                      <li>
                        The app enables "Track quantity" when the campaign is
                        active but makes no changes when the campaign is turned
                        off or deleted.
                      </li>
                    </ol>
                  )}
                  {/* </LegacyStack> */}
                  {/* </div> */}
                </Card>

                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Preorder Button
                    </Text>
                    <TextField
                      id="preorderButtonText"
                      label="Button Text"
                      placeholder="Enter button text"
                      autoComplete="off"
                      value={buttonText}
                      onChange={(e) => setButtonText(e)}
                    />
                    <TextField
                      id="preorderMessage"
                      label="Message"
                      placeholder="Enter message"
                      value={shippingMessage}
                      onChange={(e) => setShippingMessage(e)}
                      autoComplete="off"
                    />
                  </Card>
                </div>

                {/* discount */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"300"}>
                      <Text as="h4" variant="headingSm">
                        Discount
                      </Text>
                      <Text as="p" variant="bodyMd">
                        Only works with{" "}
                        <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                          Shopify Payments
                        </Link>{" "}
                      </Text>
                      <InlineStack gap="400">
                        <ButtonGroup variant="segmented">
                          <Button
                            pressed={activeButtonIndex === 0}
                            onClick={() => handleButtonClick(0)}
                            icon={DiscountIcon}
                          ></Button>
                          <Button
                            pressed={activeButtonIndex === 1}
                            onClick={() => handleButtonClick(1)}
                            icon={CashDollarIcon}
                          ></Button>
                        </ButtonGroup>
                        <TextField
                          suffix={activeButtonIndex === 0 ? "%" : "$"}
                          id="discount"
                          type="text"
                          value={
                            activeButtonIndex === 0
                              ? discountPercentage.toString()
                              : flatDiscount.toString()
                          }
                          onChange={(val) => {
                            if (activeButtonIndex === 0) {
                              setDiscountPercentage(Number(val));
                            } else {
                              setFlatDiscount(Number(val));
                            }
                          }}
                        />
                      </InlineStack>
                      {(activeButtonIndex === 0 && discountPercentage < 0) ||
                      discountPercentage >= 100 ? (
                        <Text as="p" variant="bodyMd" tone="critical">
                          Please enter valid discount percentage between 0 and
                          99
                        </Text>
                      ) : null}

                      <Text as="p" variant="bodyMd">
                        Can't see discount/strike through price?{" "}
                        <Link to="https://help.shopify.com/en/manual/payments/shopify-payments">
                          Contact support
                        </Link>
                      </Text>
                    </BlockStack>
                  </Card>
                </div>

                {/* preorder Note */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Preorder note
                    </Text>
                    <p>Visible in cart, checkout, transactional emails</p>
                    <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                      <TextField
                        id="preorderNote"
                        label="Preorder Note Key"
                        autoComplete="off"
                        value={preOrderNoteKey}
                        onChange={setPreOrderNoteKey}
                      />
                      <TextField
                        id="preorderNote"
                        label="Preorder Note Key"
                        autoComplete="off"
                        value={preOrderNoteValue}
                        onChange={setPreOrderNoteValue}
                      />
                    </div>
                  </Card>
                </div>

                {/* payment type */}
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Payment
                    </Text>
                    <div>
                      <LegacyStack vertical>
                        <RadioButton
                          label="Full payment"
                          checked={paymentMode === "full"}
                          id="full-payment"
                          name="full-payment"
                          onChange={() => setPaymentMode("full")}
                        />
                        {paymentMode === "full" && (
                          <>
                            <TextField
                              id="fullPaymentNote"
                              autoComplete="off"
                              label="Full payment text"
                              onChange={setFullPaymentText}
                              value={fullPaymentText}
                            />
                            <Text as="p" variant="bodyMd">
                              Visible in cart, checkout, transactional emails
                            </Text>
                          </>
                        )}
                        <RadioButton
                          label="Partial payment"
                          id="partial-payment"
                          name="partial-payment"
                          checked={paymentMode === "partial"}
                          onChange={() => setPaymentMode("partial")}
                        />
                        {paymentMode === "partial" && (
                          <div>
                            <div style={{ display: "flex", gap: 10 }}>
                              <div>
                                <ButtonGroup variant="segmented">
                                  <Button
                                    pressed={partialPaymentType === "percent"}
                                    onClick={() =>
                                      setPartialPaymentType("percent")
                                    }
                                    icon={DiscountIcon}
                                  ></Button>
                                  {/* <Button
                                  pressed={partialPaymentType === "flat"}
                                  onClick={() => setPartialPaymentType("flat")}
                                  icon={CashDollarFilledIcon}
                                  aria-label="Flat payment"
                                ></Button> */}
                                </ButtonGroup>
                              </div>
                              <div style={{ flex: 1 }}>
                                <TextField
                                  autoComplete="off"
                                  suffix={` ${partialPaymentType === "percent" ? "%" : "$"}`}
                                  value={partialPaymentPercentage}
                                  onChange={setPartialPaymentPercentage}
                                />
                              </div>
                            </div>
                            <div
                              style={{
                                marginTop: 10,
                                display: "flex",
                                gap: 10,
                                alignContent: "center",
                                alignItems: "center",
                              }}
                            >
                              <div>
                                <ButtonGroup variant="segmented">
                                  {/* <Button
                                  pressed={duePaymentType === 1}
                                  onClick={() => setDuePaymentType(1)}
                                  icon={ClockIcon}
                                ></Button> */}
                                  <Button
                                    pressed={duePaymentType === 2}
                                    onClick={() => setDuePaymentType(2)}
                                    icon={CalendarCheckIcon}
                                  ></Button>
                                </ButtonGroup>
                              </div>
                              <div style={{}}>
                                {duePaymentType === 1 && (
                                  <TextField
                                    id="partialPaymentNote"
                                    autoComplete="off"
                                    suffix="days after checkout"
                                  />
                                )}
                                {duePaymentType === 2 && (
                                  <div>
                                    <Popover
                                      active={popoverActive}
                                      activator={
                                        // <div style={{ flex: 1 }}>
                                        <TextField
                                          label="Select date for due payment"
                                          value={DueDateinputValue}
                                          onFocus={togglePopover}
                                          onChange={() => {}}
                                          autoComplete="off"
                                        />
                                        // </div>
                                      }
                                      onClose={() => setPopoverActive(false)}
                                    >
                                      <DatePicker
                                        month={month}
                                        year={year}
                                        onChange={handleDateChange}
                                        onMonthChange={handleMonthChange}
                                        selected={selectedDates}
                                      />
                                    </Popover>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              {plusStore && (
                                <Checkbox
                                  label="Get Due payments via Valted credit cards Note:Works only with Shopify Payments"
                                  checked={getPaymentsViaValtedPayments}
                                  onChange={() =>
                                    setGetPaymentsViaValtedPayments(
                                      !getPaymentsViaValtedPayments,
                                    )
                                  }
                                />
                              )}
                            </div>
                            <TextField
                              autoComplete="off"
                              label="Partial payment text"
                              onChange={setPartialPaymentText}
                              value={partialPaymentText}
                            />
                            <Text as="p" variant="bodyMd">
                              Visible in cart, checkout, transactional emails
                            </Text>
                            <div>
                              <TextField
                                autoComplete="off"
                                label="Text"
                                value={partialPaymentInfoText}
                                onChange={setPartialPaymentInfoText}
                              />
                              <Text as="p" variant="bodyMd">
                                Use {"{payment}"} and {"{remaining}"} to display
                                partial payment amounts and {"{date}"} for full
                                amount charge date.
                              </Text>
                            </div>
                          </div>
                        )}
                      </LegacyStack>
                    </div>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Text as="h4" variant="headingSm">
                      Campaign End Date and Time
                    </Text>
                    <div
                      style={{ display: "flex", gap: 10, alignItems: "center" }}
                    >
                      <div style={{ flex: 1 }}>
                        <Popover
                          active={campaignEndPicker.popoverActive}
                          activator={
                            <div style={{ flex: 1 }}>
                              <TextField
                                label="Select end date"
                                value={campaignEndPicker.inputValue}
                                onFocus={toggleCampaignEndPopover}
                                onChange={() => {}}
                                autoComplete="off"
                              />
                            </div>
                          }
                          onClose={toggleCampaignEndPopover}
                        >
                          <DatePicker
                            month={campaignEndPicker.month}
                            year={campaignEndPicker.year}
                            onChange={handleCampaignEndDateChange}
                            onMonthChange={handleCampaignEndMonthChange}
                            selected={campaignEndPicker.selected}
                          />
                        </Popover>
                      </div>
                      <div>
                        <TextField
                          id="campaignEndTime"
                          autoComplete="off"
                          type="time"
                          label="Time"
                          placeholder="Select time"
                          value={campaignEndTime}
                          onChange={handleCampaignEndTimeChange}
                        />
                      </div>
                    </div>
                    <Text as="p" variant="bodyMd">
                      Campaign will end at the selected date and time.
                    </Text>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"200"}>
                      <Text as="h4" variant="headingSm">
                        Order tags
                      </Text>
                      <div onKeyDown={handleKeyDown}>
                        <TextField
                          label="Order Tags"
                          value={productTagInput}
                          onChange={(value) => setProductTagInput(value)} // Polaris style
                          autoComplete="off"
                        />
                      </div>
                      <Text as="h4" variant="headingSm">
                        For customers who placed preorders
                      </Text>
                      <div>
                        {productTags.map((tag, index) => (
                          <div key={index} style={{ display: "inline-block" }}>
                            <span
                              key={index}
                              style={{
                                marginRight: 5,
                                backgroundColor: "gray",
                                padding: 5,
                                borderRadius: 5,
                                position: "relative",
                              }}
                            >
                              {tag}
                              <button
                                style={{
                                  backgroundColor: "gray",
                                  padding: 5,
                                  border: "none",
                                }}
                                onClick={() => handleRemoveTag(index)}
                              >
                                X
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <BlockStack gap={"200"}>
                      <Text as="h4" variant="headingSm">
                        Customer tags
                      </Text>
                      <div onKeyDown={handleKeyDownCustomerTag}>
                        <TextField
                          label="Customer Tags"
                          value={customerTagInput}
                          onChange={(value) => setCustomerTagInput(value)} // Polaris style
                          autoComplete="off"
                        />
                      </div>
                      <Text as="h4" variant="headingSm">
                        For customers who placed preorders
                      </Text>
                      <div>
                        {customerTags.map((tag, index) => (
                          <div key={index} style={{ display: "inline-block" }}>
                            <span
                              key={index}
                              style={{
                                marginRight: 5,
                                backgroundColor: "gray",
                                padding: 5,
                                borderRadius: 5,
                                position: "relative",
                              }}
                            >
                              {tag}
                              <button
                                style={{
                                  backgroundColor: "gray",
                                  padding: 5,
                                  border: "none",
                                }}
                                onClick={(key) => {
                                  handleRemoveCustomerTag(index);
                                }}
                              >
                                X
                              </button>
                            </span>
                          </div>
                        ))}
                      </div>
                    </BlockStack>
                  </Card>
                </div>
                <div style={{ marginTop: 20 }}>
                  <Card>
                    <Button fullWidth onClick={() => setSelected(1)}>
                      Continue to design
                    </Button>
                  </Card>
                </div>
              </div>
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
                            {discountPercentage === 0 && flatDiscount === 0 ? (
                              <Text as="h1" variant="headingLg">
                                $499.00
                              </Text>
                            ) : (
                              <Text as="h1" variant="headingLg">
                                {activeButtonIndex === 0 &&
                                discountPercentage !== 0
                                  ? "$" +
                                    (
                                      499.0 -
                                      (499.0 * discountPercentage) / 100
                                    ).toFixed(2)
                                  : 499.0 - flatDiscount > 0
                                    ? "$" + (499.0 - flatDiscount)
                                    : "$" + 0}
                              </Text>
                            )}
                          </Text>
                          {discountPercentage === 0 &&
                          flatDiscount === 0 ? null : (
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
                    <div style={{ marginTop: 20 }}>
                      <Text as="h1" variant="headingSm">
                        Size
                      </Text>
                      <div style={{ display: "flex", gap: 10 }}>
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: 2,
                            minWidth: "60px",
                            textAlign: "center",
                          }}
                        >
                          Small
                        </div>
                        <div
                          style={{
                            border: "1px solid black",
                            borderRadius: 80,
                            padding: 3,
                            backgroundColor: "black",
                            minWidth: "60px",
                          }}
                        >
                          <span style={{ color: "white", textAlign: "center" }}>
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
                          {buttonText}
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
                          {shippingMessage}
                        </h3>
                      </Text>
                    </div>
                    {paymentMode === "partial" && (
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
                          {paymentMode === "partial" ? (
                            <p>{partialPaymentText}</p>
                          ) : (
                            <p>{fullPaymentText}</p>
                          )}
                          <p>
                            {preOrderNoteKey} : {preOrderNoteValue}
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
                          onClick={() => {
                            // setProductAddType("all")
                            selectAllProducts();
                          }}
                        >
                          Add all products
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
                <Card title="Selected Products">
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
                        // label="Search products"
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
                          {selectedOption !== 3 && (
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
                        {filteredProducts.map((product) => (
                          <tr
                            key={product.id}
                            style={{
                              backgroundColor: handleDuplication(product.id)
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
                                src={
                                  product.images?.[0]?.originalSrc ||
                                  product.image
                                }
                                alt={product.title}
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
                              {product.title}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                                textAlign: "center",
                              }}
                            >
                              {product.totalInventory
                                ? product.totalInventory
                                : product.inventory}
                            </td>
                            {selectedOption !== 3 && (
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
                                  value={
                                    product?.maxUnit?.toString() ||
                                    selectedOption == 3
                                      ? product.totalInventory
                                        ? product.totalInventory
                                        : product.inventory
                                      : "0"
                                  }
                                  onChange={(value) =>
                                    handleMaxUnitChange(
                                      product.id,
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
                              {product.variants?.[0]?.price || product.price}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #eee",
                              }}
                            >
                              <div
                                onClick={() => {
                                  handleRemoveProduct(product.id);
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
                    label="specific Product"
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
              <TitleBar title="Add products">
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
