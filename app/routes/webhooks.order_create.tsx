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
  order_number,
  shop,
}: {
  storeId: string;
  customerEmail: string;
  orderId: string;
  order_number: number;
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
    order_number.toString(),
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
  const order_number = payload.order_number;
  const schedules = payload?.payment_terms?.payment_schedules || [];
  const secondSchedule = schedules[1];
  const customerEmail = payload.email || payload.customer?.email;
  const remaining = Number(secondSchedule?.amount);

  const campaignOrder = await createOrder({
    order_number,
    order_id: orderId,
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
  order_number,
  orderId,
  storeId,
}: any) {
  const uuid = uuidv4();

  await prisma.campaignOrders.update({
    where: { order_id: orderId, storeId },
    data: { draft_order_id: uuid },
  });

  const variables = {
    input: {
      customerId,
      lineItems: [
        {
          title: `Remaining Balance Payment for order #${order_number}`,
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
  const methods =
    data?.order?.paymentCollectionDetails?.vaultedPaymentMethods;
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


export const action = async ({ request }: { request: Request }) => {
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    if (topic !== "ORDERS_CREATE") {
      return Response.json({ error: "Invalid topic" }, { status: 200 });
    }

    const store = await getStore(shop);
    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 200 });
    }

    const storeId = store.id;
    const lineItems = payload.line_items || [];
    const campaignIds = extractCampaignIds(lineItems);

    if (campaignIds.length === 0) {
      return Response.json({ error: "No campaign found" }, { status: 200 });
    }

    // Increment units sold
    for (const item of lineItems) {
      await incrementUnitsSold(shop, {
        id: item.variant_id,
        quantity: item.quantity,
      });
    }

    // Increment campaign totals
    for (const campaignId of campaignIds) {
      await prisma.preorderCampaign.update({
        where: { id: campaignId, storeId },
        data: { totalOrders: { increment: 1 } },
      });
    }

    await handleOrderTags(admin, payload, storeId, campaignIds);

    const { campaignOrder, remaining, secondSchedule, customerEmail } =
      await createCampaignOrder(payload, storeId, campaignIds);

    const campaign = await prisma.preorderCampaign.findFirst({
      where: { id: campaignIds[0], storeId },
    });

    const vaultPayment = campaign?.getDueByValt || false;
    const orderId = payload.admin_graphql_api_id;
    const customerId = payload.customer?.admin_graphql_api_id;

    await sendCustomEmail({
      storeId,
      customerEmail,
      orderId,
      order_number: payload.order_number,
      shop,
    });

    if (remaining > 0 && !vaultPayment) {
      await processDraftInvoice({
        admin,
        customerId,
        customerEmail,
        remaining,
        order_number: payload.order_number,
        orderId,
        storeId,
      });
    } else if (remaining > 0 && vaultPayment) {
      await processVaultPayment({
        admin,
        orderId,
        remaining,
        secondSchedule,
        campaignOrder,
        storeId,
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("ORDERS_CREATE webhook error:", error);
    return new Response("Error", { status: 500 });
  }
};
