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