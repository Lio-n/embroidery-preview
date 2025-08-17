import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EmbroideryLine } from "./EmbroideryLine";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { useEmbroideryViewer } from "@/stores/embroideryViewer.store";
import { useEffect, useRef } from "react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

export const EmbroideryViewer = () => {
  const embroideryStore = useEmbroideryStore();
  const embroideryViewer = useEmbroideryViewer();
  const orbitControlsRef = useRef<OrbitControlsImpl>(null!);

  useEffect(() => {
    if (orbitControlsRef) {
      embroideryViewer.save({ orbitControlsRef: orbitControlsRef });
    }
  }, [orbitControlsRef]);

  return (
    <>
      <div className="mx-auto my-0 w-[95%] h-[calc(100vh_-_4rem)]">
        <Canvas camera={{ position: [0, 0, 10], fov: 35 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls
            ref={orbitControlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
          />
          {embroideryStore.geometries?.map((geometry, i) => (
            <EmbroideryLine key={i} line={geometry} />
          ))}

          {embroideryStore.geometry && (
            <EmbroideryLine
              key={embroideryStore.geometry.uuid}
              line={embroideryStore.geometry}
            />
          )}
        </Canvas>
      </div>
    </>
  );
};
