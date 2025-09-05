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
import { useEffect } from "react";

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

  const file = form.watch("file");
  const selectedFormat = form.watch("select_format");

  const inputFileFormat = file?.name.split(".").pop()?.toUpperCase() as FORMAT_EMBROIDERY;

  const isSameFormat = inputFileFormat && selectedFormat === inputFileFormat;

  const isSubmitDisabled = !file || isSameFormat || form.formState.isSubmitting;

  useEffect(() => {
    if (file && inputFileFormat) {
      const defaultFormat = inputFileFormat === FORMAT_EMBROIDERY.JEF ? FORMAT_EMBROIDERY.PES : FORMAT_EMBROIDERY.JEF;

      form.setValue("select_format", defaultFormat);
    }
  }, [file, inputFileFormat, form]);

  const onSubmit = async (data: TypeConversionFormSchema) => {
    if (isSameFormat) return;

    const fileUpdated = new File([data.file], data.file_name + "." + data.select_format, {
      type: data.file.type,
    });

    const buffer = await new EmbroideryManager().convertFormat(fileUpdated, inputFileFormat, data.select_format);

    const blob = new Blob([buffer as BlobPart], { type: "application/octet-stream" });
    downloadBlob(blob, fileUpdated.name);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      form.setValue("file", file, { shouldValidate: true });
      form.setValue("file_name", file.name.substring(0, file.name.lastIndexOf(".")), {
        shouldValidate: true,
      });
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
                <Input onChange={handleFileChange} lang="en" type="file" placeholder="No file has been uploaded." accept=".dst" />
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
                <Input {...field} disabled={!file} placeholder={file ? "Enter file name" : "Upload a file first"} />
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
              <FormLabel>Convert to</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={!file}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={file ? "Select format" : "Upload a file first"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem
                    value={FORMAT_EMBROIDERY.PES}
                    disabled={inputFileFormat === FORMAT_EMBROIDERY.PES || inputFileFormat === FORMAT_EMBROIDERY.DST}
                  >
                    {FORMAT_EMBROIDERY.PES}
                    {inputFileFormat === FORMAT_EMBROIDERY.PES && " (Current format)"}
                    {inputFileFormat === FORMAT_EMBROIDERY.DST && " (Coming soon)"}
                  </SelectItem>
                  <SelectItem value={FORMAT_EMBROIDERY.JEF} disabled={inputFileFormat === FORMAT_EMBROIDERY.JEF}>
                    {FORMAT_EMBROIDERY.JEF}
                    {inputFileFormat === FORMAT_EMBROIDERY.JEF && " (Current format)"}
                  </SelectItem>
                  <SelectItem value={FORMAT_EMBROIDERY.DST} disabled={inputFileFormat === FORMAT_EMBROIDERY.DST}>
                    {FORMAT_EMBROIDERY.DST}
                    {inputFileFormat === FORMAT_EMBROIDERY.DST && " (Current format)"}
                  </SelectItem>
                  <SelectItem
                    value={FORMAT_EMBROIDERY.EXP}
                    disabled={inputFileFormat === FORMAT_EMBROIDERY.EXP || inputFileFormat === FORMAT_EMBROIDERY.DST}
                  >
                    {FORMAT_EMBROIDERY.EXP}
                    {inputFileFormat === FORMAT_EMBROIDERY.EXP && " (Current format)"}
                    {inputFileFormat === FORMAT_EMBROIDERY.DST && " (Coming soon)"}
                  </SelectItem>
                </SelectContent>
              </Select>
              {isSameFormat && (
                <FormMessage className="text-destructive">Cannot convert to the same format. Please select a different format.</FormMessage>
              )}
            </FormItem>
          )}
        />

        <Separator className="my-4" />

        <div className="text-muted-foreground text-sm">
          <p>
            Conversion status <span className="italic text-xs">(Real-time updates)</span>:
          </p>
          <ul className="list-inside list-disc text-sm">
            <li className={inputFileFormat === FORMAT_EMBROIDERY.DST ? "text-green-600" : ""}>
              <strong>DST</strong> → JEF
            </li>
            <li className={inputFileFormat === FORMAT_EMBROIDERY.JEF ? "text-green-600" : ""}>
              <strong>JEF</strong> → Coming soon
            </li>
            <li className={inputFileFormat === FORMAT_EMBROIDERY.PES ? "text-green-600" : ""}>
              <strong>PES</strong> → Coming soon
            </li>
            <li className="text-gray-400">
              <strong>EXP</strong> → Coming soon
            </li>
          </ul>
        </div>

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={form.formState.isSubmitting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isSubmitDisabled} className={isSameFormat ? "bg-gray-400 cursor-not-allowed" : ""}>
            {form.formState.isSubmitting ? "Converting..." : "Convert"}
            {isSameFormat && " (Select different format)"}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
