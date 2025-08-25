// app/routes/api.products.ts
import { json } from "@remix-run/node";
import { getAllProducts} from "../models/campaign.server"   ;

export async function loader({ request }: { request: Request }) {
  const products = await getAllProducts(request);
  return json(products);
}
