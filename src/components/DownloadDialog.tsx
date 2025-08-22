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
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { ImageDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "./ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { formSchema, type TypeFormSchema } from "@/validations/download.validation";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";

export const DownloadDialog = () => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ImageDown /> Download
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Download your design</DialogTitle>
          <DialogDescription>
            Choose the format to export your embroidery design (PNG, JPG, WEBP or SVG) and save it to your device.
          </DialogDescription>
        </DialogHeader>
        <Separator className="my-2" />

        <DownloadForm />
      </DialogContent>
    </Dialog>
  );
};

// TODO : implemnte backgroud color picker
const DownloadForm = () => {
  const EmbStore = useEmbroideryStore();
  const EmbViewer = useEmbroideryViewer();

  const form = useForm<TypeFormSchema>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file_name: EmbStore.filesDetails?.name || "",
      select_format: "svg",
    },
  });

  const onSubmit = (data: TypeFormSchema) => {
    EmbStore.save({ filesDetails: { name: data.file_name } });
    EmbViewer.downloadScreenshot({
      format: data.select_format,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="file_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input {...field} />
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
                    <SelectValue placeholder="Select your license type..." />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="svg">SVG</SelectItem>
                  <SelectItem value="png">PNG</SelectItem>
                  <SelectItem value="jpeg">JPEG</SelectItem>
                  <SelectItem value="webp">WEBP</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>SVG is recommended for the best quality.</FormDescription>
              <FormDescription>Vector formats maintain perfect sharpness at any size and can be edited in professional software.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <DialogFooter className="mt-6">
          <DialogClose asChild>
            <Button variant="outline" disabled={EmbViewer.isExporting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" disabled={EmbViewer.isExporting}>
            Download
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
