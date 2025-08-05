import { useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EmbroideryLine } from "./EmbroideryLine";
import { loaderDSTFile } from "../utils/loaderDSTFile";
import { useEmbroideryStore } from "@/stores/embroiderySource.store";
import { DrawRange } from "./DrawRange";
import { ColorGroup } from "./ColorGroup";

export const EmbroideryViewerFiber = () => {
  const [file, setFile] = useState<File | null>(null);
  const embroideryStore = useEmbroideryStore();

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    loaderDSTFile(file).then((data) => {
      if (isMounted) {
        embroideryStore.updateSource({
          geometries: data.lines,
          colorGroup: data.colorGroup,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [file]);

  return (
    <>
      <input
        accept=".dst"
        type="file"
        onChange={(e) => {
          if (e.target.files?.[0]) {
            setFile(e.target.files[0]);
          }
        }}
      />
      {embroideryStore.geometries && <DrawRange />}
      {embroideryStore.colorGroup && <ColorGroup />}

      <div style={{ width: "80vw", height: "100vh" }}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 10]} intensity={1} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={1}
            maxDistance={50}
          />

          {embroideryStore.geometries?.map((geometry, i) => (
            <EmbroideryLine key={i} line={geometry} />
          ))}
        </Canvas>
      </div>
    </>
  );
};
