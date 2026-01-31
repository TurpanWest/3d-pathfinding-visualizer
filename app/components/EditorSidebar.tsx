import React from 'react'
import useLevelStore, { OBSTACLE_PRESETS, ObstaclePreset } from './stores/useLevelStore'

export default function EditorSidebar() {
    const isEditMode = useLevelStore((state) => state.isEditMode)
    const setDraggedPreset = useLevelStore((state) => state.setDraggedPreset)

    if (!isEditMode) return null

    return (
        <div className="fixed top-24 right-10 w-64 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex flex-col gap-4 pointer-events-auto shadow-xl max-h-[80vh] overflow-y-auto">
            <h3 className="text-white font-bold tracking-widest uppercase text-center border-b border-white/10 pb-2">Add Object</h3>
            
            <div className="flex flex-col gap-3">
                {OBSTACLE_PRESETS.map((preset, index) => (
                    <div 
                        key={index}
                        className="bg-black/20 hover:bg-white/10 transition-colors rounded-lg p-3 cursor-grab active:cursor-grabbing border border-transparent hover:border-white/30 flex items-center gap-3 group"
                        onPointerDown={() => setDraggedPreset(preset)}
                    >
                        {/* Simple CSS Preview */}
                        <div 
                            className="w-10 h-10 rounded shadow-inner border border-white/10 flex items-center justify-center"
                            style={{ backgroundColor: preset.materialColor }}
                        >
                           {/* Mini shape representation */}
                           <div 
                                style={{ 
                                    width: `${Math.min(preset.scale[0] * 4, 32)}px`, 
                                    height: `${Math.min(preset.scale[1] * 4, 32)}px`,
                                    backgroundColor: 'rgba(255,255,255,0.8)' 
                                }} 
                            />
                        </div>
                        
                        <div className="flex flex-col">
                            <span className="text-white text-sm font-bold group-hover:text-orange-300 transition-colors">{preset.name}</span>
                            <span className="text-white/50 text-[10px] uppercase">{preset.type}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-white/40 text-[10px] text-center mt-2 italic">
                Drag and drop to place
            </div>
        </div>
    )
}
