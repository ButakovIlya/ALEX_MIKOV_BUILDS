/** Virtual WASDQE keys from mobile touch pad (KeyW, KeyS, …). */
export const flyTouchKeys = new Set<string>()

export function setFlyTouchKey(code: string, pressed: boolean) {
  if (pressed) flyTouchKeys.add(code)
  else flyTouchKeys.delete(code)
}

export function clearFlyTouchKeys() {
  flyTouchKeys.clear()
}

export function isFlyKeyDown(code: string, keyboard: Set<string>) {
  return keyboard.has(code) || flyTouchKeys.has(code)
}
