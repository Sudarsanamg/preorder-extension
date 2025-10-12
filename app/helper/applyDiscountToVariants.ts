type DiscountType = "none" | "percentage" | "flat";

export async function applyDiscountToVariants(
  admin: any,
  variantIds: string[],
  discountType: DiscountType,
  discountValue: number,
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
      console.log("Variant Query Response:", JSON.stringify(responseJson, null, 2));

      const variant = responseJson.data?.productVariant;
      if (!variant) throw new Error(`Variant not found: ${variantId}`);

      const productId = variant.product.id;
      const originalPrice = parseFloat(variant.price);
      let newPrice = originalPrice;
      console.log(`Original Price for variant ${variantId}: $${originalPrice}`);
      console.log(`Applying ${discountType} discount of value: ${discountValue}`);

      // 2. Calculate discounted price
      if (discountType === "flat" && discountValue < originalPrice) {
        newPrice = originalPrice - discountValue;
      } else if (discountType === "percentage") {
        newPrice = originalPrice - (discountValue / 100) * originalPrice;
      }

      console.log(`New Price for variant ${variantId}: $${newPrice}`);

      if (newPrice < 0) newPrice = 0;

      const compareAtPrice = keepCompareAt ? originalPrice.toFixed(2) : null;

      // 3. Update variant using bulk mutation
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

      console.log("Mutation Variables:", JSON.stringify(variables, null, 2));

      const mutationRes = await admin.graphql(mutation, { variables });
      const mutationJson = await mutationRes.json();

      console.log("Mutation Response:", JSON.stringify(mutationJson, null, 2));

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
