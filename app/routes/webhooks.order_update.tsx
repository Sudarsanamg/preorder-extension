import type { FulfillmentStatus } from "@prisma/client";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  try {
    const { shop, payload, topic } = await authenticate.webhook(request);

    if(topic !== "ORDERS_UPDATED"){
      return Response.json({ error: "Invalid topic" }, { status: 200 });
    }

    const body = payload?.body ?? payload ?? null;

    if (!body || !body.id) {
      return new Response("Invalid payload", { status: 400 });
    }

    const store = await prisma.store.findUnique({
      where: { shopifyDomain: shop },
      select: { id: true },
    });

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 200 });
    }
    const storeId = store.id;

    const existingOrder = await prisma.campaignOrders.findUnique({
      where: {
         orderId: `gid://shopify/Order/${body.id}`,
         storeId: storeId
    },

    });

    if (!existingOrder) {
      return new Response("No campaign order found", { status: 200 });
    }

    if (body.cancelled_at) {
      await prisma.campaignOrders.update({
        where: {
           orderId: `gid://shopify/Order/${body.id}`, 
           storeId: storeId
          },
        data: {
          paymentStatus: "CANCELLED",
        },
      });

      return new Response("Order cancelled updated", { status: 200 });
    }

    const mapFulfillmentStatus = (status: string | null): FulfillmentStatus => {
      switch (status) {
        case "fulfilled":
          return "FULFILLED";
        default:
          return "UNFULFILLED";
      }
    };

    const mapPaymentStatus = (status: string | null) => {
      switch (status) {
        case "paid":
          return "PAID";
        case "pending":
          return "PENDING";
        case "refunded":
        case "voided":
          return "CANCELLED";
        default:
          return "PENDING";
      }
    };

    if (
      body.fulfillment_status &&
      mapFulfillmentStatus(body.fulfillment_status) !==
        existingOrder.fulfilmentStatus
    ) {
      await prisma.campaignOrders.update({
        where: { 
          orderId: `gid://shopify/Order/${body.id}`,
          storeId: storeId
       },
        data: {
          fulfilmentStatus: mapFulfillmentStatus(body.fulfillment_status),
        },
      });

    }

const newPaymentStatus = mapPaymentStatus(body.financial_status);

if (newPaymentStatus !== existingOrder.paymentStatus) {
  await prisma.campaignOrders.update({
    where: {
      orderId: `gid://shopify/Order/${body.id}`,
      storeId,
    },
    data: {
      paymentStatus: newPaymentStatus,
      updatedAt: BigInt(Date.now()),
    },
  });
}

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing order update webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

export const loader = () => new Response("Method not allowed", { status: 405 });
