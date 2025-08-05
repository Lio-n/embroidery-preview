import * as THREE from "three";
import { useEffect, useMemo, useState } from "react";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { Slider } from "./ui/slider";

export const DrawRange = () => {
  const embroideryStore = useEmbroideryStore();
  const [progress, setProgress] = useState(Infinity);
  const [geometries] = useState<THREE.Line[]>(embroideryStore.geometries || []);

  useEffect(() => {
    if (!geometries) return;

    let remaining = progress;
    geometries.forEach((line) => {
      const vertexCount = line.geometry.getAttribute("position").count;
      if (remaining > 0) {
        const showCount = Math.min(vertexCount, remaining);
        line.geometry.setDrawRange(0, showCount);
        remaining -= showCount;
      } else {
        line.geometry.setDrawRange(0, 0);
      }
    });
  }, [progress]);

  const maxDrawRange = useMemo(() => {
    return (
      geometries?.reduce((sum, line) => {
        const count = line.geometry.getAttribute("position").count;
        return sum + count;
      }, 0) ?? 1
    );
  }, [geometries]);

  return (
    <Slider
      defaultValue={[Infinity]}
      max={maxDrawRange}
      step={10}
      onValueChange={(e) => setProgress(e[0])}
    />
  );
};
