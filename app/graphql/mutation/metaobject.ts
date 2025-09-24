export const CREATE_METAOBJECT_DEFINITION = `#graphql
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        name
        type
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const CREATE_DESIGN_SETTINGS = `#graphql
  mutation CreateDesignSettings($fields: [MetaobjectFieldInput!]!) {
    metaobjectCreate(
      metaobject: {
        type: "design_settings",
        fields: $fields,
        capabilities: { publishable: { status: ACTIVE } }
      }
    ) {
      metaobject {
        id
        handle
        fields { key value }
        capabilities { publishable { status } }
      }
      userErrors { field message }
    }
  }
`;

export const CREATE_CAMPAIGN = `#graphql
  mutation CreateCampaign($fields: [MetaobjectFieldInput!]!) {
    metaobjectCreate(
      metaobject: {
        type: "preordercampaign",
        fields: $fields,
        capabilities: { publishable: { status: ACTIVE } }
      }
    ) {
      metaobject {
        id
        handle
        capabilities { publishable { status } }
      }
      userErrors { field message }
    }
  }
`;