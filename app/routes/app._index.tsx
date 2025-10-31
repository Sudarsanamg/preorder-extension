import {
  json,
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "@remix-run/node";
import {
  useLoaderData,
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
  ActionList,
  Popover,
  Modal,
  ButtonGroup,
} from "@shopify/polaris";

import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { useCallback, useEffect, useState } from "react";
import {
  createStore,
  getAccessToken,
  getAllCampaign,
  getEmailSettingsStatus,
} from "app/models/campaign.server";
import { SelectIcon } from "@shopify/polaris-icons";
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
import { handleCampaignStatusChange } from "app/helper/campaignHelper";
import { checkAppEmbedEnabled } from "app/helper/checkBlockEnable";
import { AppEmbedBanner } from "app/components/AppEmbedBanner";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
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
  const isAppEmbedEnabled = await checkAppEmbedEnabled(admin);

  return json({
    success: true,
    campaigns,
    shopId,
    emailCampaignStatus,
    shop,
    setupGuide,
    isAppEmbedEnabled,
  });
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session, admin } = await authenticate.admin(request);
  const shop = session.shop;
  const response = await admin.graphql(GET_SHOP);
    const data = await response.json();
    const shopId = data.data.shop.id;
  const isStoreExist = await isStoreRegistered(shop);
  if (!isStoreExist) {
    return Response.json(
      { success: false, error: "Store not found" },
      { status: 404 },
    );
  }
  const formData = await request.formData();
  const intent = formData.get("intent"); 
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

  if (intent === "update_campaign_status") {
    const campaignId = formData.get("campaignId") as string;
    const newStatus = formData.get("newStatus") as string;
    try {
      await handleCampaignStatusChange(admin, campaignId, newStatus,shopId);
      return json({ success: true, message: "Campaign status updated" });
    } catch (error) {
      console.error("Error updating campaign status:", error);
      return json(
        { success: false, error: "Failed to update campaign status" },
        { status: 500 },
      );
    }
  }

  return json({ success: false, message: "Invalid intent" });
};

// ---------------- Component ----------------
export default function Index() {
  useWebVitals({ path: "/app" });
  const {
    campaigns,
    emailCampaignStatus,
    shop,
    setupGuide,
    isAppEmbedEnabled,
  } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [showGuide, setShowGuide] = useState(!setupGuide);
  const fetcher = useFetcher();
  const [loading, setLoading] = useState({
    create: false,
    widget: false,
    orderEmail: false,
    shippingEmail: false,
    customizeEmail: false,
    page: true,
  });
  const [activePopoverId, setActivePopoverId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalState, setModalState] = useState({
    campaignId: "",
    newStatus: "",
    campaignName: "",
  });
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const togglePopover = useCallback((id: any) => {
    setActivePopoverId((activeId) => (activeId === id ? null : id));
  }, []);

  useEffect(() => {
    const init = async () => {
      if (setupGuide === true) {
        setShowGuide(false);
      }

      setLoading((prev) => ({ ...prev, page: false }));
    };

    init();
  }, [setupGuide]);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      shopify?.toast?.show?.("Action Completed");
      setIsChangingStatus(false);
      setIsModalOpen(false);
      setActivePopoverId(null);
    }
  }, [fetcher.state, fetcher.data]);

  const navigation = useNavigation();
  const isNavigating = navigation.state !== "idle";
  const targetPath = navigation.location?.pathname;
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
      complete: isAppEmbedEnabled,
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
            const formData = new FormData();
            formData.append("intent", "complete_setup_guide");

            fetcher.submit(formData, {
              method: "POST",
              action: "",
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
      if (id === 2) {
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
  if (loading.page) {
    return <PreorderSettingsSkeleton />;
  }
  const openConfirmModal = (
    campaignId: string,
    newStatus: string,
    name: string,
  ) => {
    setActivePopoverId(campaignId);
    setModalState({ campaignId, newStatus, campaignName: name });
    setIsModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    setIsChangingStatus(true);
    const formData = new FormData();
    formData.append("campaignId", modalState.campaignId);
    formData.append("newStatus", modalState.newStatus);
    formData.append("intent", "update_campaign_status");

    fetcher.submit(formData, { method: "post" });
  };

  return (
    <Page>
      <TitleBar title="Preorder Extension" />
      {!isAppEmbedEnabled && <AppEmbedBanner
       shop={shop} 
       isAppEmbedEnabled={isAppEmbedEnabled}
       />}

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
        </div>
        <Button
          variant="primary"
          loading={loading.create}
          onClick={() => {
            setLoading((prev) => ({ ...prev, create: true }));
            navigate("/app/campaign/new");
          }}
        >
          Create Campaign
        </Button>
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
              Preorder Campaigns
            </Text>
            <Text as="p" variant="bodyMd">
              Create tailored campaigns for different products with customisable
              payment, fulfilment, and inventory rules. Set discounts and
              personalise preorder widget appearance for each campaign.
            </Text>
            <Modal
              open={isModalOpen}
              onClose={() => !isChangingStatus && setIsModalOpen(false)}
              title="Change Campaign Status"
              primaryAction={{
                content: isChangingStatus ? "Changing..." : "Confirm",
                onAction: handleConfirmStatusChange,
                loading: isChangingStatus,
                disabled: isChangingStatus,
                destructive: modalState.newStatus === "DELETE",
              }}
              secondaryActions={[
                {
                  content: "Cancel",
                  onAction: () => setIsModalOpen(false),
                  disabled: isChangingStatus,
                },
              ]}
            >
              <Modal.Section>
                <Text as="p">
                  Are you sure you want to change{" "}
                  <strong>{modalState.campaignName}</strong> to {" "}
                  <strong>
                    {modalState?.newStatus
                      ? modalState.newStatus.charAt(0).toUpperCase() +
                        modalState.newStatus.slice(1).toLowerCase()
                      : ""}
                  </strong>
                  ?
                </Text>
              </Modal.Section>
            </Modal>

            {uniqueRows.length > 0 && (
              <div style={{ padding: "1rem" }}>
                <TextField
                  label="Search"
                  value={search}
                  onChange={setSearch}
                  placeholder="Search by Campaign Name"
                  autoComplete="off"
                />
              </div>
            )}

            {uniqueRows.length > 0 ? (
              <DataTable
                columnContentTypes={["text", "text", "numeric", "text"]}
                headings={[
                  "Name",
                  "Status",
                  <div
                    key="actions"
                    style={{
                      textAlign: "center",
                      width: "100%",
                      paddingRight: "1rem",
                    }}
                  >
                    Orders
                  </div>,
                  <div
                    key="actions"
                    style={{
                      textAlign: "right",
                      width: "100%",
                      paddingRight: "1rem",
                    }}
                  >
                    Actions
                  </div>,
                ]}
                rows={uniqueRows.map((row, index) => {
                  const campaignId = row.id;
                  const campaignName = row.data[0];
                  const currentStatus = row.data[1];
                  const currentOrders = row.data[2];
                  const isPopoverActive = activePopoverId === campaignId;
                  const rowPath = `/app/campaign/${row.id}`;
                  const isRowLoading = isNavigating && targetPath === rowPath;

                  const statusTone =
                    currentStatus === "PUBLISHED"
                      ? "success"
                      : currentStatus === "DRAFT"
                        ? "info"
                        : "critical";

                  const statusLabel =
                    currentStatus === "PUBLISHED"
                      ? "Published"
                      : currentStatus === "DRAFT"
                        ? "Draft"
                        : "Unpublished";

                  const statusActions = [
                    {
                      content: "Publish",
                      onAction: () =>
                        openConfirmModal(
                          campaignId,
                          "PUBLISHED",
                          String(campaignName),
                        ),
                      disabled: currentStatus === "PUBLISHED",
                    },
                    {
                      content: "Unpublish",
                      onAction: () =>
                        openConfirmModal(
                          campaignId,
                          "UNPUBLISHED",
                          String(campaignName),
                        ),
                      disabled: currentStatus === "UNPUBLISH",
                    },
                    // {
                    //   content: "Draft",
                    //   onAction: () =>
                    //     openConfirmModal(
                    //       campaignId,
                    //       "DRAFT",
                    //       String(campaignName),
                    //     ),
                    //   disabled: currentStatus === "DRAFT",
                    // },
                  ];

                  return [
                    // --- Name Column ---
                    <Link
                      key={`name-${index}`}
                      to={rowPath}
                      style={{
                        textDecoration: "none",
                        color: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <span>{campaignName}</span>
                      {/* {isRowLoading && <Spinner size="small" />} */}
                    </Link>,

                    // --- Status Column ---
                    <Popover
                      key={`status-${index}`}
                      active={isPopoverActive}
                      activator={
                        <button
                          onClick={() => togglePopover(campaignId)}
                          style={{
                            border: "none",
                            background: "none",
                            padding: 0,
                            cursor: "pointer",
                          }}
                        >
                          <InlineStack gap="100">
                            <Badge tone={statusTone}>{statusLabel}</Badge>
                            <Icon source={SelectIcon} tone="base" />
                          </InlineStack>
                        </button>
                      }
                      onClose={() => setActivePopoverId(null)}
                    >
                      <ActionList items={statusActions} />
                    </Popover>,

                    // --- Orders Column (Centered) ---
                    <div
                      key={`orders-${index}`}
                      style={{
                        textAlign: "center",
                        width: "100%",
                      }}
                    >
                      {currentOrders}
                    </div>,

                    // --- Actions Column (Right-aligned) ---
                    <div
                      key={`actions-${index}`}
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        width: "100%",
                        paddingRight: "1rem",
                      }}
                    >
                      <ButtonGroup>
                        <Button
                          onClick={() => {
                            navigate(`/app/campaign/${campaignId}`);
                          }}
                          variant="secondary"
                          size="slim"
                          loading={isRowLoading}
                        >
                          Edit
                        </Button>
                        <Button
                          onClick={() => {
                            openConfirmModal(
                              campaignId,
                              "DELETE",
                              String(campaignName),
                            );
                          }}
                          tone="critical"
                          variant="secondary"
                          size="slim"
                        >
                          Delete
                        </Button>
                      </ButtonGroup>
                    </div>,
                  ];
                })}
              />
            ) : (
              <div style={{ padding: "1rem", textAlign: "center" }}>
                <p>No campaigns found! Try creating a new Campaign</p>
              </div>
            )}
          </BlockStack>
        </Card>
      </div>

      {/* <div style={{ marginTop: 20, marginBottom: 20 }}>
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
      </div> */}

      <div style={{ marginTop: 20, marginBottom: 20 }}>
        <Card>
          <Text as="h4" variant="headingMd">
            {" "}
            Notifications{" "}
          </Text>
          <div style={{ margin: 10 }}></div>
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
                        setLoading((prev) => ({
                          ...prev,
                          shippingEmail: true,
                        }));
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
