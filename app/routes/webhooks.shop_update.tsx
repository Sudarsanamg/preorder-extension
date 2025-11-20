import prisma from "app/db.server";
import { authenticate } from "../shopify.server";

export const action = async ({ request }: { request: Request }) => {
  try {
    const { topic, payload, shop } = await authenticate.webhook(request);

    if (topic !== "SHOP_UPDATE") {
      return new Response("Ignored", { status: 200 });
    }

    const currency = (payload as any)?.currency || (payload as any)?.currencyCode;

    if (!currency) {
      console.warn("[SHOP_UPDATE] No currency field in payload for shop:", shop);
      return new Response("No currency provided", { status: 200 });
    }

    await prisma.store.update({
      where: { shopifyDomain: shop },
      data: {
        currencyCode: currency,
        updatedAt: BigInt(Date.now()),
      },
    });

    return new Response("OK");
  } catch (error) {
    console.error("[SHOP_UPDATE] handler error:", error);
    return new Response("Error", { status: 500 });
  }
};
