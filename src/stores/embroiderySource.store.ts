import { create } from "zustand";
import * as THREE from "three";
import type { ColorGroup } from "@/components/ColorGroup";
import type { RefObject } from "react";
import type { FileDetails } from "@/utils/parseDST";

export interface EmbroideryState {
  file_details: FileDetails | null;
  colorGroup: ColorGroup[] | null;
  geometries: THREE.Line[] | null;
  geometryRef: RefObject<THREE.BufferGeometry | null> | null;
  updateSource: (
    data: Partial<Omit<EmbroideryState, "updateSource">>
  ) => Promise<void>;
}

export const useEmbroideryStore = create<EmbroideryState>((set) => ({
  file_details: null,
  colorGroup: null,
  geometries: null,
  geometryRef: null,
  updateSource: async (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
}));
