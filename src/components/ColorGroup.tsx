import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { useCallback, useEffect, useMemo, useState } from "react";
import { BufferGeometry, Float32BufferAttribute, type BufferGeometryEventMap, type NormalBufferAttributes } from "three";
import type { ColorGroup as TColorGroup } from "@/types/embroidery.types";
import { ColorPicker } from "./ColorPicker";

export type ColorRange = {
  geometryRef: React.RefObject<BufferGeometry<NormalBufferAttributes, BufferGeometryEventMap> | null>;
  colorGroup: TColorGroup[];
};

export const ColorGroup = () => {
  const EmbStore = useEmbroideryStore();
  const [colorGroups, setColorGroups] = useState<TColorGroup[]>([]);

  useEffect(() => {
    if (EmbStore.colorGroup) {
      setColorGroups(EmbStore.colorGroup);
    }
  }, [EmbStore.colorGroup]);

  const colorHexCache = useMemo(() => {
    return colorGroups.map((group) => {
      if (!group?.color) return "#ffffff";
      return `#${group.color
        .map((c) =>
          Math.round(c * 255)
            .toString(16)
            .padStart(2, "0")
        )
        .join("")}`;
    });
  }, [colorGroups]);

  const applyColors = useCallback(() => {
    if (!EmbStore.geometries || colorGroups.length === 0) return;

    let stitchIndex = 0;
    let currentGroupIndex = 0;
    let currentGroup = colorGroups[currentGroupIndex];

    const geometries = EmbStore.geometries;

    for (let i = 0; i < geometries.length; i++) {
      const geometry = geometries[i].geometry;
      const positionAttribute = geometry.getAttribute("position");
      const vertexCount = positionAttribute.count;

      while (currentGroup && stitchIndex >= currentGroup.start + currentGroup.count) {
        currentGroupIndex++;
        currentGroup = colorGroups[currentGroupIndex];
      }

      if (!currentGroup) break;

      const [r, g, b] = currentGroup.color || [1, 1, 1];

      const colorArray = new Float32Array(vertexCount * 3);
      for (let j = 0; j < vertexCount * 3; j += 3) {
        colorArray[j] = r;
        colorArray[j + 1] = g;
        colorArray[j + 2] = b;
      }

      geometry.setAttribute("color", new Float32BufferAttribute(colorArray, 3));
      stitchIndex += vertexCount;
    }
  }, [EmbStore.geometries, colorGroups]);

  useEffect(() => {
    applyColors();
  }, [applyColors]);

  const handleColorChange = useCallback((index: number, hexColor: string) => {
    const r = parseInt(hexColor.slice(1, 3), 16) / 255;
    const g = parseInt(hexColor.slice(3, 5), 16) / 255;
    const b = parseInt(hexColor.slice(5, 7), 16) / 255;

    setColorGroups((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], color: [r, g, b] };
      return updated;
    });
  }, []);

  return (
    <div className="flex flex-wrap gap-2">
      {colorGroups.map((_, i) => (
        <div key={i}>
          <ColorPicker onChange={(v) => handleColorChange(i, v as string)} value={colorHexCache[i]} />
        </div>
      ))}
    </div>
  );
};

// rgb : 0-1
// EmbPalette.Color -> 0-1 -(0.1 to hex)- ColorPicker -> Hex -(hex to 0.1)- Update EmbPalette.Color -> 0.1
