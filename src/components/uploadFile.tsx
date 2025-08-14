import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileUpIcon } from "lucide-react";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { readerJEF } from "@/formats/jef/readerJEF";
import { validateFile } from "@/helpers/validateUploadFile.helper";
import { readerDST } from "@/formats/dst/readerDST";
import { readerEXP } from "@/formats/exp/readerEXP";
import { readerPES } from "@/formats/pes/readerPES";
import { readerXXX } from "@/formats/xxx/readerXXX";

export const UploadFile = () => {
  const [file, setFile] = useState<File | null>(null);
  const embroideryStore = useEmbroideryStore();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const currentFile = e.target.files?.[0];
    if (!currentFile) return;

    if (!validateFile(currentFile)) return;

    setFile(currentFile);
  };

  const handleSubmit = (e: { preventDefault: () => void }) => {
    e.preventDefault();

    if (!file) return;
    const extension = file.name.toLowerCase().split(".").pop();

    switch (extension) {
      case "pes":
        readerPES(file).then((data) => {
          embroideryStore.updateSource({
            geometries: data.lines,
            colorGroup: data.colorGroup,
            file_details: data.file_details,
          });
        });

        setFile(null);
        break;
      case "xxx":
        readerXXX(file).then((data) => {
          embroideryStore.updateSource({
            geometries: data.lines,
            colorGroup: data.colorGroup,
            file_details: data.file_details,
          });
        });

        setFile(null);
        break;
      case "exp":
        readerEXP(file).then((data) => {
          embroideryStore.updateSource({
            geometries: data.lines,
            colorGroup: data.colorGroup,
            file_details: data.file_details,
          });
        });

        setFile(null);
        break;
      case "jef":
        readerJEF(file).then((data) => {
          embroideryStore.updateSource({
            geometries: data.lines,
            colorGroup: data.colorGroup,
            file_details: data.file_details,
          });
          setFile(null);
        });
        break;
      case "dst":
        readerDST(file).then((data) => {
          embroideryStore.updateSource({
            geometries: data.lines,
            colorGroup: data.colorGroup,
            file_details: data.file_details,
          });

          setFile(null);
        });
        break;
      default:
        alert("Unsupported file format. Please upload a JEF, DST or EXP file.");
        return;
    }
  };

  return (
    <Card className="py-2">
      {/* <CardHeader className="px-2">
        <CardTitle>Upload a File</CardTitle>
        <CardDescription>
          Select a file to upload and click the submit button.
        </CardDescription>
      </CardHeader> */}
      <CardContent className="px-2">
        <form onSubmit={handleSubmit} className="grid gap-2 select-none">
          {file && (
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-xs">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(2)} KB
                </p>
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
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  DST JEF EXP XXX PES (MAX. SIZE 1MB)
                </p>
              </div>
              <input
                accept=".jef,.JEF,.dst,.DST,.exp,.EXP,.pes,.PES"
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
