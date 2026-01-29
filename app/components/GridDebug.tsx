import { Instance, Instances } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import usePathfinding, { GRID_SIZE } from './stores/usePathfinding'

export default function GridDebug() {
    const grid = usePathfinding((state) => state.grid)
    const gridVersion = usePathfinding((state) => state.gridVersion) // Subscribe to version
    const initGrid = usePathfinding((state) => state.initGrid)

    useEffect(() => {
        initGrid()
    }, [])

    const nodes = useMemo(() => {
        if (!grid.length) return []
        return grid.flat()
    }, [grid, gridVersion]) // Re-calc when version changes

    // Force re-render when grid updates
    // const version = usePathfinding((state) => state.grid[0]?.[0]?.walkable) // This is a hacky way to subscribe to updates. 
    // Ideally we should use a version number in store.
    
    if (!nodes.length) {
        // console.log("GridDebug: No nodes to render")
        return null
    }

    // console.log(`GridDebug: Rendering ${nodes.length} nodes. Version: ${gridVersion}`)

    return (
        <group position={[0, 0.2, 0]}>
            <Instances range={nodes.length}>
                <planeGeometry args={[GRID_SIZE * 0.9, GRID_SIZE * 0.9]} />
                <meshBasicMaterial color="white" transparent opacity={0.5} depthWrite={false} side={THREE.DoubleSide} />
                {nodes.map((node, i) => (
                    <Instance
                        key={`${node.x}-${node.z}-${node.walkable}`} // Add walkable to key to force update
                        position={[node.worldX, 0, node.worldZ]}
                        rotation={[-Math.PI / 2, 0, 0]} // Rotate instances to lie flat
                        color={node.walkable ? "white" : "red"}
                    />
                ))}
            </Instances>
        </group>
    )
}