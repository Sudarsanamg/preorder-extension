
export const GET_PRODUCT_SELLING_PLAN_GROUPS = `
  query GetProductSPGs($id: ID!) {
    product(id: $id) {
      id
      title
      sellingPlanGroups(first: 50) {
        edges {
          node {
            id
            name
            merchantCode
          }
        }
      }
    }
  }
`;