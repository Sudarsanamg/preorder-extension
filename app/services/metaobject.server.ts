import { CREATE_METAOBJECT_DEFINITION } from "../graphql/mutation/metaobject";

export async function createMetaobjectDefinition(admin: any, definition: any) {
  const res = await admin.graphql(CREATE_METAOBJECT_DEFINITION, {
    variables: { definition },
  });
  return res.json();
}
