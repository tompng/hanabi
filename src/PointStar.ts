import * as THREE from 'three'
import type { N3D } from './util'
import vertexShader from './shaders/point_star.vert'
import fragmentShader from './shaders/point_star.frag'
import { StarBaseAttributes, setStarBaseAttributes, setStarBaseBlinkAttributes, ShaderBaseParams, ShaderBeeParams, ShaderBlinkParams, buildUniforms, ShaderStopParams, ShaderLastFlashParams, timeRangeMin, timeRangeMax, colorAt, BrightnessZero } from './attributes'

type PointStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  lastFlash?: ShaderLastFlashParams
  stop?: ShaderStopParams
  bee?: ShaderBeeParams
  blink?: ShaderBlinkParams
  size: number
}

export class PointStar {
  time: { value: number }
  mesh: THREE.Points
  brightness = BrightnessZero
  count: number
  endTime: number
  constructor(geom: THREE.BufferGeometry, public params: PointStarParams) {
    const { base, color, lastFlash, stop, bee, blink, size } = params
    this.count = geom.getAttribute('position').count
    const uniforms = { ...buildUniforms({ base, color, lastFlash, stop, bee, blink }), size: { value: size } }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length, LAST_FLASH: !!lastFlash },
      uniforms: uniforms as any,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
    this.endTime = timeRangeMax(stop ? Math.min(stop.time, base.duration) : base.duration, base.burnRateRandomness || 0)
  }
  update(time: number) {
    this.time.value = time
    const { base, stop, color, lastFlash, size } = this.params
    this.mesh.visible = 0 <= time && time <= this.endTime
    if (!this.mesh.visible) {
      this.brightness = BrightnessZero
      return
    }
    const endTime = timeRangeMax(base.duration, base.burnRateRandomness || 0)
    const phase = time / endTime
    this.brightness = colorAt(color, phase)
    const scale = size ** 2 * this.count
    this.brightness.r *= scale
    this.brightness.g *= scale
    this.brightness.b *= scale
    if (lastFlash) {
      const { color, duration, size: flashSize } = lastFlash
      const minDuration = timeRangeMin(base.duration, base.burnRateRandomness || 0)
      const s = (time - minDuration + duration) / (endTime - minDuration + duration)
      if (0 < s && s < 1) {
        const l = 4 * (s * (1 - s)) ** 2 * (size + flashSize) ** 2
        this.brightness.r += l * color.r
        this.brightness.g += l * color.g
        this.brightness.b += l * color.b
      }
    }
    if (stop) {
      const s0 = timeRangeMin(stop.time, base.burnRateRandomness || 0)
      const s1 = timeRangeMax(stop.time, base.burnRateRandomness || 0)
      if (s0 < time) {
        const s = (s1 - time) / (s1 - s0)
        this.brightness.r *= s
        this.brightness.g *= s
        this.brightness.b *= s
      }
    }
  }
}

export function generatePointStarGeometry(direction: N3D[], attrs: StarBaseAttributes, lineStep: number = 8) {
  const geometry = new THREE.BufferGeometry()
  const ds: number[] = []
  direction.forEach(p => ds.push(...p))
  setStarBaseAttributes(geometry, attrs)
  setStarBaseBlinkAttributes(geometry, attrs)
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * direction.length), 3))
  geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(ds), 3))
  geometry.boundingSphere = new THREE.Sphere(undefined, 4)
  return geometry
}
