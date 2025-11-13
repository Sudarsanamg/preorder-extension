import { json } from "@remix-run/node";
import prisma from "../db.server";
import { cancelPendingOrder} from "../helper/cancelOrder";

export const loader = async () => {
  console.log("⏰ cancel Cron endpoint hit...");

  const orders = await prisma.vaultedPayment.findMany({
    where: { paymentStatus: "PENDING", 
     },
  });

  for (const payment of orders) {
    try {
      await cancelPendingOrder({
        orderId: payment.orderId,
        storeId: payment.storeId,
        refund: false,
        restock: false,
        reason: "DECLINED",
      });

      await prisma.vaultedPayment.update({
        where: { orderId: payment.orderId },
        data: { paymentStatus: "CANCELLED" },
      });

      await prisma.campaignOrders.update({
        where: { orderId: payment.orderId },
        data: { paymentStatus: "CANCELLED" },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};