import { create } from "zustand";
import type { BufferGeometry, Line } from "three";
import type { RefObject } from "react";
import type { ColorGroup, DesignMetrics, FileDetails, OutputReadStitches } from "@/types/embroidery.types";
import type { DeepPartial, PartialNull } from "@/types/general.types";

export interface EmbroideryStoreState extends PartialNull<OutputReadStitches> {
  geometries: Line[] | null;
  geometryRef: RefObject<BufferGeometry | null> | null;
}

export type EmbroideryStoreActions = {
  updateSource: (data: Partial<EmbroideryStoreState>) => void;
  setState: (data: DeepPartial<OutputReadStitches>) => void;
  updateBlockColors: (colorGroups: ColorGroup[]) => void;
};

export type EmbroideryStore = EmbroideryStoreState & EmbroideryStoreActions;

export const useEmbroideryStore = create<EmbroideryStore>((set, get) => ({
  designMetrics: null,
  blocks: null,
  filesDetails: null,
  colorGroup: null,
  geometries: null,
  geometryRef: null,
  updateBlockColors: (colorGroups) => {
    const { blocks } = get();
    if (!blocks) return null;

    const blockStarts: number[] = [];
    let currentStart = 0;

    blocks.forEach((block) => {
      blockStarts.push(currentStart);
      currentStart += block.colors.length / 3;
    });

    const updatedBlocks = blocks.map((block, blockIndex) => {
      const blockStart = blockStarts[blockIndex];
      const blockEnd = blockStart + block.colors.length / 3;

      const colorGroup = colorGroups.find((cg) => cg.start <= blockStart && cg.start + cg.count >= blockEnd);

      if (colorGroup?.color) {
        const [r, g, b] = colorGroup.color;
        const r255 = Math.round(r * 255);
        const g255 = Math.round(g * 255);
        const b255 = Math.round(b * 255);

        const uint8Colors = new Uint8Array(block.colors.length);

        for (let i = 0; i < block.colors.length; i += 3) {
          uint8Colors[i] = r255;
          uint8Colors[i + 1] = g255;
          uint8Colors[i + 2] = b255;
        }

        return { ...block, colors: uint8Colors };
      }

      return block;
    });

    set({ blocks: updatedBlocks });
  },
  updateSource: (data) => {
    try {
      set(data);
    } catch (error) {
      console.error("Error :", error);
    }
  },
  setState: (data) => {
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
