import type { SuportFormats } from "@/types/embroidery.types";
import { DSTReader } from "./DST.reader";
import { blobToData } from "@/helpers/processBuffer.helper";
import type { Stitch_Block } from "./interface";
import { JEFWriter } from "./JEF.writer";
import { downloadBlob } from "@/helpers/downloadBlob.helper";

export const writerEmbroideryFormats = async (extension: SuportFormats, file: File): Promise<void> => {
  let processedData: Uint8Array | null = null;

  switch (extension) {
    case "jef":
      {
        const buffer = await blobToData(file);

        const stitchBlocks: Stitch_Block[] = DSTReader.getStitches(buffer);

        processedData = JEFWriter.getBuffer(stitchBlocks);
      }

      break;
    default:
      throw new Error("Unsupported file format. Please select a JEF extension.");
  }

  if (!processedData) throw new Error("Something goes wrong with Writer Embroidery File!");

  const blob = new Blob([processedData as BlobPart], { type: "application/octet-stream" });

  downloadBlob(blob, file.name);
};
