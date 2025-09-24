// app/cron.server.ts
import { json } from "@remix-run/node";
import prisma from "../db.server";
import { cancelPendingOrder} from "./cancelOrder";

// Runs every minute
export const loader = async () => {
  console.log("⏰ cancel Cron endpoint hit...");

  const duePayments = await prisma.duePayment.findMany({
    where: { paymentStatus: "pending", 
      accessToken: { not: null }
     },
  });

  for (const payment of duePayments) {
    try {
      await cancelPendingOrder({
        shop: "us-preorder-store.myshopify.com",
        accessToken: payment.accessToken ?? "",
        orderId: payment.orderID,
        refund: false,
  restock: false,
  reason: "DECLINED",
      });

      await prisma.vaultedPayment.update({
        where: { orderId: payment.orderID },
        data: { paymentStatus: "CANCELLED" },
      });

      await prisma.campaignOrders.update({
        where: { order_id: payment.orderID },
        data: { paymentStatus: "CANCELLED" },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};