import { json, type ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// This is the main action function for the route.
// It will handle both the preflight OPTIONS request and the actual POST request.
export const action = async ({ request }: ActionFunctionArgs) => {
  // --- CORS Preflight Handler (MUST be the first check) ---
  // The browser sends a preflight OPTIONS request before the actual POST request.
  // We must return a successful response with the correct CORS headers for the preflight check to pass.
  // The 204 status code (No Content) is the standard for a successful preflight response.
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", // Cache the preflight response for 24 hours
      },
    });
  }

  // If the request is not a preflight, proceed with the main application logic.
  // The `authenticate.admin` helper handles validation for the actual POST request.
  const { admin } = await authenticate.admin(request);

  try {
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
          },
        }
      );
    }
  } catch (err: any) {
    console.error("Error in action function:", err);
    return json(
      { success: false, error: err.message },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
};
