const vec3 wind = vec3(0.5, 0, 0);
const vec3 gravity = vec3(0, 0, -9.8);
vec3 velocityAt(vec3 v0, float a, float t) {
  return wind + gravity / a + ((v0 - wind) - gravity / a) * exp(-a * t);
}
vec3 positionAt(vec3 v0, float a, float t) {
  return (wind + gravity / a) * t - ((v0 - wind) - gravity / a) / a * (exp(-a * t) - 1.0);
}
