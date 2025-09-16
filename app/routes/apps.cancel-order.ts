// app/routes/apps.cancel-order.ts
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";


// const SHOPIFY_ADMIN_API_ACCESS_TOKEN = "b78b494489a7f316679a1d513c9aeef1";

export const action = async ({ request }: { request: Request }) => {
  const { admin } = await authenticate.admin(request);

  const body = await request.json();
  const { orderId } = body;

  const mutation = `
    mutation orderCancel($id: ID!) {
      orderCancel(id: $id) {
        order {
          id
          status
          canceledAt
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  try {
    const response = await admin.graphql(mutation, {
      variables: { id: orderId },
    });

    const result = await response.json();

    if (result.data?.orderCancel?.order) {
      return json(
        { success: true, order: result.data.orderCancel.order },
        {
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    } else {
      return json(
        { success: false, error: result.data?.orderCancel?.userErrors },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }
  } catch (err: any) {
    return json(
      { success: false, error: err.message },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
};

// Handle preflight requests (OPTIONS)
export const loader = async ({ request }: { request: Request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  return new Response("Method not allowed", { status: 405 });
};
