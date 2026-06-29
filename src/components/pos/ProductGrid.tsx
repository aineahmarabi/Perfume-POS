import { useState, useRef } from "react";
import type React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";
import type { CartItem } from "../../hooks/useCart";
import { SearchInput } from "../ui/SearchInput";
import { useDebounce } from "../../hooks/useDebounce";
import { formatCurrency } from "../../lib/utils";
import { cn } from "../../lib/utils";
import { Package } from "lucide-react";

interface ProductGridProps {
  onAddItem: (item: Omit<CartItem, "quantity" | "discount" | "lineTotal">) => void;
  searchRef?: React.RefObject<HTMLInputElement | null>;
}

export function ProductGrid({ onAddItem, searchRef }: ProductGridProps) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const internalRef = useRef<HTMLInputElement>(null);
  const resolvedRef = searchRef ?? internalRef;

  const debouncedSearch = useDebounce(search, 200);

  const products = useQuery(api.products.list, { activeOnly: true });
  const categories = useQuery(api.categories.list, { activeOnly: true });
  const brands = useQuery(api.brands.list, { activeOnly: true });

  const filtered = (products ?? []).filter((p) => {
    const searchMatch =
      !debouncedSearch ||
      p.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.brandName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      p.variants.some((v) => v.sku.toLowerCase().includes(debouncedSearch.toLowerCase()));

    const categoryMatch =
      selectedCategory === "all" ||
      p.categoryId === selectedCategory;

    const brandMatch =
      selectedBrand === "all" ||
      p.brandId === selectedBrand;

    return searchMatch && categoryMatch && brandMatch;
  });

  const handleProductClick = (product: typeof filtered[0]) => {
    const activeVariants = product.variants.filter((v) => !v.isTester && v.isActive);
    if (activeVariants.length === 0) return;

    if (activeVariants.length === 1) {
      const v = activeVariants[0];
      if (v.stockQuantity <= 0) return;
      onAddItem({
        variantId: v._id as Id<"productVariants">,
        productId: product._id as Id<"products">,
        productName: product.name,
        brandName: product.brandName,
        sizeMl: v.sizeMl,
        sku: v.sku,
        unitPrice: v.sellingPrice,
        maxStock: v.stockQuantity,
      });
      return;
    }

    setExpandedProduct(expandedProduct === product._id ? null : product._id);
  };

  const handleVariantSelect = (
    product: typeof filtered[0],
    variantId: Id<"productVariants">
  ) => {
    const v = product.variants.find((v) => v._id === variantId);
    if (!v || v.stockQuantity <= 0) return;
    onAddItem({
      variantId: v._id as Id<"productVariants">,
      productId: product._id as Id<"products">,
      productName: product.name,
      brandName: product.brandName,
      sizeMl: v.sizeMl,
      sku: v.sku,
      unitPrice: v.sellingPrice,
      maxStock: v.stockQuantity,
    });
    setExpandedProduct(null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Filters */}
      <div className="p-3 border-b border-[#E0E0E0] space-y-2 flex-shrink-0">
        <SearchInput
          ref={resolvedRef}
          placeholder="Search by name, brand, or SKU... (F1)"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full"
        />
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedCategory("all")}
            className={cn(
              "flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-100",
              selectedCategory === "all"
                ? "bg-[#3432a8] text-white border-[#3432a8]"
                : "bg-white text-[#6B6B6B] border-[#E0E0E0] hover:border-[#3432a8]"
            )}
          >
            All
          </button>
          {(categories ?? []).map((cat) => (
            <button
              key={cat._id}
              onClick={() => setSelectedCategory(selectedCategory === cat._id ? "all" : cat._id)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 text-sm font-medium rounded border transition-colors duration-100",
                selectedCategory === cat._id
                  ? "bg-[#3432a8] text-white border-[#3432a8]"
                  : "bg-white text-[#6B6B6B] border-[#E0E0E0] hover:border-[#3432a8]"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
        {(brands ?? []).length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              onClick={() => setSelectedBrand("all")}
              className={cn(
                "flex-shrink-0 px-2.5 py-1 text-sm rounded border transition-colors duration-100",
                selectedBrand === "all"
                  ? "bg-[#F0F0F0] text-[#3432a8] border-[#E0E0E0] font-medium"
                  : "bg-white text-[#9B9B9B] border-[#E0E0E0] hover:text-[#3432a8]"
              )}
            >
              All Brands
            </button>
            {(brands ?? []).map((brand) => (
              <button
                key={brand._id}
                onClick={() => setSelectedBrand(selectedBrand === brand._id ? "all" : brand._id)}
                className={cn(
                  "flex-shrink-0 px-2.5 py-1 text-sm rounded border transition-colors duration-100",
                  selectedBrand === brand._id
                    ? "bg-[#F0F0F0] text-[#3432a8] border-[#3432a8] font-medium"
                    : "bg-white text-[#9B9B9B] border-[#E0E0E0] hover:text-[#3432a8]"
                )}
              >
                {brand.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Package size={32} className="text-[#9B9B9B] mb-2" strokeWidth={1.5} />
            <p className="text-sm text-[#6B6B6B]">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {filtered.map((product) => {
              const activeVariants = product.variants.filter(
                (v) => !v.isTester && v.isActive
              );
              const minPrice = Math.min(...activeVariants.map((v) => v.sellingPrice));
              const totalStock = activeVariants.reduce((sum, v) => sum + v.stockQuantity, 0);
              const isOutOfStock = totalStock <= 0;
              const isExpanded = expandedProduct === product._id;

              return (
                <div key={product._id} className="flex flex-col">
                  <button
                    onClick={() => handleProductClick(product)}
                    disabled={isOutOfStock}
                    className={cn(
                      "text-left p-3 rounded-md border transition-all duration-100",
                      isOutOfStock
                        ? "opacity-40 cursor-not-allowed bg-[#F7F7F7] border-[#E0E0E0]"
                        : "bg-white border-[#E0E0E0] hover:border-[#3432a8] hover:shadow-sm active:scale-[0.98]"
                    )}
                  >
                    <div className="aspect-square bg-[#F7F7F7] rounded mb-2 flex items-center justify-center">
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="h-full w-full object-contain rounded"
                        />
                      ) : (
                        <Package size={24} className="text-[#9B9B9B]" strokeWidth={1.5} />
                      )}
                    </div>
                    <p className="text-sm text-[#9B9B9B] truncate">{product.brandName}</p>
                    <p className="text-sm font-medium text-[#3432a8] leading-tight truncate">{product.name}</p>
                    <p className="text-sm font-semibold font-mono tabular-nums text-[#3432a8] mt-1">
                      {activeVariants.length > 1 ? "From " : ""}{formatCurrency(minPrice)}
                    </p>
                    {isOutOfStock && (
                      <span className="text-sm text-[#DC2626] font-medium">Out of Stock</span>
                    )}
                    {!isOutOfStock && activeVariants.length > 1 && (
                      <span className="text-sm text-[#2563EB]">{activeVariants.length} sizes</span>
                    )}
                  </button>

                  {/* Variant popover */}
                  {isExpanded && activeVariants.length > 1 && (
                    <div className="mt-1 bg-white border border-[#3432a8] rounded-md p-2 space-y-1 shadow-sm">
                      <p className="text-sm font-medium text-[#6B6B6B] px-1 pb-1">Select size:</p>
                      {activeVariants.map((v) => (
                        <button
                          key={v._id}
                          onClick={() => handleVariantSelect(product, v._id as Id<"productVariants">)}
                          disabled={v.stockQuantity <= 0}
                          className={cn(
                            "w-full flex justify-between items-center px-2 py-1.5 rounded text-sm transition-colors",
                            v.stockQuantity <= 0
                              ? "opacity-40 cursor-not-allowed"
                              : "hover:bg-[#F7F7F7]"
                          )}
                        >
                          <span className="font-medium">{v.sizeMl}ml</span>
                          <span className="font-mono tabular-nums">{formatCurrency(v.sellingPrice)}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
