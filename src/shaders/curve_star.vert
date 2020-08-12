#include <hanabi_util>
#include <base_params>
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
  float burnRate = 1.0 + burnRateRandom * burnRateRandomness;
  float bt = t2 - beeStart * burnRate;
  if (bt > 0.0) {
    float k = beeDecay * (1.0 + beeDecayRandom * beeDecayRandomness);
    float speed = beeSpeed * (1.0 + beeSpeedRandom * beeSpeedRandomness);
    gpos += beePositionAt(k, bt) * beeDirection * speed;
    v -= beeVelocityAt(k, bt) * beeDirection * speed;
  }

  float width = mix(widthStart, widthEnd, t);
  vec3 n = normalize(cross(gpos - cameraPosition, v)) * width;
  coord = vec2(2.0 * t - 1.0, u);
  brightness = max(1.0 - time / duration / burnRate, 0.0);
  gl_Position = projectionMatrix * viewMatrix * vec4(gpos + u * n, 1);
}
