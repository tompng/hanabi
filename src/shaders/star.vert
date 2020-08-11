attribute vec3 random;
uniform float time;
uniform vec3 velocity;
varying float kira, duration;
#include <hanabi_util>

void main() {
  gl_PointSize = 4.0;
  vec3 wind = vec3(0.1, 0, 0);
  vec3 v0 = velocity * 8.0 + random * 0.02 + vec3(-0.2,0.3,1);
  vec3 pos;
  float rnd1 = 16.0 * velocity.x - floor(16.0 * velocity.x);
  float rnd = 512.0 * random.x - floor(512.0 * random.x);
  float tf = 0.5 * rnd;
  float t = time - 0.01 * rnd;
  duration = 0.5 + 0.2 * rnd1;
  float tf2 = 0.3 + rnd1 * 0.1;
  kira = 0.6+ 0.4 * sin((123.0 + 23.0 * rnd) * t + rnd * 1234.0);  
  if (tf > 0.2 && t > tf2) {
    kira *= 3.0;
    pos = positionAt(v0, 6.0, tf2) + positionAt(velocityAt(v0, 6.0, tf2) + random * 1.0, 9.0, t - tf2);
  } else if (t > tf) {
    pos = positionAt(v0, 6.0, tf) + positionAt(velocityAt(v0, 6.0, tf) + random * 0.4, 16.0, t - tf);
  } else {
    kira = 0.5;
    pos = positionAt(v0, 6.0, t);
  }
  pos.z += 2.0;
  if (pos.z < -0.01) {
    gl_Position = vec4(0, 0, 0, -1);
    return;
  }
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1);
}
