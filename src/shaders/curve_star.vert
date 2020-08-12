#include <hanabi_util>
attribute vec3 direction;
attribute float frictionRandom;
attribute float speedRandom;
attribute float beeStartRandom;
attribute vec3 beeDirection;
attribute float beeSpeedRandom;
attribute float beeDecayRandom;
const float speedRandomness = 0.0;
const float frictionRandomness = 0.0;
const float beeStartRandomness = 0.0;
const float beeDecayRandomness = 0.0;
const float beeSpeedRandomness = 0.0;
const float beeDecay = 16.0;
const float beeSpeed = 8.0;
const float beeStart = 0.1;
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
  vec3 v0 = baseVelocity + velocityScale * direction * (1.0 + speedRandom * speedRandomness);
  float t2 = time - t * min(time, curveDelay);
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  vec3 gpos = center + positionAt(v0, friction2, t2);
  vec3 v = -velocityAt(v0, friction2, t2);
  float bt = t2 - (beeStart + beeStartRandom * beeStartRandomness);
  if (bt > 0.0) {
    float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
    float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
    gpos += beePositionAt(k, bt) * beeDirection * speed;
    v -= beeVelocityAt(k, bt) * beeDirection * speed;
  }

  float width = mix(widthStart, widthEnd, t);
  vec3 n = normalize(cross(gpos - cameraPosition, v)) * width;
  coord = vec2(2.0 * t - 1.0, u);
  brightness = max(1.0 - time / duration, 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos + u * n, 1);
}
