import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useBrand, verticalColor, verticalLabel } from "@/lib/brand-context";

const BrandSwitcher = () => {
  const { brand, brands, switchBrand } = useBrand();
  if (!brand) return null;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-medium">
          <span className="h-2 w-2 rounded-full" style={{ background: verticalColor(brand.vertical) }} />
          {brand.name}
          <ChevronsUpDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 p-1">
        <p className="px-2 py-1.5 text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
          Switch brand
        </p>
        {brands.map((b) => (
          <button
            key={b.id}
            onClick={() => switchBrand(b.id)}
            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: verticalColor(b.vertical) }} />
            <span className="flex-1 text-left">
              <span className="font-medium">{b.name}</span>
              <span className="ml-2 text-xs text-muted-foreground">{verticalLabel(b.vertical)}</span>
            </span>
            {b.id === brand.id && <Check className="h-4 w-4" />}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default BrandSwitcher;
