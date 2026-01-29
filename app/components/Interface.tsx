import { useEffect, useRef } from 'react'
import { addEffect } from '@react-three/fiber'
import useGame from './stores/useGame'

export default function Interface()
{
    const time = useRef<HTMLDivElement>(null)
    const restart = useGame((state) => state.restart)
    const phase = useGame((state) => state.phase)
    const activeCharacterId = useGame((state) => state.activeCharacterId)

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
            case 'ally-1': return 'SCOUT'
            case 'ally-2': return 'HEAVY'
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
        <div ref={ time } className="time absolute top-[15%] right-[15%] py-[10px] flex text-grey text-3xl pointer-events-none font-bold tracking-widest">0.00</div>
        
        {/* Squad Status Panel */}
        <div className="absolute top-10 left-10 flex flex-col gap-4">
            <div className="text-white/80 text-sm font-bold tracking-widest mb-1">SQUAD STATUS</div>
            
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
                        className="w-10 h-10 rounded-full shadow-inner flex items-center justify-center font-bold text-white text-xs border-2 border-white/20"
                        style={{ backgroundColor: getCharacterColor(id) }}
                    >
                        {id === 'player' ? 'L' : id === 'ally-1' ? 'S' : 'H'}
                    </div>

                    {/* Info */}
                    <div className="flex flex-col">
                        <span className={`text-sm font-bold tracking-wide ${activeCharacterId === id ? 'text-white' : 'text-white/60'}`}>
                            {getCharacterRole(id)}
                        </span>
                        <span className="text-[10px] uppercase text-white/40 tracking-wider">
                            {activeCharacterId === id ? 'ACTIVE CONTROL' : 'AUTONOMOUS'}
                        </span>
                    </div>

                    {/* Key Hint */}
                    {activeCharacterId === id && (
                        <div className="ml-4 px-2 py-1 bg-white/10 rounded text-[10px] text-white/80 font-mono animate-pulse">
                            Q to Swap
                        </div>
                    )}
                </div>
            ))}
        </div>


        {phase === 'ended' ? <div className="restart absolute top-[40%] left-0 w-full py-[10px] bg-[#00000033] flex items-center justify-center text-white text-[80px] pointer-events-auto cursor-pointer" onClick={ restart }>RESTART</div> : null}
    </div>
 }