import * as THREE from 'three'
import { N3D, sphereSurfaceRandom } from './util'

function randomCrosses([nx, ny, nz]: N3D): [N3D, N3D] {
  let [ax, ay, az] = sphereSurfaceRandom()
  const dot = ax * nx + ay * ny + az * nz
  ax -= dot * nx
  ay -= dot * ny
  az -= dot * nz
  const r = Math.hypot(ax, ay, az)
  ax /= r
  ay /= r
  az /= r
  const bx = ay * nz - ny * az
  const by = az * nx - nz * ax
  const bz = ax * ny - nx * ay
  return [[ax, ay, az], [bx, by, bz]]
}

export type StarBaseAttributes = ReturnType<typeof generateStarBaseAttributes>
export function generateStarBaseAttributes(size: number) {
  const burnRateRandoms: number[] = []
  const speedRandoms: number[] = []
  const frictionRandoms: number[] = []
  const beeStartRandoms: number[] = []
  const beeDirections: N3D[] = []
  const beeSpeedRandoms: number[] = []
  const beeDecayRandoms: number[] = []
  for (let i = 0; i < size; i++) {
    const beeDirection: N3D = sphereSurfaceRandom()
    burnRateRandoms.push(Math.random() - 0.5)
    speedRandoms.push(Math.random() - 0.5)
    frictionRandoms.push(Math.random() - 0.5)
    beeStartRandoms.push(Math.random() - 0.5)
    beeSpeedRandoms.push(Math.random() - 0.5)
    beeDecayRandoms.push(Math.random() - 0.5)
    beeDirections.push(beeDirection)
  }
  return {
    size,
    burnRateRandoms,
    speedRandoms,
    frictionRandoms,
    beeStartRandoms,
    beeDirections,
    beeSpeedRandoms,
    beeDecayRandoms
  }
}

export type StarParticleAttributes = ReturnType<typeof generateStarParticleAttributes>
export function generateStarParticleAttributes(size: number) {
  const blinkStartRandoms: number[] = []
  const blinkPhases: number[] = []
  const blinkRateRandoms: number[] = []
  const particleDirections: N3D[] = []
  const particlePhaseRandoms: number[] = []
  const particleSpeedRandoms: number[] = []
  const particleFrictionRandoms: number[] = []
  const particleDurationRandoms: number[] = []
  for (let i = 0; i < size; i++) {
    blinkStartRandoms.push(Math.random() - 0.5)
    blinkPhases.push(Math.random())
    blinkRateRandoms.push(Math.random() - 0.5)
    particleDirections.push(sphereSurfaceRandom())
    particlePhaseRandoms.push(Math.random() - 0.5)
    particleSpeedRandoms.push(Math.random() - 0.5)
    particleFrictionRandoms.push(Math.random() - 0.5)
    particleDurationRandoms.push(Math.random() - 0.5)
  }
  return {
    size,
    blinkPhases,
    blinkStartRandoms,
    blinkRateRandoms,
    particlePhaseRandoms,
    particleDirections,
    particleSpeedRandoms,
    particleFrictionRandoms,
    particleDurationRandoms
  }
}

export function setStarBaseAttributes(geometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry, attrs: StarBaseAttributes, repeat: number = 1) {
const {
    burnRateRandoms,
    speedRandoms,
    frictionRandoms,
    beeStartRandoms,
    beeDirections,
    beeSpeedRandoms,
    beeDecayRandoms
  } = attrs
  function set(name: string, arr: number[], n: 1 | 3) {
    if (geometry instanceof THREE.InstancedBufferGeometry) {
      geometry.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n))
    } else {
      geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), n))
    }
  }
  function add1(name: string, arr: number[]) {
    let array: number[] = arr
    if (repeat > 1) {
      array = []
      arr.forEach(v => { for (let i = 0; i < repeat; i++) array.push(v) })
    }
    set(name, array, 1)
  }
  function add3(name: string, arr: N3D[]) {
    let array: number[] = []
    arr.forEach(p => { for (let i = 0; i < repeat; i++) array.push(...p) })
    set(name, array, 3)
  }
  add1('burnRateRandom', burnRateRandoms)
  add1('speedRandom', speedRandoms)
  add1('frictionRandom', frictionRandoms)
  add1('beeStartRandom', beeStartRandoms)
  add3('beeDirection', beeDirections)
  add1('beeSpeedRandom', beeSpeedRandoms)
  add1('beeDecayRandom', beeDecayRandoms)
}

export function setStarParticleAttributes(geometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry, attrs: StarParticleAttributes) {
  const {
    blinkPhases,
    blinkStartRandoms,
    blinkRateRandoms,
    particlePhaseRandoms,
    particleDirections,
    particleSpeedRandoms,
    particleFrictionRandoms,
    particleDurationRandoms
  } = attrs
  function set(name: string, arr: number[], n: 1 | 3) {
    if (geometry instanceof THREE.InstancedBufferGeometry) {
      geometry.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), n))
    } else {
      geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), n))
    }
  }
  function add1(name: string, arr: number[]) {
    set(name, arr, 1)
  }
  function add3(name: string, arr: N3D[]) {
    let array: number[] = []
    arr.forEach(p => array.push(...p))
    set(name, array, 3)
  }
  add1('blinkPhase', blinkPhases)
  add1('blinkStartRandoms', blinkStartRandoms)
  add1('blinkRateRandoms', blinkRateRandoms)
  add1('particlePhaseRandoms', particlePhaseRandoms)
  add3('particleDirections', particleDirections)
  add1('particleSpeedRandoms', particleSpeedRandoms)
  add1('particleFrictionRandoms', particleFrictionRandoms)
  add1('particleDurationRandoms', particleDurationRandoms)
}
