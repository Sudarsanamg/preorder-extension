import prisma from "app/db.server";
// routes/api.products.ts
import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

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
    },
  });
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
      maxQuantity: p.totalInventory
    })),
  });
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
  });
}
