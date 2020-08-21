import * as THREE from 'three'
import { sample, sampleN, sphereRandom, sphereSurfaceRandom, evenSpherePoints, N3D, peakTime, positionAt, velocityAt } from './util'
import {
  ShaderBeeParams,
  ShaderBaseParams,
  ShaderStopParams,
  ShaderBlinkParams,
  ShaderParticleParams,
  generateStarBaseAttributes,
  starStops
} from './attributes'
import { ParticleTailStar, ParticleSplashStar } from './ParticleStar'
import { CurveStar } from './CurveStar'
import { PointStar } from './PointStar'
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
  direction.forEach(([bx, by, bz]) => {
    for (let i = 0; i < n; i++) {
      const [dx, dy, dz] = sphereRandom()
      let x = bx + r * dx, y = by + r * dy, z = bz + r * dz
      const rr = Math.hypot(x, y, z)
      out.push([x / rr, y / rr, z / rr])
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

const clusterDirections2 = [
  clusterDirection(polyhedron4, 24, 0.2),
  clusterDirection(polyhedron6, 20, 0.18),
  clusterDirection(polyhedron8, 16, 0.14),
  clusterDirection(polyhedron12, 10, 0.12),
  clusterDirection(polyhedron20, 6, 0.1),
]

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
    update: (t: number, pixels: number) => void
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
  friction: 8,
  duration: 0.4,
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

const colors = [
  [new THREE.Color('#884'), new THREE.Color('#842'), new THREE.Color('#444')],
  new THREE.Color('#844'),
  [new THREE.Color('#444'), new THREE.Color('#844')]
]
const colors2 = [
  new THREE.Color('#4a4'),
  new THREE.Color('#44c'),
  new THREE.Color('#84c'),
  new THREE.Color('#48c'),
  new THREE.Color('#4a8'),
  new THREE.Color('#8a4'),
]

function randomColor() {
  return sample(colors)
}

export class Fireworks {
  elements: FireworkElement[] = []
  schedules: { time: number; f: () => void }[] = []
  constructor(public scene: THREE.Scene) {}

  add(elem: FireworkElement) {
    this.elements.push(elem)
    this.scene.add(elem.star.mesh)
  }

  schedule(time: number, f: () =>  void) {
    this.schedules.push({ time, f })
  }

  update(time: number, pointPixels: number) {
    for (let i = 0; i < this.schedules.length; i++) {
      const s = this.schedules[i]
      if (time < s.time) {
        i++
        continue
      }
      if (time < s.time + 0.5) s.f()
      this.schedules[i] = this.schedules[this.schedules.length - 1]
      this.schedules.pop()
    }
    for (let i = 0; i < this.elements.length;) {
      const e = this.elements[i]
      if (time < e.startTime + e.star.endTime) {
        e.star.update(time - e.startTime, pointPixels)
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

const stopParams: ShaderStopParams = {
  time: 2.5
}
const beeParams: ShaderBeeParams = {
  start: 0.8,
  decay: 4.0,
  speed: 32.0,
  decayRandomness: 0.2,
  speedRandomness: 0.2
}

const particleSplashParams: ShaderParticleParams = {
  speed: 4,
  friction: 4,
  duration: 1.2,
  durationRandomness: 1
}

const baseParamsWithoutPosition = {
  speed: 20,
  friction: 1,
  duration: 2.5,
  speedRandomness: 0.1,
  frictionRandomness: 0.4,
  burnRateRandomness: 0.4
}

export function addHanabi(fireworks: Fireworks, sound: Record<'bang' | 'pyu', (...p: N3D) => void>, time: number) {
  const rndpos = () => 20 * (Math.floor(Math.random() * 3) - 1)
  const bulletBaseParams: ShaderBaseParams = {
    center: new THREE.Vector3(rndpos(), rndpos(), 0),
    baseVelocity: new THREE.Vector3(16 * Math.random() - 8, 16 * Math.random() - 8, 50 + 20 * Math.random()),
    speed: 0,
    friction: 0.5,
    duration: 100
  }
  const pt = peakTime(60, 0.5) * (1 - 0.1 * Math.random())
  const bstop = starStops(singleDir, singleAttr, bulletBaseParams, null, pt)[0]

  const bullet = new ParticleTailStar(singleDir, 256, { base: bulletBaseParams, stop: { time: pt }, particle: particleTailParams, color: new THREE.Color(0.02,0.02,0.02), size: 0.1 })
  fireworks.add({ star: bullet, startTime: time })
  if (Math.random() < 0.2) sound.pyu(...bstop.p)
  fireworks.schedule(time + pt, () => sound.bang(...bstop.p))
  if (Math.random() < 0.1) {
    addTypeSub(fireworks, time + pt, bstop.p, bstop.v)
  } else if (Math.random() < 0.2) {
    addTypeD(fireworks, time + pt, bstop.p, bstop.v)
  } else {
    addType1(fireworks, time + pt, bstop.p, bstop.v)
  }
}

function addType1(fireworks: Fireworks, time: number, position: N3D, velocity: N3D) {
  const bee = Math.random() < 0.2 ? beeParams : { ...beeParams, start: 2, speed: 8 * Math.random(), decayRandomness: 1, speedRandomness: 1 }
  const rotation = Math.random() < 0.2 ? randomRotation() : undefined
  const direction = rotation ? sample(clusterDirections2) : sphericalDirections[sample([6, 7])]
  const baseParams: ShaderBaseParams = {
    ...baseParamsWithoutPosition,
    center: new THREE.Vector3(...position),
    baseVelocity: new THREE.Vector3(...velocity),
    rotation
  }
  const blink: ShaderBlinkParams | undefined = Math.random() < 0.5 ? { start: 1 + 0.5 * Math.random(), rate: 0.1, rateRandomness: 0.2 } : undefined
  const stop = Math.random() < 0.2 ? stopParams : undefined
  const cstar = new CurveStar(direction, { base: baseParams, bee, stop, widthStart: 0.2, color: randomColor(), widthEnd: 0.1, curveFriction: particleTailParams.friction, curveDelay: 0.2 })
  const pstar = new PointStar(direction, { base: baseParams, bee, stop, blink, color: randomColor(), size: 0.4 })
  const tstar = new ParticleTailStar(direction, 32, { base: baseParams, bee, stop, particle: particleTailParams, size: 0.2, color: randomColor() })
  fireworks.add({ star: cstar, startTime: time })
  fireworks.add({ star: pstar, startTime: time })
  fireworks.add({ star: tstar, startTime: time })
  if (stop) {
    const sstar = new ParticleSplashStar(direction, 32, { base: baseParams, bee, stop, particle: particleSplashParams, size: 0.12, color: randomColor() })
    fireworks.add({ star: sstar, startTime: time })
  }
}

function randomRotation() {
  const th1 = 2 * Math.PI * Math.random()
  const cos1 = Math.cos(th1), sin1 = Math.sin(th1)
  const m1 = new THREE.Matrix3()
  m1.set(cos1, sin1, 0, -sin1, cos1, 0, 0, 0, 1)
  const th2 = Math.PI / 2 + Math.asin(2 * Math.random() - 1)
  const cos2 = Math.cos(th2), sin2 = Math.sin(th2)
  const m2 = new THREE.Matrix3()
  m2.set(cos2, 0, sin2, 0, 1, 0, -sin2, 0, cos2)
  const th3 = 2 * Math.PI * Math.random()
  const cos3 = Math.cos(th3), sin3 = Math.sin(th3)
  const m3 = new THREE.Matrix3()
  m3.set(cos3, sin3, 0, -sin3, cos3, 0, 0, 0, 1)
  return m1.multiply(m2).multiply(m3)
}

function addTypeD(fireworks: Fireworks, time: number, position: N3D, velocity: N3D) {
  const direction = sphericalDirections[sample([7, 8])]
  const baseParams: ShaderBaseParams = {
    ...baseParamsWithoutPosition,
    center: new THREE.Vector3(...position),
    speed: 10,
    speedRandomness: 0.05,
    duration: 1.7,
    baseVelocity: new THREE.Vector3(...velocity),
  }
  const blink: ShaderBlinkParams | undefined = Math.random() < 0.5 ? { start: 1, rate: 0.1, rateRandomness: 0.2 } : undefined
  const blink2: ShaderBlinkParams | undefined = Math.random() < 0.25 ? { start: 1, rate: 0.1, rateRandomness: 0.2 } : undefined
  const lastFlash = Math.random() < 0.5 ? { duration: 0.1, color: new THREE.Color('white'), size: 0 } : undefined
  fireworks.add({ startTime: time, star: new PointStar(direction, { base: { ...baseParams, duration: blink ? 1.5 : 1 }, color: randomColor(), size: 0.3, blink, lastFlash }) })
  if (Math.random() < 0.5) fireworks.add({ startTime: time, star: new PointStar(direction, { base: { ...baseParams, duration: blink ? 1.5 : 1, speed: 8, rotation: randomRotation() }, color: randomColor(), size: 0.3, blink, lastFlash }) })
  fireworks.add({ startTime: time, star: new ParticleTailStar(sample(diskDirections), 32, { base: { ...baseParams, speed: 17, rotation: randomRotation() }, particle: particleTailParams, color: randomColor(), blink: blink2, size: 0.1 }) })
  if (Math.random() < 0.5) fireworks.add({ startTime: time, star: new ParticleTailStar(sample(diskDirections), 32, { base: { ...baseParams, speed: 20, rotation: randomRotation() }, particle: particleTailParams, color: randomColor(), blink: blink2, size: 0.1 }) })
}

function addTypeSub(fireworks: Fireworks, time: number, position: N3D, velocity: N3D) {
  const direction = sphericalDirections[sample([4,5,6])]
  const attributes = generateStarBaseAttributes(direction.length)
  const baseParams: ShaderBaseParams = {
    ...baseParamsWithoutPosition,
    center: new THREE.Vector3(...position),
    speed: 20,
    speedRandomness: 0.05,
    duration: 1.5,
    rotation: randomRotation(),
    burnRateRandomness: 1,
    baseVelocity: new THREE.Vector3(...velocity),
  }
  const stopTime = 0.5 + 0.2 * Math.random()
  fireworks.add({ startTime: time, star: new PointStar(direction, { base: baseParams, stop: { time: stopTime }, color: new THREE.Color('#050505'), size: 0.2 })})
  const stops = starStops(direction, attributes, baseParams, null, stopTime)
  const color1 = randomColor()
  const color2 = Math.random() < 0.5 ? color1 : randomColor()
  const base = {
    ...baseParamsWithoutPosition,
    speed: 8,
    speedRandomness: 0.05,
    duration: 1,
  }
  const size = 0.1
  stops.forEach(({ p, v, t }) => {
    [color1, color2].forEach(color => {
      fireworks.add({
        startTime: time + t,
        star: new ParticleTailStar(polyhedron20, 32, {
          base: { ...base, center: new THREE.Vector3(...p), baseVelocity: new THREE.Vector3(...v), rotation: randomRotation() },
          color,
          particle: particleTailParams,
          size
        })
      })
    })
  })
}
