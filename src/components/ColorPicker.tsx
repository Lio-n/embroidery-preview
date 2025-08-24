import { forwardRef, useMemo, useState } from "react";
import { HexColorPicker } from "react-colorful";
import { cn } from "@/lib/utils";
import { Button, buttonVariants } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import type { VariantProps } from "class-variance-authority";
import { useForwardedRef } from "@/lib/use-forwarded-ref";
import { CheckIcon } from "lucide-react";

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}
type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

const ColorPicker = forwardRef<HTMLInputElement, Omit<ButtonProps, "value" | "onChange" | "onBlur"> & ColorPickerProps & ButtonProps>(
  ({ disabled, value, onChange, onBlur, name, className, size, ...props }, forwardedRef) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);
    const [color, setColor] = useState(value);

    const parsedValue = useMemo(() => {
      return color || "#FFFFFF";
    }, [color]);

    return (
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn("block size-7", className)}
            name={name}
            onClick={() => {
              setOpen(true);
            }}
            size={size}
            style={{
              backgroundColor: parsedValue,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full">
          <HexColorPicker color={parsedValue} onChange={setColor} className="mb-2" />
          <div className="relative">
            <Input
              maxLength={7}
              onChange={(e) => {
                if (e?.currentTarget?.value) setColor(e?.currentTarget?.value);
              }}
              ref={ref}
              value={parsedValue}
              className="pr-10"
            />
            <button
              disabled={color.length !== 7 || value === color}
              onClick={() => {
                onChange(color);
              }}
              className="disabled:opacity-50 disabled:cursor-not-allowed absolute right-1 top-1/2 -translate-y-1/2 bg-primary text-primary-foreground hover:bg-primary/90 h-6 w-6 p-0 rounded-md flex items-center justify-center transition-colors"
              title="Apply color"
            >
              <CheckIcon className="h-4 w-4" />
            </button>
          </div>
        </PopoverContent>
      </Popover>
    );
  }
);
ColorPicker.displayName = "ColorPicker";

export { ColorPicker };
