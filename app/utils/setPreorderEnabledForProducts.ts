export async function setPreorderEnabledForProducts(productIds:any, adminToken:any, shop:any) {
  const mutation = `
    mutation setPreorder($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const metafields = productIds.map((id:any) => ({
    namespace: "custom",
    key: "preorder",
    value: "true",
    type: "boolean",
    ownerId: id,
  }));
  

  

  return response.json();
}
