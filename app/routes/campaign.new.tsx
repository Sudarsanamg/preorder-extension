import { useState } from "react";
import type { LoaderFunctionArgs, ActionFunctionArgs } from "@remix-run/node";

import {
  Tabs,
  // Page,
  AppProvider,
  Modal,
  Button,
  ButtonGroup,
  Spinner,
  BlockStack,
  Text,
  TextField,
  Page,
} from "@shopify/polaris";
import "@shopify/polaris/build/esm/styles.css"; // Import Polaris styles
import { authenticate } from "../shopify.server";
import { useSubmit, useLoaderData } from "@remix-run/react";
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
    gid: node.id, // keep original GID if needed
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

  // const handleSelectProduct = (id) => {
  //   setSelectedProductIds((prev) =>
  //     prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
  //   );
  // };

  const handleAddPreorder = () => {
    submit(
      { productIds: JSON.stringify(selectedProductIds) },
      { method: "post" },
    );
  };

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
    <AppProvider i18n={{}}>
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
            }}
          >
            {/*  */}
            {/* left */}
            <div style={{ flex: 1 }}>
              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 20,
                  borderRadius: 5,
                  margin: 20,
                }}
              >
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
              </div>

              <div
                style={{
                  backgroundColor: "#f9f9f9",
                  padding: 20,
                  borderRadius: 5,
                  margin: 20,
                }}
              >
                <Text as="h4" variant="headingLg">
                  Preorder Button
                </Text>
                <TextField
                  id="preorderButtonText"
                  label="Button Text"
                  placeholder="Enter button text"
                                    autoComplete="off"

                />
                <TextField
                  id="preorderMessage"
                  label="Message"
                  placeholder="Enter message"
                  multiline
                  autoComplete="off"
                />
              </div>
            </div>
            {/* right */}
            <div style={{ flex: 1 }}>
              {/* preview */}
              <div
                style={{
                  height: 300,
                  width: "100%",
                  margin: 20,
                  padding: 20,
                  borderRadius: 5,
                  backgroundColor: "#f9f9f9",
                  display: "flex",
                  flexDirection: "column", 
                }}
              >
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <Text as="h4" variant="headingSm">
                    Preview
                  </Text>
                </div>
                <div style={{}}>
                  <Text as="h1" variant="headingLg">
                    White T-shirt
                  </Text>
                  <div style={{marginTop:10}}>
                  <Text as="h1" variant="headingMd" >
                    ₹499.00
                  </Text>
                  </div>
                </div>
                <div style={{marginTop:20}}>
                  <Text as="h1" variant="headingSm">
                    Size
                  </Text>
                   <div style={{display:'flex',gap:10}}>
                    <div style={{border:'1px solid black',borderRadius:80,padding:2 ,minWidth:'60px',textAlign:'center'}}>Small</div>
                    <div style={{border:'1px solid black',borderRadius:80,padding:3 ,backgroundColor:'black',minWidth:'60px'}}>
                      <span style={{color:'white', textAlign:'center'}}>Medium</span>
                    </div>
                   </div>
                </div>
                <div 
                 style={{
                    marginTop: 'auto',
                 }}>
                  <div
                    style={{
                      height: 50,
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      backgroundColor: "#000",
                      borderRadius: 5,
                      marginTop: 'auto',
                    }}
                  >
                    <span style={{ color: "white", fontWeight: "bold" }}>
                      Preorder
                    </span>
                  </div>
                </div>
                <div style={{display: "flex", justifyContent: "center",padding:5}}>
                  <Text as="h1" variant="headingMd">
                    Ship as soon as Possible
                  </Text>
                </div>
              </div>
            </div>
          </div>
        )}
        {selected === 1 && (
          <div>
            <Modal
              open={open}
              onClose={() => setOpen(false)}
              title="All Products"
            >
              <Modal.Section>
                {loading ? (
                  <Spinner size="large" />
                ) : (
                  <ul>
                    {products.map((product:any) => (
                      <div
                        key={product.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: 10,
                          padding: 10,
                          borderRadius: 5,
                          alignContent: "center",
                        }}
                      >
                        <input
                          type="checkbox"
                          // onChange={() => handleSelectProduct(product.id)}
                          // checked={selectedProductIds.includes(product.id)}
                        />
                        <div style={{ paddingRight: 20 }}>{product.title}</div>
                        {/* <div>Stock: {product.stock}</div> */}
                        <div>{product.price}</div>
                      </div>
                    ))}
                  </ul>
                )}

                <div
                  style={{
                    marginTop: 20,
                    display: "flex",
                    justifyContent: "flex-end",
                  }}
                >
                  <ButtonGroup>
                    <Button>Cancel</Button>
                    <Button variant="primary" onClick={handleAddPreorder}>
                      Add
                    </Button>
                  </ButtonGroup>
                </div>
              </Modal.Section>
            </Modal>
          </div>
        )}
        {/* </div> */}
      </Page>
    </AppProvider>
  );
}
