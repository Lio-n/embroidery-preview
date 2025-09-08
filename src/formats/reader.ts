import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";
import type { OutpusReaderFormats, OutputStitchGeometry, SuportFormats } from "@/types/embroidery.types";
import { readStitchesXXX } from "./xxx/readStitches.xxx";
import { readStitchesPES } from "./pes/readStitches.pes";
import { readStitchesEXP } from "./exp/readStitches.exp";
import { DSTReader } from "./dst/DST.reader";
import { JEFReader } from "./jef/JEF.reader";

export const readerEmbroideryFormats = async (extension: SuportFormats, file: File): Promise<OutpusReaderFormats> => {
  let processedData: OutputStitchGeometry | null = null;

  switch (extension) {
    case "pes":
      processedData = await readStitchesPES(file);
      break;
    case "xxx":
      processedData = await readStitchesXXX(file);

      break;
    case "jef":
      {
        const r = new JEFReader(file);
        processedData = await r.process();
      }
      break;
    case "exp":
      processedData = await readStitchesEXP(file);

      break;
    case "dst":
      // processedData = await readStitchesDST(file);
      {
        const r = new DSTReader(file);
        processedData = await r.process();
      }
      break;
    default:
      throw new Error("Unsupported file format. Please upload a JEF, DST or EXP file.");
  }

  if (!processedData) throw new Error("Something goes wrong with Reader Embroidery File!");

  const geometries = processedData.blocks.map((b) => processGeometry(b.vertices, b.colors));

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return {
    lines,
    ...processedData,
  };
};
