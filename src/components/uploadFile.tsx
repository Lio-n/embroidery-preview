import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpIcon } from "lucide-react";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { validateFile } from "@/helpers/validateUploadFile.helper";
import { readerEmbroideryFormats } from "@/formats/reader";
import type { SuportFormats } from "@/types/embroidery.types";

export const UploadFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const EmbStore = useEmbroideryStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentFile = e.target.files?.[0];
    if (!currentFile) return;

    if (!validateFile(currentFile)) return;

    setFile(currentFile);
  };

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();
    if (!extension) return;

    try {
      const res = await readerEmbroideryFormats(extension as SuportFormats, file);

      EmbStore.updateSource({
        geometries: res.lines,
        ...res,
      });

      setFile(null);
    } catch (error) {
      console.error("Error :", error);
    }
  };

  return (
    <Card className="py-2">
      <CardContent className="px-2">
        <form onSubmit={handleSubmit} className="grid gap-2 select-none">
          {file && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
              <Button type="submit" className="text-xs cursor-pointer">
                Upload
              </Button>
            </div>
          )}
          <div className="flex items-center justify-center w-full">
            <label
              htmlFor="dropzone-file"
              className="flex flex-col items-center justify-center w-full border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center py-4">
                <FileUpIcon className="size-5 " />

                <p className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Click to upload</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">DST JEF EXP XXX PES (MAX. SIZE 1MB)</p>
              </div>
              <input
                accept=".jef,.JEF,.dst,.DST,.exp,.EXP,.pes,.PES,.xxx,.XXX"
                id="dropzone-file"
                type="file"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
