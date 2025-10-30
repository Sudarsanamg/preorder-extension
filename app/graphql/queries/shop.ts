import prisma from "app/db.server";

export const GET_SHOP = `#graphql
  {
    shop {
      id
      name
      myshopifyDomain
      currencyCode
    }
  }
`;

export const GET_SHOP_WITH_PLAN = `#graphql
  {
  shop {
    id
    name
    plan {
      displayName
      partnerDevelopment
      shopifyPlus
    }
    primaryDomain {
      url
      host
    }
  }
}
`;


export const GET_COLLECTION_PRODUCTS = `#graphql
  query getCollectionProducts($id: ID!) {
    collection(id: $id) {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 100) {   # increase limit, Shopify caps at 250
              edges {
                node {
                  id
                  displayName
                  price
                  inventoryQuantity
                }
              }
            }
          }
        }
      }
    }
  }
`;

export async function isShopifyPaymentsEnabled(
  shopDomain: string,
): Promise<boolean> {
  const query = `
    query ShopifyPaymentsAccountStatus {
      shopifyPaymentsAccount {
        activated
      }
    }
  `;

  const accessToken = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { offlineToken: true },
  });
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (typeof accessToken?.offlineToken === "string") {
    headers["X-Shopify-Access-Token"] = accessToken.offlineToken;
  }

  const response = await fetch(
    `https://${shopDomain}/admin/api/2025-10/graphql.json`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ query }),
    }
  );

  if (!response.ok) {
    console.error(
      `Shopify API request failed: ${response.status} ${response.statusText}`
    );
    return false;
  }

  const { data, errors } = await response.json();

  // Log GraphQL errors (if any)
  if (errors) {
    console.error("GraphQL errors:", errors);
    return false;
  }

  // Check if the field exists and is true
  return data?.shopifyPaymentsAccount?.activated === true;
}
