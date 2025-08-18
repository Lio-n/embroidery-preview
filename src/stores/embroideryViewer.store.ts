import { create } from "zustand";
import type { OrbitControls } from "three-stdlib";
import type { RefObject } from "react";
import type { BoundsApi } from "@react-three/drei";

export type EmbroideryViewerState = {
  orbitControlsRef: RefObject<OrbitControls> | null;
  canvasRef: RefObject<HTMLCanvasElement> | null;
  boundsApi: BoundsApi | null;
  isCapturing: boolean;
};

export type ScreenshotOptions = {
  scale?: number;
  margin?: number;
  backgroundColor?: string;
  quality?: number;
};

export type EmbroideryViewerActions = {
  resetCameraView: () => void;
  save: (data: Partial<EmbroideryViewerState>) => void;
  downloadScreenshot: () => void;
};

export type EmbroideryViewer = EmbroideryViewerState & EmbroideryViewerActions;

export const useEmbroideryViewer = create<EmbroideryViewer>((set, get) => ({
  orbitControlsRef: null,
  canvasRef: null,
  boundsApi: null,
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
  save: (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
  isCapturing: false,

  downloadScreenshot: async () => {
    const { canvasRef, resetCameraView } = get();

    try {
      set({ isCapturing: true });

      resetCameraView();

      await new Promise((resolve) => requestAnimationFrame(resolve));

      if (!canvasRef?.current) throw new Error("Canvas no disponible");
      const dataURL = canvasRef.current.toDataURL("image/jpg", 1);

      const link = document.createElement("a");
      link.href = dataURL;
      link.download = `embroidery-design-${new Date()
        .toISOString()
        .slice(0, 10)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Error al capturar:", error);
    } finally {
      set({ isCapturing: false });
    }
  },
}));
