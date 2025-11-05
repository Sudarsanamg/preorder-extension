import type { DiscountType } from "@prisma/client";
export async function applyDiscountToVariants(
  admin: any,
  variantIds: string[],
  discountType: DiscountType,
  discountValue: number,
  flatDiscount: number,
  keepCompareAt = true
) {
  const updatedVariants: any[] = [];

  for (const variantId of variantIds) {
    try {
      // 1. Fetch current variant data
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
      const basePrice = parseFloat(variant.compareAtPrice || variant.price);
      let newPrice = basePrice;
      console.log({ basePrice, discountType, discountValue });

      if (discountType === "FIXED" && discountValue < basePrice) {
        newPrice = basePrice - flatDiscount;
      } else if (discountType === "PERCENTAGE") {
        newPrice = basePrice - (discountValue / 100) * basePrice;
      }

      if (newPrice < 0) newPrice = 0;

      // 3. Only set compareAtPrice if missing
      const compareAtPrice =
        keepCompareAt && !variant.compareAtPrice
          ? basePrice.toFixed(2)
          : variant.compareAtPrice || null;

      // 4. Mutation
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
            price: newPrice.toFixed(2),
            compareAtPrice,
          },
        ],
      };

      const mutationRes = await admin.graphql(mutation, { variables });
      const mutationJson = await mutationRes.json();

      const errors = mutationJson.data?.productVariantsBulkUpdate?.userErrors || [];
      if (errors.length > 0) {
        console.error("User Errors:", errors);
      } else {
        updatedVariants.push(
          mutationJson.data?.productVariantsBulkUpdate?.productVariants[0]
        );
      }
    } catch (err) {
      console.error(`Error updating variant ${variantId}:`, err);
    }
  }

  console.log("✅ Updated Variants:", JSON.stringify(updatedVariants, null, 2));
  return updatedVariants;
}
