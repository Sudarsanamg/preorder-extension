import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, topic, payload } = await authenticate.webhook(request);

  if (topic === "PRODUCTS_UPDATE") {
    const variants = payload.variants;

    try {
      for (const variant of variants) {
        const variantId = `gid://shopify/ProductVariant/${variant.id}`;
        const available = variant.inventory_quantity;

        // Step 1: Fetch variant metafield preorder
        const res = await admin?.graphql(
          `#graphql
          query getMetafield($id: ID!) {
            productVariant(id: $id) {
              metafield(namespace: "custom", key: "campaign_id") {
                value
              }
            }
          }
          `,
          { variables: { id: variantId } },
        );
        const json = await res?.json();
        const campaignId = json?.data.productVariant?.metafield?.value;
        if(!campaignId){
         continue
        }

        const campaign = await prisma.preorderCampaign.findUnique({
          where: { id: campaignId },
          select: { campaignType: true },
        });
        if(!campaign){
          continue
        }

        // Step 2: If preorder == true, update preorder_max_units
        if (campaignId !== "" && campaign?.campaignType === 'IN_STOCK') {
          await admin?.graphql(
            `#graphql
            mutation setMetafield($id: ID!, $value: String!) {
              metafieldsSet(metafields: [
                {
                  ownerId: $id,
                  namespace: "custom",
                  key: "preorder_max_units",
                  type: "number_integer",
                  value: $value
                }
              ]) {
                userErrors { field message }
              }
            }
          `,
            {
              variables: {
                id: variantId,
                value: String(available),
              },
            },
          );
        }
      }
    } catch (err) {
      console.error("Error updating preorder max units:", err);
    }
  }

  return new Response("OK", { status: 200 });
};
