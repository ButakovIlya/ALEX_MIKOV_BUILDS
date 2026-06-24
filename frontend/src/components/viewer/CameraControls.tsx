import { Spherical, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useImperativeHandle, useRef, forwardRef, useState } from 'react'
import { OrbitControls } from '@react-three/drei'
import { FlyCameraControls, type FlyCameraHandle } from './FlyCameraControls'
import type { ViewerSettings } from './viewerState'

export interface CameraControlsHandle {
  reset: () => void
  zoomIn: () => void
  zoomOut: () => void
  rotateLeft: () => void
  rotateRight: () => void
  rotateUp: () => void
  rotateDown: () => void
}

interface CameraControlsProps {
  settings: Pick<
    ViewerSettings,
    | 'autoRotate'
    | 'flyMode'
    | 'flyMoveSpeed'
    | 'flyLookSensitivity'
    | 'orbitRotateSpeed'
    | 'orbitPanSpeed'
    | 'orbitZoomSpeed'
    | 'autoRotateSpeed'
  >
  fitKey: number
  allowZoom?: boolean
  onReady?: () => void
}

const ROTATE_AZIMUTH = Math.PI / 12
const ROTATE_POLAR = Math.PI / 18
const ZOOM_FACTOR = 0.85
const EPS = 0.001
const MIN_DIST_RATIO = 0.2
const MAX_DIST_RATIO = 10

function clampOrbitDistance(distance: number, min: number, max: number) {
  return Math.max(min, Math.min(max, distance))
}

export const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(
  function CameraControls({ settings, fitKey, allowZoom = true, onReady }, ref) {
    const { autoRotate, flyMode } = settings
    const orbitRef = useRef<OrbitControlsImpl>(null)
    const flyRef = useRef<FlyCameraHandle>(null)
    const { camera } = useThree()
    const initialCamera = useRef<Vector3 | null>(null)
    const initialTarget = useRef<Vector3 | null>(null)
    const [orbitLimits, setOrbitLimits] = useState({ min: 1, max: 500 })
    const orbitLimitsRef = useRef(orbitLimits)
    orbitLimitsRef.current = orbitLimits

    useEffect(() => {
      if (flyMode) return
      initialCamera.current = null
      initialTarget.current = null
      const id = window.setTimeout(() => {
        const controls = orbitRef.current
        if (!controls) return
        initialCamera.current = camera.position.clone()
        initialTarget.current = controls.target.clone()
        const fitDistance = camera.position.distanceTo(controls.target)
        const nextLimits = allowZoom
          ? {
              min: Math.max(fitDistance * MIN_DIST_RATIO, 0.1),
              max: Math.max(fitDistance * MAX_DIST_RATIO, 50),
            }
          : { min: fitDistance, max: fitDistance }
        setOrbitLimits(nextLimits)
        onReady?.()
      }, 300)
      return () => window.clearTimeout(id)
    }, [camera, fitKey, flyMode, allowZoom, onReady])

    useFrame(() => {
      if (!flyMode && orbitRef.current) {
        orbitRef.current.autoRotate = autoRotate
        orbitRef.current.autoRotateSpeed = settings.autoRotateSpeed
      }
    })

    function orbit(deltaAzimuth: number, deltaPolar: number) {
      const controls = orbitRef.current
      if (!controls || flyMode) return
      const offset = camera.position.clone().sub(controls.target)
      const spherical = new Spherical().setFromVector3(offset)
      spherical.theta += deltaAzimuth
      spherical.phi = Math.max(EPS, Math.min(Math.PI - EPS, spherical.phi + deltaPolar))
      offset.setFromSpherical(spherical)
      camera.position.copy(controls.target).add(offset)
      controls.update()
    }

    useImperativeHandle(ref, () => ({
      reset() {
        if (flyMode) {
          flyRef.current?.reset()
          return
        }
        if (!initialCamera.current || !initialTarget.current) return
        camera.position.copy(initialCamera.current)
        const controls = orbitRef.current
        if (!controls) return
        controls.target.copy(initialTarget.current)
        controls.update()
      },
      zoomIn() {
        if (!allowZoom) return
        if (flyMode) {
          flyRef.current?.zoomIn()
          return
        }
        const controls = orbitRef.current
        if (!controls) return
        const { min, max } = orbitLimitsRef.current
        const offset = camera.position.clone().sub(controls.target)
        const next = clampOrbitDistance(offset.length() * ZOOM_FACTOR, min, max)
        offset.setLength(next)
        camera.position.copy(controls.target).add(offset)
        controls.update()
      },
      zoomOut() {
        if (!allowZoom) return
        if (flyMode) {
          flyRef.current?.zoomOut()
          return
        }
        const controls = orbitRef.current
        if (!controls) return
        const { min, max } = orbitLimitsRef.current
        const offset = camera.position.clone().sub(controls.target)
        const next = clampOrbitDistance(offset.length() / ZOOM_FACTOR, min, max)
        offset.setLength(next)
        camera.position.copy(controls.target).add(offset)
        controls.update()
      },
      rotateLeft() {
        orbit(ROTATE_AZIMUTH, 0)
      },
      rotateRight() {
        orbit(-ROTATE_AZIMUTH, 0)
      },
      rotateUp() {
        orbit(0, -ROTATE_POLAR)
      },
      rotateDown() {
        orbit(0, ROTATE_POLAR)
      },
    }))

    if (flyMode) {
      return (
        <FlyCameraControls
          ref={flyRef}
          speed={settings.flyMoveSpeed}
          lookSensitivity={settings.flyLookSensitivity}
          fitKey={fitKey}
          onReady={onReady}
        />
      )
    }

    return (
      <OrbitControls
        ref={orbitRef}
        makeDefault
        enablePan
        enableZoom={allowZoom}
        enableRotate
        enableDamping
        dampingFactor={0.05}
        rotateSpeed={settings.orbitRotateSpeed}
        panSpeed={settings.orbitPanSpeed}
        zoomSpeed={settings.orbitZoomSpeed}
        minDistance={orbitLimits.min}
        maxDistance={orbitLimits.max}
        minPolarAngle={EPS}
        maxPolarAngle={Math.PI - EPS}
        minAzimuthAngle={-Infinity}
        maxAzimuthAngle={Infinity}
      />
    )
  },
)
