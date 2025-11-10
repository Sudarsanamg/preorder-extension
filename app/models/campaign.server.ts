import prisma from "app/db.server";
// routes/api.products.ts
// import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import type { Prisma ,PaymentStatus ,CampaignStatus, DiscountType ,Fulfilmentmode ,scheduledFulfilmentType, FulfillmentStatus, CampaignType,  } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { decrypt } from "app/utils/crypto.server";

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
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
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
  const store = await getStoreIdByShopId(shopId as string);
  console.log(store?.id, "store");
  return prisma.preorderCampaign.findMany({
    where: {
      storeId: store?.id,
      status: {
        not: "ARCHIVED",
      },
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
  campaignType?: CampaignType;
  shopId?: string;
  getDueByValt: boolean;
  totalOrders: number;
  fulfilmentmode?: Fulfilmentmode;
  scheduledFulfilmentType? :scheduledFulfilmentType;
  fulfilmentDaysAfter: number;
  fulfilmentExactDate: Date;
  paymentType: string;
}) {
  const store = await getStoreIdByShopId(data.shopId ?? "");
  if(!store) throw new Error("Store not valid");

  return prisma.preorderCampaign.create({
    data: {
      name: data.name,
      storeId: store.id,
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
      fulfilmentExactDate: data.fulfilmentExactDate,
      paymentType:data.paymentType === 'partial' ? "PARTIALPAYMENT" : "FULLPAYMENT",
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
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
  orderTags?: Prisma.JsonValue;
  customerTags?: Prisma.JsonValue;
  discountType: DiscountType;
  discountPercent?: number;
  discountFixed?: number;
  campaignType?: CampaignType;
  shopId: string;
  getDueByValt: boolean;
  fulfilmentmode?: Fulfilmentmode;
  scheduledFulfilmentType?: scheduledFulfilmentType;
  fulfilmentDaysAfter: number;
  fulfilmentExactDate: Date;
  paymentType?: string;
}) {
  const store = await getStoreIdByShopId(data.shopId)
  if (!store) throw new Error("Store not valid")

  return prisma.preorderCampaign.update({
    where: {
      id: data.id,
      storeId: store?.id
    },
    data: {
      name: data.name,
      depositPercent: data.depositPercent,
      balanceDueDate: data.balanceDueDate,
      refundDeadlineDays: data.refundDeadlineDays,
      releaseDate: data.releaseDate,
      status: data.status,
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
      fulfilmentmode: data.fulfilmentmode,
      scheduledFulfilmentType: data.scheduledFulfilmentType,
      fulfilmentDaysAfter: data.fulfilmentDaysAfter,
      fulfilmentExactDate: data.fulfilmentExactDate,
      paymentType:data.paymentType === 'partial' ? "PARTIALPAYMENT" : "FULLPAYMENT",
      updatedAt: BigInt(Date.now()),
    },
  });
}

export async function addProductsToCampaign(
  campaignId: string,
  products: { productId: string; productImage?: string,variantTitle?: string; variantId?: string; variantInventory: number ;variantPrice?: number ;maxUnit?: number}[],
  shopId: string
) {
  const store = await getStoreIdByShopId(shopId);
  const storeId = store?.id ?? "";
  return prisma.preorderCampaignProduct.createMany({
    data: products.map((p) => ({
      campaignId,
      productId: p.productId,
      variantId: p.variantId,
      variantTitle: p.variantTitle,
      maxQuantity: Number(p.maxUnit),
      price: p.variantPrice,
      imageUrl: p.productImage,
      storeId: storeId,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    })),
  });
}

export async function replaceProductsInCampaign(
  campaignId: string,
  products: { productId: string; variantId?: string; totalInventory: number }[],
) {
  const storeId = await prisma.preorderCampaign.findUnique({
    where: { id: campaignId },
    select: { storeId: true },
  })
  return prisma.$transaction([
    // 1. Delete all existing products for this campaign

    prisma.preorderCampaignProduct.deleteMany({
      where: { 
        campaignId: campaignId },
    }),

    // 2. Insert the new products
    prisma.preorderCampaignProduct.createMany({
      data: products.map((p) => ({
        campaignId,
        productId: p.productId,
        variantId: p.variantId,
        maxQuantity: p.totalInventory,
        storeId: storeId?.storeId,
        updatedAt: BigInt(Date.now()),
        createdAt: BigInt(Date.now())
      })),
    }),
  ]);
}

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
  const store = await getStoreIdByShopId(storeId as string);
  return prisma.preorderCampaign.findMany({
    where: {
      storeId: store?.id,
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

export async function deleteCampaign(id: string, shopId: string) {

  const store = await getStoreIdByShopId(shopId as string);

  return prisma.preorderCampaign.update({
    where: { 
      id, 
      storeId : store?.id
    },
    data: {
      status: "ARCHIVED",
    },
  });
}

export async function updateCampaignStatus(id: string, status: CampaignStatus,shopId: string) {
  const store = await getStoreIdByShopId(shopId as string);
  return prisma.preorderCampaign.update({
    where: {
       id,
       storeId: store?.id
       },
    data: { status },
  });
}

export async function getOrders(shopId: string) {
  const store = await getStoreIdByShopId(shopId as string);
  return prisma.campaignOrders.findMany({
    where: {
      storeId: store?.id,
    },
    select: {
      order_id: true,
      order_number: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
      customerEmail: true,
      fulfilmentStatus: true
    },
    orderBy: {
      order_number: "desc",
    },
   
  });
}

export async function getOrdersByLimit(shopId: string, limit = 10, skip = 0) {
  const store = await getStoreIdByShopId(shopId as string);
  return prisma.campaignOrders.findMany({
    where: {
      storeId: store?.id,
    },
    select: {
      order_id: true,
      order_number: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
      customerEmail: true,
      fulfilmentStatus: true
    },
    skip,
    take: limit,
    orderBy: {
      order_number: "desc",
    },
  });
}


export async function getOrdersByFulfilmentStatus(shopId: string, status: Fulfilmentmode) {
  const store = await getStoreIdByShopId(shopId as string);
  return prisma.campaignOrders.findMany({
    where: {
      storeId: store?.id,
      
    },
    select: {
      order_id: true,
      order_number: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
      customerEmail: true
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
  shopId,
  customerEmail,
  totalAmount,
  currency,
  fulfilmentStatus,
  campaignId
}: {
  order_number: number;
  order_id: string;
  draft_order_id?: string;
  dueDate?: Date;
  balanceAmount?: number;
  paymentStatus: PaymentStatus;
  shopId: string;
  customerEmail: string;
  totalAmount: string,
  currency?: string,
  fulfilmentStatus ?: FulfillmentStatus,
  campaignId : string
}) {
  try {
    const store = await getStoreIdByShopId(shopId);
    if(!store){
      throw new Error("Store not found");
    }
    const newOrder = await prisma.campaignOrders.create({
      data: {
        order_number,
        storeId : store?.id,
        order_id,
        draft_order_id,
        dueDate,
        balanceAmount,
        paymentStatus,
        customerEmail,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
        totalAmount :totalAmount ?? new Decimal(totalAmount),
        currency,
        fulfilmentStatus,
        campaignId,
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
    data: {
       paymentStatus, 
       updatedAt: BigInt(Date.now())
      },
  });
}

export async function orderStatusUpdateByOrderId(orderId: string) {
  return prisma.campaignOrders.update({
    where: { order_id: orderId },
    data: { paymentStatus: "PAID" },
  });
}


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
    data: {
       ConfrimOrderEmailSettings: settings, 
       updatedAt: BigInt(Date.now())
      },
  });
}

export async function updateShippingEmailSettings( shopId: string,
  settings: any) {
  return prisma.store.update({
    where: { shopId: shopId },
    data: {
       ShippingEmailSettings: settings, 
       updatedAt: BigInt(Date.now())
      },
  })
}

export async function updateCustomEmailStatus(shopId: string, enable: boolean) {
  return prisma.store.update({
    where: { shopId: shopId },
    data: { 
      sendCustomEmail: enable, 
      updatedAt: BigInt(Date.now())

    },
  });
}



export async function getStoreID(storeDomain: string) {
  return prisma.store.findUnique({
    where: { shopifyDomain: storeDomain },
    select:{
      id :true
    }
  }
);
}

export async function getStoreIdByShopId(shopId: string) {
  if (!shopId) {
    return null;
  }
  return prisma.store.findUnique({
    where: { shopId },
    select: {
      id: true,
    },
  });
}

export async function createDuePayment(
  orderId: string,
  amount: string,
  currencyCode: string,
  mandateId: string,
  dueDate: Date,
  paymentStatus: PaymentStatus,
  storeDomain: string,
  campaignOrderId : string
) {
  const store = await getStoreID(storeDomain);
  if(!store){
    throw new Error("Store not found");
  }
  return prisma.vaultedPayment.create({
    data: {
      orderId,
      amount,
      currencyCode,
      mandateId,
      dueDate,
      paymentStatus,
      storeId: store.id,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
      campaignOrderId
    },
  });
}


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
  const decryptedToken = decrypt(store.offlineToken);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": decryptedToken,
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


export async function getShippingEmailSettings(shopId: string) {
  const settings = await prisma.store.findUnique({
    where: { shopId: shopId },
  });
  return settings?.ShippingEmailSettings ?? {};
}