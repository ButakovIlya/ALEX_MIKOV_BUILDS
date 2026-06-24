import * as THREE from 'three'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

// GLTFExporter expects browser FileReader in Node
globalThis.FileReader = class {
  result = null
  onloadend = null
  readAsArrayBuffer(blob) {
    blob.arrayBuffer().then((buf) => {
      this.result = buf
      this.onloadend?.()
    })
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url))
const outPath = join(__dirname, '..', 'public', 'models', 'demo-house.glb')

const scene = new THREE.Scene()

const wallMat = new THREE.MeshStandardMaterial({ color: 0x8b3a2a })
const roofMat = new THREE.MeshStandardMaterial({ color: 0x36454f })
const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
const windowMat = new THREE.MeshStandardMaterial({ color: 0x87ceeb, metalness: 0.3, roughness: 0.2 })

const body = new THREE.Mesh(new THREE.BoxGeometry(3, 2, 2.5), wallMat)
body.position.y = 1
scene.add(body)

const roof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), roofMat)
roof.position.y = 2.6
roof.rotation.y = Math.PI / 4
scene.add(roof)

const garage = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.2, 2), wallMat)
garage.position.set(-2.2, 0.6, 0)
scene.add(garage)

const door = new THREE.Mesh(new THREE.BoxGeometry(0.6, 1, 0.1), doorMat)
door.position.set(0, 0.5, 1.26)
scene.add(door)

const win1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.1), windowMat)
win1.position.set(-0.8, 1.2, 1.26)
scene.add(win1)

const win2 = win1.clone()
win2.position.x = 0.8
scene.add(win2)

const ground = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshStandardMaterial({ color: 0xf5f3f0 }))
ground.rotation.x = -Math.PI / 2
ground.position.y = -0.01
scene.add(ground)

const exporter = new GLTFExporter()
exporter.parse(
  scene,
  (result) => {
    writeFileSync(outPath, Buffer.from(result))
    console.log(`Written ${outPath}`)
  },
  (err) => {
    console.error(err)
    process.exit(1)
  },
  { binary: true },
)
