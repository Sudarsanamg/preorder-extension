import { CREATE_METAOBJECT_DEFINITION } from "../graphql/mutation/metaobject";

export async function createMetaobjectDefinition(admin: any, definition: any) {
  const res = await admin.graphql(CREATE_METAOBJECT_DEFINITION, {
    variables: { definition },
  });
  return res.json();
}

export async function fetchMetaobject(admin: any, handle: string, type: string) {
  const query = `
    query GetMetaobject($handle: String!) {
      metaobjectByHandle(handle: { handle: $handle, type: "${type}" }) {
        id
        handle
        type
        fields {
          key
          value
          type
        }
      }
    }
  `;

  const response = await admin.graphql(query, { variables: { handle } }); 
  return response;
}
