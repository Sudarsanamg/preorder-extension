import prisma from "app/db.server";

export async function incrementUnitsSold(store: string, id: string) {
  // Step 0: Get access token
  const accessToken = await prisma.store.findUnique({
    where: { shopifyDomain: store },
    select: { offlineToken: true },
  });

  if (!accessToken?.offlineToken) throw new Error("No access token for store");

  const token = accessToken.offlineToken;
  const shopDomain = store; 
  const endpoint = `https://${shopDomain}/admin/api/2023-10/graphql.json`;

  // Step 1: Fetch current metafield value
  const GET_PRODUCT_METAFIELD = `
    query getProductMetafield($id: ID!) {
      product(id: $id) {
        metafield(namespace: "custom", key: "preorder_units_sold") {
          id
          value
        }
      }
    }
  `;

  let res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: GET_PRODUCT_METAFIELD,
      variables: { id },
    }),
  });

  const productJson = await res.json();
  const currentValue = Number(productJson.data.product?.metafield?.value || "0");

  // Step 2: Increment value
  const newValue = currentValue + 1;

  // Step 3: Update metafield using metafieldsSet
  const SET_METAFIELD = `
    mutation setMetafield($ownerId: ID!, $value: String!) {
      metafieldsSet(
        metafields: [
          {
            ownerId: $ownerId
            namespace: "custom"
            key: "preorder_units_sold"
            type: "number_integer"
            value: $value
          }
        ]
      ) {
        metafields {
          id
          key
          value
          namespace
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: SET_METAFIELD,
      variables: { ownerId: id, value: newValue.toString() },
    }),
  });

  const updateJson = await res.json();
  const upsert = updateJson.data?.metafieldsSet;

  if (!upsert || upsert.userErrors.length > 0) {
    console.error("Error updating metafield:", upsert?.userErrors);
    throw new Error("Failed to update metafield");
  }

  console.log(`Updated preorder_units_sold → ${newValue}`);
  return upsert.metafields[0];
}
