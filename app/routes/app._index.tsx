// import { useEffect } from "react";
import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData, useLocation, Link } from "@remix-run/react";
import {
  Page,
  // Layout,
  Text,
  // Card,
  Button,
  Card,
  TextField,
  DataTable,
} from "@shopify/polaris";
import { TitleBar} from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import { getAllCampaign } from "app/models/campaign.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  const campaigns = await getAllCampaign();
  return json({ success: true, campaigns });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  // const { admin } = await authenticate.admin(request);
};

export default function Index() {
  const { campaigns } = useLoaderData<typeof loader>();
  const location = useLocation();

  const [search, setSearch] = useState("");


  const rows = campaigns.map((campaign) => [
    campaign.name,
    campaign.status,
    campaign.totalOrders,
  ]);

  // Filter rows based on search text
  const filteredRows = rows.filter((row) =>
    row.some((col) => String(col).toLowerCase().includes(search.toLowerCase())),
  );


  return (
    <Page>
      <TitleBar title="Preorder Extension"></TitleBar>
      <div
        style={{
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p style={{ fontSize: "26px" }}>Preorder Settings</p>
        </div>
        <Link to={{ pathname: "campaign/new", search: location.search }} prefetch="intent">
          <Button variant="primary">Create Campaign</Button>
        </Link>

      </div>

      <div style={{ marginTop: 20 }}>
        <Card>
          <Text as="h4" variant="headingMd">
            Preorder campaigns
          </Text>
          <Text as="p" variant="bodyMd">
            Create tailored campaigns for different products with customisable
            payment, fulfilment, and inventory rules. Set discounts and
            personalise preorder widget appearance for each campaign.
          </Text>
          {filteredRows.length > 0 ? (
            <div>
              <div style={{ padding: "1rem" }}>
                <TextField
                  label="Search"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by Campaign Name"
                  autoComplete="off"
                />
              </div>
              <DataTable
                columnContentTypes={["text", "text", "numeric"]}
                headings={["Name", "Status", "Orders"]}
                rows={filteredRows}
              />
            </div>
          ) : (
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <p>No campaigns found! .Try creating a new Campaign</p>
            </div>
          )}
        </Card>
      </div>
    </Page>

  );
}
