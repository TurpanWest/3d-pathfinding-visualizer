import { useEffect, useRef } from 'react'
import { addEffect } from '@react-three/fiber'
import useGame from './stores/useGame'
import useLevelStore from './stores/useLevelStore'

import EditorSidebar from './EditorSidebar'

export default function Interface()
{
    const time = useRef<HTMLDivElement>(null)
    const restart = useGame((state) => state.restart)
    const phase = useGame((state) => state.phase)
    const activeCharacterId = useGame((state) => state.activeCharacterId)

    const isEditMode = useLevelStore((state) => state.isEditMode)
    const setEditMode = useLevelStore((state) => state.setEditMode)
    const removeObstacle = useLevelStore((state) => state.removeObstacle)
    const updateObstacle = useLevelStore((state) => state.updateObstacle)
    const selectedObstacleId = useLevelStore((state) => state.selectedObstacleId)
    const selectObstacle = useLevelStore((state) => state.selectObstacle)

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isEditMode) return

            // Delete Object
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedObstacleId) {
                    removeObstacle(selectedObstacleId)
                    selectObstacle(null)
                }
            }

            // Rotate Object (R key)
            if (e.key.toLowerCase() === 'r') {
                if (selectedObstacleId) {
                    const obstacles = useLevelStore.getState().obstacles
                    const obstacle = obstacles.find(o => o.id === selectedObstacleId)
                    if (obstacle) {
                        const currentRotation = obstacle.rotation
                        updateObstacle(selectedObstacleId, {
                            rotation: [
                                currentRotation[0],
                                currentRotation[1] + Math.PI / 2,
                                currentRotation[2]
                            ]
                        })
                    }
                }
            }
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isEditMode, selectedObstacleId]) // Dependencies for effect

    // Helper to get color based on ID
    const getCharacterColor = (id: string) => {
        switch(id) {
            case 'player': return 'slateblue'
            case 'ally-1': return 'orange'
            case 'ally-2': return 'pink'
            default: return 'white'
        }
    }

    // Helper to get role name
    const getCharacterRole = (id: string) => {
        switch(id) {
            case 'player': return 'LEADER'
            case 'ally-1': return 'Astar'
            case 'ally-2': return 'Dijkstra'
            default: return 'UNIT'
        }
    }

    useEffect(() => 
        {
            const unsubscibeEffect = addEffect(() =>
                {
                    const state = useGame.getState()

                    let elapsedTime = 0

                    if(state.phase === 'playing')
                        elapsedTime = Date.now() - state.startTime
                    else if(state.phase === 'ended')
                        elapsedTime = state.endTime - state.startTime

                    elapsedTime = elapsedTime / 1000
                    const formattedTime = elapsedTime.toFixed(2)
                    if(time.current) {
                        time.current.textContent = formattedTime
                    }
                })
            
            return() => 
                {
                    unsubscibeEffect()
                }
        },[])

    return <div className="interface fixed inset-0 w-full h-full font-sans font-normal pointer-events-none">
        
        {/* Top Right Controls */}
        <div className="absolute top-10 right-10 flex gap-4 pointer-events-auto">
             <button 
                className={`
                    px-6 py-2 rounded-lg font-bold uppercase tracking-wider transition-all duration-300 shadow-lg
                    ${isEditMode 
                        ? 'bg-orange-500 text-white hover:bg-orange-600 ring-4 ring-orange-300' 
                        : 'bg-white text-[#404040] hover:bg-gray-100'}
                `}
                onClick={(e) => {
                    setEditMode(!isEditMode)
                    e.currentTarget.blur()
                }}
            >
                {isEditMode ? 'Editing Mode' : 'Play Mode'}
            </button>
        </div>

        <div className="absolute top-10 left-10 flex flex-col gap-4">
            <div className="text-[#404040] text-xl font-bold tracking-widest mb-4">Time</div>
            <div ref={ time } className="time absolute py-2.5 flex text-[#404040] text-2xl pointer-events-none font-bold tracking-widest mt-4">0.00</div>
            
            {['player', 'ally-1', 'ally-2'].map((id) => (
                <div 
                    key={id}
                    className={`
                        flex items-center gap-4 p-3 rounded-lg transition-all duration-300 border-l-4 backdrop-blur-md
                        ${activeCharacterId === id 
                            ? 'bg-white/20 border-white scale-105 shadow-lg translate-x-2' 
                            : 'bg-black/20 border-transparent opacity-70'}
                    `}
                >
                    {/* Character Avatar/Color */}
                    <div 
                        className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center font-bold text-[#404040] text-xs border-2 border-white/20"
                        style={{ backgroundColor: getCharacterColor(id) }}
                    >
                        {id === 'player' ? '1' : id === 'ally-1' ? '2' : '3'}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <span className={`text-sm font-bold tracking-wide ${activeCharacterId === id ? 'text-[#404040]' : 'text-white/60'}`}>
                            {getCharacterRole(id)}
                        </span>
                        <span className="text-[10px] uppercase text-[#404040] tracking-wider">
                            {activeCharacterId === id ? 'ACTIVE CONTROL' : 'AUTONOMOUS'}
                        </span>
                    </div>

                </div>
            ))}
        </div>


        {phase === 'ended' ? <div className="restart absolute top-[40%] left-0 w-full py-2.5 bg-[#00000033] flex items-center justify-center text-white text-[80px] pointer-events-auto cursor-pointer" onClick={ restart }>RESTART</div> : null}
        
        {/* Editor Sidebar */}
        <EditorSidebar />
    </div>
 }
