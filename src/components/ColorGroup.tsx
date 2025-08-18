import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { useCallback, useEffect, useState, type RefObject } from "react";
import {
  BufferGeometry,
  Float32BufferAttribute,
  type BufferGeometryEventMap,
  type NormalBufferAttributes,
} from "three";
import type { ColorGroup as TColorGroup } from "@/types/embroidery.types";

export type ColorRange = {
  geometryRef: RefObject<BufferGeometry<
    NormalBufferAttributes,
    BufferGeometryEventMap
  > | null>;
  colorGroup: TColorGroup[];
};

export const ColorGroup = () => {
  const embroideryStore = useEmbroideryStore();
  const [colorGroups, setColorGroups] = useState<TColorGroup[]>(
    embroideryStore.colorGroup || []
  );

  useEffect(() => {
    setColorGroups(embroideryStore.colorGroup || []);
  }, [embroideryStore.colorGroup]);

  useEffect(() => {
    if (colorGroups) applyColors();
  }, [colorGroups]);

  const applyColors = useCallback(() => {
    if (!embroideryStore.geometries || colorGroups.length === 0) return;

    let stitchIndex = 0,
      currentGroupIndex = 0;
    let currentGroup = colorGroups[currentGroupIndex];

    const geometries = embroideryStore.geometries;

    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i].geometry;
      const positionAttribute = geometry.getAttribute("position");
      const vertexCount = positionAttribute.count;

      while (
        currentGroup &&
        stitchIndex >= currentGroup.start + currentGroup.count
      ) {
        currentGroupIndex++;
        currentGroup = colorGroups[currentGroupIndex];
      }

      const [r, g, b] = currentGroup?.color || [1, 1, 1];
      const colorArray = new Float32Array(vertexCount * 3);

      for (let j = 0; j < vertexCount * 3; j += 3) {
        colorArray[j] = r;
        colorArray[j + 1] = g;
        colorArray[j + 2] = b;
      }

      geometry.setAttribute("color", new Float32BufferAttribute(colorArray, 3));
      stitchIndex += vertexCount;
    }
  }, [embroideryStore.geometries, colorGroups]);

  const handleColorChange = useCallback(
    (index: number, hexColor: string) => {
      const r = parseInt(hexColor.slice(1, 3), 16) / 255;
      const g = parseInt(hexColor.slice(3, 5), 16) / 255;
      const b = parseInt(hexColor.slice(5, 7), 16) / 255;

      const updated = [...colorGroups];
      updated[index].color = [r, g, b];

      setColorGroups(updated);
    },
    [colorGroups]
  );

  return (
    <div className="flex flex-wrap gap-2">
      {colorGroups.map((group, i) => (
        <input
          className={`size-6 rounded-sm border-none cursor-pointer -outline-offset-1 outline-3 outline-(--sidebar)`}
          key={i}
          type="color"
          value={`#${group.color
            .map((c) =>
              Math.round(c * 255)
                .toString(16)
                .padStart(2, "0")
            )
            .join("")}`}
          onChange={(e) => {
            handleColorChange(i, e.target.value);
          }}
        />
      ))}
    </div>
  );
};
