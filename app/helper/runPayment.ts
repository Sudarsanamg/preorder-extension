import prisma from "app/db.server";

const CREATE_ORDER_PAYMENT = `
  mutation orderPayment(
    $id: ID!,
    $idempotencyKey: String!,
    $amount: MoneyInput!,
    $mandateId: ID!
  ) {
    orderCreateMandatePayment(
      id: $id
      idempotencyKey: $idempotencyKey
      amount: $amount
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
  shop,
  orderId,
  mandateId,
  amount,
  currency,
}: {
  shop: string;
  orderId: string;
  mandateId: string;
  amount: number | string;
  currency: string;
}) {

  const accessToken = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
    select: { offlineToken: true },
  })

  const token = accessToken?.offlineToken;
  if (!token) {
    throw new Error(`Missing offline token for shop ${shop}`);
  }

  const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: CREATE_ORDER_PAYMENT,
      variables: {
        id: orderId, 
        idempotencyKey: crypto.randomUUID().replace(/-/g, "").slice(0, 32),
        amount: {
          amount: amount.toString(),
          currencyCode: currency,
        },
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
