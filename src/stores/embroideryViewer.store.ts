import { create } from "zustand";
import type { OrbitControls } from "three-stdlib";
import type { RefObject } from "react";

export type EmbroideryViewerState = {
  orbitControlsRef: RefObject<OrbitControls> | null;
};

export type EmbroideryViewerActions = {
  resetControl: () => Promise<void>;
  save: (data: Partial<EmbroideryViewerState>) => Promise<void>;
};

export type EmbroideryViewer = EmbroideryViewerState & EmbroideryViewerActions;

export const useEmbroideryViewer = create<EmbroideryViewer>((set) => ({
  orbitControlsRef: null,
  resetControl: async () => {
    try {
      set((data) => {
        if (data.orbitControlsRef?.current) {
          data.orbitControlsRef.current.reset();
        }
        return data;
      });
    } catch (error) {
      console.error("Error :", error);
    }
  },
  save: async (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
}));
