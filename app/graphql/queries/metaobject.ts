export const GetCampaignId = `
      query GetCampaignId($handle: MetaobjectHandleInput!) {
        metaobjectByHandle(handle: $handle) {
          id
        }
      }
    `;


export const publishMutation = `
mutation UpsertMetaobject($handle: MetaobjectHandleInput!, $status: String!) {
  metaobjectUpsert(
    handle: $handle,
    metaobject: {
      fields: [
        { key: "status", value: $status }
      ]
    }
  ) {
    metaobject {
      id
      handle
      fields {
        key
        value
      }
    }
    userErrors {
      field
      message
      code
    }
  }
}
`;

 export const updateCampaignMutation = `
      mutation UpdateCampaign($id: ID!, $metaobject: MetaobjectInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject {
            id
            handle
            fields { key value }
          }
          userErrors { field message }
        }
      }
    `;

export  const getDesignQuery = `
      query GetDesignSettings($handle: String!) {
        metaobjectByHandle(handle: { handle: $handle, type: "design_settings" }) {
          id handle type fields { key value }
        }
      }
    `;

export   const updateDesignMutation = `
      mutation UpdateDesignSettings($id: ID!, $metaobject: MetaobjectInput!) {
        metaobjectUpdate(id: $id, metaobject: $metaobject) {
          metaobject { id handle fields { key value } }
          userErrors { field message }
        }
      }
    `;