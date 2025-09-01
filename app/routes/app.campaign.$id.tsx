import { json, type LoaderFunctionArgs } from "@remix-run/node";
import {
  deleteCampaign,
  getCampaignById,
  replaceProductsInCampaign,
  updateCampaign,
} from "../models/campaign.server";
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
  Badge,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {
  useSubmit,
  useNavigate,
  useFetcher,
  useActionData,
  useLoaderData,
} from "@remix-run/react";
import {
  DiscountIcon,
  CalendarCheckIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker, Redirect } from "@shopify/app-bridge/actions";
// import {
//   createPreorderCampaign,
//   addProductsToCampaign,
// } from "../models/campaign.server";
import { useAppBridge } from "../components/AppBridgeProvider";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import { DesignFields } from "app/types/type";
import PreviewDesign from "app/components/PreviewDesign";

export const loader = async ({ params, request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // ✅ get campaign from your DB
  const campaign = await getCampaignById(params.id!);

  // ✅ product IDs from campaign
  const productIds = campaign?.products?.map((p) => p.productId) || [];

  if (productIds.length === 0) {
    return json({ campaign, products: [] });
  }

  // ✅ format IDs into Shopify GID format
  const formattedIds = productIds.map((id) => `"${id}"`).join(",");

  // ✅ GraphQL query
  const query = `
    {
      nodes(ids: [${formattedIds}]) {
        ... on Product {
          id
          title
          featuredImage {
            url
          }
          variants(first: 1) {
            edges {
              node {
                price
                inventoryQuantity
              }
            }
          }
        }
      }
    }
  `;

  // ✅ Run query via admin.graphql
  const response = await admin.graphql(query);
  const data = await response.json();
  const products = data.data.nodes.map((product: any) => ({
    id: product.id,
    title: product.title,
    image: product.featuredImage?.url,
    price: product.variants.edges[0]?.node.price ?? null,
    inventory: product.variants.edges[0]?.node.inventoryQuantity ?? null,
  }));

  const GET_DESIGN_SETTINGS = `
  query GetDesignSettings($handle: String!) {
    metaobjectByHandle(handle: { handle: $handle, type: "design_settings" }) {
      id
      handle
      type
      fields {
        key
        value
        type
      }
    }
  }
`;

 let designSettingsResponse = await admin.graphql(GET_DESIGN_SETTINGS, {
    variables: { handle: params.id! },
  });

  let parsedDesignSettingsResponse = await designSettingsResponse.json();

  return json({
    campaign,
    products,
    parsedDesignSettingsResponse
  });
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent === "delete-campaign") {
    const id = formData.get("id");
    await deleteCampaign(id);
    return redirect("/app");
  }
  if (intent === "update-campaign") {
    try {
      const updatedCampaign = await updateCampaign({
        id: params.id!,
        name: formData.get("name") as string,
        depositPercent: Number(formData.get("depositPercent")),
        balanceDueDate: new Date(formData.get("balanceDueDate") as string),
        refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
        releaseDate: formData.get("campaignEndDate")
          ? new Date(formData.get("campaignEndDate") as string)
          : undefined,
      });

      console.log(updatedCampaign, "updated campaign");
    } catch (error) {
      console.error(error);
    }

    const updatedProducts = JSON.parse(
      (formData.get("products") as string) || "[]",
    );


    try {
      const replace = await replaceProductsInCampaign(
        String(params.id!),
        updatedProducts,
      );
      console.log(replace);
      return redirect(`/app/`);
    } catch (error) {
      console.error(error);
    }
  }

  if (intent === "unpublish-campaign") {
    const id = formData.get("id");

    const unpublishMutation = `
mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $status: String!) {
  metaobjectUpsert(
    handle: $handle,
    metaobject: {
      fields: [
        { key: "status", value: $status }
      ]
    }
  ) {
    metaobject {
      id
      handle
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;
    try {
      const res = await admin.graphql(unpublishMutation, {
        variables: {
          handle: { type: "preordercampaign", handle: id }, // 👈 your campaign UUID
          status: "DRAFT",
        },
      });

      const result = await res.json();

      //need to get campaign products and need to remove campaign_id metafield in them

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

      const products = JSON.parse((formData.get("products") as string) || "[]");

      const metafields = products.flatMap((product) => [
        {
          ownerId: product.id,
          namespace: "custom",
          key: "campaign_id",
          value: "null",
        },
        {
          ownerId: product.id,
          namespace: "custom",
          key: "preorder",
          value: "false",
        },
      ]);

      try {
        const graphqlResponse = await admin.graphql(mutation, {
          variables: { metafields },
        });

        const response = await graphqlResponse.json(); // 👈 parse it

        if (response.data?.metafieldsSet?.userErrors?.length) {
          console.error(
            "///////////////////////",
            response.data.metafieldsSet.userErrors,
          );
        }
      } catch (err) {
        console.error("❌ GraphQL mutation failed:", err);
        throw err;
      }

      const GET_PRODUCT_SELLING_PLAN_GROUPS = `
  query GetProductSPGs($id: ID!) {
    product(id: $id) {
      id
      title
      sellingPlanGroups(first: 50) {
        edges {
          node {
            id
            name
            merchantCode
          }
        }
      }
    }
  }
`;

const DELETE_SELLING_PLAN_GROUP = `
  mutation DeleteSellingPlanGroup($id: ID!) {
    sellingPlanGroupDelete(id: $id) {
      deletedSellingPlanGroupId
      userErrors {
        field
        message
      }
    }
  }
`;


const productResp = await admin.graphql(GET_PRODUCT_SELLING_PLAN_GROUPS, {
      variables: { id: products[0].id},
    });
    const productData = await productResp.json();

    const groups =
      productData.data.product.sellingPlanGroups.edges.map(
        (edge) => edge.node
      ) || [];

        const deletedGroups = [];
    const errors = [];

    for (const group of groups) {
      const deleteResp = await admin.graphql(DELETE_SELLING_PLAN_GROUP, {
        variables: { id: group.id },
      });
      const deleteData = await deleteResp.json();

      if (
        deleteData.data.sellingPlanGroupDelete.userErrors &&
        deleteData.data.sellingPlanGroupDelete.userErrors.length > 0
      ) {
        errors.push({
          groupId: group.id,
          errors: deleteData.data.sellingPlanGroupDelete.userErrors,
        });
      } else {
        deletedGroups.push(deleteData.data.sellingPlanGroupDelete.deletedSellingPlanGroupId);
      }
    }

      return redirect(`/app`);
    } catch (error) {
      console.log(error);
    }
  }

  return null;
};

export default function CampaignDetail() {
  const { campaign, products ,parsedDesignSettingsResponse} = useLoaderData<typeof loader>();
  // console.log(res.campaign?.products)
  // console.log(products, "products");
  console.log(parsedDesignSettingsResponse, "parsedDesignSettingsResponse");
  const designFieldsObj = parsedDesignSettingsResponse.data.metaobjectByHandle.fields;
  const submit = useSubmit();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const actionData = useActionData<typeof action>();
  const [campaignId, setCampaignId] = useState(campaign?.id);

  const [campaignName, setCampaignName] = useState(campaign?.name);
  const [selected, setSelected] = useState(0);
  const [productTagInput, setProductTagInput] = useState("");
  const [productTags, setProductTags] = useState([]);
  const [preOrderNoteKey, setPreOrderNoteKey] = useState("Note");
  const [preOrderNoteValue, setPreOrderNoteValue] = useState("Preorder");
  const [selectedOption, setSelectedOption] = useState("preorder");
  const [buttonText, setButtonText] = useState("Preorder");
  const [shippingMessage, setShippingMessage] = useState(
    "Ship as soon as possible",
  );
  const [partialPaymentPercentage, setPartialPaymentPercentage] = useState(
    campaign?.depositPercent,
  );
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
  const [DueDateinputValue, setDueDateInputValue] = useState(
    new Date(
      campaign?.balanceDueDate ? campaign.balanceDueDate : new Date(),
    ).toLocaleDateString(),
  );
  const [productRadio, setproductRadio] = useState("option1");
  const [selectedProducts, setSelectedProducts] = useState(products || []);
  const [searchTerm, setSearchTerm] = useState("");
  const [campaignEndDate, setCampaignEndDate] = useState<Date | null>(
    campaign?.campaignEndDate ? new Date(campaign.campaignEndDate) : null,
  );
  const [campaignEndPicker, setCampaignEndPicker] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    selected: { start: new Date(), end: new Date() },
    popoverActive: false,
    inputValue: new Date().toLocaleDateString(),
  });
  const [campaignEndTime, setCampaignEndTime] = useState(
    campaign?.campaignEndDate
      ? campaign.campaignEndDate
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  );
  console.log(campaignEndTime, "campaignEndTime");
  const [status, setStatus] = useState<"published" | "not_published">(
    "not_published",
  );

  console.log(designFieldsObj)

  const designFieldsMap = designFieldsObj.reduce((acc, field) => {
  acc[field.key] = field.value;
  return acc;
}, {} as Record<string, string>);

  const [designFields, setDesignFields] = useState<DesignFields>({
    messageFontSize: designFieldsMap.messagefontsize,
    messageColor: designFieldsMap.messagecolor,
    fontFamily: designFieldsMap.fontfamily,
    buttonStyle: designFieldsMap.buttonstyle,
    buttonBackgroundColor: designFieldsMap.buttonbackgroundcolor,
    gradientDegree: designFieldsMap.gradientdegree,
    gradientColor1: designFieldsMap.gradientcolor1,
    gradientColor2: designFieldsMap.gradientcolor2,
    borderSize: designFieldsMap.bordersize,
    borderColor: designFieldsMap.bordercolor,
    spacingIT: designFieldsMap.spacingit,
    spacingIB: designFieldsMap.spacingib,
    spacingOT: designFieldsMap.spacingot,
    spacingOB: designFieldsMap.spacingob,
    borderRadius: designFieldsMap.borderradius,
    preorderMessageColor: designFieldsMap.preordermessagecolor,
    buttonFontSize: designFieldsMap.buttonfontsize,
    buttonTextColor: designFieldsMap.buttontextcolor,
  });
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

    async function fetchProductsInCollection(collectionId: string) {
      const res = await fetch("/api/products-in-collection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId }),
      });

      if (!res.ok) throw new Error("Failed to fetch products");

      const data = await res.json();
      return data.products;
    }

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
        // ✅ products directly selected
        setSelectedProducts(payload.selection);
      } else {
        // ✅ collections selected → fetch products inside
        let allProducts: any[] = [];

        for (const collection of payload.selection) {
          const productsInCollection = await fetchProductsInCollection(
            collection.id,
          );
          allProducts = [...allProducts, ...productsInCollection];
        }

        // remove duplicates by product id
        const uniqueProducts = Array.from(
          new Map(allProducts.map((p) => [p.id, p])).values(),
        );

        setSelectedProducts(uniqueProducts);
      }
    });

    picker.dispatch(ResourcePicker.Action.OPEN);
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

  const filteredProducts =
    selectedProducts.length > 0
      ? selectedProducts.filter((product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()),
        )
      : [];

  function handleRemoveProduct(id: string) {
    if (selectedProducts.length === 0) return; // do nothing if empty

    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      setProductTags((prev) => [...prev, productTagInput.trim()]);
      setProductTagInput(""); // clear input
      event.preventDefault(); // prevent form submit
    }
  };

  const handleSubmit = () => {
    //  if (!campaignName || !partialPaymentPercentage || !DueDateinputValue || selectedProducts.length === 0) {
    //   alert("Please fill all required fields and add at least one product.");
    //   return;
    // }

    console.log("function hit");
    const formData = new FormData();
    formData.append("intent", "update-campaign");
    formData.append("name", campaignName!);
    formData.append("depositPercent", String(partialPaymentPercentage));
    formData.append("balanceDueDate", DueDateinputValue);
    formData.append("refundDeadlineDays", "0");
    formData.append("campaignEndDate", campaignEndDate?.toISOString() ?? "");
    formData.append("products", JSON.stringify(selectedProducts)); // arrays/objects must be stringified

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

  useEffect(() => {
    console.log(selectedProducts);
  }, [selectedProducts]);

  const appBridge = useAppBridge();

  async function handleDelete(id: string) {
    const formData = new FormData();
    formData.append("intent", "delete-campaign");
    formData.append("id", id);

    submit(formData, { method: "post" });
  }

  // const handleNavigation = () => {
  //   // Use Remix Link for normal navigation
  //   // Or use appBridge.navigate for programmatic navigation
  //   if (appBridge && appBridge.navigate) {
  //     appBridge.navigate('/your-route');
  //   }
  // };

  const [active, setActive] = useState(false);

  const handleOpen = () => setActive(true);
  const handleClose = () => setActive(false);

  function handleUnpublish(id: string): void {
    const formData = new FormData();
    formData.append("intent", "unpublish-campaign");
    formData.append("products", JSON.stringify(selectedProducts)); // arrays/objects must be stringified
    formData.append("id", id);

    submit(formData, { method: "post" });
  }

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Update Preorder campaign"
        titleMetadata={
          status === "published" ? (
            <Badge tone="success">Published</Badge>
          ) : (
            <Badge tone="info">Not published</Badge>
          )
        }
        backAction={{
          content: "Back",
          onAction: () => navigate("/app"), // <-- Remix navigate
        }} // primaryAction={{
        //   content: "Publish",
        //   onAction: handleSubmit,
        // }}
        primaryAction={{
          content: "Unpublish",
          varient: "primary",
          onAction: () => handleUnpublish(String(campaign?.id)),
        }}
        secondaryActions={[
          {
            content: "Delete",
            destructive: true,
            onAction: () => shopify.modal.show("delete-modal"),
          },
        ]}
      >
        <Modal id="delete-modal">
          <p style={{ padding: "10px" }}>
            Delete "{campaign?.name}" This will also remove the campaign from
            your Shopify store and can’t be undone.
          </p>
          <TitleBar title={`Delete ${campaign?.name}?`}>
            <button
              variant="primary"
              tone="critical"
              onClick={() => handleDelete(String(campaign?.id))}
            >
              Delete
            </button>
            <button onClick={() => shopify.modal.hide("delete-modal")}>
              Label
            </button>
          </TitleBar>
        </Modal>
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

          <div
            style={{ display: "flex", justifyContent: "flex-end", margin: 2 }}
          >
            <button
              type="submit"
              style={{
                backgroundColor: "black",
                color: "white",
                padding: 5,
                borderRadius: 5,
              }}
            >
              Publish
            </button>
          </div>
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
                  <LegacyStack vertical>
                    <RadioButton
                      label="Show Preorder when product is out of stock"
                      checked={selectedOption === "out-of-stock"}
                      id="preorder"
                      name="preorder"
                      onChange={() => setSelectedOption("out-of-stock")}
                    />
                    {selectedOption === "out-of-stock" && (
                      <ol>
                        <li>
                          The Preorder button appears when stock reaches 0 and
                          switches to "Add to cart" once inventory is
                          replenished.
                        </li>
                        <li>
                          When the campaign is active, the app enables "Continue
                          selling when out of stock" and "Track quantity".
                        </li>
                      </ol>
                    )}
                    <RadioButton
                      label="Always show Preorder button"
                      checked={selectedOption === "always-preorder"}
                      id="always-preorder"
                      name="always-preorder"
                      onChange={() => {
                        setSelectedOption("always-preorder");
                      }}
                    />
                    {selectedOption === "always-preorder" && (
                      <Text as="p">
                        Preorder lets customers buy before stock is available.
                      </Text>
                    )}
                    <RadioButton
                      label="Show Preorder only when product in stock"
                      checked={selectedOption === "in-stock"}
                      id="back-in-stock"
                      name="back-in-stock"
                      onChange={() => {
                        setSelectedOption("in-stock");
                      }}
                    />
                    {selectedOption === "in-stock" && (
                      <Text>
                        Preorder lets customers buy before stock is available.
                      </Text>
                    )}
                  </LegacyStack>
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
                                  suffix={` ${partialPaymentType === "percent" ? "%" : "₹"}`}
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
                              <div style={{ flex: 1 }}>
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
                                        <div style={{ flex: 1 }}>
                                          <TextField
                                            label="Select date for due payment"
                                            value={DueDateinputValue}
                                            onFocus={togglePopover}
                                            onChange={() => {}}
                                            autoComplete="off"
                                          />
                                        </div>
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
                            <TextField
                              autoComplete="off"
                              label="Partial payment text"
                            />
                            <Text as="p" variant="bodyMd">
                              Visible in cart, checkout, transactional emails
                            </Text>
                            <div>
                              <TextField autoComplete="off" label="Text" />
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
                        <span
                          key={index}
                          style={{
                            marginRight: 5,
                            backgroundColor: "gray",
                            padding: 5,
                            borderRadius: 5,
                          }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </Card>
                </div>
              </div>
            )}
            {selected === 1 && (
              <div style={{ flex: 1 }}>
                <PreviewDesign
                  designFields={designFields}
                  setDesignFields={setDesignFields}
                />
              </div>
            )}

            {/* right */}
            {(selected === 0 || selected === 1) && (
              <div style={{ flex: 1, marginLeft: 20 }}>
                {/* preview */}
                <div style={{ position: "sticky", top: 20 }}>
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
                        <Text as="h1" variant="headingMd">
                          ₹499.00
                        </Text>
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
                          Pay ₹3.92 now and ₹35.28 will be charged on{" "}
                          {DueDateinputValue}
                        </Text>
                      </div>
                    )}
                  </Card>
                  <div>
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
                            <p>Partial payment</p>
                          ) : (
                            <p>Pay in full</p>
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
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
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
                        <th
                          style={{
                            padding: "8px",
                            borderBottom: "1px solid #eee",
                          }}
                        >
                          Inventory limit
                        </th>
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
                        ></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
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
                            }}
                          >
                            {product.title}
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {product.totalInventory
                              ? product.totalInventory
                              : product.inventory}
                          </td>
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
                              value={product?.maxUnit?.toString() || "0"} // Polaris expects string
                              onChange={(value) =>
                                handleMaxUnitChange(product.id, Number(value))
                              }
                            />
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
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
      </Page>
    </AppProvider>
  );
}
