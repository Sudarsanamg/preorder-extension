// import { DiscountType } from "@prisma/client";

export async function removeDiscountFromVariants(
  admin: any,
  variantIds: string[]
) {
  const updatedVariants = [];

  for (const variantId of variantIds) {
    try {
      // 1. Fetch variant data
      const variantQuery = `
        query getVariant($id: ID!) {
          productVariant(id: $id) {
            id
            price
            compareAtPrice
            product {
              id
            }
          }
        }
      `;

      const variantRes = await admin.graphql(variantQuery, {
        variables: { id: variantId },
      });

      const responseJson = await variantRes.json();
      const variant = responseJson.data?.productVariant;
      if (!variant) throw new Error(`Variant not found: ${variantId}`);

      const productId = variant.product.id;
      const { price, compareAtPrice } = variant;

      // 2. Only reset if compareAtPrice exists
      if (!compareAtPrice) {
        console.log(`No discount to remove for variant ${variantId}`);
        continue;
      }

      const restoredPrice = parseFloat(compareAtPrice);

      // 3. Mutation: restore price & clear compareAtPrice
      const mutation = `
        mutation updateVariants($id: ID!, $variants: [ProductVariantsBulkInput!]!) {
          productVariantsBulkUpdate(productId: $id, variants: $variants) {
            product {
              id
            }
            productVariants {
              id
              price
              compareAtPrice
            }
            userErrors {
              code
              field
              message
            }
          }
        }
      `;

      const variables = {
        id: productId,
        variants: [
          {
            id: variantId,
            price: restoredPrice.toFixed(2),
            compareAtPrice: null, // remove discount reference
          },
        ],
      };

      const mutationRes = await admin.graphql(mutation, { variables });
      const mutationJson = await mutationRes.json();

      const errors =
        mutationJson.data?.productVariantsBulkUpdate?.userErrors || [];
      if (errors.length > 0) {
        console.error("User Errors:", errors);
      } else {
        updatedVariants.push(
          mutationJson.data?.productVariantsBulkUpdate?.productVariants[0]
        );
        console.log(
          `✅ Discount removed from variant ${variantId} (restored to $${restoredPrice})`
        );
      }
    } catch (err) {
      console.error(`Error removing discount from variant ${variantId}:`, err);
    }
  }

  console.log(
    "✅ All Discounts Removed:",
    JSON.stringify(updatedVariants, null, 2)
  );
  return updatedVariants;
}
