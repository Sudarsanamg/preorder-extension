// app/routes/api.products.ts
import { json } from "@remix-run/node";
import {getAllVariants} from "../models/campaign.server"   ;
import { authenticate } from "app/shopify.server";
import { GET_SHOP } from "app/graphql/queries/shop";

export async function loader({ request }: { request: Request }) {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(GET_SHOP);
  const data = await response.json();
  const storeId = data.data.shop.id;
  const variants = await getAllVariants(storeId);
  return json(variants);
}
