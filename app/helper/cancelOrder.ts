import prisma from "app/db.server";
import { decrypt } from "app/utils/crypto.server";

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
  orderId,
  storeId,
  refund = false,
  restock = false,
  reason = "DECLINED",
}: {
  orderId: string;
  storeId: string;
  refund?: boolean;
  restock?: boolean;
  reason?: "CUSTOMER" | "DECLINED" | "FRAUD" | "INVENTORY" | "OTHER";
}) {

  const accessToken = await prisma.store.findUnique({
    where: { id: storeId },
    select: { offlineToken: true },
  })

  const shop = await prisma.store.findUnique({
    where: { id: storeId },
    select: { shopifyDomain: true },
  })

  const token = accessToken?.offlineToken as string;
  const decryptedToken = token && decrypt(token);
  if (!token) {
    throw new Error(`Missing offline token for shop ${shop}`);
  }
  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": decryptedToken,
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
