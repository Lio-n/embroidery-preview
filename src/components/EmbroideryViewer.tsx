import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { loaderDSTFile } from "../utils/loaderDSTFile";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export function EmbroideryViewer() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer>(null);
  const [uploadFile, setUploadFile] = useState<File>();
  const [lineFile, setLineFile] = useState<THREE.Line>();

  useEffect(() => {
    if (uploadFile) {
      loaderDSTFile(uploadFile).then((e) => {
        setLineFile(e);
      });
    }
  }, [uploadFile]);

  useEffect(() => {
    if (lineFile) {
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xfefefe);

      const camera = new THREE.PerspectiveCamera(
        45,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      camera.position.set(0, 0, 10);

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight);
      containerRef.current!.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const light = new THREE.DirectionalLight(0xffffff, 1);
      light.position.set(10, 10, 10);
      scene.add(light);
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));

      scene.add(lineFile);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;
      controls.maxDistance = 50;

      const animate = () => {
        requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      const handleResize = () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
      };
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
        renderer.dispose();
      };
    }
  }, [lineFile]);

  return (
    <div>
      <input
        accept=".dst"
        type="file"
        name="upload_dst"
        id="dst"
        onChange={(e) => {
          if (e.target.files?.length) {
            setUploadFile(e.target.files[0]);
          }
        }}
      />
      <div ref={containerRef} style={{ width: "100%", height: "100vh" }} />
    </div>
  );
}
