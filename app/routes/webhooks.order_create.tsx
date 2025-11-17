import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import { v4 as uuidv4 } from "uuid";
import { Decimal } from "@prisma/client/runtime/library";
import nodemailer from "nodemailer";
import type { FulfillmentStatus } from "@prisma/client";
import {
  AddTagsToOrderMutation,
  draftOrderCreate,
  getOrderVaultedMethods,
  getOrderWithProducts,
} from "app/graphql/queries/orders";
import { draftOrderInvoiceSendMutation } from "app/graphql/mutation/orders";
import { generateEmailTemplate } from "app/utils/generateEmailTemplate";
import { incrementUnitsSold } from "app/models/preorder.server";
import { createOrder, createDuePayment } from "app/models/campaign.server";
function mapFulfillmentStatus(status: string | null): FulfillmentStatus {
  switch (status) {
    case "fulfilled":
      return "FULFILLED";
    case "on_hold":
      return "ON_HOLD";
    default:
      return "UNFULFILLED";
  }
}

async function getStore(shop: string) {
  return prisma.store.findUnique({
    where: { shopifyDomain: shop },
    select: { id: true },
  });
}

function extractCampaignIds(lineItems: any[]) {
  const ids = lineItems
    .map((item) => {
      const prop = item.properties?.find((p: any) => p.name === "_campaignId");
      return prop?.value || null;
    })
    .filter(Boolean);

  return [...new Set(ids)];
}

async function sendCustomEmail({
  storeId,
  customerEmail,
  orderId,
  orderNumber,
  shop,
}: {
  storeId: string;
  customerEmail: string;
  orderId: string;
  orderNumber: number;
  shop: string;
}) {
  const emailSettings = await prisma.store.findFirst({
    where: { id: storeId },
    select: {
      ConfrimOrderEmailSettings: true,
      sendCustomEmail: true,
    },
  });

  if (!emailSettings?.sendCustomEmail) return;

  const templateData = await getOrderWithProducts(orderId, shop);
  const emailTemplate = generateEmailTemplate(
    emailSettings.ConfrimOrderEmailSettings,
    templateData,
    orderNumber.toString(),
  );

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"Preorder" <Preorder@noreply.com>`,
    to: customerEmail,
    subject: "Your Preorder is Confirmed!",
    html: emailTemplate,
  });
}

async function handleOrderTags(
  admin: any,
  payload: any,
  storeId: string,
  campaignIds: string[],
) {
  const campaigns = await prisma.preorderCampaign.findMany({
    where: { id: { in: campaignIds }, storeId },
  });

  const orderTags: string[] = [];
  const customerTags: string[] = [];

  for (const c of campaigns) {
    if (c.orderTags) orderTags.push(String(c.orderTags));
    if (c.customerTags) customerTags.push(String(c.customerTags));
  }

  const uniqueTags = [...new Set([...orderTags, ...customerTags])];
  if (uniqueTags.length === 0) return;

  const orderId = payload.admin_graphql_api_id;
  await admin?.graphql(AddTagsToOrderMutation, {
    variables: { id: orderId, tags: uniqueTags },
  });
}

async function createCampaignOrder(
  payload: any,
  storeId: string,
  campaignIds: string[],
) {
  const orderId = payload.admin_graphql_api_id;
  const orderNumber = payload.order_number;
  const schedules = payload?.payment_terms?.payment_schedules || [];
  const secondSchedule = schedules[1];
  const customerEmail = payload.email || payload.customer?.email;
  const remaining = Number(secondSchedule?.amount) || 0;

  const campaignOrder = await createOrder({
    orderNumber,
    orderId: orderId,
    ...(secondSchedule?.due_at && { dueDate: secondSchedule.due_at }),
    balanceAmount: remaining ?? 0,
    paymentStatus: remaining > 0 ? "PENDING" : "PAID",
    storeId,
    customerEmail,
    totalAmount: new Decimal(payload.total_price),
    currency: payload.currency,
    fulfilmentStatus: mapFulfillmentStatus(payload.fulfillment_status),
    campaignId: campaignIds[0],
  });

  return { campaignOrder, remaining, secondSchedule, customerEmail };
}

async function processDraftInvoice({
  admin,
  customerId,
  customerEmail,
  remaining,
  orderNumber,
  orderId,
  storeId,
}: any) {
  const uuid = uuidv4();

  await prisma.campaignOrders.update({
    where: { orderId: orderId, storeId },
    data: { draftOrderId: uuid },
  });

  const variables = {
    input: {
      customerId,
      lineItems: [
        {
          title: `Remaining Balance Payment for order #${orderNumber}`,
          quantity: 1,
          originalUnitPrice: remaining,
        },
      ],
      note: uuid,
      useCustomerDefaultAddress: true,
    },
  };

  const response = await admin?.graphql(draftOrderCreate, { variables });
  const data = await response?.json();
  const draftOrderId = data?.data?.draftOrderCreate?.draftOrder?.id;

  await admin?.graphql(draftOrderInvoiceSendMutation, {
    variables: { id: draftOrderId, email: { to: customerEmail } },
  });
}

async function processVaultPayment({
  admin,
  orderId,
  remaining,
  secondSchedule,
  campaignOrder,
  storeId,
}: any) {
  const response = await admin?.graphql(getOrderVaultedMethods, {
    variables: { id: orderId },
  });

  const { data }: any = await response?.json();
  const methods = data?.order?.paymentCollectionDetails?.vaultedPaymentMethods;
  const mandateId = methods?.[0]?.id;

  await createDuePayment(
    orderId,
    remaining.toString(),
    secondSchedule.currency,
    mandateId,
    secondSchedule.due_at,
    "PENDING",
    campaignOrder.id,
    storeId,
  );
}

async function processOrderCreate({
  shop,
  payload,
  admin,
}: {
  shop: string;
  payload: any;
  admin: any;
}) {
  try {
    const store = await getStore(shop);
    if (!store) {
      return;
    }

    if (
      payload.source_name === "shopify_draft_order" ||
      payload.draft_order_id
    ) {
      return ;
    }

    const storeId = store.id;
    const orderId = payload.admin_graphql_api_id;
    const existing = await prisma.campaignOrders.findUnique({
      where: { orderId },
    });

    if (existing) {
      return;
    }

    const lineItems = payload.line_items || [];
    const campaignIds = extractCampaignIds(lineItems);
    if (campaignIds.length === 0) {
      return;
    }

    for (const item of lineItems) {
      await incrementUnitsSold(shop, {
        id: item.variant_id,
        quantity: item.quantity,
      });
    }

    for (const campaignId of campaignIds) {
      await prisma.preorderCampaign.update({
        where: { id: campaignId, storeId },
        data: { totalOrders: { increment: 1 } },
      });
    }

    await handleOrderTags(admin, payload, storeId, campaignIds);

    const { campaignOrder, remaining, secondSchedule, customerEmail } =
      await createCampaignOrder(payload, storeId, campaignIds);

    await sendCustomEmail({
      storeId,
      customerEmail,
      orderId,
      orderNumber: payload.order_number,
      shop,
    });

    const campaign = await prisma.preorderCampaign.findFirst({
      where: { id: campaignIds[0], storeId },
    });

    const vaultPayment = campaign?.getDueByValt || false;
    const customerId = payload.customer?.admin_graphql_api_id;

    if (remaining > 0 && !vaultPayment) {
      await processDraftInvoice({
        admin,
        customerId,
        customerEmail,
        remaining,
        orderNumber: payload.order_number,
        orderId,
        storeId,
      });
    }

    if (remaining > 0 && vaultPayment) {
      await processVaultPayment({
        admin,
        orderId,
        remaining,
        secondSchedule,
        campaignOrder,
        storeId,
      });
    }
  } catch (error) {
    console.error("ORDERS_CREATE PROCESSING ERROR:", error);
  }
}

export const action = async ({ request }: { request: Request }) => {
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);

    if (topic !== "ORDERS_CREATE") {
      return new Response("OK", { status: 200 });
    }

    const response = new Response("OK", { status: 200 });

    processOrderCreate({ shop, payload, admin }).catch((error) =>
      console.error("ORDERS_CREATE ASYNC ERROR:", error),
    );

    return response;
  } catch (error) {
    console.error("Webhook receive error:", error);
    return new Response("OK", { status: 200 });
  }
};
