"use client";

import { Canvas } from "@react-three/fiber";
import Experience from "./components/Experience";
import Interface from "./components/Interface";
import "./globals.css"; 
import { KeyboardControls} from "@react-three/drei";

export default function Page() {
  return (
    <main className="fixed inset-0 w-full h-full bg-[ivory]">
      <KeyboardControls 
      map={ [
        { name:'forward', keys:['KeyW', 'ArrowUp']},
        { name:'backward', keys:['KeyS', 'ArrowDown']},
        { name:'leftward', keys:['KeyA', 'ArrowLeft']},
        { name:'rightward', keys:['KeyD', 'ArrowRight']},
        { name:'jump', keys:['Space']},
        { name:'swap', keys:['KeyQ']}
      ] }
      >
        <Canvas
          className="pointer-events-none"
          shadows
          camera={{
            fov: 45,
            near: 0.1,
            far: 200,
            position: [2.5, 4, 6],
          }}
        >
          <Experience />
        </Canvas>
        <Interface />
      </KeyboardControls>
    </main>
  );
}
