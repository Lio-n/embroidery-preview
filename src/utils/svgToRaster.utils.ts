export interface ConversionOptions {
  width?: number;
  height?: number;
  quality?: number;
  type?: "image/png" | "image/jpg" | "image/webp";
}

export const convertSVGtoRaster = async (svgString: string, options: ConversionOptions = {}): Promise<Blob> => {
  const { width = 800, height = 600, quality = 1, type = "image/webp" } = options;

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });
  const svgUrl = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.width = width;
  img.height = height;

  // wait img loaded
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("No se pudo obtener el contexto 2D");
  }

  // Draw SVG at canvas
  ctx.fillStyle = "#f8f9fa";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, width, height);

  // Config quality
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Convert raster
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        URL.revokeObjectURL(svgUrl);
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Error al convertir a blob"));
        }
      },
      type,
      quality
    );
  });
};
