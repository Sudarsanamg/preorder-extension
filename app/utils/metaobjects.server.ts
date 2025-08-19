import { authenticate } from "../shopify.server";

export async function updatePreorderMetafields(request, products) {

  const { admin } = await authenticate.admin(request);

  const mutation = `
    mutation setPreorderMetafields($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          ownerId
          namespace
          key
          value
          type
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const metafields = products.map((product) => ({
    ownerId: product.id,       
    namespace: "custom",      
    key: "preorder",          
    type: "boolean",
    value: "true",
  }));


  console.log("Updating metafields for products:", metafields);


    const response = await admin.graphql(mutation, { variables: { metafields } });

    console.log("Metafields update response:", response);
    return await response.json();

  
}
