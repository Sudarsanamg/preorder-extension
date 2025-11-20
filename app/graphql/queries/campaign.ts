 export const GetCampaignIdsQuery = `
  query GetCampaignIds($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on Product {
        id
        metafield(namespace: "$app:preorder-extension", key: "campaign_id") {
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
        metafield(namespace: "$app:preorder-extension", key: "campaign_id") {
          value
        }
      }
    }
  }
`;

export const THEME_LIST = `query ThemeList($roles: [ThemeRole!], $filenames: [String!]!) {
        themes(first: 10, roles: $roles) {
          edges {
            node {
              id
              role
              files(filenames: $filenames) {
                nodes {
                  body {
                    ... on OnlineStoreThemeFileBodyBase64 {
                      contentBase64
                    }
                    ... on OnlineStoreThemeFileBodyText {
                      content
                    }
                    ... on OnlineStoreThemeFileBodyUrl {
                      url
                    }
                  }
                  filename
                }
              }
            }
            cursor
          }
          pageInfo {
            hasNextPage
            hasPreviousPage
          }
        }
      }`;

export const getVariantCampaignId = `#graphql
          query getMetafield($id: ID!) {
            productVariant(id: $id) {
              metafield(namespace: "$app:preorder-extension", key: "campaign_id") {
                value
              }
            }
          }
          `;
