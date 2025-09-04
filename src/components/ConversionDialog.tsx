import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { RefreshCcwDot } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ConversionFormSchema, type TypeConversionFormSchema } from "@/validations/conversion.validation";
import { EmbroideryManager } from "@/formats/EmbroideryManager";
import { FORMAT_EMBROIDERY } from "@/types/embroidery.types";
import { downloadBlob } from "@/helpers/downloadBlob.helper";

export const ConversionDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <RefreshCcwDot /> Conversion
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Embroidery file conversion</DialogTitle>
          <DialogDescription>Convert your design to specific machine formats: JEF, PES, DST, EXP and save it for production.</DialogDescription>
        </DialogHeader>
        <Separator className="my-2" />

        <ConversionForm />
      </DialogContent>
    </Dialog>
  );
};

const ConversionForm = () => {
  const form = useForm<TypeConversionFormSchema>({
    resolver: zodResolver(ConversionFormSchema),
    defaultValues: {
      file: undefined,
      file_name: "",
      select_format: FORMAT_EMBROIDERY.JEF,
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (data: TypeConversionFormSchema) => {
    // Update file name
    const fileUpdated = new File([data.file], data.file_name + "." + data.select_format, { type: data.file.type });

    const buffer = await new EmbroideryManager().convertFormat(
      fileUpdated,
      data.file.name.split(".").pop()?.toUpperCase() as FORMAT_EMBROIDERY,
      data.select_format
    );

    // Download new file format
    const blob = new Blob([buffer as BlobPart], { type: "application/octet-stream" });
    downloadBlob(blob, fileUpdated.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file, { shouldValidate: true });
      form.setValue("file_name", file.name.substring(0, file.name.lastIndexOf(".")), { shouldValidate: true });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={() => (
            <FormItem>
              <FormLabel>File</FormLabel>

              <FormControl>
                <Input onChange={handleFileChange} type="file" placeholder="No file has been uploaded." accept=".dst,.jef" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="file_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} disabled={!form.getValues("file_name")} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="select_format"
          render={({ field }) => (
            <FormItem className="[&>button]:w-full">
              <FormLabel>Format</FormLabel>
              <Select {...field} defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={FORMAT_EMBROIDERY.PES}>{FORMAT_EMBROIDERY.PES}</SelectItem>
                  <SelectItem value={FORMAT_EMBROIDERY.JEF}>{FORMAT_EMBROIDERY.JEF}</SelectItem>
                </SelectContent>
              </Select>
            </FormItem>
          )}
        />
        <Separator className="my-4" />

        <div className="text-muted-foreground text-sm">
          <p>
            Keep in mind <span className="italic text-xs">(This will change in the future)</span>:
          </p>
          <ul className="list-inside list-disc text-sm">
            <li>
              Currently only the conversion of <strong>DST</strong> files to <strong>JEF</strong> is enabled.
            </li>
          </ul>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Converting..." : "Convert"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
