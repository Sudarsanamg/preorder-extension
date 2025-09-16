import fetch from "node-fetch";

const CANCEL_ORDER = `
  mutation cancelOrder(
    $orderId: ID!,
    $refund: Boolean!,
    $restock: Boolean!,
    $reason: OrderCancelReason!
  ) {
    orderCancel(
      orderId: $orderId
      refund: $refund
      restock: $restock
      reason: $reason
    ) {
      job {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;



export async function cancelPendingOrder({
  shop,
  accessToken,
  orderId,
  refund = false,
  restock = false,
  reason = "DECLINED",
}: {
  shop: string;
  accessToken: string;
  orderId: string;
  refund?: boolean;
  restock?: boolean;
  reason?: "CUSTOMER" | "DECLINED" | "FRAUD" | "INVENTORY" | "OTHER";
}) {
  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": accessToken,
    },
    body: JSON.stringify({
      query: CANCEL_ORDER,
      variables: { orderId, refund, restock, reason },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
  }

  if (data.data.orderCancel.userErrors.length) {
    console.error("Mutation errors:", data.data.orderCancel.userErrors);
  }

  return data;
}
