import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { AdminLayout } from "../components/layout/AdminLayout";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge, StockBadge, StatusBadge } from "../components/ui/Badge";
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from "../components/ui/Table";
import { SearchInput } from "../components/ui/SearchInput";
import { EmptyState } from "../components/ui/EmptyState";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { formatCurrency, generateSkuCode } from "../lib/utils";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Check, X } from "lucide-react";

interface VariantForm {
  id?: string;
  sku: string;
  barcode: string;
  sizeMl: number;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate: string;
  isTester: boolean;
}

interface ProductForm {
  name: string;
  brandId: string;
  categoryId: string;
  description: string;
  imageUrl: string;
}

const emptyVariant = (): VariantForm => ({
  sku: "",
  barcode: "",
  sizeMl: 100,
  costPrice: 0,
  sellingPrice: 0,
  stockQuantity: 0,
  lowStockThreshold: 5,
  expiryDate: "",
  isTester: false,
});

export function ProductsPage() {
  const [search, setSearch] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [expandedProduct, setExpandedProduct] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // Quick-add brand inline
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);

  // Quick-add category inline
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [addingCategory, setAddingCategory] = useState(false);

  const [productForm, setProductForm] = useState<ProductForm>({
    name: "", brandId: "", categoryId: "", description: "", imageUrl: "",
  });
  const [variants, setVariants] = useState<VariantForm[]>([emptyVariant()]);

  const products = useQuery(api.products.list, {});
  const brands = useQuery(api.brands.list, { activeOnly: true });
  const categories = useQuery(api.categories.list, { activeOnly: true });

  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const removeProduct = useMutation(api.products.remove);
  const createVariant = useMutation(api.products.createVariant);
  const updateVariant = useMutation(api.products.updateVariant);
  const createBrand = useMutation(api.brands.create);
  const createCategory = useMutation(api.categories.create);


  const filtered = (products ?? []).filter((p) => {
    const s = search.toLowerCase();
    const nameMatch = !s || p.name.toLowerCase().includes(s) || p.brandName.toLowerCase().includes(s);
    const brandMatch = !filterBrand || p.brandId === filterBrand;
    const catMatch = !filterCategory || p.categoryId === filterCategory;
    return nameMatch && brandMatch && catMatch;
  });

  const openAdd = () => {
    setEditingId(null);
    setProductForm({ name: "", brandId: "", categoryId: "", description: "", imageUrl: "" });
    setVariants([emptyVariant()]);
    setFormError("");
    setShowAddBrand(false);
    setShowAddCategory(false);
    setShowModal(true);
  };

  const openEdit = (product: typeof filtered[0]) => {
    setEditingId(product._id);
    setProductForm({
      name: product.name,
      brandId: product.brandId,
      categoryId: product.categoryId,
      description: product.description ?? "",
      imageUrl: product.imageUrl ?? "",
    });
    setVariants(
      product.variants.map((v) => ({
        id: v._id,
        sku: v.sku,
        barcode: v.barcode ?? "",
        sizeMl: v.sizeMl,
        costPrice: v.costPrice,
        sellingPrice: v.sellingPrice,
        stockQuantity: v.stockQuantity,
        lowStockThreshold: v.lowStockThreshold,
        expiryDate: v.expiryDate ? new Date(v.expiryDate).toISOString().split("T")[0] : "",
        isTester: v.isTester,
      }))
    );
    setFormError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!productForm.name || !productForm.brandId || !productForm.categoryId) {
      setFormError("Name, brand and category are required");
      return;
    }
    if (variants.length === 0) {
      setFormError("At least one variant is required");
      return;
    }
    setLoading(true);
    setFormError("");
    try {
      if (editingId) {
        await updateProduct({
          id: editingId as Id<"products">,
          name: productForm.name,
          brandId: productForm.brandId as Id<"brands">,
          categoryId: productForm.categoryId as Id<"categories">,
          description: productForm.description || undefined,
          imageUrl: productForm.imageUrl || undefined,
          isActive: true,
        });
        for (const v of variants) {
          const payload = {
            sku: v.sku || generateSkuCode(productForm.name, productForm.name, v.sizeMl),
            barcode: v.barcode || undefined,
            sizeMl: v.sizeMl,
            costPrice: v.costPrice,
            sellingPrice: v.sellingPrice,
            stockQuantity: v.stockQuantity,
            lowStockThreshold: v.lowStockThreshold,
            expiryDate: v.expiryDate ? new Date(v.expiryDate).getTime() : undefined,
            isTester: v.isTester,
          };
          if (v.id) {
            await updateVariant({ id: v.id as Id<"productVariants">, ...payload, isActive: true });
          } else {
            await createVariant({ productId: editingId as Id<"products">, ...payload });
          }
        }
      } else {
        const productId = await createProduct({
          name: productForm.name,
          brandId: productForm.brandId as Id<"brands">,
          categoryId: productForm.categoryId as Id<"categories">,
          description: productForm.description || undefined,
          imageUrl: productForm.imageUrl || undefined,
        });
        const brand = (brands ?? []).find((b) => b._id === productForm.brandId);
        for (const v of variants) {
          await createVariant({
            productId: productId as Id<"products">,
            sku: v.sku || generateSkuCode(brand?.name ?? "", productForm.name, v.sizeMl),
            barcode: v.barcode || undefined,
            sizeMl: v.sizeMl,
            costPrice: v.costPrice,
            sellingPrice: v.sellingPrice,
            stockQuantity: v.stockQuantity,
            lowStockThreshold: v.lowStockThreshold,
            expiryDate: v.expiryDate ? new Date(v.expiryDate).getTime() : undefined,
            isTester: v.isTester,
          });
        }
      }
      setShowModal(false);
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setLoading(true);
    try {
      await removeProduct({ id: deleteId as Id<"products"> });
      setDeleteId(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBrand = async () => {
    if (!newBrandName.trim()) return;
    setAddingBrand(true);
    try {
      const id = await createBrand({ name: newBrandName.trim() });
      setProductForm((f) => ({ ...f, brandId: id as string }));
      setNewBrandName("");
      setShowAddBrand(false);
    } finally {
      setAddingBrand(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;
    setAddingCategory(true);
    try {
      const id = await createCategory({ name: newCategoryName.trim() });
      setProductForm((f) => ({ ...f, categoryId: id as string }));
      setNewCategoryName("");
      setShowAddCategory(false);
    } finally {
      setAddingCategory(false);
    }
  };

  const brandOptions = (brands ?? []).map((b) => ({ value: b._id, label: b.name }));
  const categoryOptions = (categories ?? []).map((c) => ({ value: c._id, label: c.name }));

  return (
    <AdminLayout title="Products">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <SearchInput
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-56"
        />
        <Select
          options={[{ value: "", label: "All Brands" }, ...brandOptions]}
          value={filterBrand}
          onChange={(e) => setFilterBrand(e.target.value)}
          className="flex-1 sm:w-36 sm:flex-none"
        />
        <Select
          options={[{ value: "", label: "All Categories" }, ...categoryOptions]}
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="flex-1 sm:w-36 sm:flex-none"
        />
        <div className="flex-1" />
        <Button onClick={openAdd}>
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {!products ? (
        <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <EmptyState message="No products found." action={{ label: "Add Product", onClick: openAdd }} />
      ) : (
        <div className="bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <TableHeader>Product</TableHeader>
                <TableHeader>Brand</TableHeader>
                <TableHeader>Category</TableHeader>
                <TableHeader align="center">Variants</TableHeader>
                <TableHeader align="center">Status</TableHeader>
                <TableHeader align="right">Actions</TableHeader>
              </tr>
            </TableHead>
            <TableBody>
              {filtered.map((product) => (
                <>
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                          className="text-[#9B9B9B] hover:text-[#6B1A2A] transition-colors"
                        >
                          {expandedProduct === product._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                        <span className="font-medium text-[#6B1A2A]">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{product.brandName}</TableCell>
                    <TableCell>{product.categoryName}</TableCell>
                    <TableCell align="center">
                      <Badge variant="default">{product.variantCount}</Badge>
                    </TableCell>
                    <TableCell align="center">
                      <StatusBadge status={product.isActive ? "active" : "inactive"} />
                    </TableCell>
                    <TableCell align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(product)} className="btn-icon hover:bg-[#F0F0F0]">
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteId(product._id)}
                          className="btn-icon hover:bg-red-50 hover:text-[#DC2626] transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                  {expandedProduct === product._id && (
                    <tr className="bg-[#F7F7F7]">
                      <td colSpan={6} className="px-8 py-3">
                        <div className="space-y-1">
                          <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B] mb-2">Variants</p>
                          {product.variants.map((v) => (
                            <div key={v._id} className="flex items-center gap-6 text-sm py-1 border-b border-[#E0E0E0] last:border-0">
                              <span className="font-mono text-sm w-40">{v.sku}</span>
                              <span className="w-16">{v.sizeMl}ml</span>
                              <span className="font-mono w-28">{formatCurrency(v.sellingPrice)}</span>
                              <span className="w-20">Stock: {v.stockQuantity}</span>
                              <StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} />
                              {v.isTester && <Badge variant="info">Tester</Badge>}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Product Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Product" : "Add Product"} maxWidth="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input label="Product Name *" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Eros EDT" />

            {/* Brand field with quick-add */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-[#6B1A2A]">Brand *</label>
                {!showAddBrand && (
                  <button
                    type="button"
                    onClick={() => { setShowAddBrand(true); setNewBrandName(""); }}
                    className="ml-auto flex items-center gap-1 text-sm text-[#6B1A2A] hover:text-[#4a1020] font-medium"
                    title="Add new brand"
                  >
                    <Plus size={13} /> New
                  </button>
                )}
              </div>
              {showAddBrand ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddBrand(); if (e.key === "Escape") setShowAddBrand(false); }}
                    placeholder="Brand name..."
                    className="input-base flex-1"
                  />
                  <button type="button" onClick={handleAddBrand} disabled={addingBrand || !newBrandName.trim()} className="btn-primary px-2.5">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setShowAddBrand(false)} className="btn-secondary px-2.5">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Select options={brandOptions} value={productForm.brandId} onChange={(e) => setProductForm({ ...productForm, brandId: e.target.value })} placeholder="Select brand" />
              )}
            </div>

            {/* Category field with quick-add */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-[#6B1A2A]">Category *</label>
                {!showAddCategory && (
                  <button
                    type="button"
                    onClick={() => { setShowAddCategory(true); setNewCategoryName(""); }}
                    className="ml-auto flex items-center gap-1 text-sm text-[#6B1A2A] hover:text-[#4a1020] font-medium"
                    title="Add new category"
                  >
                    <Plus size={13} /> New
                  </button>
                )}
              </div>
              {showAddCategory ? (
                <div className="flex gap-1">
                  <input
                    autoFocus
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddCategory(); if (e.key === "Escape") setShowAddCategory(false); }}
                    placeholder="Category name..."
                    className="input-base flex-1"
                  />
                  <button type="button" onClick={handleAddCategory} disabled={addingCategory || !newCategoryName.trim()} className="btn-primary px-2.5">
                    <Check size={14} />
                  </button>
                  <button type="button" onClick={() => setShowAddCategory(false)} className="btn-secondary px-2.5">
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <Select options={categoryOptions} value={productForm.categoryId} onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })} placeholder="Select category" />
              )}
            </div>

            <Input label="Image URL (optional)" value={productForm.imageUrl} onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })} placeholder="https://..." />
          </div>
          <Input label="Description (optional)" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Fragrance description..." />

          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium uppercase tracking-wider text-[#6B6B6B]">Variants</p>
              <Button size="sm" variant="secondary" onClick={() => setVariants([...variants, emptyVariant()])}>
                <Plus size={14} /> Add Variant
              </Button>
            </div>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {variants.map((v, i) => (
                <div key={i} className="border border-[#E0E0E0] rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[#6B6B6B]">Variant {i + 1}</span>
                    {variants.length > 1 && (
                      <button onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-[#DC2626] hover:text-[#b91c1c] text-sm">Remove</button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input label="SKU" value={v.sku} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, sku: e.target.value } : x))} placeholder="Auto-generated" />
                    <Input label="Size (ml)" type="number" value={v.sizeMl} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, sizeMl: parseFloat(e.target.value) || 0 } : x))} />
                    <Input label="Barcode (optional)" value={v.barcode} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, barcode: e.target.value } : x))} />
                    <Input label="Cost Price (KES)" type="number" value={v.costPrice} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, costPrice: parseFloat(e.target.value) || 0 } : x))} />
                    <Input label="Selling Price (KES)" type="number" value={v.sellingPrice} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, sellingPrice: parseFloat(e.target.value) || 0 } : x))} />
                    <Input label="Stock Qty" type="number" value={v.stockQuantity} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, stockQuantity: parseInt(e.target.value) || 0 } : x))} />
                    <Input label="Low Stock Threshold" type="number" value={v.lowStockThreshold} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, lowStockThreshold: parseInt(e.target.value) || 5 } : x))} />
                    <Input label="Expiry Date (optional)" type="date" value={v.expiryDate} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, expiryDate: e.target.value } : x))} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={v.isTester} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, isTester: e.target.checked } : x))} className="rounded" />
                    Tester (not for sale)
                  </label>
                </div>
              ))}
            </div>
          </div>

          {formError && <p className="text-sm text-[#DC2626]">{formError}</p>}
          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} loading={loading} className="flex-1">
              {editingId ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Deactivate Product"
        message="This will hide the product from the POS. Stock data is preserved."
        confirmLabel="Deactivate"
        loading={loading}
      />
    </AdminLayout>
  );
}
