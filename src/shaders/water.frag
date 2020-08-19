uniform float time;
uniform sampler2D wave, sky, ground;
uniform vec2 resolution;
varying vec2 pos2d;

const float aspect = 3.0 / 4.0;
const float a = tan(75.0 / 180.0 * 3.1415926539 / 2.0);
const float safe = 0.8;
void main() {
  vec2 coord = 0.5 + (gl_FragCoord.xy / resolution - 0.5) * safe;
  coord.y = 1.0 - coord.y;
  float wind = 0.2 + 0.8 * smoothstep(0.0, 1.0, texture2D(wave, pos2d * vec2(0.002, 0.002)).z);
  vec3 norm = normalize(vec3(
    (
      + texture2D(wave, +pos2d * 0.297 + vec2(0, 0.2 * time)).xy
      - texture2D(wave, -pos2d * 0.371 + vec2(0, 0.2 * time)).xy
      + texture2D(wave, +pos2d * 0.097 + vec2(0.05 * time, 0)).xy
      - texture2D(wave, -pos2d * 0.071 + vec2(0.05 * time, 0)).xy
    ) * wind,
    4
  ));
  vec3 view = normalize(vec3(pos2d, 0) - cameraPosition);
  vec3 ref = reflect(view, norm);
  float zground = 10.0;
  float zsky = 1000.0;
  vec4 gcoord4 = viewMatrix * vec4(mix(cameraPosition.xy, pos2d + ref.xy * zground / ref.z, cameraPosition.z / (cameraPosition.z + zground)), 0, 1);
  vec4 scoord4 = viewMatrix * vec4(mix(cameraPosition.xy, pos2d + ref.xy * zsky / ref.z, cameraPosition.z / (cameraPosition.z + zsky)), 0, 1);
  vec2 gcoord = vec2(0.5) + vec2(-gcoord4.x * aspect, gcoord4.y) / gcoord4.z / a * 0.5 * safe;
  vec2 scoord = vec2(0.5) + vec2(-scoord4.x * aspect, scoord4.y) / scoord4.z / a * 0.5 * safe;
  vec4 gcolor = texture2D(ground, gcoord);
  vec4 scolor = texture2D(sky, scoord);
  gl_FragColor = (gcolor.a * gcolor + (1.0 - gcolor.a) * scolor) * (1.0 + dot(view, norm)) * 0.9;
  gl_FragColor.a = 1.0;
}