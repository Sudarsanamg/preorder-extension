import prisma from "app/db.server";
// routes/api.products.ts
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { Prisma ,PaymentStatus ,CampaignStatus, DiscountType ,Fulfilmentmode ,scheduledFulfilmentType } from "@prisma/client";

export async function createStore(data: {
  shopId: string;
  offlineToken: string;
  webhookRegistered: boolean;
  metaobjectsCreated: boolean;
  metaFieldsCreated: boolean;
  shopifyDomain: string;
  currencyCode: string;
  ConfrimOrderEmailSettings: Prisma.InputJsonValue;
  ShippingEmailSettings: Prisma.InputJsonValue;
  GeneralSettings: Prisma.InputJsonValue;
  EmailConfig: string;
}) {
  return prisma.store.create({
    data: {
      shopId: data.shopId,
      offlineToken: data.offlineToken,
      webhookRegistered: data.webhookRegistered,
      metaobjectsCreated: data.metaobjectsCreated,
      metaFieldsCreated: data.metaFieldsCreated,
      currencyCode: data.currencyCode,
      shopifyDomain: data.shopifyDomain,
      ConfrimOrderEmailSettings: data.ConfrimOrderEmailSettings,
      ShippingEmailSettings: data.ShippingEmailSettings,
      GeneralSettings: data.GeneralSettings,
      EmailConfig: data.EmailConfig,
    },
  });
}

export async function getAccessToken(shopifyDomain: string) {
  return prisma.session.findFirst({
    where: {
      shop: shopifyDomain,
    },
    select: {
      accessToken: true,
    },
  });
}

export async function getAllCampaign(shopId?: string) {
  return prisma.preorderCampaign.findMany({
    where: {
      storeId: shopId,
    },
  });
}

export async function getCampaignStatus(id: string) {
  return prisma.preorderCampaign.findFirst({
    where: {
      id
    },
    select: {
      status: true,
    },
  });
}

export async function createPreorderCampaign(data: {
  name: string;
  depositPercent: number;
  balanceDueDate: Date;
  refundDeadlineDays: number;
  releaseDate?: Date;
  status?: CampaignStatus;
  campaignEndDate?: Date;
  orderTags?: Prisma.JsonValue;
  customerTags?: Prisma.JsonValue;
  discountType: DiscountType;
  discountPercent?: number;
  discountFixed?: number;
  campaignType?: number;
  storeId?: string;
  getDueByValt: boolean;
  totalOrders: number;
  fulfilmentmode?: Fulfilmentmode;
  scheduledFulfilmentType? :scheduledFulfilmentType;
  fulfilmentDaysAfter: number;
  fulfilmentExactDate: Date;
}) {
  return prisma.preorderCampaign.create({
    data: {
      name: data.name,
      storeId: data.storeId ?? "",
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status ,
      campaignEndDate: data.campaignEndDate
        ? data.campaignEndDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderTags: data.orderTags ?? {},
      customerTags: data.customerTags ?? {},
      discountType: data.discountType,
      discountPercent: data.discountPercent,
      discountFixed: data.discountFixed,
      campaignType: data.campaignType,
      getDueByValt: data.getDueByValt,
      totalOrders: data.totalOrders,
      fulfilmentmode: data.fulfilmentmode,
      scheduledFulfilmentType: data.scheduledFulfilmentType,
      fulfilmentDaysAfter: data.fulfilmentDaysAfter,
      fulfilmentExactDate: data.fulfilmentExactDate
    },
  });
}

export async function updateCampaign(data: {
  id: string;
  name: string;
  depositPercent: number;
  balanceDueDate: Date;
  refundDeadlineDays: number;
  releaseDate?: Date;
  status?: CampaignStatus;
  campaignEndDate?: Date;
  campaignType: number;
  orderTags?: Prisma.JsonValue;
  customerTags?: Prisma.JsonValue;
}) {
  return prisma.preorderCampaign.update({
    where: {
      id: data.id,
    },
    data: {
      name: data.name,
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status,
      campaignType: data.campaignType,
      campaignEndDate: data.campaignEndDate
        ? data.campaignEndDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderTags: data.orderTags ?? {},
      customerTags: data.customerTags ?? {},
    },
  });
}

// Add product(s) to a campaign
export async function addProductsToCampaign(
  campaignId: string,
  products: { productId: string; productImage?: string,variantTitle?: string; variantId?: string; variantInventory: number ;variantPrice?: number ;maxUnit?: number}[],
) {
  return prisma.preorderCampaignProduct.createMany({
    data: products.map((p) => ({
      campaignId,
      productId: p.productId,
      variantId: p.variantId,
      variantTitle: p.variantTitle,
      maxQuantity: Number(p.maxUnit),
      price: p.variantPrice  ,
      imageUrl: p.productImage,    
    })),
  });
}

export async function replaceProductsInCampaign(
  campaignId: string,
  products: { id: string; variantId?: string; totalInventory: number }[],
) {
  return prisma.$transaction([
    // 1. Delete all existing products for this campaign

    prisma.preorderCampaignProduct.deleteMany({
      where: { campaignId: campaignId },
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
export async function getCampaigns(storeId: string) {
  return prisma.preorderCampaign.findMany({
    where: {
      storeId,
    },
    include: { products: true },
  });
}

export async function getCampaignById(id: string) {
  return prisma.preorderCampaign.findUnique({
    where: { id },
    include: {
      products: true,
      // preorders: true,
    },
  });
}

export async function deleteCampaign(id: string) {
  return prisma.preorderCampaign.delete({
    where: { id },
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus) {
  return prisma.preorderCampaign.update({
    where: { id },
    data: { status },
  });
}

export async function getOrders(shopId: string) {
  return prisma.campaignOrders.findMany({
    where: {
      storeId: shopId,
    },
    select: {
      order_id: true,
      order_number: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
    }
  });
}

export async function createOrder({
  order_number,
  order_id,
  draft_order_id,
  dueDate,
  balanceAmount,
  paymentStatus,
  storeId,
  customerEmail
}: {
  order_number: number;
  order_id: string;
  draft_order_id: string;
  dueDate: Date;
  balanceAmount?: number;
  paymentStatus: PaymentStatus;
  storeId: string;
  customerEmail: string;
}) {
  try {
    const newOrder = await prisma.campaignOrders.create({
      data: {
        order_number,
        storeId,
        order_id,
        draft_order_id,
        dueDate,
        balanceAmount,
        paymentStatus,
        customerEmail
      },
    });

    return newOrder;
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}

export async function orderStatusUpdate(
  orderdraft_order_id: string,
  paymentStatus: PaymentStatus,
) {
  return prisma.campaignOrders.update({
    where: { draft_order_id: orderdraft_order_id },
    data: { paymentStatus },
  });
}

export async function orderStatusUpdateByOrderId(orderId: string) {
  return prisma.campaignOrders.update({
    where: { order_id: orderId },
    data: { paymentStatus: "PAID" },
  });
}

// export async function findOrderByDraftId(draftOrderId: string) {
//   return prisma.campaignOrders.findFirst({
//     where: { draft_order_id: draftOrderId },
//   });
// }

// export async function createOrUpdateEmailSettings(
//   shopId: string,
//   settings: any,
// ) {
//   const existing = await prisma.emailSettings.findUnique({
//     where: { shopId },
//   });

//   if (existing) {
//     return prisma.emailSettings.update({
//       where: { shopId },
//       data: settings,
//     });
//   } else {
//     return prisma.emailSettings.create({
//       data: {
//         shopId,
//         ...settings,
//       },
//     });
//   }
// }

// export async function createOrUpdateShippingEmailSettings(
//   shopId: string,
//   settings: any,
// ) {
//   const existing = await prisma.shippingEmailSettings.findUnique({
//     where: { shopId },
//   });

//   if (existing) {
//     return prisma.shippingEmailSettings.update({
//       where: { shopId },
//       data: settings,
//     });
//   } else {
//     return prisma.shippingEmailSettings.create({
//       data: {
//         shopId,
//         ...settings,
//       },
//     });
//   }
// }

// export async function getEmailSettings(shopId: string) {
//   return prisma.emailSettings.findUnique({
//     where: { shopId },
//   });
// }

// export async function getShippingEmailSettings(shopId: string) {
//   return prisma.shippingEmailSettings.findUnique({
//     where: { shopId },
//   });
// }

export async function getEmailSettingsStatus(shopId: string) {
  const settings = await prisma.store.findUnique({
    where: { shopId :shopId}
    ,
  });
  
  return settings?.sendCustomEmail;
}

export async function getPreorderConfirmationEmailSettings(shopId: string) {
  const settings = await prisma.store.findUnique({
    where: { shopId: shopId },
  });
  return settings?.ConfrimOrderEmailSettings ?? {};
}

export async function updateConfrimOrderEmailSettings(
  shopId: string,
  settings: any,
) {
  return prisma.store.update({
    where: { shopId: shopId },
    data: { ConfrimOrderEmailSettings: settings },
  });
}

export async function updateCustomEmailStatus(shopId: string, enable: boolean) {
  return prisma.store.update({
    where: { shopId: shopId },
    data: { sendCustomEmail: enable },
  });
}

// export async function getShippingEmailSettingsStatus(shopId: string) {
//   const settings = await prisma.shippingEmailSettings.findUnique({
//     where: { shopId },
//   });
//   return settings?.enabled ?? false;
// }

// export async function emailSettingStatusUpdate(shopId: string, enable: string) {
//   return prisma.emailSettings.updateMany({
//     where: { shopId },
//     data: { enabled: enable == "true" ? false : true },
//   });
// }

// export async function shippingEmailSettingsStatusUpdate(
//   shopId: string,
//   enable: string,
// ) {
//   return prisma.shippingEmailSettings.updateMany({
//     where: { shopId },
//     data: { enabled: enable == "true" ? false : true },
//   });
// }

export async function getStoreID(storeDomain: string) {
  return prisma.store.findUnique({
    where: { shopifyDomain: storeDomain },
    select:{
      id :true
    }
  }
);
}

export async function createDuePayment(
  orderId: string,
  idempotencyKey: string,
  amount: string,
  currencyCode: string,
  mandateId: string,
  dueDate: Date,
  paymentStatus: PaymentStatus,
  accessToken: string,
  storeDomain: string
) {
  return prisma.vaultedPayment.create({
    data: {
      orderId,
      idempotencyKey,
      amount,
      currencyCode,
      mandateId,
      dueDate,
      paymentStatus,
      accessToken,
      storeDomain,
      storeId: (await getStoreID(storeDomain))?.id ?? "",
    },
  });
}

// export async function getPreorderDisplaySettings(storeId: string) {
//   return prisma.generalSettings.findFirst({
//     where: { storeId },
//   });
// }

// export async function savePreorderDisplay(
//   storeId: string,
//   settings: Prisma.JsonValue,
// ) {
//   return prisma.generalSettings.upsert({
//     where: { storeId },
//     update: { settings: settings as Prisma.InputJsonValue },
//     create: {
//       storeId,
//       settings: settings as Prisma.InputJsonValue,
//     },
//   });
// }

// export async function EmailConfig(
//   storeId: string,
//   emailId: string,
//   senderType: string,
//   fromName: string,
//   replyName: string,
// ) {
//   return prisma.emailConfig.upsert({
//     where: { storeId },
//     update: {
//       emailId,
//       senderType,
//       fromName,
//       replyName,
//     },
//     create: {
//       storeId,
//       emailId,
//       senderType,
//       fromName,
//       replyName,
//     },
//   });
// }

// export async function getPreorderEmailConfig(storeId: string) {
//   return prisma.emailConfig.findFirst({
//     where: { storeId },
//   });
// }

export async function getAllVariants(storeID: string) {
  // Get stored access token for this shop
  const store = await prisma.store.findUnique({
    where: { shopId: storeID },
    select: { offlineToken: true ,
      shopifyDomain: true
    },

  });

  if (!store?.offlineToken) {
    throw new Error(`No access token found for shop: ${store?.shopifyDomain}`);
  }

  const endpoint = `https://${store?.shopifyDomain}/admin/api/2023-10/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": store.offlineToken,
    },
    body: JSON.stringify({
      query: `
        query GetProductsWithVariants {
          products(first: 250) {
            edges {
              node {
                id
                images(first: 1) {
                  edges {
                    node {
                      originalSrc
                    }
                  }
                }
                variants(first: 250) {
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
      `,
    }),
  });

  const data = await response.json();

  if (data.errors) {
    console.error("Shopify GraphQL errors:", data.errors);
    throw new Error("Failed to fetch variants from Shopify");
  }

  const variants = data.data.products.edges.flatMap((edge: any) => {
    const p = edge.node;
    const productImage = p.images?.edges?.[0]?.node?.originalSrc || null;

    return p.variants.edges.map((variantEdge: any) => {
      const v = variantEdge.node;
      return {
        productId: p.id,
        productImage,
        variantId: v.id,
        variantTitle: v.displayName,
        variantPrice: v.price,
        variantInventory: v.inventoryQuantity ?? 0,
        maxUnit: 0,
      };
    });
  });

  return variants;
}
