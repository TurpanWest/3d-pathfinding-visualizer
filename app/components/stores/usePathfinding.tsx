import * as THREE from 'three'
import { create } from 'zustand'

// Grid configuration
export const GRID_SIZE = 1 // Size of each grid cell
export const MAP_WIDTH = 40 // Total width of the map
export const MAP_HEIGHT = 40 // Total height of the map
export const OFFSET_X = -MAP_WIDTH / 2
export const OFFSET_Z = -MAP_HEIGHT / 2

// Node status for A*
export interface GridNode {
    x: number
    z: number
    worldX: number
    worldZ: number
    walkable: boolean
    cost: number // Movement cost (1 for normal floor)
}

interface PathfindingState {
    grid: GridNode[][]
    gridVersion: number // Add version to force updates
    initGrid: () => void
    updateNode: (worldX: number, worldZ: number, walkable: boolean) => void
    worldToGrid: (worldX: number, worldZ: number) => { x: number, z: number } | null
    findPath: (startX: number, startZ: number, endX: number, endZ: number) => GridNode[]
    setNodeWalkable: (gridX: number, gridZ: number, walkable: boolean) => void
}

const usePathfinding = create<PathfindingState>((set, get) => ({
    grid: [],
    gridVersion: 0,

    initGrid: () => {
        const rows = Math.ceil(MAP_HEIGHT / GRID_SIZE)
        const cols = Math.ceil(MAP_WIDTH / GRID_SIZE)
        const newGrid: GridNode[][] = []

        console.log(`🗺️ Initializing Grid: ${cols}x${rows} at offset (${OFFSET_X}, ${OFFSET_Z})`)

        for (let z = 0; z < rows; z++) {
            const row: GridNode[] = []
            for (let x = 0; x < cols; x++) {
                row.push({
                    x,
                    z,
                    worldX: OFFSET_X + x * GRID_SIZE + GRID_SIZE / 2,
                    worldZ: OFFSET_Z + z * GRID_SIZE + GRID_SIZE / 2,
                    walkable: true, 
                    cost: 1
                })
            }
            newGrid.push(row)
        }
        set({ grid: newGrid })
    },

    setNodeWalkable: (gridX, gridZ, walkable) => {
        set((state) => {
            const newGrid = [...state.grid]
            if (newGrid[gridZ] && newGrid[gridZ][gridX]) {
                // Create a shallow copy of the row to trigger React updates properly if needed
                // But for performance in large grids, we might mutate or use Immer. 
                // Here, let's just mutate the object property for speed, but clone the row array to trigger Zustand.
                
                // Actually, deep cloning the whole grid is too slow.
                // We just need to update the specific node.
                newGrid[gridZ] = [...newGrid[gridZ]]
                newGrid[gridZ][gridX] = { ...newGrid[gridZ][gridX], walkable }
                return { grid: newGrid, gridVersion: state.gridVersion + 1 }
            }
            return {}
        })
    },

    worldToGrid: (worldX, worldZ) => {
        const x = Math.floor((worldX - OFFSET_X) / GRID_SIZE)
        const z = Math.floor((worldZ - OFFSET_Z) / GRID_SIZE)

        const rows = Math.ceil(MAP_HEIGHT / GRID_SIZE)
        const cols = Math.ceil(MAP_WIDTH / GRID_SIZE)

        if (x >= 0 && x < cols && z >= 0 && z < rows) {
            return { x, z }
        }
        return null
    },

    updateNode: (worldX, worldZ, walkable) => {
        const { grid, worldToGrid } = get()
        const coords = worldToGrid(worldX, worldZ)
        
        if (coords) {
            const newGrid = [...grid]
            newGrid[coords.z][coords.x] = {
                ...newGrid[coords.z][coords.x],
                walkable
            }
            set({ grid: newGrid })
        }
    },

    findPath: (startX: number, startZ: number, endX: number, endZ: number) => {
        const { grid, worldToGrid } = get()

        if (grid.length === 0) return []

        const startNode = worldToGrid(startX, startZ)
        const endNode = worldToGrid(endX, endZ)

        if (!startNode || !endNode) return []

        const openSet: GridNode[] = []
        const closedSet: Set<string> = new Set()
        const cameFrom: Map<string, GridNode> = new Map()
        
        // gScore: cost from start to current node
        const gScore: Map<string, number> = new Map()
        
        // fScore: gScore + heuristic cost to end
        const fScore: Map<string, number> = new Map()

        const startKey = `${startNode.x},${startNode.z}`
        gScore.set(startKey, 0)
        fScore.set(startKey, Math.abs(startNode.x - endNode.x) + Math.abs(startNode.z - endNode.z))
        
        openSet.push(grid[startNode.z][startNode.x])

        while (openSet.length > 0) {
            // Find node with lowest fScore
            openSet.sort((a, b) => {
                const fA = fScore.get(`${a.x},${a.z}`) ?? Infinity
                const fB = fScore.get(`${b.x},${b.z}`) ?? Infinity
                return fA - fB
            })
            
            const current = openSet.shift()!
            const currentKey = `${current.x},${current.z}`

            if (current.x === endNode.x && current.z === endNode.z) {
                // Reconstruct path
                const path: GridNode[] = []
                let curr: GridNode | undefined = current
                while (curr) {
                    path.unshift(curr)
                    const key = `${curr.x},${curr.z}`
                    curr = cameFrom.get(key)
                }
                return path
            }

            closedSet.add(currentKey)

            // Neighbors (Up, Down, Left, Right)
            const neighbors = [
                { x: 0, z: -1 }, { x: 0, z: 1 },
                { x: -1, z: 0 }, { x: 1, z: 0 }
            ]

            for (const offset of neighbors) {
                const neighborX = current.x + offset.x
                const neighborZ = current.z + offset.z

                if (neighborX >= 0 && neighborX < grid[0].length &&
                    neighborZ >= 0 && neighborZ < grid.length) {
                    
                    const neighbor = grid[neighborZ][neighborX]
                    const neighborKey = `${neighbor.x},${neighbor.z}`

                    if (!neighbor.walkable || closedSet.has(neighborKey)) continue

                    const tentativeGScore = (gScore.get(currentKey) ?? Infinity) + neighbor.cost

                    if (tentativeGScore < (gScore.get(neighborKey) ?? Infinity)) {
                        cameFrom.set(neighborKey, current)
                        gScore.set(neighborKey, tentativeGScore)
                        fScore.set(neighborKey, tentativeGScore + (Math.abs(neighbor.x - endNode.x) + Math.abs(neighbor.z - endNode.z))) // Manhattan Distance

                        if (!openSet.includes(neighbor)) {
                            openSet.push(neighbor)
                        }
                    }
                }
            }
        }
        return []
    }
}))

export default usePathfinding