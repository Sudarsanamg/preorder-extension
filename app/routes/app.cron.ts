// app/cron.server.ts
import { json } from "@remix-run/node";
import cron from "node-cron";
import prisma from "../db.server";
import { runPayment} from "./runPayment";

// Runs every minute
export const loader = async () => {
  console.log("⏰ Cron endpoint hit...");

  const duePayments = await prisma.duePayment.findMany({
    where: { paymentStatus: "pending", 
      accessToken: { not: null }
     },
  });

  for (const payment of duePayments) {
    try {
      await runPayment({
        shop: "us-preorder-store.myshopify.com",
        accessToken: payment.accessToken ?? "",
        orderId: payment.orderID,
        mandateId: payment.mandateId,
        amount: payment.amount,
        currency: payment.currencyCode,
      });

      await prisma.duePayment.update({
        where: { orderID: payment.orderID },
        data: { paymentStatus: "paid" },
      });
      await prisma.campaignOrders.update({
        where: { order_id: payment.orderID },
        data: { paymentStatus: "paid" },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};