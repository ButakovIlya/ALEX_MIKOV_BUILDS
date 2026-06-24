import { useGLTF } from '@react-three/drei'
import { assertGlbUrl } from '../../lib/glb'

export function preloadGlb(glb: string) {
  useGLTF.preload(assertGlbUrl(glb))
}
