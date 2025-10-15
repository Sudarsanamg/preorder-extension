import { json } from "@remix-run/node";
import cron from "node-cron";
import prisma from "../db.server";
import { runPayment} from "../helper/runPayment";

export const loader = async () => {
  console.log("⏰ Cron endpoint hit...");

  const duePayments = await prisma.vaultedPayment.findMany({
    where: { paymentStatus: "PENDING", 
      accessToken: { not: null }
     },
  });

  for (const payment of duePayments) {
    try {
      await runPayment({
        shop: "us-demo-store-2.myshopify.com",
        accessToken: payment.accessToken ?? "",
        orderId: payment.orderId,
        mandateId: payment.mandateId,
        amount: Number(payment.amount),
        currency: payment.currencyCode,
      });

      await prisma.vaultedPayment.update({
        where: { orderId: payment.orderId },
        data: { paymentStatus: "PAID" },
      });
      await prisma.campaignOrders.update({
        where: { order_id: payment.orderId },
        data: { paymentStatus: "PAID" },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};