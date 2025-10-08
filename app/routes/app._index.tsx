import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
  useLocation,
  Link,
  useNavigate,
  Form,
  useActionData,
  useNavigation,
} from "@remix-run/react";
import {
  Page,
  Text,
  Button,
  Card,
  TextField,
  DataTable,
  Badge,
  BlockStack,
  Divider,
  InlineStack,
  Icon,
  Spinner,
} from "@shopify/polaris";

import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useState } from "react";
import {
  createStore,
  getAccessToken,
  getAllCampaign,
  getEmailSettingsStatus,
} from "app/models/campaign.server";
import { FileIcon } from "@shopify/polaris-icons";
import preorderCampaignDef from "app/utils/preorderCampaignDef";
import productMetafieldDefinitions, { variantMetafieldDefinitions } from "app/utils/productMetafieldDefinitions";
import {
  confrimOrderTemplate,
  ShippingEmailTemplate,
} from "../utils/templates/emailTemplate";
import { GET_SHOP } from "app/graphql/queries/shop";
import { createWebhook } from "app/services/webhook.server";
import { createMetaobjectDefinition } from "app/services/metaobject.server";
import { createMetafieldDefinition } from "app/services/metafield.server";

// ---------------- Loader ----------------
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const status = await getEmailSettingsStatus(shopId);
  const emailCampaignStatus = status;
  const campaigns = await getAllCampaign(shopId);

  return json({ success: true, campaigns, shopId, emailCampaignStatus });
};

// ---------------- Action ----------------
export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  //Getting Data to create store
  const storeDataQueryresponse = await admin.graphql(GET_SHOP);
  const storeDataQuerydata = await storeDataQueryresponse.json();
  const storeId = storeDataQuerydata.data.shop.id;
  const storeDomain = storeDataQuerydata.data.shop.myshopifyDomain;
  const accessTokenResponse = await getAccessToken(storeDomain);
  const accessToken = accessTokenResponse?.accessToken as string;
  //block
  try {
    await createStore({
      storeID: storeId,
      offlineToken: accessToken,
      webhookRegistered: true,
      metaobjectsCreated: true,
      metaFieldsCreated: true,
      shopifyDomain: storeDomain,
      ConfrimOrderEmailSettings: JSON.stringify(confrimOrderTemplate),
      ShippingEmailSettings: JSON.stringify(ShippingEmailTemplate),
      GeneralSettings: "",
      EmailConfig: "",
    });
  } catch (error) {
    console.log(error);
  }

  try {
    const APP_URL = process.env.APP_URL;
  
  await createWebhook(
    admin,
    "ORDERS_CREATE",
    `${APP_URL}/webhooks/custom`,
  );
  const orderPaidRes = await createWebhook(
    admin,
    "ORDERS_PAID",
    `${APP_URL}/webhooks/order_paid`,
  );

  const inventoryUpdateRes = await createWebhook(
    admin,
    "PRODUCTS_UPDATE",
    `${APP_URL}/webhooks/products_update`,
  );


  if (inventoryUpdateRes.data?.webhookSubscriptionCreate?.userErrors?.length) {
    return json(
      {
        success: false,
        errors: inventoryUpdateRes.data.webhookSubscriptionCreate.userErrors,
      },
      { status: 400 },
    );
  }

  if (orderPaidRes.data?.webhookSubscriptionCreate?.userErrors?.length) {
    return json(
      {
        success: false,
        errors: orderPaidRes.data.webhookSubscriptionCreate.userErrors,
      },
      { status: 400 },
    );
  }

  await createMetaobjectDefinition(admin, preorderCampaignDef);
  // await createMetaobjectDefinition(admin, designSettingsDef);

  for (const def of productMetafieldDefinitions) {
    await createMetafieldDefinition(admin, def);
  }
  for(const def of variantMetafieldDefinitions){
    await createMetafieldDefinition(admin, def);
  }
  

  return json({
    success: true,
    webhook: orderPaidRes.data?.webhookSubscriptionCreate?.webhookSubscription,
    // webhook:true
  });
    
  } catch (error) {
    console.log(error);
  }
};

// ---------------- Component ----------------
export default function Index() {
  const { campaigns, emailCampaignStatus } = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [search, setSearch] = useState("");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const rows = campaigns.map((campaign) => ({
    id: campaign.id,
    data: [campaign.name, campaign.status, campaign.totalOrders],
    onClick: () => {
      navigate(`/app/campaign/${campaign.id}`);
    },
  }));

  const filteredRows = rows.filter((row) =>
    row.data.some((col) =>
      String(col).toLowerCase().includes(search.toLowerCase()),
    ),
  );

  const uniqueRows = Array.from(
    new Map(
      filteredRows.map((row) => [JSON.stringify(row.data), row]),
    ).values(),
  );

  return (
    <Page>
      <TitleBar title="Preorder Extension" />

      {/* Header */}
      <div
        style={{
          padding: "20px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <p style={{ fontSize: "26px" }}>Preorder Settings</p>
          {navigation.state !== "idle" && (
            <div style={{ display: "flex", alignItems: "center" }}>
              <Spinner size="small" />
              {/* <Text>Loading...</Text> */}
            </div>
          )}
        </div>
        <Link
          to={{ pathname: "campaign/new", search: location.search }}
          prefetch="intent"
        >
          <Button variant="primary" onClick={() => setLoading(true)}>
            Create Campaign
          </Button>
        </Link>
      </div>

      {/* Register Webhook Button */}
      <Form method="post">
        <Button
          submit
          variant="primary"
          // loading={navigation.state !== "idle"}
        >
          Register Webhook
        </Button>
      </Form>

      {actionData?.success && (
        <p style={{ color: "green", marginTop: "10px" }}>
          ✅ Webhook registered!
        </p>
      )}
      {actionData?.errors && (
        <p style={{ color: "red", marginTop: "10px" }}>
          ❌ {JSON.stringify(actionData.errors)}
        </p>
      )}

      {/* Campaigns List */}
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

          <div style={{ padding: "1rem" }}>
            <TextField
              label="Search"
              value={search}
              onChange={setSearch}
              placeholder="Search by Campaign Name"
              autoComplete="off"
            />
          </div>

          {uniqueRows.length > 0 ? (
            <DataTable
              columnContentTypes={["text", "text", "numeric"]}
              headings={["Name", "Status", "Orders"]}
              rows={uniqueRows.map((row, index) => [
                <Text
                  as="span"
                  variant="bodyMd"
                  fontWeight="medium"
                  key={index}
                >
                  <Link
                    to={`/app/campaign/${row.id}`}
                    style={{
                      textDecoration: "none",
                      color: "inherit",
                      display: "block",
                    }}
                  >
                    {row.data[0]}
                  </Link>
                </Text>,
                <Badge
                  key={`status-${index}`}
                  tone={row.data[1] === "PUBLISHED" ? "success" : "subdued"}
                >
                  {row.data[1] === "PUBLISHED" ? "Published" : "Unpublished"}
                </Badge>,
                row.data[2],
              ])}
            />
          ) : (
            <div style={{ padding: "1rem", textAlign: "center" }}>
              <p>No campaigns found! Try creating a new Campaign</p>
            </div>
          )}
        </Card>
      </div>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Card>
          <Text as="h4" variant="headingMd">
            {" "}
            General settings{" "}
          </Text>
          <Text as="p" variant="bodyMd">
            Manage settings that will apply to all preorder campaigns
          </Text>
          <div style={{ marginTop: 20 }}>
            <Card>
              <InlineStack
                blockAlign="center"
                gap={"100"}
                align="space-between"
              >
                <InlineStack gap={"100"}>
                  <div>
                    <Icon source={FileIcon} />
                  </div>
                  <BlockStack gap={"100"}>
                    <Text as="h3" variant="bodyMd" fontWeight="medium">
                      Preorder widget
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Customize the appearance of the preorder widget
                    </Text>
                  </BlockStack>
                </InlineStack>
                <Button
                  onClick={() => {
                    navigate("/app/settings/preorder-display");
                  }}
                >
                  Manage
                </Button>
              </InlineStack>
            </Card>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Card>
          <Text as="h4" variant="headingMd">
            {" "}
            Notifications{" "}
          </Text>
          <Card>
            <BlockStack gap="500">
              {/* Preorder Confirmation Email */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignSelf: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Text as="h3" variant="bodyMd" fontWeight="medium">
                      Preorder confirmation email{" "}
                      {emailCampaignStatus == true ? (
                        <Badge tone="success">On</Badge>
                      ) : (
                        <Badge tone="critical">Off</Badge>
                      )}
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      This notification is sent after an order is placed for
                      preorder items. It has a link for customers to cancel the
                      order.
                    </Text>
                  </div>
                  <div>
                    <Button
                      size="slim"
                      onClick={() => {
                        navigate("/app/settings/email-preorder-confirmation");
                      }}
                    >
                      Customize
                    </Button>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Preorder Shipping Update Email */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignSelf: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Text as="h3" variant="bodyMd" fontWeight="medium">
                      Preorder shipping update email <Badge>Default</Badge>
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Customize template for shipping updates.
                    </Text>
                  </div>
                  <div>
                    <Button
                      size="slim"
                      onClick={() => {
                        navigate(
                          "/app/settings/email-preorder-shipping-update",
                        );
                      }}
                    >
                      Customize
                    </Button>
                  </div>
                </div>
              </div>

              <Divider />

              {/* Customize sender email */}
              <div>
                <div
                  style={{
                    display: "flex",
                    alignSelf: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <Text as="h3" variant="bodyMd" fontWeight="medium">
                      Customize sender email
                    </Text>
                    <Text as="p" tone="subdued" variant="bodySm">
                      Emails are sent from info@essentialpreorder.com. You can
                      add your own email to use.
                    </Text>
                  </div>
                  <div>
                    <Button
                      size="slim"
                      onClick={() => {
                        navigate("/app/settings/email");
                      }}
                    >
                      Manage
                    </Button>
                  </div>
                </div>
              </div>
            </BlockStack>
          </Card>
        </Card>
      </div>
    </Page>
  );
}
