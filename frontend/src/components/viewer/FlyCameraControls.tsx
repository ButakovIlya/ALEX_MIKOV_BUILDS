import { Euler, Vector3 } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import { clearFlyTouchKeys, isFlyKeyDown } from './flyTouchKeys'

export interface FlyCameraHandle {
  reset: () => void
  zoomIn: () => void
  zoomOut: () => void
}

interface FlyCameraControlsProps {
  speed: number
  lookSensitivity: number
  fitKey: number
  onReady?: () => void
}

const PITCH_LIMIT = Math.PI / 2 - 0.01

function pointerLookDelta(
  sample: PointerEvent,
  prev: { x: number; y: number },
): { dx: number; dy: number; next: { x: number; y: number } } {
  const next = { x: sample.clientX, y: sample.clientY }
  if (sample.pointerType === 'touch' || sample.pointerType === 'pen') {
    return { dx: next.x - prev.x, dy: next.y - prev.y, next }
  }
  if (sample.movementX !== 0 || sample.movementY !== 0) {
    return { dx: sample.movementX, dy: sample.movementY, next }
  }
  return { dx: next.x - prev.x, dy: next.y - prev.y, next }
}

export const FlyCameraControls = forwardRef<FlyCameraHandle, FlyCameraControlsProps>(
  function FlyCameraControls({ speed, lookSensitivity, fitKey, onReady }, ref) {
    const { camera, gl } = useThree()
    const keys = useRef(new Set<string>())
    const looking = useRef(false)
    const yaw = useRef(0)
    const pitch = useRef(0)
    const initialPos = useRef(new Vector3())
    const initialYaw = useRef(0)
    const initialPitch = useRef(0)
    const speedRef = useRef(speed)
    const lookRef = useRef(lookSensitivity)
    const lastPointer = useRef<{ x: number; y: number } | null>(null)
    const pendingLook = useRef({ dx: 0, dy: 0 })
    const forward = useRef(new Vector3())
    const right = useRef(new Vector3())
    const worldUp = useRef(new Vector3(0, 1, 0))

    speedRef.current = speed
    lookRef.current = lookSensitivity

    const applyRotation = () => {
      camera.rotation.order = 'YXZ'
      camera.rotation.y = yaw.current
      camera.rotation.x = pitch.current
      camera.rotation.z = 0
    }

    const syncFromCamera = () => {
      const euler = new Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(camera.quaternion)
      yaw.current = euler.y
      pitch.current = euler.x
    }

    const captureInitial = () => {
      initialPos.current.copy(camera.position)
      initialYaw.current = yaw.current
      initialPitch.current = pitch.current
      onReady?.()
    }

    useEffect(() => {
      syncFromCamera()
      const id = window.setTimeout(captureInitial, 300)
      return () => window.clearTimeout(id)
    }, [fitKey])

    useEffect(() => {
      const el = gl.domElement

      const onKeyDown = (e: KeyboardEvent) => {
        keys.current.add(e.code)
      }
      const onKeyUp = (e: KeyboardEvent) => {
        keys.current.delete(e.code)
      }

      const onPointerDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        looking.current = true
        lastPointer.current = { x: e.clientX, y: e.clientY }
        el.setPointerCapture(e.pointerId)
      }

      const onPointerUp = (e: PointerEvent) => {
        if (e.button !== 0) return
        looking.current = false
        lastPointer.current = null
        pendingLook.current.dx = 0
        pendingLook.current.dy = 0
        try {
          el.releasePointerCapture(e.pointerId)
        } catch {
          /* already released */
        }
      }

      const onPointerMove = (e: PointerEvent) => {
        if (!looking.current || !lastPointer.current) return

        const samples =
          e.pointerType === 'touch' && typeof e.getCoalescedEvents === 'function'
            ? e.getCoalescedEvents()
            : [e]

        let prev = lastPointer.current
        const sens = lookRef.current

        for (const sample of samples) {
          const { dx, dy, next } = pointerLookDelta(sample, prev)
          prev = next
          if (dx === 0 && dy === 0) continue
          pendingLook.current.dx += dx * sens
          pendingLook.current.dy += dy * sens
        }

        lastPointer.current = prev
      }

      const onContextMenu = (e: Event) => e.preventDefault()

      el.addEventListener('pointerdown', onPointerDown)
      el.addEventListener('pointerup', onPointerUp)
      el.addEventListener('pointermove', onPointerMove)
      el.addEventListener('contextmenu', onContextMenu)
      window.addEventListener('keydown', onKeyDown)
      window.addEventListener('keyup', onKeyUp)
      window.addEventListener('pointerup', onPointerUp)

      return () => {
        el.removeEventListener('pointerdown', onPointerDown)
        el.removeEventListener('pointerup', onPointerUp)
        el.removeEventListener('pointermove', onPointerMove)
        el.removeEventListener('contextmenu', onContextMenu)
        window.removeEventListener('keydown', onKeyDown)
        window.removeEventListener('keyup', onKeyUp)
        window.removeEventListener('pointerup', onPointerUp)
        keys.current.clear()
        clearFlyTouchKeys()
        looking.current = false
      }
    }, [gl])

    useFrame((_, delta) => {
      if (pendingLook.current.dx !== 0 || pendingLook.current.dy !== 0) {
        yaw.current -= pendingLook.current.dx
        pitch.current -= pendingLook.current.dy
        pendingLook.current.dx = 0
        pendingLook.current.dy = 0
        pitch.current = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current))
      }
      applyRotation()

      const step = speedRef.current * delta
      camera.getWorldDirection(forward.current)
      right.current.crossVectors(forward.current, worldUp.current)
      if (right.current.lengthSq() < 1e-8) right.current.set(1, 0, 0)
      else right.current.normalize()

      if (isFlyKeyDown('KeyW', keys.current)) camera.position.addScaledVector(forward.current, step)
      if (isFlyKeyDown('KeyS', keys.current)) camera.position.addScaledVector(forward.current, -step)
      if (isFlyKeyDown('KeyA', keys.current)) camera.position.addScaledVector(right.current, -step)
      if (isFlyKeyDown('KeyD', keys.current)) camera.position.addScaledVector(right.current, step)
      if (isFlyKeyDown('KeyQ', keys.current) || isFlyKeyDown('Space', keys.current)) {
        camera.position.y += step
      }
      if (
        isFlyKeyDown('KeyE', keys.current) ||
        isFlyKeyDown('ShiftLeft', keys.current) ||
        isFlyKeyDown('ShiftRight', keys.current)
      ) {
        camera.position.y -= step
      }
    })

    useImperativeHandle(ref, () => ({
      reset() {
        camera.position.copy(initialPos.current)
        yaw.current = initialYaw.current
        pitch.current = initialPitch.current
        applyRotation()
      },
      zoomIn() {
        camera.getWorldDirection(forward.current)
        camera.position.addScaledVector(forward.current, speedRef.current * 0.05)
      },
      zoomOut() {
        camera.getWorldDirection(forward.current)
        camera.position.addScaledVector(forward.current, -speedRef.current * 0.05)
      },
    }))

    return null
  },
)
