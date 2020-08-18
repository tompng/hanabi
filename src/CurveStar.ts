import * as THREE from 'three'
import type { N3D } from './util'
import vertexShader from './shaders/curve_star.vert'
import fragmentShader from './shaders/curve_star.frag'
import { setStarBaseAttributes, StarBaseAttributes, ShaderBeeParams, ShaderStopParams, buildUniforms, ShaderBaseParams, timeRangeMin, timeRangeMax, colorAt, BrightnessZero, generateInstancedBufferAttribute3D } from './attributes'

type CurveStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  stop?: ShaderStopParams
  bee?: ShaderBeeParams
  widthStart: number
  widthEnd: number
  curveFriction: number
  curveDelay: number
}
export class CurveStar {
  time: { value: number }
  mesh: THREE.Mesh
  brightness = BrightnessZero
  endTime: number
  material: THREE.ShaderMaterial
  constructor(geometry: THREE.BufferGeometry, public params: CurveStarParams, public count: number) {
    const { base, color, stop, bee, curveFriction, widthStart, widthEnd, curveDelay } = params
    const uniforms = {
      ...buildUniforms({ base, color, stop, bee }),
      widthStart: { value: widthStart },
      widthEnd: { value: widthEnd },
      curveDelay: { value: curveDelay },
      curveFriction: { value: curveFriction }
    }
    this.time = uniforms.time
    this.material = new THREE.ShaderMaterial({
      defines: { BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Mesh(geometry, this.material)
    this.endTime = curveDelay + timeRangeMax(stop ? Math.min(stop.time, base.duration) : base.duration, base.burnRateRandomness || 0)
  }
  update(time: number) {
    this.time.value = time
    const { curveDelay, base, stop, color, widthStart, widthEnd } = this.params
    this.mesh.visible = 0 <= time && time <= this.endTime
    if (!this.mesh.visible) {
      this.brightness = BrightnessZero
      return
    }
    const phase = time / (curveDelay + timeRangeMax(base.duration, base.burnRateRandomness || 0))
    this.brightness = colorAt(color, phase)
    let scale = 2 * (widthStart + widthEnd) ** 2 * this.count
    if (stop) {
      const s0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
      const s1 = curveDelay + timeRangeMax(stop.time, base.burnRateRandomness || 0)
      if (s0 < time) scale *= (s1 - time) / (s1 - s0)
    }
    this.brightness.r *= scale
    this.brightness.g *= scale
    this.brightness.b *= scale
  }
  dispose() {
    this.material.dispose()
  }
}

const lineAttributes = new Map<number, THREE.BufferAttribute>()
function generateLineAttributes(step: number) {
  let attr = lineAttributes.get(step)
  if (attr) return attr
  const positions: number[] = []
  for (let i = 0; i < step; i++) {
    const t = i / step
    const t2 = (i + 1) / step
    positions.push(t, -1, 0, t, +1, 0, t2, -1, 0, t, +1, 0, t2, +1, 0, t2, -1, 0)
  }
  attr = new THREE.BufferAttribute(new Float32Array(positions), 3)
  lineAttributes.set(step, attr)
  return attr
}

export function generateCurveStarGeometry(direction: N3D[], attrs: StarBaseAttributes, lineStep: number = 8) {
  const geometry = new THREE.InstancedBufferGeometry()
  const ds: number[] = []
  direction.forEach(p => ds.push(...p))
  geometry.setAttribute('position', generateLineAttributes(lineStep))
  setStarBaseAttributes(geometry, attrs)
  geometry.setAttribute('direction', generateInstancedBufferAttribute3D(direction))
  geometry.boundingSphere = new THREE.Sphere(undefined, 1024)
  return geometry
}
