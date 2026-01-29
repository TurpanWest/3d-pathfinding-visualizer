import { useRapier } from "@react-three/rapier"
import { useEffect, useRef } from "react"
import usePathfinding from "./stores/usePathfinding"
import * as THREE from "three"

export default function GridBaker() {
    const { rapier, world } = useRapier()
    const grid = usePathfinding((state) => state.grid)
    const setNodeWalkable = usePathfinding((state) => state.setNodeWalkable)
    const isBaking = useRef(false)

    useEffect(() => {
        // Only bake once when the grid is initialized and physics is ready
        if (grid.length === 0 || isBaking.current) return

        const bake = () => {
            isBaking.current = true
            console.log("🍞 Baking navigation grid...")
            let updatedCount = 0

            // We iterate through all grid nodes
            // For each node, we cast a ray downwards to check for floor/obstacles
            
            const origin = new THREE.Vector3()
            const direction = { x: 0, y: -1, z: 0 }
            
            // Batch updates to avoid too many state changes
            const newGrid = [...grid.map(row => [...row])] // Deep copy for mutation

            for (let z = 0; z < grid.length; z++) {
                for (let x = 0; x < grid[0].length; x++) {
                    const node = newGrid[z][x]
                    
                    // Ray origin: Center of the grid cell, slightly above the highest possible floor
                    origin.set(node.worldX, 5, node.worldZ)
                    
                    const ray = new rapier.Ray(origin, direction)
                    // Increase maxToi to ensure we hit the floor even if slightly lower
                    // Floor is usually at y ~ -0.1 to 0.
                    const hit = world.castRay(ray, 20, true) 

                    if (hit) {
                        const surfaceHeight = 5 - hit.timeOfImpact
                        
                        // Debug log for the specific obstacle position (Adjusted for new obstacles)
                        // Wall at [-3.5, 0.5, 4]
                        if (Math.abs(node.worldX - (-3.5)) < 0.5 && Math.abs(node.worldZ - 4) < 0.5) {
                           console.log(`🔍 Checking Left Wall at (${node.worldX}, ${node.worldZ}). Hit height: ${surfaceHeight}`)
                        }

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
            
            console.log(`✅ Baking complete! Updated ${updatedCount} nodes.`)
        }

        // Delay slightly to ensure physics world is populated
        const timeout = setTimeout(bake, 1000) // Increased delay to 1s
        return () => clearTimeout(timeout)
        
    }, [grid, rapier, world]) // Removed setNodeWalkable dependency as we use setState directly

    return null
}