import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface GameState 
{
    blocksCount: number
    blocksSeed:number
    phase:any
    startTime: number
    endTime: number
    activeCharacterId: string
    activeCharacterPosition: [number, number, number]
    characterIds: string[]
    start: () => void
    restart: () => void
    end: () => void
    toggleCharacter: () => void
    updateActivePosition: (pos: [number, number, number]) => void
}

const useGame = create<GameState>()( subscribeWithSelector((set, get) => ({
    blocksCount: 10,
    blocksSeed:0,
    phase:'ready',
    startTime:0,
    endTime:0,
    activeCharacterId: 'player',
    activeCharacterPosition: [0, 1, 0],
    characterIds: ['player', 'ally-1', 'ally-2'],

    start :()=> 
        {
            set((state) => 
                {
                    if (state.phase === 'ready')
                        {
                            return { phase: 'playing', startTime: Date.now()}
                        } 
                    return { }

                })
        },
    
    restart :()=> 
        {
            set((state) => 
                {
                    if (state.phase === 'playing' || state.phase === 'ended' )
                        {
                            return { phase: 'ready' , blocksSeed: Math.random(), activeCharacterId: 'player'}
                        } 
                    return { }
                })
        },
        
    end :()=> 
        {
            set((state) => 
                {
                    if (state.phase === 'playing' )
                        {
                            return { phase: 'ended', endTime: Date.now()}
                        } 
                    return { }
                })
        },

    toggleCharacter: () => {
        set((state) => {
            const currentIndex = state.characterIds.indexOf(state.activeCharacterId)
            const nextIndex = (currentIndex + 1) % state.characterIds.length
            return { activeCharacterId: state.characterIds[nextIndex] }
        })
    },

    updateActivePosition: (pos) => {
        set({ activeCharacterPosition: pos })
    }
})))

export default useGame