import { Card, Button, ButtonGroup, TextField, Icon } from "@shopify/polaris";
import { DeleteIcon } from "@shopify/polaris-icons";
import { TableSkeleton } from "app/utils/loader/TableSkeleton";

interface Product {
  productId: string;
  variantId: string;
  productImage?: string;
  variantTitle: string;
  productTitle?: string;
  variantInventory?: number;
  inventory?: number;
  maxUnit?: number;
  variantPrice: number;
  image?: string;
}

interface Props {
  products: Product[];
  setProducts: (p: Product[]) => void;

  searchTerm: string;
  setSearchTerm: (val: string) => void;

  campaignType: string; // IN_STOCK | OUT_OF_STOCK | ALWAYS

  mode: "create" | "update";

  removedVariants?: string[];
  setRemovedVariants?: (v: string[]) => void;

  openResourcePicker: () => void;
  handleMaxUnitChange: (variantId: string, val: number) => void;
  handleRemoveProduct: (variantId: string) => void;
  handleDuplication: (variantId: string) => boolean;
  isLoading?: boolean;
  formatCurrency: (value: number, currency: string) => string;
  productsWithPreorderLoader: Boolean;
  storeCurrency?: string;
}

export function CampaignProductTable({
  products,
  setProducts,
  searchTerm,
  setSearchTerm,
  campaignType,
  mode,
  removedVariants,
  setRemovedVariants,
  openResourcePicker,
  handleMaxUnitChange,
  handleRemoveProduct,
  handleDuplication,
  isLoading,
  formatCurrency,
  productsWithPreorderLoader,
  storeCurrency,

}: Props) {
  const filteredProducts = products.filter((p) =>
    p.variantTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.productTitle?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          padding: 10,
          gap: 10,
          alignItems: "center",
        }}
      >
        <TextField
          label="Search products"
          labelHidden
          autoComplete="off"
          placeholder="Search by product name"
          value={searchTerm}
          onChange={setSearchTerm}
        />

        <ButtonGroup noWrap>
          <Button onClick={openResourcePicker}>Add More Products</Button>

          {mode === "create" ? (
            <Button onClick={() => setProducts([])}>Remove all Products</Button>
          ) : (
            <Button
              onClick={() => {
                if (setRemovedVariants) {
                  setRemovedVariants([
                    ...removedVariants!,
                    ...products.map((p) => p.variantId),
                  ]);
                }
                setProducts([]);
              }}
            >
              Remove all Products
            </Button>
          )}
        </ButtonGroup>
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
           <thead>
            <tr>
              <th style={{ padding: 8 }}>Image</th>
              <th style={{ padding: 8 }}>Product</th>
              <th style={{ padding: 8 }}>Inventory</th>
              {campaignType !== "IN_STOCK" && (
                <th style={{ padding: 8 }}>Inventory limit</th>
              )}
              <th style={{ padding: 8 }}>Price</th>
              <th style={{ padding: 8 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {(isLoading || productsWithPreorderLoader) ? (
              
              <TableSkeleton />
            )  : null
            }
            {filteredProducts.length === 0 && (
              <tr>
                <td
                  colSpan={campaignType !== "IN_STOCK" ? 6 : 5}
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "#666",
                    fontSize: 14,
                  }}
                >
                  No products found
                </td>
              </tr>
            )}
            {!productsWithPreorderLoader && filteredProducts.map((product) => (
              <tr
                key={product.variantId}
                style={{
                  backgroundColor: handleDuplication(product.variantId)
                    ? "#ea9898ff"
                    : "",
                  gap: 10,
                  borderBottom: "1px solid #eee",
                }}
              >
                <td style={{ padding: 8, textAlign: "center" }}>
                  {product.productImage || product.image ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <img
                      src={product.productImage || product.image}
                      style={{
                        width: 50,
                        height: 50,
                        objectFit: "cover",
                        borderRadius: 6,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 50,
                        height: 50,
                        background: "#f0f0f0",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        border: "1px solid #ddd",
                        fontSize: 12,
                        color: "#888",
                      }}
                    >
                      No Image
                    </div>
                  )}
                </td>

                <td style={{ padding: 8, textAlign: "center" }}>
                  {product.variantTitle === "Default Title"
                    ? product.productTitle
                    : product.variantTitle}
                </td>

                <td style={{ padding: 8, textAlign: "center" }}>
                  {product.variantInventory
                    ? product.variantInventory
                    : (product.inventory ?? "0")}
                </td>

                {campaignType !== "IN_STOCK" && (
                  <td style={{ padding: 8, textAlign: "center" }}>
                    <TextField
                      label="Inventory limit"
                      labelHidden
                      autoComplete="off"
                      value={String(product.maxUnit ?? "0")}
                      onChange={(val) =>
                        handleMaxUnitChange(product.variantId, Number(val))
                      }
                      autoSize       
                    />
                  </td>
                )}

                <td style={{ padding: 8, textAlign: "center" }}>
                  {formatCurrency(product.variantPrice, storeCurrency || 'USD')}
                </td>

                <td style={{ padding: 8, cursor: "pointer" }}>
                  <div onClick={() => handleRemoveProduct(product.variantId)}>
                    <Icon source={DeleteIcon} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
