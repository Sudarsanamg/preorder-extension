import { orderStatusUpdate } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import {
  CloseOrderMutation,
  orderMarkAsPaid,
} from "app/graphql/mutation/orders";

export const action = async ({ request }: { request: Request }) => {
  console.log("order paid Webhook hitted");
  try {
    const { topic, payload, admin } = await authenticate.webhook(request);

    if (topic !== "ORDERS_PAID") {
      return Response.json({ error: "Invalid topic" }, { status: 200 });
    }
    const note = payload.note;
    const ogOrder = await prisma.campaignOrders.findFirst({
      where: {
        draft_order_id: note,
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
      const response = await admin?.graphql(orderMarkAsPaid, { variables });
      const data: any = await response?.json();

      if (data.errors) {
        console.error("GraphQL Errors:", data.errors);
        return Response.json({ error: data.errors }, { status: 200 });
      }

      if (data.data.orderMarkAsPaid.userErrors.length > 0) {
        console.error("User Errors:", data.data.orderMarkAsPaid.userErrors);
        return Response.json(
          { errors: data.data.orderMarkAsPaid.userErrors },
          { status: 400 },
        );
      }

      orderStatusUpdate(note, "PAID");
      const duePaymentOrderId = payload.admin_graphql_api_id;
      // archeive the due payment
      const archeiveDuePaymentResponse = await admin?.graphql(
        CloseOrderMutation,
        {
          variables: { id: duePaymentOrderId },
        },
      );

      const archeiveDuePaymentData = await archeiveDuePaymentResponse?.json();
      console.log(
        "Archeived due payment:",
        archeiveDuePaymentData?.data.orderClose.order,
      );

      return new Response("Ok");
    } catch (error) {
      console.error("❌ Error marking order as paid:", error);
      return Response.json({ error: "Server error" }, { status: 500 });
    }
  } catch (error) {
    console.log(error);
  }
  return new Response();
};
