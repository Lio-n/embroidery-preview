import { create } from "zustand";
import type { BufferGeometry, Line } from "three";
import type { RefObject } from "react";
import type {
  ColorGroup,
  DesignMetrics,
  FileDetails,
} from "@/types/embroidery.types";

export type EmbroideryStoreState = {
  designMetrics: DesignMetrics | null;
  filesDetails: FileDetails | null;

  colorGroup: ColorGroup[] | null;
  geometries: Line[] | null;
  geometry: Line | null;
  geometryRef: RefObject<BufferGeometry | null> | null;
};

export type EmbroideryStoreActions = {
  updateSource: (data: Partial<EmbroideryStoreState>) => void;
};

export type EmbroideryStore = EmbroideryStoreState & EmbroideryStoreActions;

export const useEmbroideryStore = create<EmbroideryStore>((set) => ({
  designMetrics: null,
  filesDetails: null,
  size: null,
  colorGroup: null,
  geometries: null,
  geometry: null,
  geometryRef: null,
  updateSource: (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
}));
