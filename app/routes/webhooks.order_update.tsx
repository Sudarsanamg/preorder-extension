import type { FulfillmentStatus } from "@prisma/client";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  try {
    const result = await authenticate.webhook(request);
    const body = result.payload?.body ?? result.payload ?? null;

    if (!body || !body.id) {
      return new Response("Invalid payload", { status: 400 });
    }


    const existingOrder = await prisma.campaignOrders.findUnique({
      where: { order_id: `gid://shopify/Order/${body.id}` },
    });

    if (!existingOrder) {
      return new Response("No campaign order found", { status: 200 });
    }

    if (body.cancelled_at) {
      await prisma.campaignOrders.update({
        where: { order_id: `gid://shopify/Order/${body.id}` },
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

    if (
      body.fulfillment_status &&
      mapFulfillmentStatus(body.fulfillment_status) !==
        existingOrder.fulfilmentStatus
    ) {
      await prisma.campaignOrders.update({
        where: { order_id: `gid://shopify/Order/${body.id}` },
        data: {
          fulfilmentStatus: mapFulfillmentStatus(body.fulfillment_status),
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
