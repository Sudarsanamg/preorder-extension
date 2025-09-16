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

      await prisma.duePayment.update({
        where: { orderID: payment.orderID },
        data: { paymentStatus: "cancelled" },
      });
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};