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
