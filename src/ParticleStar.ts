import * as THREE from 'three'
import type { N3D } from './util'
import tailVertexShader from './shaders/particle_tail.vert'
import splashVertexShader from './shaders/particle_splash.vert'
import fragmentShader from './shaders/point_star.frag'
import { StarBaseAttributes, setStarBaseAttributes, generateStarParticleAttributes, setStarParticleAttributes, ShaderBaseParams, ShaderBeeParams, ShaderBlinkParams, ShaderStopParams, ShaderParticleParams, buildUniforms } from './attributes'

type ParticleStarParams = {
  base: ShaderBaseParams
  color: THREE.Color | THREE.Color[]
  bee?: ShaderBeeParams
  blink?: ShaderBlinkParams
  stop?: ShaderStopParams
  particle: ShaderParticleParams
  size: number
}

export class ParticleTailStar {
  time: { value: number }
  mesh: THREE.Points
  constructor(geom: THREE.BufferGeometry, { base, color, bee, stop, blink, particle, size }: ParticleStarParams) {
    const uniforms = { ...buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size } }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: !!stop, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: tailVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
  }
  update(time: number) {
    this.time.value = time
  }
}

export class ParticleSplashStar {
  time: { value: number }
  mesh: THREE.Points
  constructor(geom: THREE.BufferGeometry, { base, color, bee, blink, particle, stop, size }: ParticleStarParams & { stop: ShaderStopParams }) {
    const uniforms = {... buildUniforms({ base, color, bee, blink, stop, particle }), size: { value: size } }
    this.time = uniforms.time
    const material = new THREE.ShaderMaterial({
      defines: { BLINK: !!blink, BEE: !!bee, STOP: true, COLORS: Array.isArray(color) && color.length },
      uniforms: uniforms as any,
      vertexShader: splashVertexShader,
      fragmentShader,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    this.mesh = new THREE.Points(geom, material)
  }
  update(time: number) {
    this.time.value = time
  }
}

export function generateParticleStarGeometry(direction: N3D[], attrs: StarBaseAttributes, particles: number = 64) {
  const geometry = new THREE.BufferGeometry()
  const ds: number[] = []
  direction.forEach(p => {
    for (let i = 0; i < particles; i++) ds.push(...p)
  })
  setStarBaseAttributes(geometry, attrs, particles)
  const pattrs = generateStarParticleAttributes(particles * direction.length)
  setStarParticleAttributes(geometry, pattrs)
  geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3 * particles * direction.length), 3))
  geometry.setAttribute('direction', new THREE.BufferAttribute(new Float32Array(ds), 3))
  geometry.boundingSphere = new THREE.Sphere(undefined, 4)
  return geometry
}
