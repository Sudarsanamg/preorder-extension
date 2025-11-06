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
import type { LoaderFunctionArgs } from "@remix-run/node";
import { getOrders } from "app/models/campaign.server";
import { Link, useActionData, useLoaderData, useSubmit } from "@remix-run/react";
import { useCallback, useEffect, useState } from "react";
import type { IndexFiltersProps, TabProps } from "@shopify/polaris";
import {
  // getOrdersfulfilmentStatus,
  getOrderWithProducts,
} from "app/graphql/queries/orders";
import { GET_SHOP_WITH_PLAN } from "app/graphql/queries/shop";
import prisma from "app/db.server";
import { generateEmailTemplate } from "app/utils/generateEmailTemplate";
import nodemailer from "nodemailer";
import { isStoreRegistered } from "app/helper/isStoreRegistered";
import { formatDate } from "app/utils/formatDate";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const adminSession = await authenticate.admin(request);
  const { admin , session } = await authenticate.admin(request);
  const shop = session.shop;
    const isStoreExist = await isStoreRegistered(shop);
    if(!isStoreExist){
      return Response.json({ success: false, error: "Store not found" }, { status: 404 });
    }

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
  // console.log(orders, "orders");
  // const ordersId = orders.map((order: any) => order.order_id);

  // // Fetch fulfillment status from Shopify
  // const fullFillmentResponse = await admin.graphql(getOrdersfulfilmentStatus, {
  //   variables: { ids: ordersId },
  // });
  // const fullFillmentResponsedata = await fullFillmentResponse.json();
  // const fulfilmentStatusNodes = fullFillmentResponsedata.data.nodes;

  // const fulfilmentStatusMap: Record<string, string> = {};
  // fulfilmentStatusNodes.forEach((node: any) => {
  //   if (node) fulfilmentStatusMap[node.id] = node.displayfulfilmentStatus;
  // });

  const enrichedOrders = orders.map((order: any) => ({
    ...order,
   
    paymentStatus: (order.paymentStatus || "unknown").toLowerCase(),
  }));

  const shopDomain = adminSession.session.shop;
  return { orders: enrichedOrders, shopDomain };
};

export const action = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  if (!session || !session.shop || !session.accessToken) {
    return Response.json(
      { success: false, message: "Session is invalid or expired" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "shipping-notification") {
    const subject = formData.get("subject");
    const message = formData.get("message");

    // Fetch shop data
    const response = await admin.graphql(GET_SHOP_WITH_PLAN);
    const data = await response.json();
    const shop = data.data.shop;
    const shopId = shop.id;

    // Get email settings from the database
    const emailSettings = await prisma.store.findFirst({
      where: { shopId: shopId },
      select: {
        ShippingEmailSettings: true,
      },
    });

    let template : any = emailSettings?.ShippingEmailSettings;
    if (template) {
      template.subject = subject;
      template.description = message;
    }

    const selectedOrders = formData.get("selectedOrders");
    const selectedOrdersArray = JSON.parse(selectedOrders as string);

    for (let order of selectedOrdersArray) {
      const getOrderWithProductsResponse = await getOrderWithProducts(
        order.orderId,
        session.shop,
      );

      const emailTemplate = generateEmailTemplate(
        template,
        getOrderWithProductsResponse,
        order.orderId.split("/").pop(),
      );

      const transporter = nodemailer.createTransport({
        service: "Gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      const emailConfig = {
        fromName: "Preorder",
        replyName: "Preorder@noreply.com",
      };

      try {
        await transporter.sendMail({
          from: `"${emailConfig?.fromName}" ${emailConfig?.replyName} <${emailConfig?.replyName}>`,
          to: order.customerEmail,
          subject: "Your Preorder is Confirmed!",
          html: emailTemplate,
        });
      } catch (error) {
        console.error("❌ Email send error:", error);
      }
    }

    return Response.json({ success: true });
  }

  return Response.json(
    { success: false, message: "Invalid intent" },
    { status: 400 },
  );
};


export default function AdditionalPage() {
  const { orders, shopDomain } = useLoaderData<typeof loader>();
  const [active, setActive] = useState(false);
  const submit = useSubmit();
  let actionData = useActionData<typeof action>();
  const [isSending, setIsSending] = useState(false);

  const [selectedTab, setSelectedTab] = useState(0);
  const [queryValue, setQueryValue] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | undefined>();
  const { mode, setMode } = useSetIndexFiltersMode();

  const tabs: TabProps[] = [
    { content: "All", id: "all-tab" },
    { content: "Unfulfilled", id: "unfulfilled-tab" },
    { content: "Fulfilled", id: "fulfilled-tab" },
    { content: "On Hold", id: "onhold-tab" },
  ];
  const [subject, setSubject] = useState("Delivery update for order {order}");
  const [emailText, setEmailText] = useState(
    "We wanted to inform you that there will be a delay in shipping the preorder items in order {order}. We are working hard to get your items to you as soon as possible.",
  );
  const handleChange = useCallback(() => setActive((a) => !a), []);

  const allOrders = orders.map((order: any) => ({
    id: order.order_id,
    orderNumber: `#${order.order_number}`,
    dueDate: order.dueDate ? new Date(order.dueDate).toLocaleDateString() : "Full Payment",
    balanceAmount: `$${order.balanceAmount ?? 0}`,
    paymentStatus: order.paymentStatus,
    fulfilmentStatus: order.fulfilmentStatus ?order.fulfilmentStatus :"UNFULFILLED",
    customerEmail: order.customerEmail,
  }));

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
            { label: "All", value: "" },
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
  const filteredOrders = allOrders.filter((order:any) => {
    const matchesQuery =
      queryValue === "" ||
      order.orderNumber.toLowerCase().includes(queryValue.toLowerCase());

    const matchesTab =
      selectedTab === 1
        ? order.fulfilmentStatus === "UNFULFILLED"
        : selectedTab === 2
          ? order.fulfilmentStatus === "FULFILLED"
          : selectedTab === 3
            ? order.fulfilmentStatus === "ON_HOLD"
            : true;

    const matchesPaymentStatus =
      !paymentStatus || order.paymentStatus === paymentStatus;

    return matchesQuery && matchesTab && matchesPaymentStatus;
  });

  const { selectedResources, allResourcesSelected, handleSelectionChange ,clearSelection} =
    useIndexResourceState(filteredOrders);

  useEffect(() => {
    if (actionData?.success) {
      setIsSending(false);
      setActive(false);
      shopify?.toast?.show?.('Message sent'); // or replace with your toast solution
      clearSelection(); 
    }
    if (actionData && !actionData.success) {
      setIsSending(false);
      shopify?.toast?.show?.('Something went wrong',{
        isError: true
      });
    }
  }, [actionData]);

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
        fulfilmentStatus,
      }: {
        id: string;
        orderNumber: string;
        dueDate: string;
        balanceAmount: string;
        paymentStatus?: string;
        fulfilmentStatus: string;
      },
      index: number,
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
            to=""
          >
            <Text variant="bodyMd" fontWeight="bold" as="span">
              {orderNumber}
            </Text>
          </Link>
        </IndexTable.Cell>
        <IndexTable.Cell>{formatDate(dueDate)}</IndexTable.Cell>
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
          {paymentStatus === "cancelled" && <Badge tone="critical">Cancelled</Badge>}
        </IndexTable.Cell>
        <IndexTable.Cell>
          {fulfilmentStatus === "FULFILLED" && (
            <Badge progress="complete" tone="success">
              Fulfilled
            </Badge>
          )}
          {fulfilmentStatus === "ON_HOLD" && (
            <Badge progress="partiallyComplete" tone="attention">
              On Hold
            </Badge>
          )}
          {fulfilmentStatus === "UNFULFILLED" && (
            <Badge progress="incomplete" tone="warning">
              Unfulfilled
            </Badge>
          )}
          {fulfilmentStatus === "unknown" && <Badge>Unknown</Badge>}
        </IndexTable.Cell>
      </IndexTable.Row>
    ),
  );

  const handleFiltersQueryChange = useCallback(
    (value: string) => setQueryValue(value),
    [],
  );

  function handleShippingNotification() {
    setIsSending(true);

    const formData = new FormData();
    formData.append("intent", "shipping-notification");
    formData.append("subject", subject);
    formData.append("message", emailText);

    const selectedOrders = selectedResources.map((id) => {
      const selectedOrder = allOrders.find((order: any) => order.id === id);
      return {
        orderId: selectedOrder?.id,
        customerEmail: selectedOrder?.customerEmail,
        orderNumber: selectedOrder?.orderNumber,
        dueDate: selectedOrder?.dueDate,
        balanceAmount: selectedOrder?.balanceAmount,
        paymentStatus: selectedOrder?.paymentStatus,
        fulfilmentStatus: selectedOrder?.fulfilmentStatus,
      };
    });

    formData.append("selectedOrders", JSON.stringify(selectedOrders));
    submit(formData, { method: "post" });
  }

  return (
    <Page title="Preorders">
      <TitleBar title="Additional page" />
      <Modal
        open={active}
        onClose={handleChange}
        title="Send shipping notification"
        primaryAction={{
          content: isSending ? 'Sending...' : 'Send',
          onAction: handleShippingNotification,
          loading: isSending,
          disabled: isSending,
        }}
        secondaryActions={[
          {
            content: "Cancel",
            onAction: handleChange,
            disabled: isSending,
            loading: false,
          },
        ]}
      >
        <Modal.Section>
          <BlockStack gap="400">
            <Banner>
              <Text as="p" variant="bodyMd">
                1 email will be sent. Customize email templates in{" "}
                <a href="#">settings</a>
              </Text>
            </Banner>
            <Box>
              <Text as="h5" variant="bodyMd" fontWeight="semibold">
                Subject
              </Text>
              <TextField
                label="Subject"
                labelHidden
                value={subject}
                onChange={setSubject}
                autoComplete="off"
                helpText="Use {order} for order number"
                disabled={isSending}
              />
            </Box>
            <Box>
              <Text as="h5" variant="bodyMd" fontWeight="semibold">
                Email text
              </Text>
              <TextField
                label="Email text"
                labelHidden
                value={emailText}
                onChange={setEmailText}
                multiline={4}
                autoComplete="off"
                helpText="Use {order} for order number"
                disabled={isSending}
              />
            </Box>
          </BlockStack>
        </Modal.Section>
      </Modal>
      <div style={{ margin:20}}>
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
        //    pagination={{
        //   hasNext: true,
        //   onNext: () => {},
        // }}
        >
          {rowMarkup}
        </IndexTable>
      </Card>
      </div>
    </Page>
  );
}
