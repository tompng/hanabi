import * as THREE from 'three'

const renderTargetOption = {
  minFilter: THREE.LinearFilter,
  magFilter: THREE.LinearFilter,
  wrapS: THREE.ClampToEdgeWrapping,
  wrapT: THREE.ClampToEdgeWrapping
}
export function createRenderTarget(size: number) {
  return new THREE.WebGLRenderTarget(size, size, renderTargetOption)
}
const vertexShader = `
varying vec2 coord;
void main() {
  gl_Position = vec4(2.0 * position.xy, 0, 1);
  coord = (position.xy + 0.5);
}
`
const fragmentShader = `
uniform float delta;
uniform sampler2D map;
varying vec2 coord;
void main() {
  gl_FragColor = (
    4.0 * texture2D(map, coord)
    + texture2D(map, coord + vec2(+1, 0) * delta)
    + texture2D(map, coord + vec2(-1, 0) * delta)
    + texture2D(map, coord + vec2(0, +1) * delta)
    + texture2D(map, coord + vec2(0, -1) * delta)
  ) / 8.0;
}
`
export class Smoother {
  scene = new THREE.Scene()
  camera = new THREE.Camera()
  uniforms = {
    map: { value: null as THREE.Texture | null },
    delta: { value: 0 }
  }
  constructor(public renderer: THREE.WebGLRenderer) {
    const plane = new THREE.Mesh(
      new THREE.PlaneGeometry(),
      new THREE.ShaderMaterial({
        uniforms: this.uniforms,
        vertexShader,
        fragmentShader,
        depthTest: false
      })
    )
    this.scene.add(plane)
  }
  smooth(texture: THREE.Texture, output: THREE.WebGLRenderTarget, delta: number) {
    const target = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(output)
    this.uniforms.map.value = texture
    this.uniforms.delta.value = delta
    this.renderer.render(this.scene, this.camera)
    this.uniforms.map.value = null
    this.renderer.setRenderTarget(target)
  }
}