import { useFrame } from "@react-three/fiber"
import { useState } from "react"
import * as THREE from "three"
import useGame from "./stores/useGame"

export default function CameraController() {
    const activeCharacterId = useGame((state) => state.activeCharacterId)
    
    // We keep the smoothed position state here, persisting across character switches
    const [smoothedCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10))
    const [smoothedCameraTarget] = useState(() => new THREE.Vector3(0, 0, 0))

    useFrame((state, delta) => {
        // 1. Find the active character in the scene
        // We can't rely on Zustand position alone because it might be throttled (0.1s update)
        // We need smooth per-frame updates.
        // Since we named our RigidBodies in Character.tsx with `name={id}`, we can try to find them.
        // However, RigidBody adds a group/object. Let's hope we can find it.
        
        // Actually, Rapier RigidBody `name` prop might not propagate to the THREE.Object3D in the way we expect for easy querying if it's nested.
        // But let's try querying by name.
        
        const characterObject = state.scene.getObjectByName(activeCharacterId)
        
        if (characterObject) {
            // Get world position of the character
            // Note: RigidBody updates the mesh position, so this should be accurate.
            const bodyPosition = characterObject.getWorldPosition(new THREE.Vector3())

            // 2. Calculate desired camera position & target
            const cameraPosition = new THREE.Vector3()
            cameraPosition.copy(bodyPosition)
            cameraPosition.z += 5
            cameraPosition.y += 5

            const cameraTarget = new THREE.Vector3()
            cameraTarget.copy(bodyPosition)
            cameraTarget.y += 0.5 

            // 3. Smoothly lerp
            smoothedCameraPosition.lerp(cameraPosition, 5 * delta)
            smoothedCameraTarget.lerp(cameraTarget, 5 * delta)

            // 4. Apply to camera
            state.camera.position.copy(smoothedCameraPosition)
            state.camera.lookAt(smoothedCameraTarget)
        }
    })

    return null
}