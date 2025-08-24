import { processGeometry } from "@/helpers/processGeometry.helper";
import { LineBasicMaterial } from "three";
import { processLine } from "@/helpers/processLines.helper";
import type {
  OutpusReaderFormats,
  OutputReadStitches,
  SuportFormats,
} from "@/types/embroidery.types";
import { readStitchesXXX } from "./xxx/readStitches.xxx";
import { readStitchesPES } from "./pes/readStitches.pes";
import { readStitchesJEF } from "./jef/readStitches.jef";
import { readStitchesEXP } from "./exp/readStitches.exp";
import { readStitchesDST } from "./dst/readStitches.dst";

export const readerEmbroideryFormats = async (
  extension: SuportFormats,
  file: File
): Promise<OutpusReaderFormats> => {
  let processedData: OutputReadStitches | null = null;

  switch (extension) {
    case "pes":
      processedData = await readStitchesPES(file);
      break;
    case "xxx":
      processedData = await readStitchesXXX(file);

      break;
    case "jef":
      processedData = await readStitchesJEF(file);

      break;
    case "exp":
      processedData = await readStitchesEXP(file);

      break;
    case "dst":
      processedData = await readStitchesDST(file);

      break;
    default:
      throw new Error(
        "Unsupported file format. Please upload a JEF, DST or EXP file."
      );
  }

  if (!processedData)
    throw new Error("Something goes wrong with Reader Embroidery File!");

  const geometries = processedData.blocks.map((b) =>
    processGeometry(b.vertices, b.colors)
  );

  const material = new LineBasicMaterial({ vertexColors: true });

  // Transform geometries to THREE.Line objects
  const lines = geometries.map((geometry) => processLine(geometry, material));

  return {
    lines,
    ...processedData,
  };
};
