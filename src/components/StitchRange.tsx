import { useEffect, useMemo, useState } from "react";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { Slider } from "./ui/slider";

export const StitchRange = () => {
  const EmbStore = useEmbroideryStore();

  const [progress, setProgress] = useState(Infinity); // Default to a large number to show all initially

  useEffect(() => {
    if (!EmbStore.geometries) return;

    let remaining = progress;
    EmbStore.geometries.forEach((line) => {
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
      EmbStore.geometries?.reduce((sum, line) => {
        const count = line.geometry.getAttribute("position").count;
        return sum + count;
      }, 0) ?? 1
    );
  }, [EmbStore.geometries]);

  if (!EmbStore.geometries) return null;

  return (
    <>
      <Slider
        defaultValue={[progress]}
        max={maxDrawRange}
        step={10}
        onValueChange={(e) => setProgress(e[0])}
      />
    </>
  );
};
