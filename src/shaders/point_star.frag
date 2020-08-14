varying float brightness;
void main() {
  vec2 coord = 2.0 * gl_PointCoord.xy - vec2(1);
  float r2 = dot(coord, coord);
  gl_FragColor = vec4(vec3(1,0.5,0.2) * (1.0 - r2) * brightness, 1);
}
