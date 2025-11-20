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
  return prisma.preorderCampaign.findMany({
    where: {
      storeId: store?.id,
      status: {
        not: "ARCHIVED",
      },
    },
    orderBy: {
      createdAt : 'asc'
    }
  });
}

export async function getCampaignStatus(id: string , storeId: string ) {
  return prisma.preorderCampaign.findFirst({
    where: {
      id,
      storeId
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
  discountValue?: number;
  campaignType?: CampaignType;
  shopId?: string;
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
      status: data.status ,
      campaignEndDate: data.campaignEndDate
        ? data.campaignEndDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderTags: data.orderTags ?? {},
      customerTags: data.customerTags ?? {},
      discountType: data.discountType,
      discountValue: data.discountValue,
      campaignType: data.campaignType,
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
  discountValue?: number;
  campaignType?: CampaignType;
  shopId: string;
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
      status: data.status,
      campaignEndDate: data.campaignEndDate
        ? data.campaignEndDate
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      orderTags: data.orderTags ?? {},
      customerTags: data.customerTags ?? {},
      discountType: data.discountType,
      discountValue: data.discountValue,
      campaignType: data.campaignType,
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
      variantId: p.variantId ?? "",
      variantTitle: p.variantTitle ?? "",
      maxQuantity: Number(p.maxUnit || 0),
      price: Number(p.variantPrice || 0),
      imageUrl: p.productImage ?? null,
      storeId: storeId,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
    })),
  });
}

export async function replaceProductsInCampaign(
  campaignId: string,
  products: { productId: string; variantTitle?: string, variantId?: string; totalInventory: number ,variantInventory: number ,maxUnit?: number ,variantPrice?: number ,productImage?: string}[],
  storeId: string,
  campaignType: CampaignType
) {
  return prisma.$transaction([
    // 1. Delete all existing products for this campaign

    prisma.preorderCampaignProduct.deleteMany({
      where: { 
        campaignId: campaignId ,
        storeId: storeId
      },
    }),

    // 2. Insert the new products
    prisma.preorderCampaignProduct.createMany({
      data: products.map((p) => ({
        campaignId,
        productId: p.productId,
        variantId: p.variantId ?? "",
        variantTitle: p.variantTitle ?? "",
        price: Number(p.variantPrice || 0),
        imageUrl: p.productImage ?? null,
        maxQuantity:campaignType == "IN_STOCK"
                  ? Number(p.variantInventory)
                  : Number(p?.maxUnit || 0) ,
        storeId: storeId,
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

export async function getCampaignById(id: string, storeDomain: string) {
  
  const storeId = await prisma.store.findFirst({
    where: { shopifyDomain: storeDomain },
    select: { id: true },
  })

  return prisma.preorderCampaign.findUnique({
    where: { 
      id,
      storeId: storeId?.id
     },
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
      orderId: true,
      orderNumber: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
      customerEmail: true,
      fulfilmentStatus: true
    },
    orderBy: {
      orderNumber: "desc",
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
      orderId: true,
      orderNumber: true,
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
      orderNumber: "desc",
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
      orderId: true,
      orderNumber: true,
      dueDate: true,
      balanceAmount: true,
      paymentStatus: true,
      storeId: true,
      customerEmail: true
    }
  });
}

export async function createOrder({
  orderNumber,
  orderId,
  draftOrderId,
  dueDate,
  balanceAmount,
  paymentStatus,
  storeId,
  customerEmail,
  totalAmount,
  currency,
  fulfilmentStatus,
  campaignIds,   
}: {
  orderNumber: number;
  orderId: string;
  draftOrderId?: string;
  dueDate?: Date;
  balanceAmount?: number;
  paymentStatus: PaymentStatus;
  storeId: string;
  customerEmail: string;
  totalAmount: string;
  currency?: string;
  fulfilmentStatus?: FulfillmentStatus;
  campaignIds: string[];   
}) {
  try {
    const newOrder = await prisma.campaignOrders.create({
      data: {
        orderNumber,
        storeId,
        orderId,
        draftOrderId,
        dueDate,
        balanceAmount,
        paymentStatus,
        customerEmail,
        createdAt: BigInt(Date.now()),
        updatedAt: BigInt(Date.now()),
        totalAmount: new Decimal(totalAmount),
        currency,
        fulfilmentStatus,
      },
    });
       await prisma.orderCampaignMapping.createMany({
        data: campaignIds.map((campaignId) => ({
          orderId: newOrder.id,
          campaignId,
        })),
        skipDuplicates: true,
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
  storeId: string
) {
  if(!orderdraft_order_id) return
  return prisma.campaignOrders.update({
    where: { 
      draftOrderId: orderdraft_order_id ,
      storeId : storeId
    },
    data: {
       paymentStatus, 
       updatedAt: BigInt(Date.now())
      },
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
  campaignOrderId : string,
  storeId: string
) {

  return prisma.vaultedPayment.create({
    data: {
      orderId,
      amount,
      currencyCode,
      mandateId,
      dueDate,
      paymentStatus,
      storeId: storeId,
      createdAt: BigInt(Date.now()),
      updatedAt: BigInt(Date.now()),
      campaignOrderId
    },
  });
}


export async function getAllVariants(shopId: string) {
  const store = await prisma.store.findUnique({
    where: { shopId: shopId },
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