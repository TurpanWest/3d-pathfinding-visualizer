import { useRapier, RigidBody } from "@react-three/rapier"
import { useFrame } from "@react-three/fiber"
import { useKeyboardControls } from "@react-three/drei"
import { useState, useRef, useEffect} from 'react'
import * as THREE from 'three'
import useGame from "./stores/useGame"
import usePathfinding, { GridNode } from "./stores/usePathfinding"

interface CharacterProps {
    id: string
    position: [number, number, number]
    color?: string
}

export default function Character({ id, position, color = "slateblue" }: CharacterProps)
{
    const body = useRef<any>(null)
    const [subscribeKeys, getKeys ] = useKeyboardControls()
    const { rapier, world } = useRapier()
    
    // Game State
    const activeCharacterId = useGame((state) => state.activeCharacterId)
    const activeCharacterPosition = useGame((state) => state.activeCharacterPosition)
    const updateActivePosition = useGame((state) => state.updateActivePosition)
    const start = useGame((state) => state.start)
    const end = useGame((state) => state.end)
    const restart = useGame((state) => state.restart)
    
    const isActive = activeCharacterId === id

    // Pathfinding
    const findPath = usePathfinding((state) => state.findPath)
    const [path, setPath] = useState<GridNode[]>([])
    const [targetNode, setTargetNode] = useState<GridNode | null>(null)

    // Audio
    const [audio, setAudio] = useState<HTMLAudioElement | null>(null)
    const [jumpSound] = useState(() => new Audio('/jumping.wav'))

    useEffect(() => {
        const a = new Audio('/ballrolling.wav')
        a.loop = true
        setAudio(a)
        return () => {
            a.pause()
        }
    }, [])

    useEffect(() => {
        if(audio) {
            if (!isActive) {
                audio.volume = 0
                if (!audio.paused) audio.pause()
            }
        }
    }, [isActive, audio])

    const jump = () =>
    {
        const origin = body.current.translation()
        origin.y -= 0.31
        const direction = { x:0, y: -1, z:0}
        const ray = new rapier.Ray(origin, direction)
        const hit:any = world.castRay(ray, 10, true)

        if (hit.timeOfImpact < 0.15)
        {
            body.current.applyImpulse({ x:0, y:0.5, z:0})
            jumpSound.currentTime = 0
            jumpSound.play().catch(() => {})
        }
    }
    
    const reset = () =>
    {
        body.current.setTranslation({x: position[0], y: position[1], z: position[2]})
        body.current.setLinvel({x:0,y:0,z:0})
        body.current.setAngvel({x:0,y:0,z:0})
        setPath([])
        setTargetNode(null)
    }

    useEffect(() => 
    {
        const unsubscibeReset = useGame.subscribe(
            (state) => state.phase,
            (phase) => {
                if (phase === 'ready')
                    reset()
            },
        )
        
        const unsubscibeJump = subscribeKeys(
            (state) => state.jump, 
            (value) => {
                if(value && isActive) jump()
            }
        )

        const unsubscibeAny = subscribeKeys(() =>{
            if (isActive) start()
        })

        return () =>
        {
            unsubscibeJump()
            unsubscibeAny()
            unsubscibeReset()
        }
    }, [isActive]) 

    // Update Path (Only for Bots)
    useFrame((state) => {
        if (!body.current) return

        const currentPos = body.current.translation()

        // 1. If Active: Broadcast position
        if (isActive) {
            // Update global position less frequently to save performance (e.g., every 5 frames or using a ref for time)
            // But for smooth following, Zustand might be too slow if updated every frame.
            // Let's use a throttle logic or just update it. For 3 characters, per-frame zustand update is surprisingly okay, 
            // but let's throttle it slightly to be safe.
            if (state.clock.getElapsedTime() % 0.1 < 0.02) {
                 updateActivePosition([currentPos.x, currentPos.y, currentPos.z])
            }
        } 
        // 2. If Bot: Find path to Active Player
        else {
            // Calculate path to active player every 0.5s
            if (state.clock.getElapsedTime() % 0.5 < 0.02) {
                // Don't follow if too close (prevent pushing)
                const distToTarget = Math.sqrt(
                    Math.pow(currentPos.x - activeCharacterPosition[0], 2) + 
                    Math.pow(currentPos.z - activeCharacterPosition[2], 2)
                )

                if (distToTarget > 2) { // Stop if within 2 units
                    const newPath = findPath(currentPos.x, currentPos.z, activeCharacterPosition[0], activeCharacterPosition[2])
                    if (newPath.length > 0) {
                        setPath(newPath)
                    }
                } else {
                    setPath([]) // Stop moving
                }
            }
        }
    })

    useFrame((state, delta) =>
    {
        if (!body.current) return

        const bodyPosition = body.current.translation()

        // 1. Controls (Only if Active)
        if (isActive) {
            const { forward, backward, leftward, rightward } = getKeys()

            const impulse = { x:0, y:0, z:0 }
            const torque = { x:0, y:0, z:0 }

            const impulseStrength = 0.6 * delta
            const torqueStrength = 0.2 * delta

            if(forward) { impulse.z -= impulseStrength; torque.x -= torqueStrength }
            if(backward) { impulse.z += impulseStrength; torque.x += torqueStrength }
            if(leftward) { impulse.x -= impulseStrength; torque.z += torqueStrength }
            if(rightward) { impulse.x += impulseStrength; torque.z -= torqueStrength }

            body.current.applyImpulse(impulse)
            body.current.applyTorqueImpulse(torque)
        } else {
            // Reset initialization flag so next time it becomes active, it syncs with current camera
            // hasInitializedCamera.current = false
            
            // AI Movement (Follow Path)
            if (path.length > 1) {
                const nextNode = path[1] // path[0] is current node
                // Add a small random offset to prevent stacking perfectly on top of each other
                // ideally this should be based on agent ID but random is fine for now
                const targetX = nextNode.worldX
                const targetZ = nextNode.worldZ

                const dx = targetX - bodyPosition.x
                const dz = targetZ - bodyPosition.z
                
                const distance = Math.sqrt(dx*dx + dz*dz)
                
                // Increase acceptance radius to avoid jitter when close to node
                if (distance > 0.4) {
                    // Steering: Seek
                    const speed = 6 // Max speed
                    const desiredVelocity = {
                        x: (dx / distance) * speed,
                        z: (dz / distance) * speed
                    }

                    const currentVel = body.current.linvel()
                    
                    // Stronger force to correct path deviation
                    const forceStrength = 5.0 * delta
                    const impulse = {
                        x: (desiredVelocity.x - currentVel.x) * forceStrength,
                        y: 0,
                        z: (desiredVelocity.z - currentVel.z) * forceStrength
                    }
                    
                    body.current.applyImpulse(impulse)
                } else {
                    // Reached node, remove it
                    setPath((prev) => prev.slice(1))
                }
            } else {
                // No path or reached end: Apply braking friction to stop sliding
                const currentVel = body.current.linvel()
                body.current.applyImpulse({
                    x: -currentVel.x * 2.0 * delta,
                    y: 0,
                    z: -currentVel.z * 2.0 * delta
                })
            }
        }
        
        // Audio Control
        if (audio && isActive) {
            const currentVel = body.current.linvel()
            const speed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z)
            
            const maxSpeed = 5
            const volume = Math.min(speed / maxSpeed, 1)
            audio.volume = volume

            // Check if character is on ground
            const origin = body.current.translation()
            origin.y -= 0.31
            const direction = { x:0, y: -1, z:0}
            const ray = new rapier.Ray(origin, direction)
            const hit:any = world.castRay(ray, 10, true)
            const isGrounded = hit && hit.timeOfImpact < 0.15

            if (speed > 0.5 && isGrounded) {
                if (audio.paused) audio.play().catch(() => {})
            } else {
                if (!audio.paused) audio.pause()
            }
        }

        // 3. Game Logic (Win/Lose)
        // if (bodyPosition.z < -(blocksCount * 4 + 2))
        // {
        //     end()
        // }
        if (bodyPosition.y < -4)
        {
            restart()
        }
    })

    return <RigidBody 
        ref={body} 
        name={id} // Add name for querying
        canSleep={false} 
        colliders="ball" 
        restitution={0.2} 
        friction={1} 
        linearDamping={0.5} 
        angularDamping={0.5} 
        position={position}
    >
        <mesh castShadow>
            <icosahedronGeometry args={[0.3,1]} />
            <meshStandardMaterial flatShading color={color} emissive={isActive ? color : "black"} emissiveIntensity={isActive ? 0.5 : 0} />
        </mesh>
    </RigidBody>
}