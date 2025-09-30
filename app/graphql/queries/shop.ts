export const GET_SHOP = `#graphql
  {
    shop {
      id
      name
      myshopifyDomain
    }
  }
`;

export const GET_SHOP_WITH_PLAN = `#graphql
  {
    shop {
      id
      name
      myshopifyDomain
      plan {
        displayName
        partnerDevelopment
        shopifyPlus
      }
    }
  }
`;


export const GET_COLLECTION_PRODUCTS = `#graphql
  query getCollectionProducts($id: ID!) {
    collection(id: $id) {
      products(first: 50) {
        edges {
          node {
            id
            title
            handle
            images(first: 1) {
              edges {
                node {
                  url
                }
              }
            }
            variants(first: 100) {   # increase limit, Shopify caps at 250
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
  }
`;

