import type { ActionFunctionArgs } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import prisma from "app/db.server";
import {  updateMaxUnitMutation } from "app/graphql/mutation/metafields";
import { getVariantCampaignId } from "app/graphql/queries/campaign";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, topic, payload, shop } = await authenticate.webhook(request);

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shop },
    select: { id: true },
  });

  if (!store) {
    return Response.json({ error: "Store not found" }, { status: 200 });
  }

  if (topic === "PRODUCTS_UPDATE") {
    const variants = payload.variants;

    try {
      for (const variant of variants) {
        const variantId = `gid://shopify/ProductVariant/${variant.id}`;
        const available = variant.inventory_quantity;

        const res = await admin?.graphql(
          getVariantCampaignId,
          { variables: { id: variantId } },
        );
        const json = await res?.json();
        const campaignId = json?.data.productVariant?.metafield?.value;
        if (!campaignId) {
          continue;
        }

        const campaign = await prisma.preorderCampaign.findUnique({
          where: {
            id: campaignId,
            storeId: store.id
          },
          select: { campaignType: true },
        });
        if (!campaign) {
          continue;
        }

        // Step 2: If preorder == true, update preorder_max_units
        if (campaignId !== "" && campaign?.campaignType === "IN_STOCK") {
          await admin?.graphql(
            updateMaxUnitMutation,
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
