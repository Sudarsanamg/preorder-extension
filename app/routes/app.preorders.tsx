import {
  Card,
  Page,
  Text,
  IndexFilters,
  IndexTable,
  Badge,
  useSetIndexFiltersMode,
  useBreakpoints,
  useIndexResourceState,
  Select,
  Modal,
  BlockStack,
  Banner,
  Box,
  TextField,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "app/shopify.server";
import { LoaderFunctionArgs } from "@remix-run/node";
import { getOrders } from "app/models/campaign.server";
import { Link, useLoaderData, useNavigate } from "@remix-run/react";
import { useCallback, useState } from "react";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import { getOrdersFulfillmentStatus } from "app/graphql/queries/orders";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const adminSession = await authenticate.admin(request);
  const { admin } = await authenticate.admin(request);

  const shopQuery = `{
    shop {
      id
      name
      myshopifyDomain
    }
  }`;

  const response = await admin.graphql(shopQuery);
  const data = await response.json();
  const shopId = data.data.shop.id;

  const orders = await getOrders(shopId);
  const ordersId = orders.map((order: any) => order.order_id);

  // Fetch fulfillment status from Shopify
  const fullFillmentResponse = await admin.graphql(getOrdersFulfillmentStatus, {
    variables: { ids: ordersId },
  });
  const fullFillmentResponsedata = await fullFillmentResponse.json();
  const fulfillmentStatusNodes = fullFillmentResponsedata.data.nodes;

  // Create lookup map { orderId -> status }
  const fulfillmentStatusMap: Record<string, string> = {};
  fulfillmentStatusNodes.forEach((node: any) => {
    if (node) fulfillmentStatusMap[node.id] = node.displayFulfillmentStatus;
  });

  // Merge fulfillmentStatus into your orders
  const enrichedOrders = orders.map((order: any) => ({
    ...order,
    fulfillmentStatus: (
      fulfillmentStatusMap[order.order_id] || "unknown"
    ).toLowerCase(),
    paymentStatus: (order.paymentStatus || "unknown").toLowerCase(),
  }));

  const shopDomain = adminSession.session.shop;
  return { orders: enrichedOrders, shopDomain };
};

export default function AdditionalPage() {
  const { orders, shopDomain } = useLoaderData<typeof loader>();
  const [active, setActive] = useState(false);

  const [selectedTab, setSelectedTab] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();

  const { mode, setMode } = useSetIndexFiltersMode();

  const tabs: TabProps[] = [
    { content: "On Hold", id: "onhold-tab" },
    { content: "Fulfilled", id: "fulfilled-tab" },
    { content: "Unfulfilled", id: "unfulfilled-tab" },
  ];
  const [subject, setSubject] = useState("Delivery update for order {order}");
  const [emailText, setEmailText] = useState(
    "We wanted to inform you that there will be a delay in shipping the preorder items in order {order}. We are working hard to get your items to you as soon as possible.",
  );
  const handleChange = useCallback(() => setActive(!active), [active]);

  const allOrders = orders.map((order: any) => ({
    id: order.order_id,
    orderNumber: `#${order.order_number}`,
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "-",
    balanceAmount: `$${order.balanceAmount ?? 0}`,
    paymentStatus: order.paymentStatus,
    fulfillmentStatus: order.fulfillmentStatus.toLowerCase(),
  }));

  console.log(allOrders);

  // Filters
  const filters = [
    {
      key: "paymentStatus",
      label: "Payment Status",
      filter: (
        <Select
          label="Payment Status"
          labelHidden
          options={[
            { label: "Paid", value: "paid" },
            { label: "Partially paid", value: "pending" },
          ]}
          value={paymentStatus}
          onChange={(value: any) => setPaymentStatus(value)}
        />
      ),
    },
  ];

  const appliedFilters: IndexFiltersProps["appliedFilters"] = [];
  if (paymentStatus) {
    appliedFilters.push({
      key: "paymentStatus",
      label: `Payment status is ${paymentStatus}`,
      onRemove: () => setPaymentStatus(undefined),
    });
  }

  // Filtering logic
  const filteredOrders = allOrders.filter((order) => {
    const matchesQuery =
      queryValue === "" ||
      order.orderNumber.toLowerCase().includes(queryValue.toLowerCase());

    const matchesTab =
      selectedTab === 0
        ? order.fulfillmentStatus === "on_hold"
        : selectedTab === 1
          ? order.fulfillmentStatus === "fulfilled"
          : selectedTab === 2
            ? order.fulfillmentStatus === "unfulfilled"
            : true;

    const matchesPaymentStatus =
      !paymentStatus || order.paymentStatus === paymentStatus;

    return matchesQuery && matchesTab && matchesPaymentStatus;
  });

  const { selectedResources, allResourcesSelected, handleSelectionChange } =
    useIndexResourceState(filteredOrders);

  const resourceName = { singular: "order", plural: "orders" };
  const promotedBulkActions = [
    {
      content: "Send shipping update",
      onAction: () => {
        handleChange();
      },
    },
  ];

  function getNumericId(gid: string) {
    return gid.split("/").pop();
  }

  const rowMarkup = filteredOrders.map(
    (
      {
        id,
        orderNumber,
        dueDate,
        balanceAmount,
        paymentStatus,
        fulfillmentStatus,
      },
      index,
    ) => (
      <IndexTable.Row
        id={id}
        key={id}
        selected={selectedResources.includes(id)}
        position={index}
      >
        <IndexTable.Cell>
          <Link
            onClick={() => {
              const numericId = getNumericId(id);
              window.open(
                `https://${shopDomain}/admin/orders/${numericId}`,
                "_blank",
              );
            }}
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {orderNumber}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{dueDate}</IndexTable.Cell>
        <IndexTable.Cell>
          <Text as="span" alignment="end" numeric>
            {balanceAmount}
          </Text>
        </IndexTable.Cell>
        <IndexTable.Cell>
          {paymentStatus === "paid" && (
            <Badge progress="complete" tone="success">
              Paid
            </Badge>
          )}
         
          {paymentStatus === "pending" && (
            <Badge progress="incomplete" tone="info">
              Pending
            </Badge>
          )}
          {paymentStatus === "unknown" && <Badge>Unknown</Badge>}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {fulfillmentStatus === "fulfilled" && (
            <Badge progress="complete" tone="success">
              Fulfilled
            </Badge>
          )}
          {fulfillmentStatus === "on_hold" && (
            <Badge progress="partiallyComplete" tone="attention">
              On Hold
            </Badge>
          )}

          {fulfillmentStatus === "unfulfilled" && (
            <Badge progress="incomplete" tone="critical">
              Unfulfilled
            </Badge>
          )}
          {fulfillmentStatus === "unknown" && <Badge>Unknown</Badge>}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  return (
    <Page title="Preorders">
      <TitleBar title="Additional page" />
      <Modal
        open={active}
        onClose={handleChange}
        title="Send shipping delay notification"
        primaryAction={{
          content: "Send",
          onAction: () => console.log("Email sent"),
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleChange,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            {/* Info Banner */}
            <Banner>
              <Text as="p" variant="bodyMd">
                1 email will be sent. Customize email templates in{" "}
                <a href="#">settings</a>
              </Text>
            </Banner>

            {/* Subject */}
            <Box>
              <Text as="label" variant="bodyMd" fontWeight="semibold">
                Subject
              </Text>
              <TextField
                value={subject}
                onChange={setSubject}
                autoComplete="off"
                helpText="Use {order} for order number"
              />
            </Box>

            {/* Email Text */}
            <Box>
              <Text as="label" variant="bodyMd" fontWeight="semibold">
                Email text
              </Text>
              <TextField
                value={emailText}
                onChange={setEmailText}
                multiline={4}
                autoComplete="off"
                helpText="Use {order} for order number"
              />
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>
      <Card>
        <IndexFilters
          queryValue={queryValue}
          queryPlaceholder="Search orders"
          onQueryChange={handleFiltersQueryChange}
          onQueryClear={() => setQueryValue("")}
          cancelAction={{
            onAction: () => setQueryValue(""),
            disabled: false,
            loading: false,
          }}
          tabs={tabs}
          selected={selectedTab}
          onSelect={(index) => setSelectedTab(index)}
          filters={filters}
          appliedFilters={appliedFilters}
          onClearAll={() => {
            setQueryValue("");
            setPaymentStatus(undefined);
          }}
          mode={mode}
          setMode={setMode}
        />
        <IndexTable
          condensed={useBreakpoints().smDown}
          resourceName={resourceName}
          itemCount={filteredOrders.length}
          selectedItemsCount={
            allResourcesSelected ? "All" : selectedResources.length
          }
          onSelectionChange={handleSelectionChange}
          promotedBulkActions={promotedBulkActions}
          headings={[
            { title: "Order" },
            { title: "Due Date" },
            { title: "Balance Amount", alignment: "end" },
            { title: "Payment status" },
            { title: "Fulfillment status" },
          ]}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
    </Page>
  );
}
