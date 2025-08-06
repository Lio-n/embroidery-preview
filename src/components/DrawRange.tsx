import { useEffect, useMemo, useState } from "react";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { Slider } from "./ui/slider";

export const DrawRange = () => {
  const embroideryStore = useEmbroideryStore();

  const [progress, setProgress] = useState(1000000); // Default to a large number to show all initially
  // const [embroideryStore.geometries] = useState<THREE.Line[]>(embroideryStore.embroideryStore.geometries || []);

  useEffect(() => {
    if (!embroideryStore.geometries) return;

    let remaining = progress;
    embroideryStore.geometries.forEach((line) => {
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
      embroideryStore.geometries?.reduce((sum, line) => {
        const count = line.geometry.getAttribute("position").count;
        return sum + count;
      }, 0) ?? 1
    );
  }, [embroideryStore.geometries]);

  if (!embroideryStore.geometries) return null;

  return (
    <>
      <Slider
        defaultValue={[Infinity]}
        max={maxDrawRange}
        step={10}
        onValueChange={(e) => setProgress(e[0])}
      />
    </>
  );
};
