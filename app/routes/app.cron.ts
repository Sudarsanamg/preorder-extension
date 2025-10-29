import { json } from "@remix-run/node";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import cron from "node-cron";
import prisma from "../db.server";
import { runPayment} from "../helper/runPayment";

export const loader = async () => {
  console.log("⏰ Cron endpoint hit...");

  const todayStart = new Date();
todayStart.setHours(0, 0, 0, 0);  

const todayEnd = new Date();
todayEnd.setHours(23, 59, 59, 999)

  const duePayments = await prisma.vaultedPayment.findMany({
    where: {
      paymentStatus: "PENDING",
    },
  });

  //  dueDate: {
  //       gte: todayStart,
  //       lte: todayEnd,
  //     },

  console.log("Due payments found:", duePayments);

  for (const payment of duePayments) {
    try {
      await runPayment({
        shop: payment.storeDomain?? "",
        orderId: payment.orderId,
        mandateId: payment.mandateId,
        amount: Number(payment.amount),
        currency: payment.currencyCode,
      });

      await prisma.vaultedPayment.update({
        where: { orderId: payment.orderId },
        data: {
           paymentStatus: "PAID" ,
           updatedAt: BigInt(Date.now())
          },
      });
      await prisma.campaignOrders.update({
        where: { order_id: payment.orderId },
        data: { paymentStatus: "PAID",
         updatedAt: BigInt(Date.now())
         },
      })
    } catch (err) {
      console.error("❌ Payment failed:", err);
    }
  }

  return json({ ok: true });
};