import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  Download,
  MoreHorizontal,
  Plus,
  Search,
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
import bag from "./assets/product-4.svg";
import jacket from "./assets/product-6.svg";
import shoes from "./assets/product-3.svg";
import shirt from "./assets/product-1.svg";
import headphones from "./assets/product-8.svg";
import "./surge-dashboard.css";
import "./manifest-dashboard.css";

import type { SurgeDashboardProps } from "./surge-dashboard";

export interface ManifestDashboardProps extends SurgeDashboardProps {
  categoriesHref: string;
}

// Snapshot values from the public Manifest demo, not a reporting service model.
const metrics = [
  { title: "Revenue", value: "$15K", change: "0.8%", previous: "$15K", down: false },
  { title: "Orders", value: "23", change: "0%", previous: "23", down: false },
  { title: "Avg order value", value: "$644.02", change: "0.8%", previous: "$639.09", down: false },
  { title: "Units sold", value: "94", change: "13%", previous: "108", down: true },
];
const categories = [
  { name: "Outerwear", revenue: "$4.1K", units: 17, image: jacket, change: "239.7%", down: false },
  { name: "Bags", revenue: "$2.8K", units: 15, image: bag, change: "7.1%", down: false },
  { name: "Denim", revenue: "$2.0K", units: 12, image: jacket, change: "42.8%", down: true },
  { name: "Footwear", revenue: "$1.8K", units: 10, image: shoes, change: "35.7%", down: true },
  { name: "Activewear", revenue: "$1.4K", units: 14, image: shirt, change: "21.5%", down: true },
  { name: "Apparel", revenue: "$1.0K", units: 15, image: shirt, change: "3.1%", down: true },
  {
    name: "Accessories",
    revenue: "$397",
    units: 11,
    image: headphones,
    change: "22.5%",
    down: true,
  },
];
const stockFilters = ["All products", "In stock", "Low stock", "Out of stock"];

function status(product: SurgeDashboardProps["products"][number]) {
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
    <Frame
      dense
      className={`manifest-dashboard-panel ${className}`}
      role="region"
      aria-label={title}
    >
      <FrameHeader className="manifest-dashboard-panel-header">
        <div>
          <FrameTitle>{title}</FrameTitle>
          <FrameDescription>{description}</FrameDescription>
        </div>
        {action}
      </FrameHeader>
      <FramePanel fit className="manifest-dashboard-panel-body">
        {children}
      </FramePanel>
    </Frame>
  );
}

export function ManifestDashboard({
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
  categoriesHref,
  onViewCategory,
  onExport,
  reporting,
}: ManifestDashboardProps) {
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
    <section className="manifest-dashboard" aria-label="Store dashboard">
      <div className="manifest-dashboard-heading">
        <h1>Welcome to {storeName}</h1>
        <div className="manifest-dashboard-heading-actions">
          <SurgeReportingPeriodControl model={reporting} />
          <Button variant="outline" onClick={onExport}>
            <Download data-icon="inline-start" aria-hidden="true" />
            Export
          </Button>
          <Button asChild>
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
            >
              <Plus data-icon="inline-start" aria-hidden="true" />
              New product
            </a>
          </Button>
        </div>
      </div>
      <div className="manifest-dashboard-metrics">
        {metrics.map((metric) => (
          <Frame
            dense
            key={metric.title}
            className="manifest-dashboard-metric"
            role="region"
            aria-label={metric.title}
          >
            <FrameHeader className="manifest-dashboard-metric-header">
              <FrameTitle>{metric.title}</FrameTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`${metric.title} options`}>
                    <MoreHorizontal />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="reui-reference manifest-dashboard-metric-menu"
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
            <FramePanel fit className="manifest-dashboard-metric-body">
              <div className="manifest-dashboard-metric-value">
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
      <div className="manifest-dashboard-overview">
        <DashboardPanel
          title="Inventory velocity"
          description="Units sold per category"
          className="manifest-dashboard-velocity"
          action={
            <Badge variant="destructive-light" size="sm">
              <TrendingDown aria-hidden="true" />
              13.0%
            </Badge>
          }
        >
          <BusinessBars
            large
            values={[11, 14, 15, 15, 12, 10, 17]}
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
          className="manifest-dashboard-categories"
          action={
            <Button variant="outline" size="sm" asChild>
              <a
                href={categoriesHref}
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
                  onViewCategories();
                }}
              >
                View all
              </a>
            </Button>
          }
        >
          {categories.map((category) => (
            <Button
              key={category.name}
              variant="ghost"
              className="manifest-dashboard-category"
              onClick={() => onViewCategory(category.name)}
            >
              <span className="manifest-dashboard-category-label">
                <img src={category.image} alt="" />
                <span>
                  <strong>{category.name}</strong>
                  <small>
                    {category.revenue} · {category.units} units
                  </small>
                </span>
              </span>
              <Badge variant={category.down ? "destructive-light" : "success-light"} size="sm">
                {category.down ? (
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
        className="manifest-dashboard-inventory"
        action={
          <div className="manifest-dashboard-inventory-actions">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={query ? "secondary" : "ghost"}
                  size="icon-sm"
                  aria-label="Search products"
                >
                  <Search aria-hidden="true" />
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="end"
                className="reui-reference manifest-stock-search-popover"
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
        <div className="manifest-dashboard-stock-tools">
          <div className="manifest-dashboard-stock-tabs-scroll">
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
          paginationControls={{ sizes: [5, 10, 20], className: "manifest-dashboard-pagination" }}
          scrollArea="horizontal"
          className="manifest-dashboard-grid"
          fields={[
            {
              id: "product",
              title: "Product",
              value: (product) => product.name,
              size: 300,
              render: (product) => (
                <Button
                  variant="link"
                  className="manifest-dashboard-product"
                  onClick={() => onOpenProduct(product)}
                >
                  <img src={product.image} alt="" />
                  <span>
                    <strong>{product.name}</strong>
                    <small>{product.sku}</small>
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
                <strong className="manifest-dashboard-price">${product.price}</strong>
              ),
            },
            {
              id: "stock",
              title: "Stock",
              value: (product) => product.stock,
              size: 110,
              render: (product) => (
                <strong className="manifest-dashboard-stock">{product.stock}</strong>
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
              value: () => "",
              size: 130,
              render: () => <span aria-label="Rating unavailable">—</span>,
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
          <div className="manifest-dashboard-empty">
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
