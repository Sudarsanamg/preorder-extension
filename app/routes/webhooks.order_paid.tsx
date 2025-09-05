import { orderStatusUpdate } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

export const action = async ({ request }: { request: Request }) => {
  console.log("Webhook hitted");
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    console.log("Webhook order_paid  hitted");
    // console.log('Order Number',payload.order_number);
    console.log(payload,"payload");

    const note = payload.note;

    console.log(note);

    orderStatusUpdate(note, "paid");

    return new Response('Ok');



  }
  catch (error) {
    console.log(error);
  }
  return new Response();
}