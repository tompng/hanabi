#include <hanabi_util>
attribute vec3 velocity;
uniform vec3 center;
uniform vec3 baseVelocity;
uniform float velocityScale;
uniform float friction;
uniform float duration;
uniform float curveDelay;
uniform float time;
uniform float widthStart;
uniform float widthEnd;
varying vec2 coord;
varying float brightness;
void main(){
  float t = position.x;
  float u = position.y;
  vec3 v0 = baseVelocity + velocityScale * velocity;
  float t2 = time - t * min(time, curveDelay);
  vec3 gpos = center + positionAt(v0, friction, t2);
  vec3 v = -velocityAt(v0, friction, t2);
  float width = mix(widthStart, widthEnd, t);
  vec3 n = normalize(cross(gpos - cameraPosition, v)) * width;
  coord = vec2(2.0 * t - 1.0, u);
  brightness = max(1.0 - time / duration, 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos + u * n, 1);
}
