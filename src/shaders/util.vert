const float pi = 3.14159265358979323846;
const vec3 wind = vec3(0.5, 0, 0);
const vec3 gravity = vec3(0, 0, -9.8);
vec3 velocityAt(vec3 v0, float k, float t) {
  return wind + gravity / k + (v0 - wind - gravity / k) * exp(-k * t);
}

vec3 positionAt(vec3 v0, float k, float t) {
  return (wind + gravity / k) * t - (v0 - wind - gravity / k) / k * (exp(-k * t) - 1.0);
}

float beePositionAt(float k, float t) {
  return (1.0 - (k * t + 1.0) * exp(-k * t)) / k;
}

float beeVelocityAt(float k, float t) {
  return k * t * exp(-k * t);
}

vec2 spiralPositionAt(float k, float w, float t) {
  return (vec2(1, 0) - (vec2(k, -w) * t + vec2(1, 0)) * exp(-k * t) * sin(vec2(w * t + pi / 2.0, w * t))) / k;
}

vec2 spiralVelocityAt(float k, float w, float t) {
  return vec2(k - w * w / k, -2.0 * w) * t * exp(-k * t) * sin(vec2(w * t + pi / 2.0, w * t));
}

#ifdef COLORS
uniform vec3[COLORS] colors;
vec3 interpolateColor(float t) {
  float t2 = t * float(COLORS);
  int i = clamp(int(t2), 0, COLORS - 2);
  return mix(colors[i], colors[i + 1], smoothstep(0.0, 1.0, t2 - float(i)));
}
#endif