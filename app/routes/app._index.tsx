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
  useNavigation,
  useFetcher,
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
import { useEffect, useState } from "react";
import {
  createStore,
  getAccessToken,
  getAllCampaign,
  getEmailSettingsStatus,
} from "app/models/campaign.server";
import { FileIcon } from "@shopify/polaris-icons";
import preorderCampaignDef from "app/utils/preorderCampaignDef";
import productMetafieldDefinitions, {
  variantMetafieldDefinitions,
} from "app/utils/productMetafieldDefinitions";
import {
  confrimOrderTemplate,
  preorderDisplaySetting,
  ShippingEmailTemplate,
} from "../utils/templates/emailTemplate";
import { GET_SHOP } from "app/graphql/queries/shop";
// import { createWebhook } from "app/services/webhook.server";
import { createMetaobjectDefinition } from "app/services/metaobject.server";
import { createMetafieldDefinition } from "app/services/metafield.server";
import { useWebVitals } from "app/helper/useWebVitals";
import { SetupGuide } from "app/components/setupGuide";
import prisma from "app/db.server";
import PreorderSettingsSkeleton from "app/utils/loader/homeLoader";

// ---------------- Loader ----------------
export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP);
  const data = await response.json();
  const shopId = data.data.shop.id;
  const shop = session.shop;
  const storeDomain = data.data.shop.myshopifyDomain;
  const cuurencyCode = data.data.shop.currencyCode;

  let storeData = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
  });
  const accessTokenResponse = await getAccessToken(storeDomain);
  const accessToken = accessTokenResponse?.accessToken as string;
  if (storeData) {
    if (storeData.appInstalled === false) {
      await prisma.store.update({
        where: { id: storeData.id },
        data: { appInstalled: true },
      });
    }
  } else {
    try {
      await createStore({
        shopId: shopId,
        offlineToken: accessToken,
        webhookRegistered: true,
        metaobjectsCreated: true,
        metaFieldsCreated: true,
        shopifyDomain: storeDomain,
        ConfrimOrderEmailSettings: confrimOrderTemplate,
        ShippingEmailSettings: ShippingEmailTemplate,
        GeneralSettings: preorderDisplaySetting,
        EmailConfig: "",
        currencyCode: cuurencyCode,
      });

      await createMetaobjectDefinition(admin, preorderCampaignDef);
      for (const def of productMetafieldDefinitions) {
        await createMetafieldDefinition(admin, def);
      }
      for (const def of variantMetafieldDefinitions) {
        await createMetafieldDefinition(admin, def);
      }
    } catch (error) {
      console.log(error);
    }
  }
  const SetupGuide = await prisma.store.findUnique({
    where: { shopifyDomain: storeDomain },
    select: {
      SetupCompleted: true,
    },
  });
  const setupGuide = SetupGuide?.SetupCompleted;
  const status = await getEmailSettingsStatus(shopId);
  const emailCampaignStatus = status;
  const campaigns = await getAllCampaign(shopId);

  return json({
    success: true,
    campaigns,
    shopId,
    emailCampaignStatus,
    shop,
    setupGuide,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const {  session } = await authenticate.admin(request);
  const shop = session.shop;
  const formData = await request.json();
  const intent = formData.intent;

  if (intent === "complete_setup_guide") {
    try {
      await prisma.store.update({
        where: { shopifyDomain: shop },
        data: { SetupCompleted: true },
      });

      return json({
        success: true,
        SetupGuide: true,
        message: "Setup guide completed",
      });
    } catch (error) {
      console.error("Error updating setup guide:", error);
      return json(
        { success: false, error: "Failed to update setup guide" },
        { status: 500 },
      );
    }
  }

  return json({ success: false, message: "Invalid intent" });
};

// ---------------- Component ----------------
export default function Index() {
  useWebVitals({ path: "/app" });
  const { campaigns, emailCampaignStatus, shop, setupGuide } =
    useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showGuide, setShowGuide] = useState(!setupGuide);
  const fetcher = useFetcher();
  const [loading,setLoading] = useState({
    create: false,
    widget: false,
    orderEmail :false,
    shippingEmail :false,
    customizeEmail :false,
    page :true
  })

  useEffect(() => {
  const init = async () => {
    if (setupGuide === true) {
      setShowGuide(false);
    }

    setLoading((prev) => ({ ...prev, page: false }));
  };

  init();
}, [setupGuide]);

  const navigation = useNavigation();
  const ITEMS = [
    {
      id: 0,
      title: "Create a Preorder Campaign",
      description:
        "Choose which products you want to sell as preorders. You can decide: when to show the “Preorder” button and if customers pay now, later, or in parts",

      complete: campaigns.length > 0,
      primaryButton: {
        content: "Create a campaign",
        props: {
          url: "/app/campaign/new",
          external: true,
        },
      },
    },
    {
      id: 1,
      title: "Activate app embed in Shopify",
      description:
        "You need to activate the app in your store’s theme settings. This makes the preorder button appear on your site.",
      complete: false,
      primaryButton: {
        content: "Open Theme Editor",
        props: {
          onClick: () =>
            window.open(
              `https://${shop}/admin/themes/current/editor`,
              "_blank",
            ),
        },
      },

      secondaryButton: {
        content: "I have done it",
        props: {
          onClick: () => onStepComplete(1),
        },
      },
    },
    {
      id: 2,
      title: "Confirm preorder campaigns are working properly",
      description:
        "Finish the steps above, preview it in store to confirm that it’s working properly. Let us know if you run into issues or need design tweaks.",

      complete: false,
      primaryButton: {
        content: "Everything looks great!",
        props: {
          onClick: async () => {
              onStepComplete(2);

            fetcher.submit(JSON.stringify({ intent: "complete_setup_guide" }), {
              method: "post",
              action: "",
              encType: "application/json",
            });

            
          },
        },
      },

      secondaryButton: {
        content: "Need help",
        props: {
          onClick: () => setShowGuide(true),
        },
      },
    },
  ];
  const [items, setItems] = useState(ITEMS);

  const rows = campaigns.map((campaign) => ({
    id: campaign.id,
    data: [campaign.name, campaign.status, campaign.totalOrders],
    onClick: () => {
      navigate(`/app/campaign/${campaign.id}`);
    },
  }));

  const onStepComplete = async (id: any) => {
    try {
      setItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, complete: !item.complete } : item,
        ),
      );
      if(id === 2){
        setShowGuide(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

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
  if(loading.page){
    return <PreorderSettingsSkeleton />
  }

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
          <Button variant="primary" 
          loading ={loading.create}
          onClick={() => setLoading((prev) => ({ ...prev, create: true }))}
          >Create Campaign</Button>
        </Link>
      </div>
      {showGuide && (
        <div>
          <SetupGuide
            onDismiss={() => {
              setShowGuide(false);
              setItems(ITEMS);
            }}
            onStepComplete={onStepComplete}
            items={items}
          />
        </div>
      )}


      {/* Campaigns List */}
      <div style={{ marginTop: 20 }}>
        <Card>
          <BlockStack gap="200">
            <Text as="h4" variant="headingLg">
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
                    tone={row.data[1] === "PUBLISHED" ? "success" : "info"}
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
          </BlockStack>
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
                    setLoading((prev) => ({ ...prev, widget: true }));
                    navigate("/app/settings/preorder-display");
                  }}
                  loading={loading.widget}
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
                        setLoading((prev) => ({ ...prev, orderEmail: true }));
                        navigate("/app/settings/email-preorder-confirmation");
                      }}
                      loading={loading.orderEmail}
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
                        setLoading((prev) => ({ ...prev, shippingEmail: true }));
                        navigate(
                          "/app/settings/email-preorder-shipping-update",
                        );
                      }}
                      loading={loading.shippingEmail}
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
