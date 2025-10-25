 export const GetCampaignIdsQuery = `
  query GetCampaignIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        metafield(namespace: "custom", key: "campaign_id") {
          value
        }
      }
    }
  }
`;

export const GetVariantCampaignIdsQuery = `
  query GetVariantCampaignIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        metafield(namespace: "custom", key: "campaign_id") {
          value
        }
      }
    }
  }
`;
