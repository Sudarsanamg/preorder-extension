import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

export async function action({ request } : { request: Request }) {
  const { collectionId } = await request.json();
  console.log("collectionId", collectionId);
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `
      query ProductsInCollection($id: ID!) {
        collection(id: $id) {
          products(first: 50) {
            edges {
              node {
                id
                title
                handle
                images(first: 1) {
                  edges {
                    node { src }
                  }
                }
                variants(first: 1) {
                  edges {
                    node { price }
                  }
                }
              }
            }
          }
        }
      }
    `,
    { variables: { id: collectionId } }
  );

  const data = response.data || response.body?.data;
  if (!data?.collection) {
    return json({ products: [] });
  }

  const products = data.collection.products.edges.map((e: any) => e.node);

  // Return as JSON (Remix will serialize properly to string)
  return json({ products });
}
