import prisma from "app/db.server";
import { decrypt } from "app/utils/crypto.server";

export async function incrementUnitsSold(store: string, variantData: { id: string; quantity: number, campaignId?: string }) {
  if(!variantData.campaignId){ 
    return;
  }

  const accessToken = await prisma.store.findUnique({
    where: { shopifyDomain: store },
    select: { offlineToken: true },
  });

  if (!accessToken?.offlineToken) throw new Error("No access token for store");

  let token = accessToken.offlineToken;
  token = token && decrypt(token);
  const shopDomain = store; 
  const endpoint = `https://${shopDomain}/admin/api/2023-10/graphql.json`;


  const GET_VARIANT_METAFIELD = `
  query getVariantMetafield($id: ID!) {
    productVariant(id: $id) {
      metafield(namespace: "$app:preorder-extension", key: "preorder_units_sold") {
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
      query: GET_VARIANT_METAFIELD,
      variables: { id: `gid://shopify/ProductVariant/${variantData.id}`},
    }),
  });

  const productJson = await res.json();
  const currentValue = Number(productJson.data.product?.metafield?.value || "0");

  // Step 2: Increment value
  const newValue = currentValue + variantData.quantity;

  const campaignProduct = await prisma.preorderCampaignProduct.findFirst({
    where: {
      variantId: `gid://shopify/ProductVariant/${variantData.id}`,
    },
  });

  if (campaignProduct) {
    await prisma.preorderCampaignProduct.update({
      where: {
        id: campaignProduct.id,
      },
      data: {
        soldQuantity: {
          increment : variantData.quantity
        }
      },
    });
  }

  // Step 3: Update metafield using metafieldsSet
  const SET_METAFIELD = `
    mutation setMetafield($ownerId: ID!, $value: String!) {
      metafieldsSet(
        metafields: [
          {
            ownerId: $ownerId
            namespace: "$app:preorder-extension"
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
      variables: { ownerId: `gid://shopify/ProductVariant/${variantData.id}`, value: newValue.toString() },
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
