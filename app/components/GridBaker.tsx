import { useRapier } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import usePathfinding from "./stores/usePathfinding"
import useLevelStore from "./stores/useLevelStore"
import * as THREE from "three"

export default function GridBaker() {
    const { rapier, world } = useRapier()
    const grid = usePathfinding((state) => state.grid)
    const isBaking = useRef(false)

    // Debounce Timer
    const debounceTimer = useRef<NodeJS.Timeout | null>(null)

    const bake = () => {
        if (isBaking.current) return
        isBaking.current = true
        let updatedCount = 0

        // We iterate through all grid nodes
        // For each node, we cast a ray downwards to check for floor/obstacles
        
        const origin = new THREE.Vector3()
        const direction = { x: 0, y: -1, z: 0 }
        
        // Batch updates to avoid too many state changes
        const newGrid = [...usePathfinding.getState().grid.map(row => [...row])] // Deep copy for mutation
        
        // If grid is empty, maybe initGrid hasn't finished?
        if (newGrid.length === 0) {
             isBaking.current = false
             return
        }

        for (let z = 0; z < newGrid.length; z++) {
            for (let x = 0; x < newGrid[0].length; x++) {
                const node = newGrid[z][x]
                
                // Ray origin: Center of the grid cell, slightly above the highest possible floor
                origin.set(node.worldX, 5, node.worldZ)
                
                const ray = new rapier.Ray(origin, direction)
                // Increase maxToi to ensure we hit the floor even if slightly lower
                // Floor is usually at y ~ -0.1 to 0.
                const hit = world.castRay(ray, 20, true) 

                if (hit) {
                    const surfaceHeight = 5 - hit.timeOfImpact
                    
                    if (surfaceHeight > 0.2) { // Lower threshold for obstacles (was 1.0)
                        // Too high (Wall/Obstacle)
                        node.walkable = false
                        updatedCount++
                    } else if (surfaceHeight < -0.5) { // Adjusted threshold for pit (was -1.0)
                        // Too low (Pit)
                        node.walkable = false
                        updatedCount++
                    } else {
                        // Walkable Floor (around height 0)
                        node.walkable = true
                    }
                } else {
                    // No hit = Void/Pit
                    node.walkable = false
                    updatedCount++
                }
            }
        }
        
        // Bulk update the store
        usePathfinding.setState((state) => ({ 
            grid: newGrid, 
            gridVersion: state.gridVersion + 1 
        }))
        
        console.log(`🍞 Grid Baked! Updated ${updatedCount} nodes (blocked/void).`)
        isBaking.current = false
    }

    // Initial Bake
    useEffect(() => {
        const timeout = setTimeout(bake, 1000)
        return () => clearTimeout(timeout)
    }, []) // Run once on mount (after physics init)

    // Subscribe to Level Changes (Obstacles moved/added/removed)
    useEffect(() => {
        const unsubscribe = useLevelStore.subscribe(
            (state) => state.obstacles,
            () => {
                // Debounce the bake to avoid spamming while dragging (though dragging only updates on release now)
                if (debounceTimer.current) clearTimeout(debounceTimer.current)
                
                debounceTimer.current = setTimeout(() => {
                    bake()
                }, 100) // Small delay to ensure physics has updated
            }
        )
        return () => {
            unsubscribe()
            if (debounceTimer.current) clearTimeout(debounceTimer.current)
        }
    }, [])

    return null
}
