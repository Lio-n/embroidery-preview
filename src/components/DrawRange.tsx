import { useEffect, useState, type RefObject } from "react";
import * as THREE from "three";

type DrawRange = {
  geometryRef: RefObject<THREE.BufferGeometry<
    THREE.NormalBufferAttributes,
    THREE.BufferGeometryEventMap
  > | null>;
};
export const DrawRange = ({ geometryRef }: DrawRange) => {
  const [progress, setProgress] = useState(100);

  // Update drawRange every frame if progress changes
  useEffect(() => {
    if (geometryRef.current) {
      const count = geometryRef.current.getAttribute("position").count;
      const visibleCount = Math.floor((progress / 100) * count);
      geometryRef.current.setDrawRange(0, visibleCount);
    }
  }, [progress]);

  return (
    <input
      type="range"
      min={0}
      max={100}
      value={progress}
      onChange={(e) => setProgress(parseInt(e.target.value))}
      style={{ position: "absolute", top: 10, left: 10, zIndex: 1 }}
    />
  );
};
