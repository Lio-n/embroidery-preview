import { create } from "zustand";
import * as THREE from "three";
import type { ColorGroup } from "@/components/ColorGroup";
import type { RefObject } from "react";

interface EmbroideryState {
  colorGroup: ColorGroup[] | null;
  geometries: THREE.Line[] | null;
  geometryRef: RefObject<THREE.BufferGeometry | null> | null;
  updateSource: (
    data: Partial<Omit<EmbroideryState, "updateSource">>
  ) => Promise<void>;
}

export const useEmbroideryStore = create<EmbroideryState>((set) => ({
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
