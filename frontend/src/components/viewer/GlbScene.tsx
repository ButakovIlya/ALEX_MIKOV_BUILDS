import { useEffect } from 'react'
import type { Group, Mesh, MeshStandardMaterial } from 'three'
import { useGLTF } from '@react-three/drei'
import { assertGlbUrl } from '../../lib/glb'

interface GlbSceneProps {
  glb: string
  wireframe: boolean
}

function setWireframe(object: Group, enabled: boolean) {
  object.traverse((child) => {
    if (!('isMesh' in child) || !child.isMesh) return
    const mesh = child as Mesh
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    materials.forEach((material) => {
      if ('wireframe' in material) {
        ;(material as MeshStandardMaterial).wireframe = enabled
      }
    })
  })
}

export function GlbScene({ glb, wireframe }: GlbSceneProps) {
  const url = assertGlbUrl(glb)
  const { scene } = useGLTF(url)

  useEffect(() => {
    scene.traverse((child) => {
      if ('isMesh' in child && child.isMesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })
  }, [scene])

  useEffect(() => {
    setWireframe(scene, wireframe)
  }, [scene, wireframe])

  return <primitive object={scene} />
}

export function GlbLoader() {
  return (
    <mesh>
      <boxGeometry args={[0.5, 0.5, 0.5]} />
      <meshStandardMaterial color="#8B3A2A" wireframe />
    </mesh>
  )
}
