import type { OutputReadStitches } from "@/types/embroidery.types";

interface SVGExportOptions {
  includeMetadata?: boolean;
  viewBoxPadding?: number;
  strokeWidth?: number;
  backgroundColor?: string;
}

interface GenerateSVG {
  data: Pick<OutputReadStitches, "blocks" | "filesDetails" | "designMetrics">;
  options?: SVGExportOptions;
}

export const generateEmbroiderySVG = ({
  data,
  options = {},
}: GenerateSVG): string => {
  const {
    includeMetadata = true,
    viewBoxPadding = 10,
    strokeWidth = 1,
    backgroundColor = "#f8f9fa",
  } = options;

  const {
    blocks,
    filesDetails,
    designMetrics: {
      boundingBox: { size },
    },
  } = data;

  const width = size.x.max - size.x.min;
  const height = size.y.max - size.y.min;
  const viewBox = `${size.x.min - viewBoxPadding} ${
    size.y.min - viewBoxPadding
  } ${width + viewBoxPadding * 2} ${height + viewBoxPadding * 2}`;

  const paths = blocks
    .map((block, blockIndex) => {
      const vertices = block.vertices;
      const colors = block.colors;

      if (vertices.length === 0) return "";

      const color = `rgb(${colors[0]}, ${colors[1]}, ${colors[2]})`; // R G B

      let pathData = "";
      for (let i = 0; i < vertices.length; i += 3) {
        const x = vertices[i];
        const y = vertices[i + 1];

        if (i === 0) {
          pathData += `M ${x},${y} `;
        } else {
          pathData += `L ${x},${y} `;
        }
      }

      return `<path d="${pathData}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" data-block="${blockIndex}" />`;
    })
    .filter((path) => path !== "")
    .join("\n");

  const metadata = includeMetadata
    ? `
    <g id="metadata" font-family="Arial" font-size="10" fill="#333" transform="translate(20, ${
      height + 60
    })">
      <text y="0">Archivo: ${filesDetails.name}.${filesDetails.extension}</text>
      <text y="15">Puntadas: ${filesDetails.stitches.toLocaleString()}</text>
      <text y="30">Bloques: ${blocks.length}</text>
      <text y="45">Dimensiones: ${(width / 10).toFixed(1)}x${(
        height / 10
      ).toFixed(1)} mm</text>
      <text y="60">Saltos: ${filesDetails.jumps?.toLocaleString() || "0"}</text>
    </g>
  `
    : "";

  const template = `<?xml version="1.0" encoding="UTF-8"?>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" width="${width}px" height="${height}px" style="background: ${backgroundColor};">
                <title>${filesDetails.name} - Diseño de Bordado</title>
                <desc>${filesDetails.stitches} puntadas, ${blocks.length} bloques de color</desc>
                <g id="embroidery-design" transform="scale(1, -1)">
                  ${paths}
                  ${metadata}
                </g>
            </svg>`;

  return template;
};
