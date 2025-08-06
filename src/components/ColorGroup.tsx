import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { useEffect, useState, type RefObject } from "react";
import * as THREE from "three";

export type ColorGroup = {
  index: number; // group _ID
  start: number;
  count: number;
  color: [number, number, number]; // RGB
};

export type ColorRange = {
  geometryRef: RefObject<THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > | null>;
  colorGroup: ColorGroup[];
};

export const ColorGroup = () => {
  const embroideryStore = useEmbroideryStore();
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>(
    embroideryStore.colorGroup || []
  );

  const applyColors = () => {
    if (!embroideryStore.geometries || !colorGroups.length) return;

    let stitchIndex = 0;
    let groupIdx = 0;
    let group = colorGroups[groupIdx];

    embroideryStore.geometries.forEach((geometry) => {
      const vertexCount = geometry.geometry.getAttribute("position").count;
      // while the group exists and the stitch index is greater than the start + count of the group
      while (group && stitchIndex >= group.start + group.count) {
        groupIdx++;
        group = colorGroups[groupIdx];
      }
      // If we run out of groups, just use the last one
      const colorArray: number[] = [];
      const [r, g, b] = group ? group.color : [1, 1, 1];
      for (let i = 0; i < vertexCount; i++) {
        colorArray.push(r, g, b);
      }
      geometry.geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colorArray, 3)
      );
      stitchIndex += vertexCount;
    });
  };

  useEffect(() => {
    setColorGroups(embroideryStore.colorGroup || []);
  }, [embroideryStore.colorGroup]);

  useEffect(() => {
    if (colorGroups) applyColors();
  }, [colorGroups]);

  return (
    <div className="flex flex-wrap gap-2">
      {colorGroups.map((group, idx) => (
        <input
          className="size-6 rounded-full border-none cursor-pointer"
          key={idx}
          type="color"
          value={`#${group.color
            .map((c) =>
              Math.round(c * 255)
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`}
          onChange={(e) => {
            const hex = e.target.value;
            const r = parseInt(hex.slice(1, 3), 16) / 255;
            const g = parseInt(hex.slice(3, 5), 16) / 255;
            const b = parseInt(hex.slice(5, 7), 16) / 255;

            const updated = [...colorGroups];
            updated[idx].color = [r, g, b];

            setColorGroups(updated);
            // applyColors();
          }}
        />
      ))}
    </div>
  );
};
