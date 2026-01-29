import * as THREE from "three"
import { CuboidCollider, RigidBody } from "@react-three/rapier"
import { useMemo, useState, useRef } from "react"
import { useFrame } from "@react-three/fiber";
import { Float, Text, useGLTF } from "@react-three/drei";
import { Model as SpeakerModel } from './model/Speaker'
import { PositionalAudio } from "@react-three/drei"


const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
const floor1Material = new THREE.MeshStandardMaterial({color: "limegreen"});
const floor2Material = new THREE.MeshStandardMaterial({color: "greenyellow"});
const floor3Material = new THREE.MeshStandardMaterial({color: "whitegrey"});
const wallMaterial = new THREE.MeshStandardMaterial({color: "slategrey"});


export function BlockStart({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    return <group position= {position}>
        <Float floatIntensity={0.25} rotationIntensity={0.25}>
            <Text 
                font="bebas-neue-v9-latin-regular.woff" 
                scale={0.15} 
                maxWidth={8} 
                lineHeight={1.2} 
                letterSpacing={0.06} 
                textAlign="right" 
                position={[0.75, 0.9, 0]} 
                rotation-y={-0.25}
                color="white"
            >
                WASD / Arrows to Move
                Space to Jump
                Q to Swap Squad
                <meshBasicMaterial toneMapped={false}/>
            </Text>
        </Float>
        <mesh 
        geometry={boxGeometry}
        material={floor1Material} 
        position={ [ 0, -0.1, 0] } 
        scale={[ 4, 0.2, 4 ]} 
        receiveShadow
        />
        {/* Wall 1: Left Barrier */}
        <RigidBody type="fixed" position={[-3.5, 0.5, 4]} rotation={[0, 0, 0]}>
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[4, 1, 1]} castShadow />
        </RigidBody>

        {/* Wall 2: Right Barrier */}
        <RigidBody type="fixed" position={[3.5, 0.5, 7]} rotation={[0, 0, 0]}>
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[4, 1, 1]} castShadow />
        </RigidBody>

        {/* Wall 3: Center U-Shape Trap */}
        <RigidBody type="fixed" position={[0, 0.5, 12]} rotation={[0, 0, 0]}>
             {/* Back */}
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[6, 1, 1]} castShadow />
        </RigidBody>
        <RigidBody type="fixed" position={[-2.5, 0.5, 10]} rotation={[0, 0, 0]}>
             {/* Left Arm */}
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[1, 1, 3]} castShadow />
        </RigidBody>
        <RigidBody type="fixed" position={[2.5, 0.5, 10]} rotation={[0, 0, 0]}>
             {/* Right Arm */}
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[1, 1, 3]} castShadow />
        </RigidBody>
        
        {/* Wall 4: Diagonal Wall */}
        <RigidBody type="fixed" position={[-4, 0.5, 18]} rotation={[0, Math.PI / 4, 0]}>
            <mesh geometry={boxGeometry} material={wallMaterial} scale={[1, 1, 8]} castShadow />
        </RigidBody>
    </group>
}

export function BlockEnd({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    const hamburger = useGLTF('./hamburger.glb')

    hamburger.scene.children.forEach((mesh) =>
        {
            mesh.castShadow = true
        })

    return <group position= {position}>
        <Float floatIntensity={0.25} rotationIntensity={0.25}>
            <Text font="bebas-neue-v9-latin-regular.woff" scale={0.5} maxWidth={0.25} lineHeight={0.75} letterSpacing={0.06} textAlign="right" position={[0.75, 0.65, 2]} rotation-y={-0.25}>Finish Line
                <meshBasicMaterial toneMapped={false}/>
            </Text>
        </Float>
        <mesh 
        geometry={boxGeometry}
        material={floor1Material} 
        position={ [ 0, 0, 0] } 
        scale={[ 4, 0.2, 4 ]} 
        receiveShadow
        />
        <RigidBody type='fixed' colliders='hull' position={[0,0.25,0]} restitution={ 0.2} friction={0}>
            <primitive object={ hamburger.scene} 
            scale={ 0.2}
            />
        </RigidBody>
    </group>
}

export function BlockSpinner({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    const obstacale = useRef<any>(null)
    const [speed] = useState(() => (Math.random() + 0.2) * (Math.random() < 0.5? -1: 1))

    useFrame((state) =>
    {
        const time = state.clock.getElapsedTime()
        const rotation = new THREE.Quaternion()
        rotation.setFromEuler(new THREE.Euler(0, time * speed, 0))
        obstacale.current.setNextKinematicRotation(rotation)
    })

    return <group position= {position}>
        <mesh 
        geometry={boxGeometry}
        material={floor2Material} 
        position={ [ 0, -0.1, 0] } 
        scale={[ 4, 0.2, 4 ]} 
        receiveShadow
        />
        <RigidBody ref={ obstacale } type="kinematicPosition" position={ [0, 0.3, 0 ] } restitution={ 0.2 } friction={0}>
            <mesh
            geometry={boxGeometry}
            scale={[ 3.5, 0.3, 0.3 ]} 
            castShadow
            receiveShadow
            >
            <meshStandardMaterial color="tomato" transparent opacity={0.4} />
            </mesh>
        </RigidBody>
    </group>
}

export function BlockLimbo({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    const obstacale = useRef<any>(null)
    const [ timeOffset ] = useState(() => (Math.random()) * (Math.PI * 2))


    useFrame((state) =>
    {
        const time = state.clock.getElapsedTime()
        const y = Math.sin(time + timeOffset)
        obstacale.current.setNextKinematicTranslation( {x: position[0], y: position[1]+ y * 0.5 ,z: position[2]})
    })

    return <group position= {position}>
        <mesh 
        geometry={boxGeometry}
        material={floor2Material} 
        position={ [ 0, -0.1, 0] } 
        scale={[ 4, 0.2, 4 ]} 
        receiveShadow
        />
        <RigidBody ref={ obstacale } type="kinematicPosition" position={ [0, 0.3, 0 ] } restitution={ 0.2 } friction={0}>
            <mesh
            geometry={boxGeometry}
            position={[0, 1, 0]} 
            scale={[ 3.5, 1, 0.1 ]} 
            castShadow
            receiveShadow
            >
            <meshStandardMaterial color="tomato" transparent opacity={0.4} />
            </mesh>
        </RigidBody>
    </group>
}

export function BlockAxe({ position = [0, 0, 0] }: { position?: [number, number, number] })
{
    const obstacale = useRef<any>(null)
    const [ timeOffset ] = useState(() => (Math.random()) * (Math.PI * 2))


    useFrame((state) =>
    {
        const time = state.clock.getElapsedTime()
        const x = Math.sin(time + timeOffset) * 1.25
        obstacale.current.setNextKinematicTranslation( {x: position[0] +x * 0.5, y: position[1] +0.75,z: position[2]})
    })


    return <group position= {position}>
        <mesh 
        geometry={boxGeometry}
        material={floor2Material} 
        position={ [ 0, -0.1, 0] } 
        scale={[ 4, 0.2, 4 ]} 
        receiveShadow
        />
        <RigidBody ref={ obstacale } type="kinematicPosition" position={ [0, 0.3, 0 ] } restitution={ 0.2 } friction={0}>
            <mesh
            geometry={boxGeometry}
            scale={[ 2.5, 1.5, 0.3 ]} 
            castShadow
            receiveShadow
            >
            <meshStandardMaterial color="tomato" transparent opacity={0.4} />
            </mesh>
        </RigidBody>
    </group>
}


export function Floor()
{
    return <group>
        <RigidBody type='fixed' restitution={0.2} friction={0}>
            <mesh 
            geometry={boxGeometry}
            material={floor3Material} 
            position={ [ 0, -0.1, 0] } 
            scale={[ 40, 0.1, 40 ]} 
            receiveShadow
            />
        </RigidBody>
    </group>
}

function Bounds({length =1})
{
    return <RigidBody type='fixed' restitution={0.2} friction={0}>
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ length, 0.75, 0] } 
        scale={[ 0.3, 4, 2 * length ]} 
        castShadow
        />
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ -length, 0.75, 0] } 
        scale={[ 0.3, 4, 2 * length ]} 
        receiveShadow
        />
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ 0, 0.75, -length] } 
        scale={[ 2 * length, 4, 0.2 ]} 
        receiveShadow
        />
        <mesh 
        geometry={boxGeometry}
        material={wallMaterial} 
        position={ [ 0, 0.75, length] } 
        scale={[ 2 * length, 4, 0.2 ]} 
        receiveShadow
        />
        {/* <CuboidCollider 
        args={ [ 2, 0.1, 2*length] }
        position={ [ 0, -0.1, -(length*2)+2]}
        restitution={ 0.2 } 
        friction={1}
        /> */}
    </RigidBody>
}

export function Speaker({position = [0, 0, 0], rotation = [0, 0, 0]}: {position?: [number, number, number], rotation?: [number, number, number]}) 
{
  const speakerRef = useRef<any>(null)

      return (
        <group position={position}>
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
        </group>
  )
}

export function Level({ count = 5, types = [BlockAxe, BlockLimbo, BlockSpinner] , seed = 0 }: { count?: number, types?: any[] , seed?:number }) 
{
    const blocks = useMemo(() => 
    {
        const blocks:any = []
        for(let i=0; i < count; i++)
            {
                const type:any = types[Math.floor(Math.random() * types.length)]
                blocks.push(type)
            }
        return blocks
    },[ count, types, seed])

    return <>       
        <BlockStart position={[0,0,0]}/> 
        {/* {blocks.map((Block: any, index: number) => <Block key={index} position={[0, 0, -(index+1)*4]} />)}   */}
        {/* <BlockEnd position={[0, 0, -(count+1)* 4]}/>  */}
        <Floor />
        <Bounds length={ 20 }/>
        <Speaker position={[-10, -3, -25]} rotation={[0, Math.PI/6, 0]}/>

    </>
}