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
        metafield(namespace: "$app:preorder-extension", key: "preorder_max_units") {
        value
      }
      }
    }
  }
`;

export const GET_VARIENT_BY_IDS= `#graphql
query getVariantsByIds($ids: [ID!]!) {
  nodes(ids: $ids) {
    ... on ProductVariant {
      id
      title
      inventoryQuantity
      price
      product {
        id
        title
        featuredImage {
          url
        }
      }
      metafield(namespace: "$app:preorder-extension", key: "preorder_max_units") {
        value
      }
    }
  }
}
`;

export const GET_PRODUCTS_WITH_PREORDER_WITH_ID = `#graphql
  query getProductsMetafields($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        metafield(namespace: "$app:preorder-extension", key: "campaign_id") {
          value
        }
      }
    }
  }
`;
