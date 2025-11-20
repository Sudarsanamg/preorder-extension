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
      ... on ProductVariant {
        id
        title
        metafield(namespace: "$app:preorder-extension", key: "preorder") {
          value
        }
      }
    }
  }
`;

export const GET_PRODUCTS_WITH_PREORDER_WITH_CAMPAIGNID = `#graphql
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

export const removeMetaFieldMutation = `
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

export const updateMaxUnitMutation = `#graphql
            mutation setMetafield($id: ID!, $value: String!) {
              metafieldsSet(metafields: [
                {
                  ownerId: $id,
                  namespace: "$app:preorder-extension",
                  key: "preorder_max_units",
                  type: "number_integer",
                  value: $value
                }
              ]) {
                userErrors { field message }
              }
            }
          `;