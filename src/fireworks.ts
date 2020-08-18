import * as THREE from 'three'
import { sphereRandom, sphereSurfaceRandom, evenSpherePoints, N3D, peakTime, positionAt, velocityAt } from './util'
import {
  ShaderBeeParams,
  ShaderBaseParams,
  ShaderParticleParams,
  generateStarBaseAttributes
} from './attributes'

import {
  polyhedron4,
  polyhedron6,
  polyhedron8,
  polyhedron12,
  polyhedron20
} from './polyhedrons'

type Direction = N3D[]

function circularDirection(n: number): Direction {
  const dirs: Direction = []
  const start = 2 * Math.PI * Math.random() / n
  for (let i = 0; i < n; i++) {
    const th = start + 2 * Math.PI * i / n
    dirs.push([Math.cos(th), Math.sin(th), 0])
  }
  return dirs
}
function diskDirection(n: number, rmin: number, rmax: number): Direction {
  const dirs: Direction = []
  const start = 2 * Math.PI * Math.random() / n
  for (let i = 0; i < n; i++) {
    const th = start + 2 * Math.PI * i / n
    const r = rmin + (rmax - rmin) * Math.random()
    dirs.push([Math.cos(th), Math.sin(th), 0])
  }
  return dirs
}
function clusterDirection(direction: Direction, n: number, r: number) {
  const out: Direction = []
  direction.forEach(([x, y, z]) => {
    const r = Math.hypot(x, y, z)
    for (let i = 0; i < n; i++) {
      const [dx, dy, dz] = sphereRandom()
      out.push([x + r * dx, y + r * dy, z + r * dz])
    }
  })
  return out
}
function onewayDirection(n: number, r: number) {
  const out: Direction = []
  const r2d = (): [number, number] => {
    while (true) {
      const x = 2 * Math.random() - 1
      const y = 2 * Math.random() - 1
      if (x ** 2 + y ** 2 < 1) return [x, y]
    }
  }
  for (let i = 0; i < n; i++) {
    const [x, y] = r2d()
    const rr = Math.hypot(r * x, r * y, 1)
    out.push([r * x / rr, r * y / rr, 1 / rr])
  }
  return out
}

const sphericalDirections: Direction[] = [
  polyhedron4,
  polyhedron6,
  polyhedron8,
  polyhedron12,
  polyhedron20
]
for (let i = 0; i < 10; i++) {
  sphericalDirections.push(evenSpherePoints(i + 1, 0.5))
}

const clusterDirections: Direction[][] = [
  polyhedron4,
  polyhedron6,
  polyhedron8,
  polyhedron12,
  polyhedron20,
  circularDirection(2),
  circularDirection(3)
].map(direction => {
  const ds: Direction[] = [direction]
  ;[4, 5, 6, 8, 12, 20].forEach(n => {
    ds.push(clusterDirection(direction, n, 1 / Math.sqrt(direction.length)))
  })
  return ds
})

const diskDirections: Direction[] = []

for (let i = 0; i < 10; i++) {
  diskDirections.push(diskDirection(Math.floor(20 + 20 * 1.2 ** i), 0.5, 1.5))
}

const onewayDirections = [20, 40, 60].map(n => {
  return onewayDirection(n, 0.5 + 0.5 * Math.random())
})

function generateShells(n: number) {
  const rnd = Math.random()
  let beeLeft = 1
  let tailLeft = 2
  let multiClusterLeft = 1
  const shellinfo = [...new Array(n)].map(() => {
    if (Math.random() < 0.1 && [multiClusterLeft > 0, multiClusterLeft--][0]) {
      // return multiClusterShell()
    }
    let point = Math.random() < 0.5
    const curve = Math.random() < 0.2
    const blink = Math.random() < 0.2
    const splash = Math.random() < 0.1
    const tail = Math.random() < 0.2 && [tailLeft > 0, tailLeft--][0]
    const bee = (tail || curve) && Math.random() < 0.1 && [beeLeft > 0, beeLeft--][0]
    if (!tail || !blink || !point) point = true
    // return singleShell(point, curve, blink, splash, tail, bee)
  })
}

type FireworkElement = {
  star: {
    mesh: THREE.Object3D
    update: (t: number) => void
    brightness: { r: number; g: number; b: number }
    endTime: number
    dispose: () => void
  }
  startTime: number
}

const singleAttr = generateStarBaseAttributes(1)
const singleDir: N3D[] = [[0, 0, 0]]

const particleTailParams: ShaderParticleParams = {
  speed: 1,
  friction: 16,
  duration: 0.8,
  durationRandomness: 0.5
}

function bulletParameters(x: number, y: number, dx: number, dy: number, z: number, t: number = 1) {
  const vz = Math.pow(z / 50, 0.75) * 50 // approximation for 20 < z < 100, friction: 0.5
  const friction = 0.5
  const stopTime = peakTime(vz, friction) * t
  const velocity: N3D = [vz * dx, vz * dy, vz]
  const stopPosition = positionAt(velocity, friction, stopTime)
  stopPosition[0] += x
  stopPosition[1] += y
  const stopVelocity = velocityAt(velocity, friction, stopTime)
  const base: ShaderBaseParams = {
    center: new THREE.Vector3(x, y, 0),
    baseVelocity: new THREE.Vector3(...velocity),
    speed: 0,
    friction,
    duration: stopTime * 2
  }
  return { stopTime, stopPosition, stopVelocity, base }
}

export class Fireworks {
  elements: FireworkElement[] = []
  constructor(public scene: THREE.Scene) {}

  add(elem: FireworkElement) {
    this.elements.push(elem)
    this.scene.add(elem.star.mesh)
  }

  update(time: number) {
    for (let i = 0; i < this.elements.length;) {
      const e = this.elements[i]
      if (time < e.startTime + e.star.endTime) {
        e.star.update(time - e.startTime)
        i++
      } else {
        this.scene.remove(e.star.mesh)
        e.star.dispose()
        this.elements[i] = this.elements[this.elements.length - 1]
        this.elements.pop()
      }
    }
  }

  brightness() {
    const color = { r: 0, g: 0, b: 0 }
    this.elements.forEach(e => {
      color.r += e.star.brightness.r
      color.g += e.star.brightness.g
      color.b += e.star.brightness.b
    })
    return color
  }
}
