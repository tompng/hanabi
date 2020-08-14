varying float brightness;
#ifdef COLORS
varying vec3 color;
#else
uniform vec3 color;
#endif
void main() {
  vec2 coord = 2.0 * gl_PointCoord.xy - vec2(1);
  float r2 = dot(coord, coord);
  gl_FragColor = vec4(color * (1.0 - r2) * brightness, 1);
}
