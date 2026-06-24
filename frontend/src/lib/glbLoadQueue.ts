const MAX_CONCURRENT = 2
let active = 0
const waiters: Array<() => void> = []

export function acquireGlbSlot(): Promise<void> {
  if (active < MAX_CONCURRENT) {
    active += 1
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    waiters.push(() => {
      active += 1
      resolve()
    })
  })
}

export function releaseGlbSlot(): void {
  active = Math.max(0, active - 1)
  const next = waiters.shift()
  if (next) next()
}
