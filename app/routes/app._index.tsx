// import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate} from "@remix-run/react";
import {
  Page,
  // Layout,
  // Text,
  // Card,
  Button,
  // BlockStack,
  // Box,
  // List,
  // Link,
  // InlineStack,
} from "@shopify/polaris";
import { TitleBar,  } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // const { admin } = await authenticate.admin(request);

};

export default function Index() {
    const navigate = useNavigate();



  return (
    <Page>
      <TitleBar title="Preorder Extension" >
       
      </TitleBar>
      <div style={{ padding: "20px" ,display: "flex", justifyContent: "space-between"}} >
        <div>
          <p style={{fontSize:'26px'}}>Preorder Settings</p>
        </div>
        <div onClick={() => {
          navigate("/campaign/new/");
        }}>
          <Button variant="primary">
            Create Campaign
          </Button>
        </div>
      </div>

    
    </Page>
  );
}
