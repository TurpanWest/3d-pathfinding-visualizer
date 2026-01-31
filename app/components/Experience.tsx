"use client";

import { Physics } from "@react-three/rapier";
import Lights from "./Lights";
import Character from "./Character";
import {Level} from "./Level";
import { Mesh } from "three";
import useGame from "./stores/useGame"
import usePathfinding from "./stores/usePathfinding"
import useLevelStore from "./stores/useLevelStore"
import { useKeyboardControls, OrbitControls } from "@react-three/drei";
import { useEffect } from "react";
import CameraController from "./CameraController";
import GridBaker from "./GridBaker";

export default function Experience() {

  const toggleCharacter = useGame((state) => state.toggleCharacter)
  const initGrid = usePathfinding((state) => state.initGrid)
  const isEditMode = useLevelStore((state) => state.isEditMode)
  const [subscribeKeys] = useKeyboardControls()

  useEffect(() => {
    initGrid()
  }, [])

  useEffect(() => {
    const unsubscribeSwap = subscribeKeys(
      (state) => state.swap,
      (value) => {
        if (value && !isEditMode) toggleCharacter() // Disable swap in edit mode
      }
    )
    return () => unsubscribeSwap()
  }, [isEditMode]) // Re-run effect when mode changes

  return (
    <>
      <color args={ [ '#bdedfc']} attach="background"/>
      <Physics>
        <Lights />
        <Level/>
        <Character id="player" position={[0, 1, 0]} color="slateblue" />
        <Character id="ally-1" position={[-2, 1, 0]} color="orange" />
        <Character id="ally-2" position={[2, 1, 0]} color="hotpink" />
        
        <CameraController />
        
        <GridBaker />
      </Physics>
    </>
  );
}
