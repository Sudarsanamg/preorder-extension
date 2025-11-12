import { orderStatusUpdate } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import {
  CloseOrderMutation,
  orderMarkAsPaid,
} from "app/graphql/mutation/orders";

export const action = async ({ request }: { request: Request }) => {
  try {
    const { topic, payload, admin, shop } = await authenticate.webhook(request);

    if (topic !== "ORDERS_PAID") {
      return Response.json({ error: "Invalid topic" }, { status: 200 });
    }

    const store = await prisma.store.findUnique({
      where: { shopifyDomain: shop },
      select: { id: true },
    });

    if (!store) {
      return Response.json({ error: "Store not found" }, { status: 200 });
    }

    const storeId = store.id;
    const note = payload.note;
    const ogOrder = await prisma.campaignOrders.findFirst({
      where: {
        draft_order_id: note,
        storeId: storeId,
      },
    });

    if (!ogOrder) {
      return Response.json({ error: "No preorder found" }, { status: 200 });
    }

    const ogOrderId = ogOrder?.order_id;
    const variables = {
      input: {
        id: ogOrderId,
      },
    };

    try {
      await admin?.graphql(orderMarkAsPaid, { variables });
      orderStatusUpdate(note, "PAID", storeId);
      const duePaymentOrderId = payload.admin_graphql_api_id;
      await admin?.graphql(CloseOrderMutation, {
        variables: { id: duePaymentOrderId },
      });

      return new Response("Ok");
    } catch (error) {
      console.error("❌ Error marking order as paid:", error);
      return Response.json({ error: "Server error" }, { status: 200 });
    }
  } catch (error) {
    console.log(error);
  }
  return new Response();
};
