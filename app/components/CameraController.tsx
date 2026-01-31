import { useFrame } from "@react-three/fiber"
import { useState } from "react"
import * as THREE from "three"
import useGame from "./stores/useGame"
import useLevelStore from "./stores/useLevelStore"

export default function CameraController() {
    const activeCharacterId = useGame((state) => state.activeCharacterId)
    const isEditMode = useLevelStore((state) => state.isEditMode)
    
    // We keep the smoothed position state here, persisting across character switches
    const [smoothedCameraPosition] = useState(() => new THREE.Vector3(10, 10, 10))
    const [smoothedCameraTarget] = useState(() => new THREE.Vector3(0, 0, 0))

    useFrame((state, delta) => {
        
        let targetPosition = new THREE.Vector3()
        let targetLookAt = new THREE.Vector3()

        if (isEditMode) {
            // Edit Mode: Top-down view
            // High altitude, centered on the map (or roughly 0,0,0)
            targetPosition.set(0, 40, 0)
            targetLookAt.set(0, 0, 0)
            
            // We can still smooth the transition
            smoothedCameraPosition.lerp(targetPosition, 2 * delta)
            smoothedCameraTarget.lerp(targetLookAt, 2 * delta)

            state.camera.position.copy(smoothedCameraPosition)
            state.camera.lookAt(smoothedCameraTarget)

        } else {
            // Play Mode: Follow Character
            const characterObject = state.scene.getObjectByName(activeCharacterId)
            
            if (characterObject) {
                const bodyPosition = characterObject.getWorldPosition(new THREE.Vector3())
    
                targetPosition.copy(bodyPosition)
                targetPosition.z += 5
                targetPosition.y += 5
    
                targetLookAt.copy(bodyPosition)
                targetLookAt.y += 0.5 
    
                // 3. Smoothly lerp
                smoothedCameraPosition.lerp(targetPosition, 5 * delta)
                smoothedCameraTarget.lerp(targetLookAt, 5 * delta)
    
                // 4. Apply to camera
                state.camera.position.copy(smoothedCameraPosition)
                state.camera.lookAt(smoothedCameraTarget)
            }
        }
    })

    return null
}
