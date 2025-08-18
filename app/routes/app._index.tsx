// import { useEffect } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { useNavigate} from "@remix-run/react";
import {
  Page,
  // Layout,
  Text,
  // Card,
  Button,
  Card,
  TextField,
  DataTable,
  // BlockStack,
  // Box,
  // List,
  // Link,
  // InlineStack,
} from "@shopify/polaris";
import { TitleBar,  } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";



export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // const { admin } = await authenticate.admin(request);

};

export default function Index() {
    const navigate = useNavigate();

    const [search, setSearch] = useState("");

  const rows = [
    ["Snowboard", "20", "$500"],
    ["Skateboard", "50", "$200"],
    ["Surfboard", "10", "$700"],
    ["Scooter", "30", "$150"],
  ];

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    row.some((col) => col.toLowerCase().includes(search.toLowerCase()))
  );



  return (
    <Page>
      <TitleBar title="Preorder Extension" >
       
      </TitleBar>
      <div style={{ padding: "20px" ,display: "flex", justifyContent: "space-between"}} >
        <div>
          <p style={{fontSize:'26px'}}>Preorder Settings</p>
        </div>
        <div onClick={() => {
          navigate("/app/campaign/new");
          console.log("Navigate to campaign creation page");
        }}>
          <Button variant="primary">
            Create Campaign
          </Button>
        </div>
      </div>

      <div style={{marginTop:20}}>
        <Card>
          <Text as="h4" variant="headingMd">
Preorder campaigns
          </Text>
          <Text as="p" variant="bodyMd">
            Create tailored campaigns for different products with customisable payment, fulfilment, and inventory rules. Set discounts and personalise preorder widget appearance for each campaign.
          </Text>
          <div style={{ padding: "1rem" }}>
        <TextField
          label="Search"
          value={search}
          onChange={setSearch}
          placeholder="Search products..."
          autoComplete="off"
        />
      </div>
      <DataTable
        columnContentTypes={["text", "text", "numeric"]}
        headings={["Name", "Status", "Orders"]}
        rows={filteredRows}
      />
        </Card>
      </div>

    
    </Page>
  );
}
