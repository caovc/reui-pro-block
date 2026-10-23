import type { CatalogProduct } from "./catalog-data";
import { useFileUpload } from "@/hooks/use-file-upload";
import { BusinessGrid } from "./grid";
import { useState } from "react";
import { Plus, X, SlidersHorizontal } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button, Input, Panel, exportCsv } from "./shared";
import { Choice, Tone } from "./fidelity";
import shirt from "./assets/product-1.svg";
export function ProductCatalog({
  products,
  onCreate,
  onEdit,
}: {
  products: CatalogProduct[];
  onCreate: () => void;
  onEdit: (p: CatalogProduct) => void;
}) {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All statuses");
  const [filters, setFilters] = useState(false);
  const shown = products.filter(
    (p) =>
      (p.name + " " + p.vendor).toLowerCase().includes(q.toLowerCase()) &&
      (status === "All statuses" || status === p.status),
  );
  return (
    <>
      <div className="bt-heading">
        <h1>
          Products <span className="bt-count">{products.length}</span>
        </h1>
        <div className="bt-actions">
          <Button
            variant="outline"
            onClick={() =>
              exportCsv("products", [
                ["Product", "Vendor", "Category", "Stock", "Price", "Status"],
                ...products.map((p) => [
                  p.name,
                  p.vendor,
                  p.category,
                  String(p.stock),
                  p.price,
                  p.status,
                ]),
              ])
            }
          >
            Export
          </Button>
          <Button onClick={onCreate}>
            <Plus />
            New product
          </Button>
        </div>
      </div>
      <section className="bt-catalog">
        <div className="bt-catalog-filter">
          <Button variant="outline" onClick={() => setFilters(!filters)}>
            <SlidersHorizontal />
            Filters
          </Button>
          <span>Product contains</span>
          <Input
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
            }}
            placeholder="Name or vendor..."
            aria-label="Name or vendor"
          />
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Clear product search"
            onClick={() => setQ("")}
          >
            <X />
          </Button>
          {filters && (
            <Choice
              label="Product status"
              value={status}
              onChange={setStatus}
              options={["All statuses", "Active", "Draft", "Scheduled"]}
            />
          )}
          <Button
            className="ml-auto"
            variant="ghost"
            onClick={() => {
              setQ("");
              setStatus("All statuses");
            }}
          >
            Clear
          </Button>
        </div>
        <BusinessGrid
          headers={["Product", "Category", "Inventory", "Price", "Status"]}
          selectable
          pageSize={8}
          rows={shown.map((p) => [
            <button key="product" className="bt-product-name text-left" onClick={() => onEdit(p)}>
              <img className="bt-product-image" src={p.image} alt="" />
              <span>
                {p.name}
                <small className="bt-table-sub">{p.vendor}</small>
              </span>
            </button>,
            p.category,
            <span key="inventory">
              {p.stock.toLocaleString()} in stock
              <small className="bt-table-sub">{p.variants} variants</small>
            </span>,
            p.price,
            <Tone
              key="status"
              tone={p.status === "Active" ? "green" : p.status === "Draft" ? "amber" : "blue"}
            >
              {p.status}
            </Tone>,
          ])}
          onRow={(i) => onEdit(shown[i])}
        />
      </section>
    </>
  );
}
export function ProductEditor({
  product,
  onCancel,
  onSave,
}: {
  product?: CatalogProduct;
  onCancel: () => void;
  onSave: (p: CatalogProduct) => void;
}) {
  const [title, setTitle] = useState(product?.name ?? "");
  const [status, setStatus] = useState(product?.status ?? "Draft");
  const [subtitle, setSubtitle] = useState(product?.subtitle ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [productType, setProductType] = useState(product?.productType ?? "Physical");
  const [collections, setCollections] = useState(product?.collections ?? "");
  const [tags, setTags] = useState(product?.tags ?? "");
  const [media, setMedia] = useState(
    product?.media ?? (product ? [{ src: product.image, name: "Product image" }] : []),
  );
  const [variantsEdited, setVariantsEdited] = useState(false);
  const [category, setCategory] = useState(product?.category ?? "Apparel");
  const [vendor, setVendor] = useState(product?.vendor ?? "Manifest Atelier");
  const [variants, setVariants] = useState<
    { color: string; size: string; sku: string; price: string; inventory: string }[]
  >(product?.variantRows ?? []);
  const [{ files, isDragging, errors }, upload] = useFileUpload({
    multiple: true,
    accept: "image/*",
    maxSize: 10 * 1024 * 1024,
  });
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        const uploaded = await Promise.all(
          files
            .filter((entry) => entry.file instanceof File)
            .map(async (entry) => ({
              name: entry.file.name,
              src: await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(String(reader.result));
                reader.onerror = () => reject(reader.error);
                reader.readAsDataURL(entry.file as File);
              }),
            })),
        );
        const allMedia = [...media, ...uploaded];
        const image = allMedia[0]?.src ?? shirt;
        const prices = variants.map((variant) => Number(variant.price || 0));
        const variantPrice = prices.length
          ? Math.min(...prices) === Math.max(...prices)
            ? `$${Math.min(...prices)}`
            : `$${Math.min(...prices)} – $${Math.max(...prices)}`
          : "$0";
        onSave({
          name: title,
          subtitle,
          description,
          productType,
          collections,
          tags,
          media: allMedia,
          vendor,
          category,
          status,
          stock: variants.length
            ? variants.reduce((s, v) => s + Number(v.inventory || 0), 0)
            : variantsEdited
              ? 0
              : (product?.stock ?? 0),
          variants: variants.length || (variantsEdited ? 0 : product?.variants || 0),
          price: variantsEdited ? variantPrice : (product?.price ?? variantPrice),
          image,
          variantRows: variants,
        });
      }}
    >
      <div className="bt-heading mb-4">
        <h1>{product ? "Edit product" : "New product"}</h1>
        <div className="bt-actions">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={!title.trim()}>
            {product ? "Save changes" : "Create product"}
          </Button>
        </div>
      </div>
      <div className="bt-product-editor">
        <div className="bt-stack">
          <Panel title="General">
            <label className="bt-editor-row">
              <span>
                Title<small>Storefront display name.</small>
              </span>
              <Input
                aria-label="Title"
                placeholder="e.g. AeroFlex Runner"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </label>
            <label className="bt-editor-row">
              <span>
                Subtitle<small>A short tagline under the title.</small>
              </span>
              <Input
                aria-label="Subtitle"
                placeholder="Optional"
                value={subtitle}
                onChange={(event) => setSubtitle(event.target.value)}
              />
            </label>
            <label className="bt-editor-row">
              <span>
                Description<small>Sales copy for the product page.</small>
              </span>
              <Textarea
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                aria-label="Description"
                placeholder="Responsive knit running shoe with a cushioned midsole..."
                rows={4}
              />
            </label>
          </Panel>
          <Panel title="Media">
            <div
              className="bt-dropzone"
              data-dragging={isDragging}
              onDragEnter={upload.handleDragEnter}
              onDragLeave={upload.handleDragLeave}
              onDragOver={upload.handleDragOver}
              onDrop={upload.handleDrop}
            >
              <input className="hidden" {...upload.getInputProps()} />
              <Button type="button" variant="outline" size="sm" onClick={upload.openFileDialog}>
                <Plus />
                Add files
              </Button>
              <span>
                {files.length
                  ? files.map((f) => f.file.name).join(", ")
                  : "Drop product photos here or click to browse."}
              </span>
            </div>
            {errors.map((x) => (
              <p className="text-destructive text-xs" role="alert" key={x}>
                {x}
              </p>
            ))}
            {media.length > 0 && (
              <div className="bt-upload-previews">
                {media.map((item, index) => (
                  <div key={`${item.name}-${index}`}>
                    <img src={item.src} alt={item.name} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove existing media ${index + 1}`}
                      onClick={() => setMedia((current) => current.filter((_, i) => i !== index))}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {files.length > 0 && (
              <div className="bt-upload-previews">
                {files.map((f) => (
                  <div key={f.id}>
                    <img src={f.preview} alt={f.file.name} />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={"Remove " + f.file.name}
                      onClick={() => upload.removeFile(f.id)}
                    >
                      <X />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </Panel>
          <Panel title="Variants">
            <div className="flex justify-end mb-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setVariantsEdited(true);
                  setVariants((v) => [
                    ...v,
                    { color: "", size: "", sku: "", price: "", inventory: "" },
                  ]);
                }}
              >
                <Plus />
                Add variant
              </Button>
            </div>
            {variants.length ? (
              <BusinessGrid
                headers={["Color", "Size", "SKU", "Price", "Inventory", ""]}
                className="bt-product-variant-grid"
                rows={variants.map((variant, index) => [
                  ...(["color", "size", "sku", "price", "inventory"] as const).map((key) => (
                    <Input
                      key={key}
                      aria-label={`Variant ${index + 1} ${key}`}
                      type={key === "price" || key === "inventory" ? "number" : "text"}
                      min={0}
                      step={key === "price" ? "0.01" : undefined}
                      value={variant[key]}
                      onChange={(event) => {
                        setVariantsEdited(true);
                        setVariants((current) =>
                          current.map((row, rowIndex) =>
                            rowIndex === index ? { ...row, [key]: event.target.value } : row,
                          ),
                        );
                      }}
                    />
                  )),
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    key="remove"
                    aria-label={`Remove variant ${index + 1}`}
                    onClick={() => {
                      setVariantsEdited(true);
                      setVariants((current) => current.filter((_, rowIndex) => rowIndex !== index));
                    }}
                  >
                    <X />
                  </Button>,
                ])}
              />
            ) : (
              <div className="bt-empty">
                {product?.variants && !variantsEdited
                  ? `${product.variants} existing variants · ${product.stock.toLocaleString()} in stock. Existing inventory is retained when saving.`
                  : "No variants yet. Add one to get started."}
              </div>
            )}
          </Panel>
        </div>
        <div className="bt-stack">
          <Panel title="Status">
            <Choice
              label="Status"
              value={status}
              onChange={setStatus}
              options={["Draft", "Active", "Scheduled"]}
            />
          </Panel>
          <Panel title="Organization">
            <div className="bt-form">
              <label>
                Category
                <Choice
                  label="Category"
                  value={category}
                  onChange={setCategory}
                  options={[
                    "Apparel",
                    "Accessories",
                    "Activewear",
                    "Bags",
                    "Denim",
                    "Footwear",
                    "Outerwear",
                  ]}
                />
              </label>
              <label>
                Type
                <Choice
                  label="Type"
                  value={productType}
                  onChange={setProductType}
                  options={["Physical", "Digital"]}
                />
              </label>
              <label>
                Vendor
                <Input
                  aria-label="Vendor"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                />
              </label>
              <label>
                Collections
                <Input
                  aria-label="Collections"
                  placeholder="Add a collection"
                  value={collections}
                  onChange={(event) => setCollections(event.target.value)}
                />
              </label>
              <label>
                Tags
                <Input
                  aria-label="Tags"
                  placeholder="Add a tag"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                />
              </label>
            </div>
          </Panel>
        </div>
      </div>
    </form>
  );
}
