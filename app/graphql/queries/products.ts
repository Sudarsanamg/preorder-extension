export const GET_PRODUCTS_BY_IDS = `#graphql
  query getProductsByIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        featuredImage {
          url
        }
        variants(first: 1) {
          edges {
            node {
              price
              inventoryQuantity
            }
          }
        }
        metafield(namespace: "custom", key: "preorder_max_units") {
        value
      }
      }
    }
  }
`;
