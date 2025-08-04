import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { EmbroideryLine } from "./EmbroideryLine";
import { loaderDSTFile } from "../utils/loaderDSTFile";
import { DrawRange } from "./DrawRange";
import { ColorGroup } from "./ColorGroup";

export const EmbroideryViewerFiber = () => {
  const [file, setFile] = useState<File | null>(null);
  const [threeLine, setThreeLine] = useState<THREE.Line | null>(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const [colorGroups, setColorGroups] = useState<ColorGroup[]>();

  useEffect(() => {
    let isMounted = true;
    if (!file) return;

    loaderDSTFile(file).then((threeLine) => {
      if (isMounted) {
        setThreeLine(threeLine[0]);
        setColorGroups(threeLine[1]);
        geometryRef.current = threeLine[0].geometry as THREE.BufferGeometry;
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
      {threeLine && <DrawRange geometryRef={geometryRef} />}
      {colorGroups && (
        <ColorGroup geometryRef={geometryRef} colorGroups={colorGroups} />
      )}

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
          {threeLine && <EmbroideryLine line={threeLine} />}
        </Canvas>
      </div>
    </>
  );
};
