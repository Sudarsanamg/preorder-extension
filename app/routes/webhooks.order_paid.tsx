import { orderStatusUpdate } from "app/models/campaign.server";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

export const action = async ({ request }: { request: Request }) => {
  console.log("Webhook hitted");
  try {
    const { topic, shop, payload, admin } = await authenticate.webhook(request);
    console.log("Webhook order_paid  hitted");
    // console.log('Order Number',payload.order_number);
    // console.log(payload,"payload order paid webhook >>>>>>>>>>>>>>>>>>>>>>>>");

    const note = payload.note;

    // console.log(note);
    const ogOrder = await prisma.campaignOrders.findFirst({
      where: {
         draft_order_id: note
      }
    })

    // console.log(ogOrder);
    const ogOrderId = ogOrder?.order_id;

    const mutation = `
    mutation orderMarkAsPaid($input: OrderMarkAsPaidInput!) {
      orderMarkAsPaid(input: $input) {
        order {
          id
          displayFinancialStatus
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      id: ogOrderId,
    },
  };

  try {
  const response = await admin.graphql(mutation, { variables });
  const data = await response.json();

    if (data.errors) {
      console.error("GraphQL Errors:", data.errors);
      return Response.json({ error: data.errors }, { status: 500 });
    }

    if (data.data.orderMarkAsPaid.userErrors.length > 0) {
      console.error("User Errors:", data.data.orderMarkAsPaid.userErrors);
      return Response.json(
        { errors: data.data.orderMarkAsPaid.userErrors },
        { status: 400 }
      );
    }

    orderStatusUpdate(note, "paid");
    const duePaymentOrderId = payload.admin_graphql_api_id;
    // archeive the due payment
    const CloseOrderMutation = `
    mutation closeOrder($id: ID!) {
      orderClose(input: { id: $id }) {
        order {
          id
          closed
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const archeiveDuePaymentResponse = await admin.graphql(CloseOrderMutation, {
    variables: { id: duePaymentOrderId },
  });

  const archeiveDuePaymentData = await archeiveDuePaymentResponse.json();
  console.log(
    "Archeived due payment:",
    archeiveDuePaymentData.data.orderClose.order)

    return new Response('Ok');        
  } catch (error) {
      console.error("❌ Error marking order as paid:", error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }


  }
  catch (error) {
    console.log(error);
  }
  return new Response();
}