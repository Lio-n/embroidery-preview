import { Canvas } from "@react-three/fiber";
import { Bounds, OrbitControls } from "@react-three/drei";
import { EmbroideryLine } from "./EmbroideryLine";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export const EmbroideryViewer = () => {
  const embroideryStore = useEmbroideryStore();
  const embroideryViewer = useEmbroideryViewer();
  const orbitControlsRef = useRef<OrbitControlsImpl>(null!);
  const canvasRef = useRef<HTMLCanvasElement>(null!);

  useEffect(() => {
    if (orbitControlsRef) {
      embroideryViewer.save({ orbitControlsRef, canvasRef });
    }
  }, [orbitControlsRef, canvasRef]);

  return (
    <>
      <div className="mx-auto my-0 w-[95%] h-[calc(100vh_-_4rem)]">
        <Canvas
          ref={canvasRef}
          gl={{ preserveDrawingBuffer: true, alpha: true }}
          camera={{ position: [0, 0, 20], fov: 40 }}
        >
          {embroideryViewer.scene?.backgroundColor && (
            <color
              attach="background"
              args={[embroideryViewer.scene?.backgroundColor]}
            />
          )}
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls
            enableRotate
            ref={orbitControlsRef}
            makeDefault
            maxDistance={
              embroideryStore.designMetrics?.boundingBox.maxDimension
                ? embroideryStore.designMetrics?.boundingBox.maxDimension * 1.5
                : 20
            }
          />

          <Bounds fit clip margin={0.9}>
            {embroideryStore.geometries?.map((geometry, i) => (
              <EmbroideryLine key={i} line={geometry} />
            ))}
          </Bounds>
        </Canvas>
      </div>
    </>
  );
};
