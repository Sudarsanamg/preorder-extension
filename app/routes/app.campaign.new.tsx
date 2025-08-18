import { useState, useCallback } from "react";
import { LoaderFunctionArgs, ActionFunctionArgs, json } from "@remix-run/node";

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
  FormLayout,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css";
import { authenticate } from "../shopify.server";
import {  useSubmit } from "@remix-run/react";
import {
  DiscountIcon,
  CalendarCheckIcon,
  DeleteIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import { ResourcePicker } from "@shopify/app-bridge/actions";
import { useAppBridge } from "../components/AppBridgeProvider";
import { Modal, TitleBar } from "@shopify/app-bridge-react";
import {
  createPreorderCampaign,
  addProductsToCampaign,
} from "../models/campaign.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  const query = `
    query {
      products(first: 20) {
        edges {
          node {
            id
            title
            totalInventory
            priceRangeV2 {
              minVariantPrice {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
  `;

  const response = await admin.graphql(query);
  const data = await response.json();

  const products = data.data.products.edges.map(({ node }) => ({
    id: node.id.replace("gid://shopify/Product/", ""), // numeric id for metafield updates
    gid: node.id,
    title: node.title,
    stock: node.totalInventory,
    price: `${node.priceRangeV2.minVariantPrice.amount} ${node.priceRangeV2.minVariantPrice.currencyCode}`,
  }));

  return json({ products });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  console.log("[Remix action] /campaign/new action triggered");
  const formData = await request.formData();
  const intent = formData.get("intent");
  console.log(
    "action-hit*************************************************************",
  );

  switch (intent) {
    case "create-campaign": {
      const campaign = await createPreorderCampaign({
        name: formData.get("name") as string,
        depositPercent: Number(formData.get("depositPercent")),
        balanceDueDate: new Date(formData.get("balanceDueDate") as string),
        refundDeadlineDays: Number(formData.get("refundDeadlineDays")),
        releaseDate: formData.get("releaseDate")
          ? new Date(formData.get("releaseDate") as string)
          : undefined,
      });

      const products = JSON.parse((formData.get("products") as string) || "[]");
      if (products.length > 0) {
        await addProductsToCampaign(campaign.id, products);
      }

      return json({ success: "Unknown intent" }, { status: 400 });
    }

    default:
      return json({ error: "Unknown intent" }, { status: 400 });
  }
};

export default function Newcampaign() {
  const submit = useSubmit();
  const [campaignName, setCampaignName] = useState("");
  const [selected, setSelected] = useState(0);
  // const [open, setOpen] = useState(true);

  // const { products } = useLoaderData<typeof loader>();
  // const [loading, setLoading] = useState(false);
  // const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [productTagInput,setProductTagInput] = useState("");
  const [productTags, setProductTags] = useState([]);
  const [preOrderNoteKey,setPreOrderNoteKey] = useState("Note");
  const [preOrderNoteValue,setPreOrderNoteValue] = useState("Preorder");
  const [selectedOption, setSelectedOption] = useState("preorder");
  const [buttonText, setButtonText] = useState("Preorder");
  const [shippingMessage, setShippingMessage] = useState(
    "Ship as soon as possible",
  );
  const [partialPaymentPercentage, setPartialPaymentPercentage] = useState("");
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
  // Handler for campaign end date picker
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

  const appBridge = useAppBridge();

  const openResourcePicker = () => {
    shopify.modal.hide("my-modal");
    const picker = ResourcePicker.create(appBridge, {
      resourceType: ResourcePicker.ResourceType.Product,
      options: {
        selectMultiple: true,
      },
    });
    picker.subscribe(ResourcePicker.Action.SELECT, (payload) => {
      const selection = payload.selection;
      setSelectedProducts(payload.selection);
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
    // Format the selected date for the input field
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
      id: "add-products",
      content: "Add Products",
      panelID: "add-products-content",
    },
  ];

  const filteredProducts = selectedProducts.filter((product) =>
    product.title.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  function handleRemoveProduct(id: any) {
    setSelectedProducts((prev) => prev.filter((product) => product.id !== id));
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && productTagInput.trim() !== "") {
      setProductTags((prev) => [...prev, productTagInput.trim()]);
      setProductTagInput(""); // clear input
      event.preventDefault(); // prevent form submit
    }
  };



    // if (!campaignName || !partialPaymentPercentage || !DueDateinputValue || selectedProducts.length === 0) {
    //   alert("Please fill all required fields and add at least one product.");
    //   return;
    // }


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
  event.preventDefault();

  const formData = new FormData();
  formData.append("intent", "create-campaign");
  formData.append("name", campaignName);
  formData.append("depositPercent", String(partialPaymentPercentage));
  formData.append("balanceDueDate", DueDateinputValue);
  formData.append("refundDeadlineDays", "0");
  formData.append("releaseDate", campaignEndDate.toISOString());
  formData.append("products", JSON.stringify(selectedProducts)); // arrays/objects must be stringified

  submit(formData, { method: "post" });
};



  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Create Preorder campaign"
        backAction={{ content: "Back", url: "/" }}
        primaryAction={{
          content: "Publish",
        }}
      >
        {/* <button
          type="button"
          onClick={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent<HTMLFormElement>)}
        >
          Submit
        </button> */}
        <form method="post" onSubmit={handleSubmit}>
           <div style={{ display: "flex", justifyContent: "flex-end", margin: "10px" }}>
              <button type="submit">
                Create
              </button>
            </div>
          <FormLayout>
        {selected === 0 && (
          <div
            style={{
              display: "flex",
              position: "relative",
              paddingBottom: 20,
            }}
          >
            {/*  */}
            {/* left */}
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
                      {/* <li>
                        The Preorder button appears when stock reaches 0 and
                        switches to "Add to cart" once inventory is replenished.
                      </li>
                      <li>
                        When the campaign is active, the app enables "Continue selling when out of stock" and "Track quantity".
                      </li> */}
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
                    <TextField id="preorderNote" label="Preorder Note Key" autoComplete="off" value={preOrderNoteKey} onChange={setPreOrderNoteKey}  />
                    <TextField id="preorderNote" label="Preorder Note Key" autoComplete="off" value={preOrderNoteValue} onChange={setPreOrderNoteValue} />
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
                            style={{ marginTop: 10, display: "flex", gap: 10 }}
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
                  <div
                    onKeyDown={handleKeyDown}
                  >
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
                      <span key={index} style={{ marginRight: 5 ,backgroundColor:'gray',padding:5,borderRadius:5}}>
                        {tag}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
            {/* right */}
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
                      marginTop: 20,
                    }}
                  >
                    <div
                      style={{
                        height: 50,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: "#000",
                        borderRadius: 5,
                        marginTop: "auto",
                      }}
                    >
                      <span style={{ color: "white", fontWeight: "bold" }}>
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
                      {shippingMessage}
                    </Text>
                  </div>
                  {paymentMode === 'partial' && (
                    <div style={{ display: "flex", justifyContent: "center" }}>
                      <Text as="h1" variant="headingMd">
                        Pay ₹3.92 now and ₹35.28 will be charged on {DueDateinputValue}
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
                    <div style={{display:'flex',gap:25}}>
                      <div>
                        <img src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg" alt="" height={80} />
                      </div>
                      <div>
                        <p style={{ fontWeight: "bold" ,fontSize:"16px"}}>Baby Pink T-shirt</p>
                        {
                        paymentMode === 'partial' ?
                         <p>Partial payment</p> 
                         : 
                         <p>Pay in full</p>
                         }
                         <p>{preOrderNoteKey} : {preOrderNoteValue}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
        {selected === 1 && (
          <div>
            {selectedProducts.length === 0 && (
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
                      Products and variants that are added will be prepared for
                      preorder after the campaign is published
                    </Text>
                  </div>
                  <div>
                    <ButtonGroup>
                      <Button onClick={() => shopify.modal.show("my-modal")}>
                        Add Specific Product
                      </Button>
                      <Button variant="primary">Add all products</Button>
                    </ButtonGroup>
                  </div>
                </div>
              </Card>
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
                              src={product.images?.[0]?.originalSrc || ""}
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
                            {product.totalInventory}
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
                              value={product.preorderQuantity || ""}
                              // onChange={qty => {
                              //   setSelectedProducts(prev =>
                              //     prev.map(p =>
                              //       p.id === product.id
                              //         ? { ...p, preorderQuantity: qty }
                              //         : p
                              //     )
                              //   );
                              // }}
                            />
                          </td>
                          <td
                            style={{
                              padding: "8px",
                              borderBottom: "1px solid #eee",
                            }}
                          >
                            {product.variants?.[0]?.price || "N/A"}
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
        {/* </div> */}
        </FormLayout>
        </form>
      </Page>
    </AppProvider>
  );
}
