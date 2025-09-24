import { CREATE_METAFIELD_DEFINITION } from "../graphql/mutation/metafields";

export async function createMetafieldDefinition(admin: any, definition: any) {
  const res = await admin.graphql(CREATE_METAFIELD_DEFINITION, {
    variables: { definition },
  });
  return res.json();
}
