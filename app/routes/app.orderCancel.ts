// app/cron.server.ts
import { json } from "@remix-run/node";
import prisma from "../db.server";
import { cancelPendingOrder} from "../helper/cancelOrder";

// Runs every minute
export const loader = async () => {
  console.log("⏰ cancel Cron endpoint hit...");

  const duePayments = await prisma.vaultedPayment.findMany({
    where: { paymentStatus: "PENDING", 
      accessToken: { not: null }
     },
  });

  for (const payment of duePayments) {
    try {
      await cancelPendingOrder({
        shop: "us-demo-store-2.myshopify.com",
        accessToken: payment.accessToken ?? "",
        orderId: payment.orderId,
        refund: false,
  restock: false,
  reason: "DECLINED",
      });

      await prisma.vaultedPayment.update({
        where: { orderId: payment.orderId },
        data: { paymentStatus: "CANCELLED" },
      });

      await prisma.campaignOrders.update({
        where: { order_id: payment.orderId },
        data: { paymentStatus: "CANCELLED" },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};