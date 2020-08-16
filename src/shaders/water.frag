uniform float time;
uniform sampler2D wave, sky, ground;
uniform vec2 resolution;
varying vec2 pos2d;

const float aspect = 3.0 / 4.0;
const float a = tan(75.0 / 180.0 * 3.1415926539 / 2.0);
void main() {
  vec2 coord = 0.5 + (gl_FragCoord.xy / resolution - 0.5) * 0.8;
  coord.y = 1.0 - coord.y;
  vec3 norm = normalize(vec3(
    texture2D(wave, pos2d * 0.97 + time * vec2(0.05, 0.02)).xy
    - texture2D(wave, -pos2d.xy * 0.71 + time * vec2(0.02, 0.05)).xy,
    4
  ));
  vec3 view = normalize(vec3(pos2d, 0) - cameraPosition);
  vec3 ref = reflect(view, norm);
  float zground = 0.04;
  float zsky = 1.0;
  vec4 gcoord4 = viewMatrix * vec4(mix(cameraPosition.xy, pos2d + ref.xy * zground / ref.z, cameraPosition.z / (cameraPosition.z + zground)), 0, 1);
  vec4 scoord4 = viewMatrix * vec4(mix(cameraPosition.xy, pos2d + ref.xy * zsky / ref.z, cameraPosition.z / (cameraPosition.z + zsky)), 0, 1);
  vec2 gcoord = vec2(0.5) + vec2(gcoord4.x * aspect, -gcoord4.y) / gcoord4.z / a * 0.5 * 0.8;
  vec2 scoord = vec2(0.5) + vec2(scoord4.x * aspect, -scoord4.y) / scoord4.z / a * 0.5 * 0.8;
  vec4 gcolor = texture2D(ground, gcoord);
  vec4 scolor = texture2D(sky, scoord);
  gl_FragColor = (gcolor.a * gcolor + (1.0 - gcolor.a) * scolor) * (1.0 + dot(view, norm)) * 0.9;
  gl_FragColor.a = 1.0;
}