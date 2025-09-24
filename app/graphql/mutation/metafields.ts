export const CREATE_METAFIELD_DEFINITION = `#graphql
  mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        name
        key
        type {
          name
          category
        }
        ownerType
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const SET_PREORDER_METAFIELDS = `#graphql
  mutation setPreorderMetafields($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields {
        id
        namespace
        key
        type
        value
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const GET_PRODUCTS_WITH_PREORDER = `#graphql
  query getProductsMetafields($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        title
        metafield(namespace: "custom", key: "preorder") {
          value
        }
      }
    }
  }
`;

