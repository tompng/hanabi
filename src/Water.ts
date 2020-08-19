import * as THREE from 'three'
import vertexShader from './shaders/water.vert'
import fragmentShader from './shaders/water.frag'
import waveUrl from '../wave.jpg'

const planeGeometry = new THREE.PlaneBufferGeometry()
planeGeometry.boundingSphere = new THREE.Sphere(undefined, 1024)
let waveTexture: THREE.Texture | null = null
const loader = new THREE.TextureLoader()
function getWaveTexture() {
  if (waveTexture) return waveTexture
  waveTexture = loader.load(waveUrl)
  waveTexture.wrapS = THREE.RepeatWrapping,
  waveTexture.wrapT = THREE.RepeatWrapping
  return waveTexture
}

export class Water {
  skyTarget: THREE.WebGLRenderTarget
  groundTarget: THREE.WebGLRenderTarget
  mesh: THREE.Mesh
  uniforms = {
    time: { value: 0 },
    wave: { value: null as THREE.Texture | null },
    sky: { value: null as THREE.Texture | null },
    ground: { value: null as THREE.Texture | null },
    resolution: { value: null as THREE.Vector2 | null }
  }
  constructor(width: number, height: number) {
    this.skyTarget = new THREE.WebGLRenderTarget(width, height)
    this.groundTarget = new THREE.WebGLRenderTarget(width, height)
    this.mesh = new THREE.Mesh(
      planeGeometry,
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader,
        fragmentShader
      })
    )
    this.uniforms.resolution.value = new THREE.Vector2(width, height)
  }
  update(time: number) {
    this.uniforms.time.value = time
    this.uniforms.wave.value = getWaveTexture()
    this.uniforms.ground.value = this.groundTarget.texture
    this.uniforms.sky.value = this.skyTarget.texture
  }
}