import { useState, type RefObject } from "react";
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
  colorGroups: ColorGroup[];
};
export const ColorGroup = ({ geometryRef, ...props }: ColorRange) => {
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>(
    props.colorGroups
  );

  const applyColors = () => {
    const colorArray: number[] = [];

    for (const group of colorGroups) {
      for (let i = 0; i < group.count; i++) {
        const [r, g, b] = group.color;
        colorArray.push(r, g, b);
      }
    }

    geometryRef.current?.setAttribute(
      "color",
      new THREE.Float32BufferAttribute(colorArray, 3)
    );
  };

  return colorGroups ? (
    <>
      {colorGroups.map((group, idx) => (
        <input
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
            applyColors();
          }}
        />
      ))}
    </>
  ) : null;
};
