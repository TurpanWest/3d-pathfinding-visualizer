import * as THREE from "three"
import { CuboidCollider, RigidBody, RapierRigidBody } from "@react-three/rapier"
import { useMemo, useState, useRef } from "react"
import { useFrame } from "@react-three/fiber";
import { Float, Text, useGLTF } from "@react-three/drei";
import { Model as SpeakerModel } from './model/Speaker'
import { PositionalAudio } from "@react-three/drei"
import useLevelStore, { Obstacle } from "./stores/useLevelStore";


const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const floor1Material = new THREE.MeshStandardMaterial({color: "limegreen"});
const floor2Material = new THREE.MeshStandardMaterial({color: "greenyellow"});
const floor3Material = new THREE.MeshStandardMaterial({color: "whitegrey"});
const wallMaterial = new THREE.MeshStandardMaterial({color: "slategrey"});
const selectedMaterial = new THREE.MeshStandardMaterial({color: "orange"});


export function BlockStart({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    return <group position= {position}>
        <Float floatIntensity={0.25} rotationIntensity={0.25}>
            <Text 
                font="bebas-neue-v9-latin-regular.woff" 
                scale={0.40} 
                lineHeight={1.2} 
                letterSpacing={0.06} 
                textAlign="center" 
                position={[0.75, 1.2,  -0.4]} 
                rotation-y={-0.25}
                color="white"
            >
                WASD / Arrows to Move{"\n"}
                Space to Jump{"\n"}
                Q to Swap Ball
                <meshBasicMaterial toneMapped={false}/>
            </Text>
        </Float>
        <mesh 
        geometry={boxGeometry}
        material={floor1Material} 
        position={ [ 0, -0.1, 0] } 
        scale={[ 8, 0.2, 8 ]} 
        receiveShadow
        />
    </group>
}

function DynamicObstacle({ obstacle }: { obstacle: Obstacle }) {
    const rigidBody = useRef<RapierRigidBody>(null)
    const [timeOffset] = useState(() => Math.random() * Math.PI * 2)

    const isSelected = useLevelStore((state) => state.selectedObstacleId === obstacle.id)
    const selectObstacle = useLevelStore((state) => state.selectObstacle)
    const updateObstacle = useLevelStore((state) => state.updateObstacle)
    const isEditMode = useLevelStore((state) => state.isEditMode)
    
    // Drag state
    const [isDragging, setIsDragging] = useState(false)
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5), [])
    const planeIntersect = new THREE.Vector3()

    useFrame((state) => {
        if (!rigidBody.current) return
        
        // --- Drag Logic ---
        if (isDragging && isEditMode) {
            state.raycaster.setFromCamera(state.pointer, state.camera)
            state.raycaster.ray.intersectPlane(dragPlane, planeIntersect)
            
            // Constrain movement if needed? For now, free XZ movement
            const nextPos = {
                x: planeIntersect.x,
                y: 0.5, // Keep fixed height
                z: planeIntersect.z
            }
            
            // If dragging, we override the animation for X/Z but we might want to keep the "wave" logic?
            // User said "Direct Drag", implying they control the position.
            // If we drag a dynamic object, we probably want to move its BASE position.
            // But visually, the object is at Base + Wave.
            // If we set the object to Mouse Pos, we are setting (Base + Wave) = Mouse.
            // So Base = Mouse - Wave.
            
            const time = state.clock.getElapsedTime()
            const speed = obstacle.movement?.speed || 1
            const range = obstacle.movement?.range || 1
            const axis = obstacle.movement?.axis || 'y'
            const waveOffset = Math.sin(time * speed + timeOffset) * range
            
            if (axis === 'x') nextPos.x -= waveOffset
            if (axis === 'y') nextPos.y -= waveOffset // Should usually be 0 offset for y since we clamp y=0.5
            if (axis === 'z') nextPos.z -= waveOffset
            
            rigidBody.current.setNextKinematicTranslation({
                x: planeIntersect.x, // We want the object VISUALLY at mouse
                y: 0.5,
                z: planeIntersect.z
            })
            
            // We don't update store here to avoid re-renders
            return 
        }

        // --- Normal Animation Logic (when not dragging) ---
        if (obstacle.movement) {
            const time = state.clock.getElapsedTime()
            const speed = obstacle.movement.speed || 1
            const range = obstacle.movement.range || 1
            const axis = obstacle.movement.axis || 'y'
            
            const offset = Math.sin(time * speed + timeOffset) * range
            
            const currentPos = obstacle.position
            const nextPos = {
                x: currentPos[0],
                y: currentPos[1],
                z: currentPos[2]
            }
            
            if (axis === 'x') nextPos.x += offset
            if (axis === 'y') nextPos.y += offset
            if (axis === 'z') nextPos.z += offset
    
            rigidBody.current.setNextKinematicTranslation(nextPos)
        }
    })

    return (
        <RigidBody 
            ref={rigidBody} 
            type="kinematicPosition" 
            position={obstacle.position} 
            rotation={obstacle.rotation}
            colliders="cuboid"
        >
            <mesh 
                geometry={boxGeometry} 
                material={isSelected ? selectedMaterial : wallMaterial} 
                scale={obstacle.scale} 
                castShadow 
                onPointerDown={(e) => {
                    if (!isEditMode) return // Only allow interaction in Edit Mode
                    e.stopPropagation()
                    selectObstacle(obstacle.id)
                    setIsDragging(true)
                    // e.target.setPointerCapture(e.pointerId) // Not strictly needed with useFrame raycasting
                    document.body.style.cursor = 'grabbing'
                }}
                onPointerUp={(e) => {
                    if (!isEditMode) return 
                    e.stopPropagation()
                    setIsDragging(false)
                    document.body.style.cursor = 'auto'
                    
                    // Commit final position to store
                    // We need to calculate the "Base" position
                    // Current visual pos is at planeIntersect (approximately)
                    // Base = Visual - Wave
                    
                    // We re-calculate the intersection to be sure
                    const raycaster = new THREE.Raycaster()
                    raycaster.setFromCamera(e.pointer, e.camera) // e.pointer is normalized
                    // Note: e.pointer in r3f event is same as state.pointer
                    const target = new THREE.Vector3()
                    raycaster.ray.intersectPlane(dragPlane, target)

                    // Calculate wave offset at this moment
                    // We need access to time... using performance.now?
                    // Or just use the target as the new base and let the wave jump?
                    // To be precise:
                    // We want Base such that Base + Wave = Target
                    // So Base = Target - Wave
                    
                    // Since we can't easily access the exact render time here without hooks,
                    // let's just set the base position to the Target.
                    // This means the object might "jump" by the wave amount when released, 
                    // or rather, the wave will continue from this new center.
                    // This is acceptable for a prototype.
                    
                    updateObstacle(obstacle.id, { 
                        position: [target.x, 0.5, target.z] 
                    })
                }}
            />
        </RigidBody>
    )
}

function StaticObstacle({ obstacle }: { obstacle: Obstacle }) {
    const isSelected = useLevelStore((state) => state.selectedObstacleId === obstacle.id)
    const selectObstacle = useLevelStore((state) => state.selectObstacle)
    const updateObstacle = useLevelStore((state) => state.updateObstacle)
    const isEditMode = useLevelStore((state) => state.isEditMode)
    
    // Drag state
    const [isDragging, setIsDragging] = useState(false)
    const rigidBody = useRef<RapierRigidBody>(null)
    const dragPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.5), [])
    const planeIntersect = new THREE.Vector3()

    useFrame((state) => {
        if (!isDragging || !rigidBody.current || !isEditMode) return
        
        state.raycaster.setFromCamera(state.pointer, state.camera)
        state.raycaster.ray.intersectPlane(dragPlane, planeIntersect)
        
        rigidBody.current.setNextKinematicTranslation({
            x: planeIntersect.x,
            y: 0.5,
            z: planeIntersect.z
        })
    })

    return (
        <RigidBody 
            ref={rigidBody}
            type="kinematicPosition" // Changed to kinematic to allow movement
            position={obstacle.position} 
            rotation={obstacle.rotation}
            colliders="cuboid"
        >
            <mesh 
                geometry={boxGeometry} 
                material={isSelected ? selectedMaterial : wallMaterial} 
                scale={obstacle.scale} 
                castShadow 
                onPointerDown={(e) => {
                    if (!isEditMode) return 
                    e.stopPropagation()
                    selectObstacle(obstacle.id)
                    setIsDragging(true)
                    document.body.style.cursor = 'grabbing'
                }}
                onPointerUp={(e) => {
                    if (!isEditMode) return 
                    e.stopPropagation()
                    setIsDragging(false)
                    document.body.style.cursor = 'auto'
                    
                    // Re-calculate intersection for precision
                    const raycaster = new THREE.Raycaster()
                    raycaster.setFromCamera(e.pointer, e.camera)
                    const target = new THREE.Vector3()
                    raycaster.ray.intersectPlane(dragPlane, target)

                    updateObstacle(obstacle.id, { 
                        position: [target.x, 0.5, target.z] 
                    })
                }}
            />
        </RigidBody>
    )
}

export function Obstacles(){
    const obstacles = useLevelStore((state) => state.obstacles)

    return <group>
        {obstacles.map((obstacle) => {
            if (obstacle.type === 'dynamic') {
                return <DynamicObstacle key={obstacle.id} obstacle={obstacle} />
            }
            return <StaticObstacle key={obstacle.id} obstacle={obstacle} />
        })}
    </group>
}

export function Floor()
{
    const selectObstacle = useLevelStore((state) => state.selectObstacle)
    const isEditMode = useLevelStore((state) => state.isEditMode)

    return <group>
        <RigidBody type='fixed' restitution={0.2} friction={0}>
            <mesh 
            geometry={boxGeometry}
            material={floor3Material} 
            position={ [ 0, -0.1, 0] } 
            scale={[ 40, 0.1, 40 ]} 
            receiveShadow
            onClick={(e) => {
                if (!isEditMode) return 
                e.stopPropagation()
                selectObstacle(null)
            }}
            />
        </RigidBody>
    </group>
}

export function Bounds({length =1})
{
    return <RigidBody type='fixed' restitution={0.2} friction={0}>
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ length, 1.4, 0] } 
        scale={[ 0.3, 3, 2 * length ]} 
        castShadow
        />
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ -length, 1.4, 0] } 
        scale={[ 0.3, 3, 2 * length ]} 
        receiveShadow
        />
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ 0, 0.75, -length] } 
        scale={[ 2 * length, 4, 0.2 ]} 
        receiveShadow
        />
        <CuboidCollider 
            args={[length, 2, 0.1]} 
            position={[ 0, 0.5, length]} 
        />
    </RigidBody>
}

export function Speaker({position = [0, 0, 0], rotation = [0, 0, 0]}: {position?: [number, number, number], rotation?: [number, number, number]}) 
{
  const speakerRef = useRef<any>(null)

      return (
        <group position={position}>
            <RigidBody>
                <SpeakerModel 
                    rotation={[rotation[0], rotation[1], rotation[2]]}
                    scale={[1, 1, 1]}
                >
                <PositionalAudio
                url='/bgm.mp3'
                loop
                autoplay={true}
                distance={3}
                ref={speakerRef} 
                />
                </SpeakerModel>
            </RigidBody>
        </group>
  )
}

export function Level() 
{

    return <>       
        <BlockStart position={[0,0,0]}/> 
        <Obstacles />
        <Floor />
        <Bounds length={ 20 }/>
        {/* <Speaker position={[-10, -3, -15]} rotation={[0, Math.PI/6, 0]}/> */}

    </>
}
