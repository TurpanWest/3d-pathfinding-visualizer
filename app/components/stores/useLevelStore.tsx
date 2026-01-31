import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import * as THREE from 'three'

export type ObstacleType = 'box' | 'dynamic'

export interface Obstacle {
    id: string
    type: ObstacleType
    position: [number, number, number]
    rotation: [number, number, number]
    scale: [number, number, number]
    materialColor: string
    // For dynamic obstacles
    movement?: {
        axis: 'x' | 'y' | 'z'
        speed: number
        range: number
    }
}

// Preset Interface for Sidebar
export interface ObstaclePreset {
    name: string
    type: ObstacleType
    scale: [number, number, number]
    materialColor: string
    movement?: {
        axis: 'x' | 'y' | 'z'
        speed: number
        range: number
    }
}

// Presets Definition
export const OBSTACLE_PRESETS: ObstaclePreset[] = [
    { name: 'Standard Box', type: 'box', scale: [1, 1, 1], materialColor: 'slategrey' },
    { name: 'Wide Wall', type: 'box', scale: [4, 1, 1], materialColor: 'slategrey' },
    { name: 'Tall Pillar', type: 'box', scale: [1, 3, 1], materialColor: 'slategrey' },
    { name: 'Dynamic (Y-Axis)', type: 'dynamic', scale: [2, 1, 1], materialColor: 'crimson', movement: { axis: 'y', speed: 2, range: 1.5 } },
    { name: 'Dynamic (Z-Axis)', type: 'dynamic', scale: [2, 1, 1], materialColor: 'royalblue', movement: { axis: 'z', speed: 1.5, range: 3 } },
]

interface LevelState {
    obstacles: Obstacle[]
    addObstacle: (obstacle: Obstacle) => void
    removeObstacle: (id: string) => void
    updateObstacle: (id: string, data: Partial<Obstacle>) => void

    // Selection state
    selectedObstacleId: string | null
    selectObstacle: (id: string | null) => void

    // Edit Mode
    isEditMode: boolean
    setEditMode: (mode: boolean) => void

    // Dragging New Object state
    draggedPreset: ObstaclePreset | null
    setDraggedPreset: (preset: ObstaclePreset | null) => void
}

const defaultObstacles: Obstacle[] = [
    // Wall 1: Dynamic (formerly Dynamic component)
    {
        id: 'wall-dynamic-1',
        type: 'dynamic',
        position: [-3.5, 0.5, 4],
        rotation: [0, 0, 0],
        scale: [4, 1, 1],
        materialColor: 'slategrey',
        movement: { axis: 'y', speed: 1, range: 1 }
    },
    // Wall 2: Right Barrier
    {
        id: 'wall-right-barrier',
        type: 'box',
        position: [3.5, 0.5, 7],
        rotation: [0, 0, 0],
        scale: [4, 1, 1],
        materialColor: 'slategrey'
    },
    // Wall 3: Center U-Shape Trap (Back)
    {
        id: 'wall-u-back',
        type: 'box',
        position: [0, 0.5, 12],
        rotation: [0, 0, 0],
        scale: [6, 1, 1],
        materialColor: 'slategrey'
    },
    // Wall 3: Center U-Shape Trap (Left Arm)
    {
        id: 'wall-u-left',
        type: 'box',
        position: [-2.5, 0.5, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 3],
        materialColor: 'slategrey'
    },
    // Wall 3: Center U-Shape Trap (Right Arm)
    {
        id: 'wall-u-right',
        type: 'box',
        position: [2.5, 0.5, 10],
        rotation: [0, 0, 0],
        scale: [1, 1, 3],
        materialColor: 'slategrey'
    },
    // Wall 4: Diagonal Wall
    {
        id: 'wall-diagonal',
        type: 'box',
        position: [-4, 0.5, 14],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 8],
        materialColor: 'slategrey'
    }
]

const useLevelStore = create<LevelState>()(subscribeWithSelector((set) => ({
    obstacles: defaultObstacles,
    addObstacle: (obstacle) => set((state) => ({ obstacles: [...state.obstacles, obstacle] })),
    removeObstacle: (id) => set((state) => ({ obstacles: state.obstacles.filter((o) => o.id !== id) })),
    updateObstacle: (id, data) => set((state) => ({
        obstacles: state.obstacles.map((o) => (o.id === id ? { ...o, ...data } : o))
    })),
    selectedObstacleId: null,
    selectObstacle: (id) => set({ selectedObstacleId: id }),

    // Edit Mode
    isEditMode: false,
    setEditMode: (mode) => set({ isEditMode: mode, selectedObstacleId: null }), // Clear selection on mode switch
    
    // Dragging New Object
    draggedPreset: null,
    setDraggedPreset: (preset) => set({ draggedPreset: preset })
})))

export default useLevelStore
