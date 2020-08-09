const vec3 color = vec3(0.8, 0.8, 1) * 0.2;
uniform float time;
varying float kira;
void main() {
  vec2 coord = 2.0 * gl_PointCoord.xy - vec2(1);
  float r2 = dot(coord, coord);
  gl_FragColor = vec4((1.0 - r2) * color * max(0.6 - time, 0.0) * kira, 1);
}
