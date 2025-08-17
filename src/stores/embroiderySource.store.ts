import { create } from "zustand";
import type { BufferGeometry, Line } from "three";
import type { ColorGroup } from "@/components/ColorGroup";
import type { RefObject } from "react";
import type { FileDetails } from "@/types/embroidery.types";

export type EmbroideryStoreState = {
  file_details: FileDetails | null;
  colorGroup: ColorGroup[] | null;
  geometries: Line[] | null;
  geometry: Line | null;
  geometryRef: RefObject<BufferGeometry | null> | null;
};

export type EmbroideryStoreActions = {
  updateSource: (data: Partial<EmbroideryStoreState>) => Promise<void>;
};

export type EmbroideryStore = EmbroideryStoreState & EmbroideryStoreActions;

export const useEmbroideryStore = create<EmbroideryStore>((set) => ({
  file_details: null,
  colorGroup: null,
  geometries: null,
  geometry: null,
  geometryRef: null,
  updateSource: async (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
}));
