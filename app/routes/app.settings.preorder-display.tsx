import {
  BlockStack,
  Card,
  Checkbox,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { useState } from "react";

export default function PreorderDisplay() {
  const [checked, setChecked] = useState({
    productPage: true,
    featuredProducts: true,
    quickBuy: true,
    multiplePages: true,
  });

  return (
    <Page backAction={{ content: "Back", url: "/app/" }} title="Pages:Button">
      <InlineStack align="space-between" gap={"300"} wrap={false}>
        {/* left */}
        <BlockStack gap={"300"}>
          <Card>
            <Text variant="headingMd" as="h2">
              Show Preorder button on
            </Text>
            <Text variant="bodyMd" as="p">
              Preorder button replaces ‘Add to cart’
            </Text>
            <BlockStack gap={"100"}>
              <Checkbox label="Basic checkbox" checked={true} />
              <Checkbox label="Featured products" checked={true} />
              <div style={{paddingLeft:"20px"}}>
              <Text variant="bodyMd" as="p" >
                Add Preorder button on featured products in homepage, collection
                and search pages
              </Text>
              </div>
              <Checkbox
                label="
Quick buy modals"
                checked={true}
              />
              <Checkbox
                label="Product lists in collection, homepage and search pages"
                checked={true}
              />
            </BlockStack>
          </Card>
          <Card>
            <Text variant="headingMd" as="h2">
              Preorder discount
            </Text>
            <Checkbox
                label="Show preorder discount in featured products, quick buy modals and lists"
                checked={true}
              />
          </Card>
        </BlockStack>

        {/* right */}
        <BlockStack gap={"400"}>
          <Card>
            <Text variant="headingMd" as="h2">
              COLLECTIONS, HOMEPAGE, SEARCH PAGES
            </Text>
            <div style={{display:"flex",gap:"20px",flexWrap:"wrap" ,justifyContent:"center",marginTop:"20px"}}>
            {Array.from({ length: 6 }, (_, index) => (
                <div>
                    <img src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg" alt="" style={{width:"120px" ,height:"50px"}} />
                    <p>Baby T shirt</p>
                    <button style={{width:"100%" ,backgroundColor:"black",color:"white",border:"none" ,padding:"5px 2px"}}>Preorder</button>
                </div>
            ))}
            </div>
          </Card>
          <Card>
           <Text as="h2" variant="headingMd">
            FEATURED PRODUCT, QUICK BUY

           </Text>
           <div style={{display:"flex",gap:"20px",marginTop:"20px"}}>
            <img src="https://essential-preorder.vercel.app/images/placeholder-preorder-product-img.jpg" alt="" style={{width:"200px" ,height:"200px",objectFit: "cover"}} />
           <BlockStack gap={"100"}>
            <Text as="h2" variant="headingMd">
                White T-shirt
            </Text>
            <Text as="p" variant="bodyMd">
                $25.00
            </Text>
            <Text as="p" variant="bodyMd">
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
                        <button style={{width:"100%" ,backgroundColor:"black",color:"white",border:"none" ,padding:"7px 3px",marginTop:"20px",borderRadius:"5px"}}>Preorder</button>
                        <p style={{textAlign:"center"}}>preorder Message</p>
                        <p style={{textAlign:"center"}}>Partial payment message
</p>

                    
           </BlockStack>
            </div>
            

          </Card>
        </BlockStack>
      </InlineStack>
    </Page>
  );
}
