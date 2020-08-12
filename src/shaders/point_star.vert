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

const float size = 0.02;
const float resolution = 800.0;
varying float brightness;

void main() {
  vec3 v0 = baseVelocity + velocityScale * direction * (1.0 + speedRandom * speedRandomness);
  float friction2 = friction * (1.0 + frictionRandom * frictionRandomness);
  vec3 gpos = center + positionAt(v0, friction2, time);
  float bt = time - (beeStart + beeStartRandom * beeStartRandomness);
  if (bt > 0.0) {
    float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
    float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
    gpos += beePositionAt(k, bt) * beeDirection * speed;
  }
  float fPointSize = resolution * size / distance(cameraPosition, gpos);
  gl_PointSize = clamp(2.0, fPointSize, 16.0);
  brightness = max(1.0 - time / duration, 0.0) * fPointSize / gl_PointSize;
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos, 1);
}
