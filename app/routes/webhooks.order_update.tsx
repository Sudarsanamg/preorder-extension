import { FulfillmentStatus } from "@prisma/client";
import prisma from "../db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  try {
    const result = await authenticate.webhook(request);
    const topic = result.topic;
    const shop = result.shop;
    const body = result.payload?.body ?? result.payload ?? result?.body ?? null;

    // Defensive check — avoid crashes
    if (!body || !body.id) {
      console.error("❌ Invalid webhook payload:", body);
      return new Response("Invalid payload", { status: 400 });
    }

    console.log("🧾 Order update received from:", shop);
    console.log("Topic:", topic);
    console.log("Order ID:", body.id);
    console.log("Fulfillment:", body.fulfillment_status);
    console.log("Financial:", body.financial_status);
    console.log("Cancelled at:", body.cancelled_at);

    const existingOrder = await prisma.campaignOrders.findUnique({
      where: { order_id: `gid://shopify/Order/${body.id}` },
    });

    if (!existingOrder) {
      console.log("⏭️ Order not part of any campaign. Skipping.");
      return new Response("No campaign order found", { status: 200 });
    }

    // ✅ Step 2: Handle cancellation
    if (body.cancelled_at) {
      await prisma.campaignOrders.update({
        where: { order_id: `gid://shopify/Order/${body.id}` },
        data: {
          paymentStatus: "CANCELLED",
        },
      });

      console.log("🚫 Order marked as cancelled in DB");
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

    // ✅ Step 3: Handle fulfillment status change (optional)
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

      console.log("📦 Fulfillment status updated:", body.fulfillment_status);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("❌ Error processing order update webhook:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

export const loader = () => new Response("Method not allowed", { status: 405 });
