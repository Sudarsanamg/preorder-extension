import prisma from "app/db.server";

export const getOrdersFulfillmentStatus = `
query getOrdersFulfillmentStatus($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on Order {
      id
      displayFulfillmentStatus
    }
  }
}
`;

export const AddTagsToOrderMutation = `
  mutation AddTagsToOrder($id: ID!, $tags: [String!]!) {
    orderUpdate(input: {id: $id, tags: $tags}) {
      order {
        id
        tags
      }
      userErrors {
        field
        message
      }
    }
  }
`;


export const draftOrderCreate = `
        mutation draftOrderCreate($input: DraftOrderInput!) {
          draftOrderCreate(input: $input) {
            draftOrder {
              id
              invoiceUrl
              totalPriceSet {
                presentmentMoney {
                  amount
                  currencyCode
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

export const getOrderVaultedMethods = `
    query getOrderVaultedMethods($id: ID!) {
      order(id: $id) {
        paymentCollectionDetails {
          vaultedPaymentMethods {
            id
          }
          additionalPaymentCollectionUrl
        }
      }
    }
  `;

export async function getOrderWithProducts(orderId: string, shopDomain: string) {
  const query = `
    query GetOrderWithProducts($orderId: ID!) {
      order(id: $orderId) {
        id
        name
        lineItems(first: 10) {
          edges {
            node {
              title
              quantity
              variant {
                id
                title
                price
                product {
                  id
                  title
                  descriptionHtml
                  images(first: 1) {
                    edges {
                      node {
                        src
                        altText
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `;
  
  const variables = { orderId };

  const store = await prisma.store.findUnique({
    where: { shopifyDomain: shopDomain },
    select: { offlineToken: true },
  });

  if (!store?.offlineToken) {
    throw new Error(`No access token found for shop: ${shopDomain}`);
  }

  let accessToken = store.offlineToken;

  try {
    const response = await fetch(`https://${shopDomain}/admin/api/2023-01/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
      body: JSON.stringify({ query, variables }),
    });

    const data = await response.json();

    if (!data || !data.data || !data.data.order) {
      console.error("Error: Order not found in response for orderId:", orderId);
      throw new Error("Order not found in GraphQL response");
    }

    const orderDetails = data.data.order.lineItems.edges.map((edge: any) => {
      const variant = edge.node.variant;
      const product = variant.product;

      const productImage = product.images.edges.length > 0 ? product.images.edges[0].node.src : null;

      return {
        title: product.title,
        quantity: edge.node.quantity, 
        price: variant.price, 
        productImage, 
      };
    });

    return orderDetails;

  } catch (error) {
    console.error("Error fetching order data:", error);
    throw new Error("Failed to fetch order data");
  }
}