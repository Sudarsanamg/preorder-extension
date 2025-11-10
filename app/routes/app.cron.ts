// import { json } from "@remix-run/node";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import cron from "node-cron";
import prisma from "../db.server";
import { runPayment} from "../helper/runPayment";

export const loader = async () => {
  console.log("⏰ Cron endpoint hit...");

  const duePayments = await prisma.vaultedPayment.findMany({
    where: {
      paymentStatus: "PENDING",
    },
  });

  for (const payment of duePayments) {
    try {
      await runPayment({
        storeId: payment.storeId,
        orderId: payment.orderId,
        mandateId: payment.mandateId,
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

  return Response.json({ ok: true });
};