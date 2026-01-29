"use client";

import { Physics } from "@react-three/rapier";
import Lights from "./Lights";
import Character from "./Character";
import {Level} from "./Level";
import { Mesh } from "three";
import useGame from "./stores/useGame"
import usePathfinding from "./stores/usePathfinding"
import { useKeyboardControls } from "@react-three/drei";
import { useEffect } from "react";
import GridDebug from "./GridDebug";
import GridBaker from "./GridBaker";
import CameraController from "./CameraController";

export default function Experience() {

  const blocksCount = useGame((state) => state.blocksCount)
  const blocksSeed = useGame((state) => state.blocksSeed)
  const toggleCharacter = useGame((state) => state.toggleCharacter)
  const initGrid = usePathfinding((state) => state.initGrid)
  const [subscribeKeys] = useKeyboardControls()

  useEffect(() => {
    initGrid()
  }, [])

  useEffect(() => {
    const unsubscribeSwap = subscribeKeys(
      (state) => state.swap,
      (value) => {
        if (value) toggleCharacter()
      }
    )
    return () => unsubscribeSwap()
  }, [])

  return (
    <>
      <color args={ [ '#bdedfc']} attach="background"/>
      <Physics>
        <Lights />
        <Level count={blocksCount} seed={blocksSeed}/>
        <Character id="player" position={[0, 1, 0]} color="slateblue" />
        <Character id="ally-1" position={[-2, 1, 0]} color="orange" />
        <Character id="ally-2" position={[2, 1, 0]} color="mediumpurple" />
        <Character id="ally-3" position={[4, 1, 0]} color="blue" />
        <CameraController />
        <GridBaker />
        {/* <GridDebug /> */}
      </Physics>
    </>
  );
}
      