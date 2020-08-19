import * as THREE from 'three'

export class Camera {
  mainCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 2048)
  waterCamera = new THREE.PerspectiveCamera(75, 1, 0.1, 2048)
  fov = 75
  waveCameraRatio = 0.8
  constructor(public width: number, public height: number, public position: { x: number; y: number; z: number } = { x: 0, y: 0, z: 0 }, public horizontalAngle: number = 0, public verticalAngle: number = 0) {
    this.update()
  }
  update() {
    this.mainCamera.fov = this.fov
    this.waterCamera.fov = 2 * 180 / Math.PI * Math.atan(Math.tan(Math.PI / 180 * this.fov / 2) / this.waveCameraRatio)
    ;[this.mainCamera, this.waterCamera].forEach(camera => {
      const zdir = camera == this.mainCamera ? 1 : -1
      camera.position.x = this.position.x
      camera.position.y = this.position.y
      camera.position.z = this.position.z * zdir
      camera.aspect = this.width / this.height
      camera.rotation.order = 'ZXY'
      camera.rotation.x = Math.PI / 2 + this.verticalAngle * zdir
      camera.rotation.z = this.horizontalAngle - Math.PI / 2
      camera.rotation.y = 0
      camera.updateProjectionMatrix()
      camera.matrixWorldNeedsUpdate = true
    })
  }
}
