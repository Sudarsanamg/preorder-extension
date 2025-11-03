import prisma from "app/db.server";
import { decrypt } from "app/utils/crypto.server";

const CREATE_ORDER_PAYMENT = `
  mutation orderPayment(
    $id: ID!,
    $idempotencyKey: String!,
    $mandateId: ID!
  ) {
    orderCreateMandatePayment(
      id: $id
      idempotencyKey: $idempotencyKey
      mandateId: $mandateId
    ) {
      userErrors {
        field
        message
      }
    }
  }
`;

export async function runPayment({
  storeId,
  orderId,
  mandateId,
  amount,
  currency,
}: {
  storeId: string;
  orderId: string;
  mandateId: string;
  amount: number | string;
  currency: string;
}) {

  const store = await prisma.store.findUnique({
    where: {
      id: storeId,
    },
    include: {
      campaignOrders: {
        where: {
          order_id: orderId,
        },
      },
    },
  });

  if(!store?.campaignOrders.length ) {
    throw new Error(`Something went wrong`);
  }

  const token = store.offlineToken;
  const shop = store.shopifyDomain;
  const decryptedToken = decrypt(token as string);

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
      query: CREATE_ORDER_PAYMENT,
      variables: {
        id: orderId, 
        idempotencyKey: crypto.randomUUID().replace(/-/g, "").slice(0, 32),
        mandateId,
      },
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error("GraphQL errors:", data.errors);
  }

  if (data.data.orderCreateMandatePayment.userErrors.length) {
    console.error("Mutation errors:", data.data.orderCreateMandatePayment.userErrors);
  }

  return data;
}
