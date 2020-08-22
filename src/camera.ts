import * as THREE from 'three'

export class Camera {
  mainCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 2048)
  waterCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 2048)
  fov = 75
  pointPixels = 0
  waveCameraSafe = 0.8
  aspect = 1
  constructor(public width: number, public height: number, public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }, public horizontalAngle: number = 0, public verticalAngle: number = 0) {
    this.update()
  }
  update() {
    this.verticalAngle = Math.min(Math.max(-Math.PI / 4, this.verticalAngle), Math.PI / 3)
    this.aspect = this.width / this.height
    this.mainCamera.fov = this.fov
    const fovtan = Math.min(0.75, 0.9 * this.height / this.width)
    this.fov = 2 * Math.atan(fovtan) * 180 / Math.PI
    this.waterCamera.fov = 2 * 180 / Math.PI * Math.atan(Math.tan(Math.PI / 180 * this.fov / 2) / this.waveCameraSafe)
    this.pointPixels = this.height / Math.tan(Math.PI / 180 * this.fov / 2)
    ;[this.mainCamera, this.waterCamera].forEach(camera => {
      const zdir = camera == this.mainCamera ? 1 : -1
      camera.position.x = this.position.x
      camera.position.y = this.position.y
      camera.position.z = this.position.z * zdir
      camera.aspect = this.aspect
      camera.rotation.order = 'ZXY'
      camera.rotation.x = Math.PI / 2 + this.verticalAngle * zdir
      camera.rotation.z = this.horizontalAngle - Math.PI / 2
      camera.rotation.y = 0
      camera.updateProjectionMatrix()
      camera.matrixWorldNeedsUpdate = true
    })
  }
  listenerPosition() {
    const hcos = Math.cos(this.horizontalAngle)
    const hsin = Math.sin(this.horizontalAngle)
    const vcos = Math.cos(this.verticalAngle)
    const vsin = Math.sin(this.verticalAngle)
    return {
      position: this.position,
      view: { x: vcos * hcos, y: vcos * hsin, z: vsin },
      up: { x: -vsin * hcos, y: -vsin * hsin, z: vcos }
    }
  }
  viewAt(xratio: number, yratio: number) {
    const s = Math.tan(this.fov * Math.PI / 180 / 2)
    const dx = s * (2 * xratio - 1) * this.width / this.height
    const dy = s * (1 - 2 * yratio)
    const cosxy = Math.cos(this.horizontalAngle)
    const sinxy = Math.sin(this.horizontalAngle)
    const cosz = Math.cos(this.verticalAngle)
    const sinz = Math.sin(this.verticalAngle)
    return {
      x: cosz * (cosxy + sinxy * dx),
      y: cosz * (sinxy - cosxy * dx),
      z: sinz + cosz * dy
    }
  }
}
