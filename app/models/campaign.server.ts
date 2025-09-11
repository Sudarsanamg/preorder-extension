import prisma from "app/db.server";
// routes/api.products.ts
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Prisma } from "@prisma/client";

export async function getAllCampaign(){
  return prisma.preorderCampaign.findMany();
}

export async function createPreorderCampaign(data: {
  name: string;
  depositPercent: number;
  balanceDueDate: Date;
  refundDeadlineDays: number;
  releaseDate?: Date;
  status?: string;
  campaignEndDate?: Date;
  orderTags?: Prisma.JsonValue;
  customerTags?: Prisma.JsonValue;
  discountType?: string;
  discountPercent?: number;
  discountFixed?: number;
}) {
  return prisma.preorderCampaign.create({
    data: {
      name: data.name,
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status ?? "active",
      campaignEndDate: data.campaignEndDate ? data.campaignEndDate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderTags: data.orderTags?? {} ,
      customerTags: data.customerTags?? {},
      discountType: data.discountType,
      discountPercent: data.discountPercent,
      discountFixed: data.discountFixed,
    },
  });
}


export async function updateCampaign(data:{
  id: string;
  name: string;
  depositPercent: number;
  balanceDueDate: Date;
  refundDeadlineDays: number;
  releaseDate?: Date;
  status?: string;
  campaignEndDate?: Date;
}) {
  return prisma.preorderCampaign.update({
    where: {
      id: data.id
    },
    data: {
      name: data.name,
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status ?? "active",
      campaignEndDate: data.campaignEndDate ? data.campaignEndDate : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })
}

// Add product(s) to a campaign
export async function addProductsToCampaign(
  campaignId: string,
  products: { id: string; variantId?: string; totalInventory: number }[]
) {
  return prisma.preorderCampaignProduct.createMany({
    data: products.map((p) => ({
      campaignId,
      productId: p.id,
      variantId: p.variantId,
      maxQuantity: p.totalInventory? p.totalInventory : 0
    })),
  });
}

export async function replaceProductsInCampaign(
  campaignId: string,
  products: { id: string; variantId?: string; totalInventory: number }[]
) {
  return prisma.$transaction([
    // 1. Delete all existing products for this campaign

    prisma.preorderCampaignProduct.deleteMany({
      where: { campaignId : campaignId },
    }),

    // 2. Insert the new products
    prisma.preorderCampaignProduct.createMany({
      data: products.map((p) => ({
        campaignId,
        productId: p.id,
        variantId: p.variantId,
        maxQuantity: p.totalInventory,
      })),
    }),
  ]);
}


// utils/products.server.ts
export async function getAllProducts(request: Request) {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(`
    query GetFirst250Products {
      products(first: 250) {
        edges {
          node {
            id
            title
            handle
            featuredImage {
              url
            }
            totalInventory
            variants(first: 1) {
              edges {
                node {
                  price
                }
              }
            }
          }
        }
      }
    }
  `);

  const data = await response.json();

  const products = data.data.products.edges.map((edge: any) => {
    const node = edge.node;
    return {
      id: node.id,
      title: node.title,
      handle: node.handle,
      image: node.featuredImage?.url || null,
      inventory: node.totalInventory ?? 0,
      price: node.variants.edges[0]?.node.price || "0.00",
    };
  });

  return products;
}



// Fetch all campaigns
export async function getCampaigns() {
  return prisma.preorderCampaign.findMany({
    include: { products: true },
  });
}

export async function getCampaignById(id: string) {
  return prisma.preorderCampaign.findUnique({
    where: { id },
    include: {
    products: true,
    preorders: true,
  },
  });
}

export async function deleteCampaign(id: string) {
  return prisma.preorderCampaign.delete({
    where: { id },
  });
}

export async function updateCampaignStatus(id: string, status: string) {
  return prisma.preorderCampaign.update({
    where: { id },
    data: { status },
  });
}

export async function getOrders() {
  return prisma.campaignOrders.findMany();
}

export async function createOrder({
  order_number,
  order_id,
  draft_order_id,
  dueDate,
  balanceAmount,
  paymentStatus,
}: {
  order_number: number;
  order_id: string;
  draft_order_id: string;
  dueDate: Date;
  balanceAmount: number;
  paymentStatus: string;
}) {
  try {
    const newOrder = await prisma.campaignOrders.create({
      data: {
        order_number,
        order_id,
        draft_order_id,
        dueDate,
        balanceAmount,
        paymentStatus,
      },
    });

    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function orderStatusUpdate(orderdraft_order_id: string, paymentStatus: string) {
  return prisma.campaignOrders.update({
    where: { draft_order_id: orderdraft_order_id },
    data: { paymentStatus },
  })
}

// export async function findOrderByDraftId(draftOrderId: string) {
//   return prisma.campaignOrders.findFirst({
//     where: { draft_order_id: draftOrderId },
//   });
// }

export async function createOrUpdateEmailSettings(shopId: string, settings: any) {
  const existing = await prisma.emailSettings.findUnique({
    where: { shopId },
  });

  if (existing) {
    return prisma.emailSettings.update({
      where: { shopId },
      data: settings,
    });
  } else {
    return prisma.emailSettings.create({
      data: {
        shopId,
        ...settings,
      },
    });
  }
}

export async function getEmailSettings(shopId: string) {
  return prisma.emailSettings.findUnique({
    where: { shopId },
  });
}

export async function getEmailSettingsStatus(shopId: string) {
  const settings = await prisma.emailSettings.findUnique({
    where: { shopId },
  });
  return settings?.enabled ?? false;
}

export async function emailSettingStatusUpdate(shopId: string, enable: string) {
  return prisma.emailSettings.updateMany({
    where: { shopId },
    data: { enabled: enable == "true" ? false : true },
  });
}