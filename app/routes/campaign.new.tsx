import { useState, useCallback, useEffect } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

import {
  Tabs,
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
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css"; 
import { authenticate } from "../shopify.server";
import { useSubmit, useLoaderData } from "@remix-run/react";
import {
  ClockIcon,
  DiscountIcon,
  CashDollarFilledIcon,
  CalendarCheckIcon,
} from "@shopify/polaris-icons";
import enTranslations from "@shopify/polaris/locales/en.json";
import {ResourcePicker} from '@shopify/app-bridge/actions';
import { useAppBridge } from "../components/AppBridgeProvider"; 

import { json } from "@remix-run/node";

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
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const ids = JSON.parse(formData.get("productIds") as string); // array of numeric product IDs

  const metafields = ids.map((id) => ({
    ownerId: `gid://shopify/Product/${id}`,
    namespace: "custom",
    key: "preorder",
    type: "boolean",
    value: "true",
  }));

  const mutation = `
    mutation metafieldsSet($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  await admin.graphql(mutation, { variables: { metafields } });

  return { success: true };
};

export default function NewCampaign() {
  const submit = useSubmit();


  const [selected, setSelected] = useState(0);
  const [open, setOpen] = useState(true);

  const { products } = useLoaderData<typeof loader>();
  const [loading, setLoading] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [selectedOption, setSelectedOption] = useState("preorder");
  const [buttonText, setButtonText] = useState("Preorder");
  const [shippingMessage, setShippingMessage] = useState(
    "Ship as soon as possible",
  );
  const [paymentMode, setPaymentMode] = useState("partial");
  const [partialPaymentType, setPartialPaymentType] = useState("percentage");
  const [duePaymentType, setDuePaymentType] = useState(1);
  const [{ month, year }, setMonthYear] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

  const [selectedDates, setSelectedDates] = useState({
    start: new Date(),
    end: new Date(),
  });

  const [popoverActive, setPopoverActive] = useState(false);
  const [inputValue, setInputValue] = useState(new Date().toLocaleDateString());

  const appBridge = useAppBridge();

  const openResourcePicker = () => {
    const picker = ResourcePicker.create(appBridge, {
      resourceType: ResourcePicker.ResourceType.Product,
      options: {
        selectMultiple: true,
      },
    });
    picker.subscribe(ResourcePicker.Action.SELECT, (payload) => {
      const selection = payload.selection;
      console.log("Selected products:", selection);
      selection.forEach((product: { id: any; title: any; variants: any; }) => {
        console.log("Product ID:", product.id);
        console.log("Product Title:", product.title);
        console.log("Product Variants:", product.variants);
      });
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
    const formatted = range.start.toLocaleDateString();
    setInputValue(formatted);
    setPopoverActive(false); // Close after selecting
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

  return (
    <AppProvider i18n={enTranslations}>
      <Page
        title="Create Preorder campaign"
        backAction={{ content: "Back", url: "/" }}
        primaryAction={<Button variant="primary">Publish</Button>}
      >
        <Tabs tabs={tabs} selected={selected} onSelect={setSelected} />
        {/* <div style={{marginTop: 20, padding: 20, border: '1px solid #ccc', borderRadius: '4px',margin:20, backgroundColor: '#f9f9f9'}}> */}
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
                  <Text as="h4" variant="headingLg">
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
                    <TextField id="preorderNote" autoComplete="off" />
                    <TextField id="preorderNote" autoComplete="off" />
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
                                <Button
                                  pressed={partialPaymentType === "flat"}
                                  // onClick={() => handleButtonClick(0)}
                                  onClick={() => setPartialPaymentType("flat")}
                                  icon={CashDollarFilledIcon}
                                ></Button>
                              </ButtonGroup>
                            </div>
                            <div style={{ flex: 1 }}>
                              <TextField
                                id="partialPaymentNote"
                                autoComplete="off"
                                suffix={` ${partialPaymentType === "percent" ? "%" : "₹"}`}
                              />
                            </div>
                          </div>
                          <div
                            style={{ marginTop: 10, display: "flex", gap: 10 }}
                          >
                            <div>
                              <ButtonGroup variant="segmented">
                                <Button
                                  pressed={duePaymentType === 1}
                                  onClick={() => setDuePaymentType(1)}
                                  icon={ClockIcon}
                                ></Button>
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
                                          value={inputValue}
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
                </Card>
                <div>
                  <Card>
                    <div style={{ padding: 3, textAlign: "center" }}>
                      <Text as="p" variant="headingSm">
                        CART, CHECKOUT, EMAIL PREVIEW
                      </Text>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        )}
        {selected === 1 && (
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
                    Products and variants that are added will be prepared for
                    preorder after the campaign is published
                  </Text>
                </div>
                <div>
                  <ButtonGroup>
                    <Button 
                    // onClick={() => shopify.modal.show('my-modal')}
                    onClick={openResourcePicker}
                    >Add Specific Product</Button>
                    <Button variant="primary">Add all products</Button>
                  </ButtonGroup>
                </div>
              </div>
            </Card>
            {/* <Modal id="my-modal">
              <div style={{display:'flex',flexDirection:"column",gap:10 ,padding:10}} >
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
                <button variant="primary"  >Continue</button>
                <button 
                // onClick={() => shopify.modal.hide('my-modal')}
                >Cancel</button>
              </TitleBar>
            </Modal>
             */}

          </div>
        )}
        {/* </div> */}
      </Page>
    </AppProvider>

  );

}
