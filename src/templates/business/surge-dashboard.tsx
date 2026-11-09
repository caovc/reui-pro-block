import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  Frame,
  FrameDescription,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "@/components/reui/frame";
import { Badge } from "@/components/reui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DomainRecordGrid } from "@/blocks/data/grid-advanced-model-grid";
import { BusinessBars } from "./charts";
import { SurgeReportingPeriodControl } from "./surge-date-range";
import type { SurgeReportingPeriodModel } from "./surge-reporting-period";
import bag from "./assets/product-4.svg";
import jacket from "./assets/product-6.svg";
import shoes from "./assets/product-3.svg";
import shirt from "./assets/product-1.svg";
import headphones from "./assets/product-8.svg";
import "./surge-dashboard.css";

export interface SurgeDashboardProduct {
  name: string;
  sku: string;
  category: string;
  price: number;
  stock: number;
  image: string;
}

export interface SurgeDashboardProps {
  storeName: string;
  products: SurgeDashboardProduct[];
  filter: string;
  onFilterChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  newProductHref: string;
  onCreateProduct: () => void;
  onOpenProduct: (product: SurgeDashboardProduct) => void;
  onViewCategories: () => void;
  onViewCategory: (name: string) => void;
  onExport: () => void;
  reporting: SurgeReportingPeriodModel;
}

const metrics = [
  { title: "Revenue", value: "$20K", change: "63.7%", previous: "$12K", down: false },
  { title: "Orders", value: "33", change: "120%", previous: "15", down: false },
  { title: "Avg order value", value: "$598.81", change: "25.6%", previous: "$804.59", down: true },
  { title: "Units sold", value: "132", change: "59%", previous: "83", down: false },
];
const categories = [
  { name: "Bags", revenue: "$3.9K", units: 21, image: bag, change: "90.9%" },
  { name: "Outerwear", revenue: "$3.8K", units: 17, image: jacket, change: "55.8%" },
  { name: "Footwear", revenue: "$3.2K", units: 19, image: shoes, change: "70.7%" },
  { name: "Denim", revenue: "$3.0K", units: 18, image: jacket, change: "20.6%" },
  { name: "Activewear", revenue: "$2.1K", units: 22, image: shirt, change: "119.1%" },
  { name: "Apparel", revenue: "$1.7K", units: 23, image: shirt, change: "141.1%" },
  { name: "Accessories", revenue: "$432", units: 12, image: headphones, change: "27.3%" },
];
const stockFilters = ["All products", "In stock", "Low stock", "Out of stock"];

function status(product: SurgeDashboardProduct) {
  return product.stock === 0 ? "Out of stock" : product.stock < 40 ? "Low stock" : "In stock";
}

function DashboardPanel({
  title,
  description,
  action,
  className = "",
  children,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Frame dense className={`surge-dashboard-panel ${className}`} role="region" aria-label={title}>
      <FrameHeader className="surge-dashboard-panel-header">
        <div>
          <FrameTitle>{title}</FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </div>
        {action}
      </FrameHeader>
      <FramePanel fit className="surge-dashboard-panel-body">
        {children}
      </FramePanel>
    </Frame>
  );
}

export function SurgeDashboard({
  storeName,
  products,
  filter,
  onFilterChange,
  query,
  onQueryChange,
  newProductHref,
  onCreateProduct,
  onOpenProduct,
  onViewCategories,
  onViewCategory,
  onExport,
  reporting,
}: SurgeDashboardProps) {
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 5 });
  const visible = products.filter(
    (product) =>
      (filter === "All products" || status(product) === filter) &&
      `${product.name} ${product.sku} ${product.category}`
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  function resetPage() {
    setPagination((current) => ({ ...current, pageIndex: 0 }));
  }
  return (
    <section className="surge-dashboard" aria-label="Store dashboard">
      <div className="surge-dashboard-heading">
        <h1>Welcome to {storeName}</h1>
        <div className="surge-dashboard-heading-actions">
          <SurgeReportingPeriodControl model={reporting} />
          <Button variant="outline" onClick={onExport}>
            <Download data-icon="inline-start" aria-hidden="true" />
            Export
          </Button>
          <Button
            render={
              <a
                href={newProductHref}
                onClick={(event) => {
                  if (
                    event.button !== 0 ||
                    event.metaKey ||
                    event.ctrlKey ||
                    event.shiftKey ||
                    event.altKey
                  )
                    return;
                  event.preventDefault();
                  onCreateProduct();
                }}
              />
            }
          >
            <Plus data-icon="inline-start" aria-hidden="true" />
            New product
          </Button>
        </div>
      </div>
      <div className="surge-dashboard-metrics">
        {metrics.map((metric) => (
          <Frame
            dense
            key={metric.title}
            className="surge-dashboard-metric"
            role="region"
            aria-label={metric.title}
          >
            <FrameHeader className="surge-dashboard-metric-header">
              <FrameTitle>{metric.title}</FrameTitle>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="ghost" size="icon-sm" aria-label={`${metric.title} options`} />
                  }
                >
                  <MoreHorizontal />
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="reui-reference surge-dashboard-metric-menu"
                >
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigator.clipboard.writeText(metric.value).then(
                        () => toast.success(`${metric.title} copied`),
                        () => toast.error("Could not copy the value"),
                      );
                    }}
                  >
                    Copy value
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onSelect={() => {
                      void navigator.clipboard
                        .writeText(
                          `${metric.title}: ${metric.value}; previous period: ${metric.previous}`,
                        )
                        .then(
                          () => toast.success(`${metric.title} summary copied`),
                          () => toast.error("Could not copy the summary"),
                        );
                    }}
                  >
                    Copy summary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </FrameHeader>
            <FramePanel fit className="surge-dashboard-metric-body">
              <div className="surge-dashboard-metric-value">
                <strong>{metric.value}</strong>
                <Badge variant={metric.down ? "destructive-light" : "success-light"} size="sm">
                  {metric.down ? <ArrowDown aria-hidden="true" /> : <ArrowUp aria-hidden="true" />}
                  {metric.change}
                </Badge>
              </div>
              <Separator />
              <p>
                Vs previous period: <strong>{metric.previous}</strong>
              </p>
            </FramePanel>
          </Frame>
        ))}
      </div>
      <div className="surge-dashboard-overview">
        <DashboardPanel
          title="Inventory velocity"
          description="Units sold per category"
          className="surge-dashboard-velocity"
          action={
            <Badge variant="success-light" size="sm">
              <TrendingUp aria-hidden="true" />
              59.0%
            </Badge>
          }
        >
          <BusinessBars
            large
            values={[12, 22, 23, 21, 18, 19, 17]}
            labels={[
              "Accessories",
              "Activewear",
              "Apparel",
              "Bags",
              "Denim",
              "Footwear",
              "Outerwear",
            ]}
          />
        </DashboardPanel>
        <DashboardPanel
          title="Top categories"
          description="By revenue"
          className="surge-dashboard-categories"
          action={
            <Button variant="outline" size="sm" onClick={onViewCategories}>
              View all
            </Button>
          }
        >
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="ghost"
              className="surge-dashboard-category"
              onClick={() => onViewCategory(category.name)}
            >
              <span className="surge-dashboard-category-label">
                <img src={category.image} alt="" />
                <span>
                  <strong>{category.name}</strong>
                  <small>
                    {category.revenue} · {category.units} units
                  </small>
                </span>
              </span>
              <Badge
                variant={category.name === "Accessories" ? "destructive-light" : "success-light"}
                size="sm"
              >
                {category.name === "Accessories" ? (
                  <TrendingDown aria-hidden="true" />
                ) : (
                  <TrendingUp aria-hidden="true" />
                )}
                {category.change}
              </Badge>
            </Button>
          ))}
        </DashboardPanel>
      </div>
      <DashboardPanel
        title="Inventory stocks"
        description="Across every location"
        className="surge-dashboard-inventory"
        action={
          <div className="surge-dashboard-inventory-actions">
            <Popover>
              <PopoverTrigger
                render={
                  <Button
                    variant={query ? "secondary" : "ghost"}
                    size="icon-sm"
                    aria-label="Search products"
                  />
                }
              >
                <Search aria-hidden="true" />
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="reui-reference surge-stock-search-popover"
                aria-label="Search inventory products"
              >
                <Input
                  aria-label="Search products"
                  placeholder="Search products..."
                  value={query}
                  onChange={(event) => {
                    onQueryChange(event.target.value);
                    resetPage();
                  }}
                />
                {query && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      onQueryChange("");
                      resetPage();
                    }}
                  >
                    Clear search
                  </Button>
                )}
              </PopoverContent>
            </Popover>
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download data-icon="inline-start" aria-hidden="true" />
              Export
            </Button>
          </div>
        }
      >
        <div className="surge-dashboard-stock-tools">
          <div className="surge-dashboard-stock-tabs-scroll">
            <Tabs
              value={filter}
              onValueChange={(next) => {
                onFilterChange(next);
                resetPage();
              }}
            >
              <TabsList variant="line" aria-label="Inventory stock filters">
                {stockFilters.map((name) => (
                  <TabsTrigger key={name} value={name}>
                    {name}
                    <Badge variant="secondary" size="sm">
                      {name === "All products"
                        ? products.length
                        : products.filter((product) => status(product) === name).length}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </div>
        <Separator />
        <DomainRecordGrid
          data={visible}
          getRowId={(product) => product.sku}
          pagination={pagination}
          onPaginationChange={setPagination}
          paginationControls={{ sizes: [5, 10, 20], className: "surge-dashboard-pagination" }}
          scrollArea="horizontal"
          className="surge-dashboard-grid"
          fields={[
            {
              id: "product",
              title: "Product",
              value: (product) => product.name,
              size: 300,
              render: (product) => (
                <Button
                  variant="link"
                  className="surge-dashboard-product"
                  onClick={() => onOpenProduct(product)}
                >
                  <img src={product.image} alt="" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku} · Maven & Co.</small>
                  </span>
                </Button>
              ),
            },
            {
              id: "category",
              title: "Category",
              value: (product) => product.category,
              size: 145,
              render: (product) => (
                <Badge variant="secondary" size="sm">
                  {product.category}
                </Badge>
              ),
            },
            {
              id: "price",
              title: "Price",
              value: (product) => product.price,
              size: 120,
              render: (product) => (
                <strong className="surge-dashboard-price">${product.price}</strong>
              ),
            },
            {
              id: "stock",
              title: "Stock",
              value: (product) => product.stock,
              size: 110,
              render: (product) => (
                <strong className="surge-dashboard-stock">{product.stock}</strong>
              ),
            },
            {
              id: "status",
              title: "Status",
              value: status,
              size: 140,
              render: (product) => (
                <Badge
                  size="sm"
                  variant={
                    product.stock === 0
                      ? "destructive-light"
                      : product.stock < 40
                        ? "warning-light"
                        : "success-light"
                  }
                >
                  {status(product)}
                </Badge>
              ),
            },
            {
              id: "rating",
              title: "Rating",
              value: () => 5,
              size: 130,
              render: () => (
                <span className="surge-dashboard-rating" aria-label="5 out of 5 stars">
                  {[0, 1, 2, 3, 4].map((star) => (
                    <Star key={star} aria-hidden="true" />
                  ))}
                </span>
              ),
            },
            {
              id: "actions",
              title: "",
              header: () => null,
              value: (product) => product.sku,
              size: 40,
              render: (product) => (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Open actions for ${product.name}`}
                  onClick={() => onOpenProduct(product)}
                >
                  <MoreHorizontal />
                </Button>
              ),
            },
          ]}
        />
        {!visible.length && (
          <div className="surge-dashboard-empty">
            <Button
              variant="outline"
              onClick={() => {
                onQueryChange("");
                onFilterChange("All products");
                resetPage();
              }}
            >
              Reset filters
            </Button>
          </div>
        )}
      </DashboardPanel>
    </section>
  );
}
