import * as THREE from 'three'
import { N3D, sphereSurfaceRandom, positionAt, beePositionAt, velocityAt, beeVelocityAt } from './util'

export type ShaderBaseParams = {
  center: THREE.Vector3
  baseVelocity: THREE.Vector3
  speed: number
  friction: number
  duration: number
  rotation?: THREE.Matrix3
  speedRandomness?: number;
  frictionRandomness?: number
  burnRateRandomness?: number
}
export type ShaderStopParams = {
  time: number
}
export type ShaderBlinkParams = {
  start: number
  rate: number
  rateRandomness?: number
}
export type ShaderBeeParams = {
  decay: number
  speed: number
  start: number
  decayRandomness?: number
  speedRandomness?: number
}
export type ShaderLastFlashParams = {
  duration: number
  color: THREE.Color
  size: number
}
export type ShaderParticleParams = {
  speed: number
  friction: number
  duration: number
  speedRandomness?: number
  frictionRandomness?: number
  durationRandomness?: number
}
export type ShaderParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  stop?: ShaderStopParams
  blink?: ShaderBlinkParams
  bee?: ShaderBeeParams
  particle?: ShaderParticleParams
  lastFlash?: ShaderLastFlashParams
}
export function buildUniforms({ base, color, stop, blink, bee, particle, lastFlash }: ShaderParams) {
  const stopUniforms = stop ? { stopTime: { value: stop.time } } : {}
  const blinkUniforms = blink ? {
    blinkStart: { value: blink.start },
    blinkRate: { value: blink.rate },
    blinkRateRandomness: { value: blink.rateRandomness ?? 0 },
  } : {}
  const beeUniforms = bee ? {
    beeDecay: { value: bee.decay },
    beeSpeed: { value: bee.speed },
    beeStart: { value: bee.start },
    beeDecayRandomness: { value: bee.decayRandomness ?? 0 },
    beeSpeedRandomness: { value: bee.speedRandomness ?? 0 }
  } : {}
  const particleUniforms = particle ? {
    particleSpeed: { value: particle.speed },
    particleFriction: { value: particle.friction },
    particleDuration: { value: particle.duration },
    particleSpeedRandomness: { value: particle.speedRandomness ?? 0 },
    particleFrictionRandomness: { value: particle.frictionRandomness ?? 0 },
    particleDurationRandomness: { value: particle.durationRandomness ?? 0 },
  } : {}
  const rotationUniforms = base.rotation ? { value: base.rotation } : {}
  const colorUniforms: Record<string, { value: THREE.Color }> = {}
  if (Array.isArray(color)) {
    color.forEach((value, index) => {
      colorUniforms[`color${index}`] = { value }
    })
  } else {
    colorUniforms['color'] = { value: color }
  }
  const lastFlashUniforms = lastFlash ? {
    lastFlashDuration: { value: lastFlash.duration },
    lastFlashColor: { value: lastFlash.color },
    lastFlashSize: { value: lastFlash.size },
  } : {}
  return {
    time: { value: 0 },
    center: { value: base.center },
    baseVelocity: { value: base.baseVelocity },
    speed: { value: base.speed },
    friction: { value: base.friction },
    duration: { value: base.duration },
    speedRandomness: { value: base.speedRandomness ?? 0 },
    frictionRandomness: { value: base.frictionRandomness ?? 0 },
    burnRateRandomness: { value: base.burnRateRandomness ?? 0 },
    ...colorUniforms,
    ...lastFlashUniforms,
    ...rotationUniforms,
    ...stopUniforms,
    ...blinkUniforms,
    ...beeUniforms,
    ...particleUniforms
  }
}

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
  const blinkPhases: number[] = []
  const blinkRateRandoms: number[] = []
  for (let i = 0; i < size; i++) {
    const beeDirection: N3D = sphereSurfaceRandom()
    burnRateRandoms.push(Math.random() - 0.5)
    speedRandoms.push(Math.random() - 0.5)
    frictionRandoms.push(Math.random() - 0.5)
    beeStartRandoms.push(Math.random() - 0.5)
    beeSpeedRandoms.push(Math.random() - 0.5)
    beeDecayRandoms.push(Math.random() - 0.5)
    beeDirections.push(beeDirection)
    blinkPhases.push(Math.random())
    blinkRateRandoms.push(Math.random() - 0.5)
  }
  return {
    size,
    burnRateRandoms,
    speedRandoms,
    frictionRandoms,
    beeStartRandoms,
    beeDirections,
    beeSpeedRandoms,
    beeDecayRandoms,
    blinkPhases,
    blinkRateRandoms
  }
}

export function starStops(direction: N3D[], attributes: StarBaseAttributes, base: ShaderBaseParams, bee: ShaderBeeParams | null, stopTime: number) {
  const {
    center,
    baseVelocity,
    speed,
    friction,
    rotation,
    speedRandomness,
    frictionRandomness,
    burnRateRandomness,
  } = base
  const output: { p: N3D; v: N3D; t: number }[] = []
  for (let i = 0; i < attributes.size; i++) {
    const burnRate = (1 + 0.5 * attributes.burnRateRandoms[i] * (burnRateRandomness || 0))
    const t = stopTime * burnRate
    const vr = speed * (1 + 0.5 * attributes.speedRandoms[i] * (speedRandomness || 0))
    const f = friction * (1 + 0.5 * attributes.frictionRandoms[i] * (frictionRandomness || 0))
    let dir = direction[i]
    if (rotation) {
      const d3 = rotation.multiplyVector3(new THREE.Vector3(...dir))
      dir = [d3.x, d3.y, d3.z]
    }
    const v0: N3D = [
      baseVelocity.x + vr * dir[0],
      baseVelocity.y + vr * dir[1],
      baseVelocity.z + vr * dir[2]
    ]
    const p = positionAt(v0, f, t)
    const v = velocityAt(v0, f, t)
    p[0] += center.x
    p[1] += center.y
    p[2] += center.z
    if (bee) {
      const bt = t - bee.start * burnRate;
      if (bt > 0) {
        const f = bee.decay * (1.0 + attributes.beeDecayRandoms[i] * (bee.decayRandomness || 0))
        const speed = bee.speed * (1.0 + attributes.beeSpeedRandoms[i] * (bee.speedRandomness || 0))
        const bp = beePositionAt(f, bt)
        const bv = beeVelocityAt(f, bt)
        for (let j = 0; j < 3; j++) {
          p[j] += bp * attributes.beeDirections[i][j] * speed
          v[j] += bv * attributes.beeDirections[i][j] * speed
        }
      }
    }
    output.push({ p, v, t })
  }
  return output
}

export type StarParticleAttributes = ReturnType<typeof generateNewStarParticleAttributes>
const starParticleAttributesCache = new Map<number, StarParticleAttributes>()
export function generateStarParticleAttributes(size: number) {
  let attr = starParticleAttributesCache.get(size)
  if (!attr) starParticleAttributesCache.set(size, attr = generateNewStarParticleAttributes(size))
  return attr
}
function generateNewStarParticleAttributes(size: number) {
  const blinkPhases: number[] = []
  const blinkRateRandoms: number[] = []
  const particleDirections: N3D[] = []
  const particlePhases: number[] = []
  const particleSpeedRandoms: number[] = []
  const particleFrictionRandoms: number[] = []
  const particleDurationRandoms: number[] = []
  for (let i = 0; i < size; i++) {
    blinkPhases.push(Math.random())
    blinkRateRandoms.push(Math.random() - 0.5)
    particleDirections.push(sphereSurfaceRandom())
    particlePhases.push(Math.random() - 0.5)
    particleSpeedRandoms.push(Math.random() - 0.5)
    particleFrictionRandoms.push(Math.random() - 0.5)
    particleDurationRandoms.push(Math.random() - 0.5)
  }
  return {
    size,
    blinkPhases,
    blinkRateRandoms,
    particlePhases,
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
    if (geometry instanceof THREE.InstancedBufferGeometry) {
      geometry.setAttribute(name, generateInstancedBufferAttribute1D(arr, repeat))
    } else {
      geometry.setAttribute(name, generateBufferAttribute1D(arr, repeat))
    }
  }
  function add3(name: string, arr: N3D[]) {
    if (geometry instanceof THREE.InstancedBufferGeometry) {
      geometry.setAttribute(name, generateInstancedBufferAttribute3D(arr, repeat))
    } else {
      geometry.setAttribute(name, generateBufferAttribute3D(arr, repeat))
    }
  }
  add1('burnRateRandom', burnRateRandoms)
  add1('speedRandom', speedRandoms)
  add1('frictionRandom', frictionRandoms)
  add1('beeStartRandom', beeStartRandoms)
  add3('beeDirection', beeDirections)
  add1('beeSpeedRandom', beeSpeedRandoms)
  add1('beeDecayRandom', beeDecayRandoms)
}

export function timeRangeMin(time: number, randomness: number) {
  return time * (1 - 0.5 * randomness)
}
export function timeRangeMax(time: number, randomness: number) {
  return time * (1 + 0.5 * randomness)
}

export function setStarBaseBlinkAttributes(geometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry, attrs: StarBaseAttributes, repeat: number = 1) {
  const { blinkPhases, blinkRateRandoms } = attrs
  function add(name: string, arr: number[]) {
    let array: number[] = arr
    if (repeat > 1) {
      array = []
      arr.forEach(v => { for (let i = 0; i < repeat; i++) array.push(v) })
    }
    if (geometry instanceof THREE.InstancedBufferGeometry) {
      geometry.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(arr), 1))
    } else {
      geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(arr), 1))
    }
  }
  add('blinkPhase', blinkPhases)
  add('blinkRateRandom', blinkRateRandoms)
}

export function setStarParticleAttributes(geometry: THREE.BufferGeometry | THREE.InstancedBufferGeometry, attrs: StarParticleAttributes) {
  const {
    blinkPhases,
    blinkRateRandoms,
    particlePhases,
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
  add1('blinkRateRandom', blinkRateRandoms)
  add1('particlePhase', particlePhases)
  add3('particleDirection', particleDirections)
  add1('particleSpeedRandom', particleSpeedRandoms)
  add1('particleFrictionRandom', particleFrictionRandoms)
  add1('particleDurationRandom', particleDurationRandoms)
}

export function colorAt(color: THREE.Color | THREE.Color[], phase: number) {
  if (phase <= 0 || phase >= 1) return { r: 0, g: 0, b: 0 }
  if (Array.isArray(color)) {
    if (color.length === 1) return { r: color[0].r, g: color[0].g, b: color[0].b }
    let t = phase * color.length
    const i = Math.min(Math.floor(t), color.length - 1)
    t -= i
    t = t * t * (3 - 2 * t)
    const ca = color[i]
    if (i === color.length - 1) {
      return {
        r: ca.r * (1 - t),
        g: ca.g * (1 - t),
        b: ca.b * (1 - t)
      }
    }
    const cb = color[i + 1]
    return {
      r: (ca.r * (1 - t) + t * cb.r),
      g: (ca.g * (1 - t) + t * cb.g),
      b: (ca.b * (1 - t) + t * cb.b)
    }
  } else {
    const s = 1 - phase
    return { r: s * color.r, g: s * color.g, b: s * color.b }
  }
}
export function colorMult({ r, g, b }: { r: number; g: number; b: number }, scale: number) {
  return { r: r * scale, g: g * scale, b: b * scale }
}


const attributeCache1D = new Map<number[], Map<number, THREE.BufferAttribute>>()
const attributeCache3D = new Map<N3D[], Map<number, THREE.BufferAttribute>>()
const instancedAttributeCache1D = new Map<number[], Map<number, THREE.BufferAttribute>>()
const instancedAttributeCache3D = new Map<N3D[], Map<number, THREE.BufferAttribute>>()
export function generateBufferAttribute1D(array: number[], repeat: number = 1) {
  return cacheFetch2(attributeCache1D, array, repeat, () => {
    const arr = new Float32Array(repeat * array.length)
    array.forEach((v, i) => {
      for (let j = 0; j < repeat; j++) arr[repeat * i + j] = v
    })
    return new THREE.BufferAttribute(arr, 1)
  })
}
export function generateBufferAttribute3D(array: N3D[], repeat: number = 1) {
  return cacheFetch2(attributeCache3D, array, repeat, () => {
    const arr = new Float32Array(3 * repeat * array.length)
    array.forEach((v, i) => {
      for (let j = 0; j < repeat; j++) {
        const k = 3 * (repeat * i + j)
        arr[k] = v[0]
        arr[k+ 1] = v[1]
        arr[k + 2] = v[2]
      }
    })
    return new THREE.BufferAttribute(arr, 3)
  })
}
export function generateInstancedBufferAttribute1D(array: number[], repeat: number = 1) {
  return cacheFetch2(instancedAttributeCache1D, array, repeat, () => {
    const arr = new Float32Array(repeat * array.length)
    array.forEach((v, i) => {
      for (let j = 0; j < repeat; j++) arr[repeat * i + j] = v
    })
    return new THREE.InstancedBufferAttribute(arr, 1)
  })
}
export function generateInstancedBufferAttribute3D(array: N3D[], repeat: number = 1) {
  return cacheFetch2(instancedAttributeCache3D, array, repeat, () => {
    const arr = new Float32Array(3 * repeat * array.length)
    array.forEach((v, i) => {
      for (let j = 0; j < repeat; j++) {
        const k = 3 * (repeat * i + j)
        arr[k] = v[0]
        arr[k+ 1] = v[1]
        arr[k + 2] = v[2]
      }
    })
    return new THREE.InstancedBufferAttribute(arr, 3)
  })
}
export function cacheFetch2<T, U, V>(cache: Map<T, Map<U, V>>, key1: T, key2: U, f: () => V): V {
  let map = cache.get(key1)
  if (!map) cache.set(key1, map = new Map())
  let v = map.get(key2)
  if (!v) map.set(key2, v = f())
  return v
}
const emptyPositionAttributeCache = new Map<number, THREE.BufferAttribute>()
export function generateEmptyPositionAttribute(size: number) {
  let attr = emptyPositionAttributeCache.get(size)
  if (!attr) emptyPositionAttributeCache.set(size, attr = new THREE.BufferAttribute(new Float32Array(3 * size), 3))
  return attr
}

export const BrightnessZero = { r: 0, g: 0, b: 0 }
