import { create } from "zustand";
import type { BufferGeometry, Line } from "three";
import type { RefObject } from "react";
import type {
  DesignMetrics,
  FileDetails,
  PromiseReadStitches,
} from "@/types/embroidery.types";
import type { DeepPartial, PartialNull } from "@/types/general.types";

export interface EmbroideryStoreState extends PartialNull<PromiseReadStitches> {
  geometries: Line[] | null;
  geometryRef: RefObject<BufferGeometry | null> | null;
}

export type EmbroideryStoreActions = {
  updateSource: (data: Partial<EmbroideryStoreState>) => void;
  save: (data: DeepPartial<PromiseReadStitches>) => void;
};

export type EmbroideryStore = EmbroideryStoreState & EmbroideryStoreActions;

export const useEmbroideryStore = create<EmbroideryStore>((set) => ({
  designMetrics: null,
  blocks: null,
  filesDetails: null,
  colorGroup: null,
  geometries: null,
  geometryRef: null,
  updateSource: (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
  save: (data) => {
    try {
      set((state) => {
        const newState = { ...state };

        if (data.filesDetails && state.filesDetails) {
          newState.filesDetails = {
            ...state.filesDetails,
            ...data.filesDetails,
          };
        } else if (data.filesDetails) {
          newState.filesDetails = data.filesDetails as FileDetails;
        }

        if (data.designMetrics && state.designMetrics) {
          newState.designMetrics = {
            ...state.designMetrics,
            ...data.designMetrics,
          } as DesignMetrics;
        }

        // Repetir para otras propiedades anidadas...
        return newState;
      });
    } catch (error) {
      console.error("Error saving data:", error);
    }
  },
}));
