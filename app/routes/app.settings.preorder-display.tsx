import { ActionFunctionArgs, LoaderFunctionArgs, redirect  } from "@remix-run/node";
import {
  BlockStack,
  Card,
  Checkbox,
  InlineStack,
  Page,
  Text,
} from "@shopify/polaris";
import { useEffect, useState } from "react";
import {SaveBar, useAppBridge} from '@shopify/app-bridge-react';
import { authenticate } from "../shopify.server";
import { useLoaderData ,useSubmit} from "@remix-run/react";
import { getPreorderDisplaySettings, savePreorderDisplay } from "app/models/campaign.server";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  // return storeId;
  const {admin} = await authenticate.admin(request);

  const query = `{
    shop {
      id
      name
      myshopifyDomain
    }
  }`;

  const response = await admin.graphql(query);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const settings = await getPreorderDisplaySettings(shopId);    

  return {shopId  ,settings};
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const intent = formData.get("intent");
  switch (intent) {
    case "save-preorder-display":{
      const settings = formData.get("settings");
      const shopId = formData.get("shopId");
      try {
        const response = await savePreorderDisplay(String(shopId), JSON.parse(settings as string));
        redirect('/app');
      } catch (error) {
        console.error("Error saving email settings:", error);
        return { success: false, error: "Failed to save email settings." };
      }
    }
      
    default:
      return { error: "Invalid intent" };
  }
}




export default function PreorderDisplay() {

  const { shopId ,settings} = useLoaderData<typeof loader>();
  const settingsData = settings?.settings ?? {};
  const [checked, setChecked] = useState({
    productPage: settingsData.productPage ?? true,
    featuredProducts:  settingsData.featuredProducts ?? true,
    quickBuy: settingsData.quickBuy ?? true,
    multiplePages: settingsData.multiplePages ?? true,
    preOrderDiscount: settingsData.preOrderDiscount ?? true,
  });

    const shopify = useAppBridge();
    const submit = useSubmit();

     const handleSave = () => {
    console.log('Saving');
    const formdata = new FormData();
    formdata.append("intent", "save-preorder-display");
    formdata.append("settings", JSON.stringify(checked));
    formdata.append("shopId",shopId); 
    submit(formdata, { method: "post" });

    shopify.saveBar.hide('my-save-bar');
  };

  const handleDiscard = () => {
    console.log('Discarding');
    shopify.saveBar.hide('my-save-bar');
  };


  useEffect(() => {
    shopify.saveBar.show("my-save-bar");
  }, [checked]);


  return (
    <Page backAction={{ content: "Back", url: "/app/" }} title="Pages:Button">
      <SaveBar id="my-save-bar">
        <button variant="primary" onClick={handleSave}></button>
        <button onClick={handleDiscard}></button>
      </SaveBar>
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
              <Checkbox label="Basic checkbox" 
              onChange={() => {
                setChecked((prev) => ({
                  ...prev,
                  productPage: !prev.productPage,
                }));
              }}
              checked={checked.productPage}
               />
              <Checkbox label="Featured products"
              onChange={() => {
                setChecked((prev) => ({
                  ...prev,
                  featuredProducts: !prev.featuredProducts,
                }));
              }}
               checked={checked.featuredProducts} />
              <div style={{paddingLeft:"20px"}}>
              <Text variant="bodyMd" as="p" >
                Add Preorder button on featured products in homepage, collection
                and search pages
              </Text>
              </div>
              <Checkbox
                label="
Quick buy modals"
                onChange={() => {
                  setChecked((prev) => ({
                    ...prev,
                    quickBuy: !prev.quickBuy,
                  }));
                }}
                checked={checked.quickBuy}
              />
              <Checkbox
                label="Product lists in collection, homepage and search pages"
                onChange={() => {
                  setChecked((prev) => ({
                    ...prev,
                    multiplePages: !prev.multiplePages,
                  }));
                }}
                checked={checked.multiplePages}
              />
            </BlockStack>
          </Card>
          <Card>
            <Text variant="headingMd" as="h2">
              Preorder discount
            </Text>
            <Checkbox
                label="Show preorder discount in featured products, quick buy modals and lists"
                onChange={() => {
                  setChecked((prev) => ({
                    ...prev,
                    preOrderDiscount: !prev.preOrderDiscount,
                  }));
                }}
                checked={checked.preOrderDiscount}
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
                    <button style={{width:"100%" ,backgroundColor:"black",color:"white",border:"none" ,padding:"5px 2px"}}>{checked.featuredProducts===true ? "Preorder" : "Add to cart"}</button>
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
                        <button style={{width:"100%" ,backgroundColor:"black",color:"white",border:"none" ,padding:"7px 3px",marginTop:"20px",borderRadius:"5px"}}>{checked.featuredProducts===true ? "Preorder" : "Add to cart"}</button>
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
