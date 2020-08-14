import * as THREE from 'three'

const vertexShader = `
varying vec2 coord;
void main() {
  gl_Position = vec4(2.0 * position.xy, 0, 1);
  coord = (position.xy + 0.5);
}
`
const fragmentShader = `
uniform float mult1, mult2;
uniform sampler2D map1, map2;
varying vec2 coord;
void main() {
  gl_FragColor = mult1 * texture2D(map1, coord) + mult2 * texture2D(map2, coord);
  gl_FragColor.a = 1.0;
}
`

export class Capturer {
  films: { n: number; target: THREE.WebGLRenderTarget }[] = []
  scene = new THREE.Scene()
  camera = new THREE.Camera()
  frames = 0
  uniforms = {
    map1: { value: null as THREE.Texture | null },
    map2: { value: null as THREE.Texture | null },
    mult1: { value: 0 },
    mult2: { value: 0 }
  }
  constructor(public renderer: THREE.WebGLRenderer, public width: number, public height: number) {
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
  getNewFilm() {
    for (let i = 0; i < this.films.length; i++) {
      const target = this.films[i]
      if (target.n === 0) return [i, target] as const
    }
    const index = this.films.length
    const target = { n: 0, target: new THREE.WebGLRenderTarget(this.width, this.height) }
    this.films[index] = target
    return [index, target] as const
  }
  add(render: () => void) {
    if (this.frames > 1024) return
    ;(window as any).capturer = this
    this.frames++
    let [index, film] = this.getNewFilm()
    const originalRenderTarget = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(film.target)
    render()
    film.n = 1
    while (index > 0 && this.films[index].n === this.films[index - 1].n) {
      const f1 = this.films[index]
      const f2 = this.films[index - 1]
      const [_, ft] = this.getNewFilm()
      const s = this;(window as any).debug = (a: string) => eval(a)
      this.render(f1.target.texture, f2.target.texture, 0.5, 0.5, ft.target)
      const t2 = f2.target
      const tt = ft.target
      f2.target = tt
      ft.target = t2
      f1.n = 0
      f2.n *= 2
      index--
    }
    this.renderer.setRenderTarget(originalRenderTarget)
  }
  reset(n: number) {
    this.frames = 0
    this.films.forEach(f => { f.n = 0 })
    while (this.films.length > n) {
      const f = this.films.pop()
      f?.target.dispose()
    }
  }
  getOutput() {
    const [_i1, f1] = this.getNewFilm()
    f1.n = 1
    const [_i2, f2] = this.getNewFilm()
    f1.n = 0
    let { target: tmp1 } = f1
    let { target: tmp2 } = f2
    let index = 0
    while (this.films[index + 1].n > 0) index ++
    let { n, target: out } = this.films[index]
    index--
    while (index >= 0) {
      let f = this.films[index]
      const s = this;(window as any).debug2 = (a: string) => eval(a)
      this.render(out.texture, f.target.texture, n / (n + f.n), f.n / (n + f.n), tmp2)
      out = tmp2
      tmp2 = tmp1
      tmp1 = out
      n += f.n
      index--
    }
    return out
  }
  capture(canvas?: HTMLCanvasElement) {
    const buffer = new Uint8Array(4 * this.width * this.height)
    this.renderer.readRenderTargetPixels(this.getOutput(), 0, 0, this.width, this.height, buffer)
    if (!canvas) canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    const ctx = canvas.getContext('2d')!
    const imgdata = ctx.createImageData(this.width, this.height)
    for (let y = 0; y < this.height; y++) {
      const stride = 4 * this.width
      for (let i = 0; i < stride; i++) imgdata.data[y * stride + i] = i % 4 === 3 ? 0xff : buffer[(this.height - y - 1) * stride + i]
    }
    ctx.putImageData(imgdata, 0, 0)
    return canvas
  }
  render(map1: THREE.Texture, map2: THREE.Texture, mult1: number, mult2: number, dst: THREE.WebGLRenderTarget) {
    if (map1 == dst.texture || map2 == dst.texture) throw 'err'
    const target = this.renderer.getRenderTarget()
    this.renderer.setRenderTarget(dst)
    this.uniforms.map1.value = map1
    this.uniforms.map2.value = map2
    this.uniforms.mult1.value = mult1
    this.uniforms.mult2.value = mult2
    this.renderer.render(this.scene, this.camera)
    this.uniforms.map1.value = this.uniforms.map2.value = null
    this.renderer.setRenderTarget(target)
  }
  show() {
    const texture = this.getOutput().texture
    this.uniforms.map1.value = texture
    this.uniforms.map2.value = texture
    this.uniforms.mult1.value = 1
    this.uniforms.mult2.value = 0
    if (this.frames === 30) {
      this.renderer.render(this.scene, this.camera)
      this.reset(10)
    }
  }
}

