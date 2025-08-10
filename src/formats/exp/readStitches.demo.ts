import { blobToData } from "@/helpers/processBuffer.helper";
import type { ColorGroup, StitchBlock } from "@/types/embroidery.types";
import { generatePalette } from "@/utils/generatePalette";

// Convierte signed 8-bit
function signed8(n: number): number {
  return n & 0x80 ? n - 0x100 : n;
}

// Normaliza color que puede venir en 0..255 o 0..1 a 0..1
function normalizeColor(c: { r: number; g: number; b: number }) {
  const norm = (v: number) => (v > 1 ? v / 255 : v);
  return { r: norm(c.r), g: norm(c.g), b: norm(c.b) };
}

// Asegura que la paleta tenga al menos (neededCount) colores (devuelve paleta normalizada)
function ensurePalette(
  neededCount: number,
  currentPalette: { r: number; g: number; b: number }[]
) {
  if (currentPalette.length >= neededCount) return currentPalette;
  const newSize = Math.max(neededCount, currentPalette.length * 2 || 8);
  const raw = generatePalette(newSize); // asume generatePalette(n) => array de {r,g,b}
  return raw.map(normalizeColor);
}

/**
 * Lee un archivo EXP y devuelve bloques con vértices/colors y colorGroup
 */
export const readStitches = async (
  file: File
): Promise<{ blocks: StitchBlock[]; colorGroup: ColorGroup[] }> => {
  const buffer = await blobToData(file);
  const view = new DataView(buffer);

  // Paleta inicial (8 colores)
  let palette = ensurePalette(8, []);
  // Si generatePalette devuelve objetos en 0..1 o 0..255, normalizeColor los deja en 0..1

  // estado de color
  let colorIndex = 0;
  palette = ensurePalette(colorIndex + 1, palette);
  let currentColor = palette[colorIndex];

  const colorGroup: ColorGroup[] = [];
  let pointIndex = 0;

  let currentGroup: ColorGroup = {
    index: colorIndex,
    start: pointIndex,
    count: 0,
    color: [currentColor.r, currentColor.g, currentColor.b],
  };

  const blocks: StitchBlock[] = [];
  let currentBlock: StitchBlock = { vertices: [], colors: [] };

  let cx = 0,
    cy = 0;
  let ptr = 0;

  while (ptr < view.byteLength) {
    // Leer dos bytes base (b1, b2)
    const b1 = view.getUint8(ptr++);
    const b2 = view.getUint8(ptr++);

    // Caso 1: puntada normal (b1 != 0x80)
    if (b1 !== 0x80) {
      const dx = signed8(b1);
      const dy = signed8(b2); // invertir Y para coordenadas de visualización
      cx += dx;
      cy += dy;
      currentBlock.vertices.push(cx, cy, 0);
      currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);

      pointIndex++;
      continue;
    }

    // Aquí b1 === 0x80 => es un control
    const control = b2;

    // END
    if (control === 0x80) {
      // cerrar grupo y bloques
      continue;
    }

    // leer desplazamiento extra (dos bytes) que acompañan al comando
    const ex = view.getUint8(ptr++);
    const ey = view.getUint8(ptr++);
    const dx = signed8(ex);
    const dy = signed8(ey);

    // COLOR CHANGE
    if (control === 0x01) {
      // cerrar grupo anterior
      currentGroup.count = pointIndex - currentGroup.start;
      colorGroup.push(currentGroup);

      // cerrar bloque actual si tiene puntos
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }

      // avanzar índice de color y obtener color
      colorIndex++;
      palette = ensurePalette(colorIndex + 1, palette);
      currentColor = palette[colorIndex];

      // nuevo grupo
      currentGroup = {
        index: colorIndex,
        start: pointIndex,
        count: 0,
        color: [currentColor.r, currentColor.g, currentColor.b],
      };

      // el comando puede traer movimiento
      if (dx !== 0 || dy !== 0) {
        cx += dx;
        cy += dy;
      }
      continue;
    }

    // JUMP / TRIM (no dibujamos punto, sólo movemos y se separa bloque)
    if (control === 0x04) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
        currentBlock = { vertices: [], colors: [] };
      }
      cx += dx;
      cy += dy;
      continue;
    }

    // STITCH con control (raro, pero existe)
    if (control === 0x02) {
      cx += dx;
      cy += dy;
      currentBlock.vertices.push(cx, cy, 0);
      currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
      pointIndex++;
      continue;
    }

    // Si control no reconocido, salimos del loop
    break;
  }

  // push último bloque si tiene puntos
  if (currentBlock.vertices.length > 0) {
    blocks.push(currentBlock);
  }

  // finalizar último grupo
  currentGroup.count = pointIndex - currentGroup.start;
  colorGroup.push(currentGroup);
  console.log("EXP readStitches:", blocks);
  return { blocks, colorGroup };
};

// function signed8(n: number): number {
//   return n & 0x80 ? n - 0x100 : n;
// }

// /*  EXP Body - Command Table
//     | Command      | B0   | B1   |
//     | ------------ | ---- | ---- |
//     | END          | 0x80 | 0x80 |
//     | COLOR_CHANGE | 0x80 | 0x01 |
//     | STOP         | 0x80 | 0x01 |
//     | JUMP         | 0x80 | 0x04 |
//     | STITCH         | 0x80 | 0x02 |
// */ export const readStitches = async (
//   file: File
// ): Promise<{ blocks: StitchBlock[]; colorGroup: ColorGroup[] }> => {
//   const buffer = await blobToData(file);
//   const view = new DataView(buffer);

//   const threeColors = generatePalette(2);

//   let currentColor = threeColors[0];
//   const colorGroup: ColorGroup[] = [];
//   let pointIndex = 0,
//     index = 0;

//   let currentGroup: ColorGroup = {
//     index,
//     start: pointIndex,
//     count: 0,
//     color: [currentColor.r, currentColor.g, currentColor.b],
//   };

//   const blocks: StitchBlock[] = [];
//   let currentBlock: StitchBlock = { vertices: [], colors: [] };

//   let cx = 0,
//     cy = 0;
//   let ptr = 0;

//   while (ptr < buffer.byteLength) {
//     const b1 = view.getUint8(ptr++);
//     const b2 = view.getUint8(ptr++);

//     const dx = signed8(b1);
//     const dy = signed8(b2); // positive, because Y axis goes downwards

//     if (b1 === 0x80) {
//       if (b2 === 0x80) {
//         // END
//         console.log("EXP readStitches - END");
//         blocks.push(currentBlock);
//         continue;
//       }
//       if (b2 === 0x01) {
//         // COLOR CHANGE

//         currentGroup.count = pointIndex - currentGroup.start;
//         colorGroup.push(currentGroup);

//         if (currentBlock.vertices.length > 0) {
//           blocks.push(currentBlock);
//           currentBlock = { vertices: [], colors: [] };
//         }

//         index++;
//         currentColor = threeColors[index % threeColors.length];

//         // new color group
//         currentGroup = {
//           index,
//           start: pointIndex,
//           count: 0,
//           color: [currentColor.r, currentColor.g, currentColor.b],
//         };
//         continue;
//       }
//       if (b2 === 0x04) {
//         // TRIM/JUMP
//         // file_details.jumps += 1; // Count jumps

//         if (currentBlock.vertices.length > 0) {
//           blocks.push(currentBlock);
//           currentBlock = { vertices: [], colors: [] };
//         }
//         continue; // Skip jump stitches
//       }
//     }

//     cx += dx;
//     cy += dy;

//     currentBlock.vertices.push(cx, cy, 0); // Z-coordinate is 0 as embroidery designs are 2D
//     currentBlock.colors.push(currentColor.r, currentColor.g, currentColor.b);
//     pointIndex++;
//   }

//   console.log("EXP readStitches:", blocks);
//   currentGroup.count = pointIndex - currentGroup.start;
//   colorGroup.push(currentGroup);

//   if (currentBlock.vertices.length > 0) {
//     blocks.push(currentBlock);
//   }

//   return { blocks, colorGroup };
// };
/*


    // Puntada normal
    if (b1 !== 0x80) {
      const dx = signed8(b1);
      const dy = -signed8(b2);
      cx += dx;
      cy += dy;
      currentBlock.vertices.push(cx, cy, 0);
      continue;
    }

    // END
    if (b2 === 0x80) {
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
      }
      break;
    }

    // Leer desplazamiento extra después de control code
    const dx = signed8(view.getUint8(ptr++));
    const dy = -signed8(view.getUint8(ptr++));

    if (b2 === 0x01) {
      // COLOR CHANGE
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = { vertices: [], colors: [] };
      if (dx !== 0 || dy !== 0) {
        cx += dx;
        cy += dy;
      }
      continue;
    }

    if (b2 === 0x04) {
      // TRIM / JUMP
      if (currentBlock.vertices.length > 0) {
        blocks.push(currentBlock);
      }
      currentBlock = { vertices: [], colors: [] };
      cx += dx;
      cy += dy;
      continue;
    }

    if (b2 === 0x02) {
      // STITCH con control
      cx += dx;
      cy += dy;
      currentBlock.vertices.push(cx, cy, 0);
      continue;
    }

    // Control desconocido → salimos
    break;

*/
