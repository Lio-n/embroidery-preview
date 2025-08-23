import { create } from "zustand";
import type { OrbitControls } from "three-stdlib";
import type { RefObject } from "react";
import type { BoundsApi } from "@react-three/drei";
import { useEmbroideryStore } from "./embroiderySource.store";
import { generateEmbroiderySVG } from "@/utils/svgGenerator.utils";
import { downloadBlob } from "@/helpers/downloadBlob.helper";
import type { OutputReadStitches } from "@/types/embroidery.types";
import type { ExportFormat } from "@/validations/download.validation";
import { convertSVGtoRaster, type ConversionOptions } from "@/utils/svgToRaster.utils";

type SceneOptions = {
  backgroundColor: string | null;
};

export type EmbroideryViewerState = {
  orbitControlsRef: RefObject<OrbitControls> | null;
  canvasRef: RefObject<HTMLCanvasElement> | null;
  boundsApi: BoundsApi | null;
  scene: SceneOptions;
  isExporting: boolean;
};

export type ExportOptions = {
  scale?: number;
  backgroundColor?: string;
  quality?: number;
};

type DownloadScreenshot = {
  format: ExportFormat;
  options?: ExportOptions;
};

export type EmbroideryViewerActions = {
  resetCameraView: () => void;
  setState: (data: Partial<EmbroideryViewerState>) => void;
  updateScene: (data: Partial<SceneOptions>) => void;
  exportAsSVG: (designData: Pick<OutputReadStitches, "blocks" | "filesDetails" | "designMetrics">, options: ExportOptions) => void;
  exportAsRaster: (
    designData: Pick<OutputReadStitches, "blocks" | "filesDetails" | "designMetrics">,
    options: ExportOptions,
    format: Omit<ExportFormat, "svg">
  ) => void;
  downloadScreenshot: (data: DownloadScreenshot) => Promise<void>;
};

export type EmbroideryViewer = EmbroideryViewerState & EmbroideryViewerActions;

export const useEmbroideryViewer = create<EmbroideryViewer>((set, get) => ({
  scene: { backgroundColor: null },
  orbitControlsRef: null,
  canvasRef: null,
  boundsApi: null,
  isExporting: false,
  resetCameraView: () => {
    try {
      set((data) => {
        const api = data.boundsApi;
        const controls = data.orbitControlsRef?.current;

        if (api) {
          api.refresh().fit();
        }
        if (controls) {
          controls.enabled = false;
          controls.target.set(0, 0, 0);
          controls.object.position.set(0, 0, 20);
          controls.update();
          controls.saveState();
          controls.enabled = true;
        }

        return data;
      });
    } catch (error) {
      console.error("Error :", error);
    }
  },
  setState: (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
  downloadScreenshot: async ({ format, options = {} }) => {
    const { blocks, filesDetails, designMetrics } = useEmbroideryStore.getState();

    if (!blocks || !filesDetails || !designMetrics) {
      throw new Error("No hay diseño cargado para exportar");
    }

    const designData = { blocks, filesDetails, designMetrics };

    set({ isExporting: true });

    try {
      switch (format) {
        case "svg":
          await get().exportAsSVG(designData, options);
          break;
        case "png":
        case "jpeg":
        case "webp":
          await get().exportAsRaster(designData, options, format);
          break;
      }
    } catch (error) {
      console.error("Error en exportación:", error);
      throw error;
    } finally {
      set({ isExporting: false });
    }
  },
  exportAsSVG: async (designData, options = {}) => {
    const svgContent = generateEmbroiderySVG({
      data: designData,
      options,
    });

    const blob = new Blob([svgContent], {
      type: "image/svg+xml;charset=utf-8",
    });

    downloadBlob(blob, `${designData.filesDetails.name}.svg`);
  },
  exportAsRaster: async (designData, options = {}, format) => {
    const svgContent = generateEmbroiderySVG({
      data: designData,
      options,
    });

    // TODO : The raster is used temporarily, as there is a conflict when obtaining the correct size of the design on stage. The capture fails in quality.
    const blob = await convertSVGtoRaster(svgContent, {
      type: `image/${format}` as ConversionOptions["type"],
    });

    downloadBlob(blob, `${designData.filesDetails.name}.png`);
  },
  updateScene: (data) => {
    try {
      const { scene } = get();

      scene.backgroundColor = data.backgroundColor ?? "";
      set({ scene });
    } catch (error) {
      console.error("Error :", error);
    }
  },
}));
