import * as THREE from 'three'
const sphereGeometry = new THREE.SphereBufferGeometry(1, 32, 16, undefined, undefined, 0, Math.PI / 2 * 1.2)
sphereGeometry.boundingSphere = new THREE.Sphere(undefined, 1024)
export const skyMesh = new THREE.Mesh(
  sphereGeometry,
  new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 color;
      const mat3 rotateMatrix = mat3(
        cos(0.1), 0, sin(0.1),
        0, 1, 0,
        -sin(0.1), 0, cos(0.1)
      );
      void main(){
        vec3 view = position.xzy;
        gl_Position = projectionMatrix * viewMatrix * vec4(cameraPosition + 1024.0 * rotateMatrix * view, 1);
        float n = view.z;
        color = vec3(0.4, 0.6, 0.75) * (1.0 - 0.5 * n) * 0.3;
        if (n < 0.2) color = color * (1.0 + 2.0 * (n - 0.1)) + vec3(0.6,0.3,0) * (0.1 - n);
      }
    `,
    fragmentShader: `varying vec3 color;void main(){gl_FragColor = vec4(color,1);}`,
    side: THREE.DoubleSide
  })
)
