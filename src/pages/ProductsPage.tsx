import { useState, Fragment, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { formatCurrency, generateSkuCode } from "../lib/utils";
import { Plus, Edit, Trash2, ChevronDown, ChevronRight, Check, X, Upload, Download } from "lucide-react";
import { ImageUpload } from "../components/ui/ImageUpload";
import { SkeletonTable } from "../components/ui/Skeleton";

interface ImportRow {
  name: string;
  brand: string;
  category: string;
  description?: string;
  sku?: string;
  barcode?: string;
  sizeMl: number;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  lowStockThreshold: number;
  expiryDate?: number;
  isTester: boolean;
}

const CSV_TEMPLATE_HEADERS = "name,brand,category,description,sku,sizeMl,costPrice,sellingPrice,stockQuantity,lowStockThreshold,barcode,expiryDate,isTester";
const CSV_TEMPLATE_EXAMPLE = "Eros EDT,Versace,EDT,Fresh masculine scent,,100,2500,4500,10,5,,,false";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    if (line[i] === '"') { inQuotes = !inQuotes; }
    else if (line[i] === "," && !inQuotes) { result.push(current); current = ""; }
    else { current += line[i]; }
  }
  result.push(current);
  return result;
}

function parseCSV(text: string): { rows: ImportRow[]; errors: string[] } {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return { rows: [], errors: ["File must have a header row and at least one data row."] };
  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase().replace(/\s/g, ""));
  const rows: ImportRow[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const vals = parseCSVLine(lines[i]).map((v) => v.trim());
    const get = (col: string) => vals[headers.indexOf(col.toLowerCase())] ?? "";
    const name = get("name");
    const brand = get("brand");
    const category = get("category");
    const sizeMlVal = parseFloat(get("sizeMl") || get("sizeml")) || 0;
    if (!name || !brand || !category) {
      errors.push(`Row ${i + 1}: name, brand, and category are required.`);
      continue;
    }
    if (sizeMlVal <= 0) {
      errors.push(`Row ${i + 1}: sizeMl must be a positive number.`);
      continue;
    }
    const expiryStr = get("expiryDate") || get("expirydate");
    rows.push({
      name,
      brand,
      category,
      description: get("description") || undefined,
      sku: get("sku") || undefined,
      barcode: get("barcode") || undefined,
      sizeMl: sizeMlVal,
      costPrice: parseFloat(get("costPrice") || get("costprice")) || 0,
      sellingPrice: parseFloat(get("sellingPrice") || get("sellingprice")) || 0,
      stockQuantity: parseInt(get("stockQuantity") || get("stockquantity")) || 0,
      lowStockThreshold: parseInt(get("lowStockThreshold") || get("lowstockthreshold")) || 5,
      expiryDate: expiryStr ? new Date(expiryStr).getTime() : undefined,
      isTester: (get("isTester") || get("istester")).toLowerCase() === "true",
    });
  }
  return { rows, errors };
}

function downloadTemplate() {
  const content = `${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE}`;
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "products_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

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
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("q") ?? "");

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) setSearch(q);
  }, [searchParams]);
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
  const bulkImport = useMutation(api.products.bulkImport);
  const seedProducts = useMutation(api.seed.seedProducts);
  const [seeding, setSeeding] = useState(false);

  // Bulk import state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importRows, setImportRows] = useState<ImportRow[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState("");
  const [importResult, setImportResult] = useState<string | null>(null);


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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError("");
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const { rows, errors } = parseCSV(text);
      if (errors.length > 0) {
        setImportError(errors.join("\n"));
        setImportRows([]);
      } else {
        setImportRows(rows);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleImport = async () => {
    if (importRows.length === 0) return;
    setImportLoading(true);
    setImportError("");
    try {
      const result = await bulkImport({ rows: importRows });
      setImportResult(`Successfully imported ${result.imported} variant${result.imported !== 1 ? "s" : ""}.`);
      setImportRows([]);
    } catch (e: unknown) {
      setImportError(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImportLoading(false);
    }
  };

  const brandOptions = (brands ?? []).map((b) => ({ value: b._id, label: b.name }));
  const categoryOptions = (categories ?? []).map((c) => ({ value: c._id, label: c.name }));

  return (
    <AdminLayout title="Products">
      <div className="mb-4 space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <SearchInput
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full sm:w-56"
          />
          <div className="flex gap-2 w-full sm:w-auto flex-wrap">
            {products?.length === 0 && (
              <Button
                variant="secondary"
                onClick={async () => { setSeeding(true); try { await seedProducts({}); } finally { setSeeding(false); } }}
                loading={seeding}
                className="flex-1 sm:flex-none border-[#1E1B3A] text-[#1E1B3A]"
              >
                Load Catalogue
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setShowImportModal(true); setImportRows([]); setImportError(""); setImportResult(null); }} className="flex-1 sm:flex-none">
              <Upload size={16} /> Import CSV
            </Button>
            <Button onClick={openAdd} className="flex-1 sm:flex-none">
              <Plus size={16} /> Add Product
            </Button>
          </div>
        </div>
        <div className="flex gap-2">
          <Select
            options={[{ value: "", label: "All Brands" }, ...brandOptions]}
            value={filterBrand}
            onChange={(e) => setFilterBrand(e.target.value)}
            className="flex-1"
          />
          <Select
            options={[{ value: "", label: "All Categories" }, ...categoryOptions]}
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="flex-1"
          />
        </div>
      </div>

      {!products ? (
        <SkeletonTable rows={6} cols={6} />
      ) : filtered.length === 0 ? (
        <EmptyState message="No products found." action={{ label: "Add Product", onClick: openAdd }} />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[#E0E0E0] rounded-md overflow-hidden">
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
                  <Fragment key={product._id}>
                    <TableRow>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setExpandedProduct(expandedProduct === product._id ? null : product._id)}
                            className="text-[#9B9B9B] hover:text-[#1E1B3A] transition-colors"
                          >
                            {expandedProduct === product._id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                          <span className="font-medium text-[#1E1B3A]">{product.name}</span>
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
                                <span className="w-20 text-[#9B9B9B]">Min: {v.lowStockThreshold}</span>
                                <StockBadge quantity={v.stockQuantity} threshold={v.lowStockThreshold} />
                                {v.isTester && <Badge variant="info">Tester</Badge>}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((product) => (
              <div key={product._id} className="bg-white border border-[#E0E0E0] rounded-md p-4">
                <div className="flex items-start gap-3">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-14 h-14 rounded object-cover flex-shrink-0 bg-[#F7F7F7]" />
                  ) : (
                    <div className="w-14 h-14 rounded bg-[#F7F7F7] flex-shrink-0 flex items-center justify-center">
                      <span className="text-xs text-[#9B9B9B]">IMG</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#1E1B3A] truncate">{product.name}</p>
                    <p className="text-xs text-[#9B9B9B]">{product.brandName} · {product.categoryName}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="default">{product.variantCount} variant{product.variantCount !== 1 ? "s" : ""}</Badge>
                      <StatusBadge status={product.isActive ? "active" : "inactive"} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-[#F0F0F0]">
                  <button onClick={() => openEdit(product)} className="flex-1 text-sm text-[#2563EB] py-1.5 border border-[#E0E0E0] rounded-md">Edit</button>
                  <button onClick={() => setDeleteId(product._id)} className="flex-1 text-sm text-[#DC2626] py-1.5 border border-[#E0E0E0] rounded-md">Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Product Form Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingId ? "Edit Product" : "Add Product"} maxWidth="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input label="Product Name *" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="e.g. Eros EDT" />

            {/* Brand field with quick-add */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <label className="text-sm font-medium text-[#1E1B3A]">Brand *</label>
                {!showAddBrand && (
                  <button
                    type="button"
                    onClick={() => { setShowAddBrand(true); setNewBrandName(""); }}
                    className="ml-auto flex items-center gap-1 text-sm text-[#1E1B3A] hover:text-[#2D2A5E] font-medium"
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
                <label className="text-sm font-medium text-[#1E1B3A]">Category *</label>
                {!showAddCategory && (
                  <button
                    type="button"
                    onClick={() => { setShowAddCategory(true); setNewCategoryName(""); }}
                    className="ml-auto flex items-center gap-1 text-sm text-[#1E1B3A] hover:text-[#2D2A5E] font-medium"
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

            <ImageUpload
              label="Product Image (optional)"
              value={productForm.imageUrl}
              onChange={(url) => setProductForm({ ...productForm, imageUrl: url })}
            />
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
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
        title="Delete Product"
        message="This will permanently delete the product and all its variants. This cannot be undone."
        confirmLabel="Delete"
        loading={loading}
      />

      {/* Bulk Import Modal */}
      <Modal isOpen={showImportModal} onClose={() => setShowImportModal(false)} title="Import Products from CSV" maxWidth="lg">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-[#6B6B6B]">Upload a CSV file to bulk-create products and variants.</p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-1 text-sm text-[#1E1B3A] hover:underline font-medium"
            >
              <Download size={14} /> Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-[#E0E0E0] rounded-md p-6 text-center">
            <Upload size={24} className="mx-auto text-[#9B9B9B] mb-2" />
            <p className="text-sm text-[#6B6B6B] mb-2">Select a CSV file to import</p>
            <label className="btn-primary px-4 py-2 text-sm cursor-pointer inline-block">
              Choose File
              <input type="file" accept=".csv,text/csv" className="hidden" onChange={handleFileSelect} />
            </label>
          </div>

          <div className="bg-[#F7F7F7] rounded-md p-3 text-xs text-[#6B6B6B]">
            <p className="font-medium mb-1">Required columns: <span className="font-mono">name, brand, category, sizeMl, sellingPrice</span></p>
            <p>Optional: <span className="font-mono">description, sku, barcode, costPrice, stockQuantity, lowStockThreshold, expiryDate, isTester</span></p>
            <p className="mt-1">Brands and categories are created automatically if they don't exist. One row = one variant.</p>
          </div>

          {importError && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-[#DC2626] whitespace-pre-line">
              {importError}
            </div>
          )}

          {importResult && (
            <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-[#16A34A]">
              {importResult}
            </div>
          )}

          {importRows.length > 0 && (
            <div>
              <p className="text-sm font-medium text-[#6B6B6B] mb-2">{importRows.length} row{importRows.length !== 1 ? "s" : ""} ready to import</p>
              <div className="border border-[#E0E0E0] rounded-md overflow-x-auto max-h-48">
                <table className="w-full text-xs">
                  <thead className="bg-[#F7F7F7]">
                    <tr>
                      {["Name", "Brand", "Category", "Size (ml)", "Cost", "Price", "Stock"].map((h) => (
                        <th key={h} className="text-left px-3 py-2 font-medium text-[#6B6B6B] whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {importRows.slice(0, 50).map((r, i) => (
                      <tr key={i} className="border-t border-[#F0F0F0]">
                        <td className="px-3 py-1.5 font-medium">{r.name}</td>
                        <td className="px-3 py-1.5">{r.brand}</td>
                        <td className="px-3 py-1.5">{r.category}</td>
                        <td className="px-3 py-1.5">{r.sizeMl}</td>
                        <td className="px-3 py-1.5">{r.costPrice}</td>
                        <td className="px-3 py-1.5">{r.sellingPrice}</td>
                        <td className="px-3 py-1.5">{r.stockQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {importRows.length > 50 && (
                  <p className="text-xs text-[#9B9B9B] px-3 py-2">…and {importRows.length - 50} more rows</p>
                )}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowImportModal(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleImport} loading={importLoading} disabled={importRows.length === 0} className="flex-1">
              Import {importRows.length > 0 ? `${importRows.length} Row${importRows.length !== 1 ? "s" : ""}` : ""}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
