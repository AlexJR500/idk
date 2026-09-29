/* gl.js · WebGL engines for "A media luz" (builder 2).
   Spec 5.1 (engraving engine), 5.2 (allioli macro) and 5.3 (haze). Contract: GL_INTERFACE.md.
   Two contexts at most:
     engrave  WebGL2 on #engrave: bakes each dish into a G-buffer once, then re-cuts the lines per frame
              with the pass light; also bakes the hero still and draws the allioli macro (re-parented canvas).
     haze     WebGL1 on #haze: the smoke in the lamp beam (hero, then Esta noche).
   Everything reads from window.mediaLuz. Nothing here touches layout, scroll or copy. Until ok(stage) is
   called the page keeps its CSS fallbacks, and fail(stage) brings them back (errors, context loss). */
(function () {
  "use strict";
  const ML = window.mediaLuz;
  if (!ML || !ML.el || !ML.el.engrave) return;
  const OPT = Object.assign({ adapt: true }, window.__mlGL || {});   // test hook only: {adapt:false} keeps full quality, {cap:n} caps the resolution
  const DEG = Math.PI / 180;
  const STATIC = !!(ML.reduced || !ML.motion);                         // one frame per change, no time, no loops
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const rgb = (h, d) => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ""); if (!m) return d; const n = parseInt(m[1], 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; };
  const DPR = () => Math.max(1, window.devicePixelRatio || 1);
  const LOW = document.documentElement.classList.contains("low");      // the page's own flag: 4 cores or 4 GB or less
  /* Visibility from the page's observer; before its first report, measure (viewport ±25%). */
  const seen = (key, el) => {
    const v = ML.state[key]; if (typeof v === "boolean") return v;
    if (!el || !el.isConnected) return false;
    const r = el.getBoundingClientRect(), m = innerHeight * .25;
    return r.width > 0 && r.bottom > -m && r.top < innerHeight + m;
  };

  /* Dishes that did not pass the quality gate ship as their typographic plate (spec 5.6). Empty = all engraved. */
  const TYPO = [];

  /* ============================== shared GLSL ============================== */
  const COMMON = `
float ss(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
float h13(vec3 p){ p = fract(p * .1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float h12(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn(vec3 p){ vec3 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(mix(h13(i), h13(i + vec3(1,0,0)), f.x), mix(h13(i + vec3(0,1,0)), h13(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(h13(i + vec3(0,0,1)), h13(i + vec3(1,0,1)), f.x), mix(h13(i + vec3(0,1,1)), h13(i + vec3(1,1,1)), f.x), f.y), f.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h12(i), h12(i + vec2(1,0)), f.x), mix(h12(i + vec2(0,1)), h12(i + vec2(1,1)), f.x), f.y); }
float fbm3(vec3 p){ return vn(p) * .5714 + vn(p * 2.03 + 17.1) * .2857 + vn(p * 4.07 + 41.3) * .1429; }
float fbm2(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn2(p); p = p * 2.02 + vec2(7.3, 1.7); a *= .5; } return s / .9375; }
`;
  const VS2 = `#version 300 es
void main(){ vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2)); gl_Position = vec4(p * 2. - 1., 0., 1.); }`;

  /* ---------- pass A: raymarch one dish into a 4 x RGBA8 G-buffer (spec 5.1) ----------
     T0 normal, material/7 · T1 x, y (16 bit each) · T2 z (16 bit), AO, coverage ·
     T3 stroke coordinate (16 bit), soft shadow toward light A, soft shadow toward light B.
     The stroke coordinate is a per-object surface parameter in world units (around a croqueta, along a fry,
     over the chicken), so each object is cut with its own burin direction instead of one global slice.
     The two shadows are the ends of the scene's light sweep; the shade pass blends them by azimuth, so the food
     sits on the plate without a per-frame shadow march. */
  const BAKE = `#version 300 es
precision highp float; precision highp int;
uniform vec2 uRes; uniform vec3 uCam, uFw, uRt, uUp, uLa, uLb; uniform float uTan, uStepK, uDens; uniform int uScene, uSteps, uShSteps;
layout(location = 0) out vec4 o0; layout(location = 1) out vec4 o1; layout(location = 2) out vec4 o2; layout(location = 3) out vec4 o3;
const float D = .0174533, PI = 3.14159265;
const vec3 N1 = vec3(.196, .630, -.751);          /* screen-up tilted 15 deg away from the camera: no bullseyes on tops */
${COMMON}
float ridge(vec3 p){ float s = 0., a = .5; for (int i = 0; i < 3; i++) { float n = 1. - abs(2. * vn(p) - 1.); s += a * n * n; p = p * 2.03 + 11.7; a *= .5; } return s / .875; }
mat2 rot(float a){ float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float sdSph(vec3 p, float r){ return length(p) - r; }
float sdCyl(vec3 p, float r, float h){ vec2 d = abs(vec2(length(p.xz), p.y)) - vec2(r, h); return min(max(d.x, d.y), 0.) + length(max(d, 0.)); }
float sdTor(vec3 p, vec2 t){ return length(vec2(length(p.xz) - t.x, p.y)) - t.y; }
float sdCap(vec3 p, vec3 a, vec3 b, float r){ vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float sdRBox(vec3 p, vec3 b, float r){ vec3 q = abs(p) - b + r; return length(max(q, 0.)) + min(max(q.x, max(q.y, q.z)), 0.) - r; }
float sdEll(vec3 p, vec3 r){ float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / k1; }
float sdRCone(vec3 p, vec3 a, vec3 b, float r1, float r2){
  vec3 ba = b - a; float l2 = dot(ba, ba), rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1. / l2;
  vec3 pa = p - a; float y = dot(pa, ba), z = y - l2; vec3 xv = pa * l2 - ba * y;
  float x2 = dot(xv, xv), y2 = y * y * l2, z2 = z * z * l2, k = sign(rr) * rr * rr * x2;
  if (sign(z) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
  if (sign(y) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
  return (sqrt(x2 * a2 * il2) + y * rr) * il2 - r1; }
float smin(float a, float b, float k){ float h = max(k - abs(a - b), 0.) / k; return min(a, b) - h * h * k * .25; }
/* angle around segment a->b times radius: lines that run along a limb, seam underneath */
float around(vec3 p, vec3 a, vec3 b, float r){ vec3 ax = normalize(b - a), v = p - a; vec3 u = normalize(vec3(0., 1., 0.) - ax * ax.y), s = cross(ax, u);
  vec3 w = v - ax * dot(v, ax); return atan(dot(w, s), dot(w, u)) * r; }

bool gW = false; float gS = 0.;   /* when gW, the scene also writes the stroke coordinate of the closest object */

/* materials: 1 plate, 2 crust, 3 boniato, 4 skin, 5 sauce, 6 bone, 7 breadcrumb */
/* plate: radius .80, a low well and a rolled rim; the shade pass draws it as a few contours and sparse light strokes */
float plate(vec3 p){ return min(sdCyl(p - vec3(0., .03, 0.), .80, .03), sdTor(p - vec3(0., .072, 0.), vec2(.745, .032))); }
vec2 plateR(vec3 p){ if (gW) gS = (length(p.xz) + max(.104 - p.y, 0.) * 1.4) * .5; return vec2(plate(p), 1.); }

/* a piped dollop of allioli: three stacked lobes, a spiral line wound up it */
void dollop(inout vec2 r, vec3 p, vec3 c){
  vec3 q = p - c;
  float s = sdEll(q, vec3(.15, .075, .15));
  s = smin(s, sdEll(q - vec3(-.01, .07, .01), vec3(.11, .06, .11)), .05);
  s = smin(s, sdEll(q - vec3(-.02, .125, .02), vec3(.07, .045, .07)), .045);
  s = smin(s, sdEll(q - vec3(-.035, .165, .03), vec3(.03, .03, .03)), .04);
  if (s < r.x) { r = vec2(s, 5.); if (gW) gS = q.y * .9 + atan(q.x, q.z) / (2. * PI) / uDens; }
}
float croq(vec3 p, vec3 c, float yaw, out vec3 q){ q = p - c; q.xz = rot(yaw) * q.xz; vec3 k = q; k.y /= .92; return sdCap(k, vec3(-.24, 0., 0.), vec3(.24, 0., 0.), .155) * .92; }
vec2 sCroq(vec3 p, vec3 dol){
  vec2 r = plateR(p);
  vec3 q1, q2, q3;
  float c1 = croq(p, vec3(-.27, .203, .09), 18. * D, q1), c2 = croq(p, vec3(.07, .203, -.15), -32. * D, q2), c3 = croq(p, vec3(.23, .203, .23), 75. * D, q3);
  float c = min(c1, min(c2, c3));
  if (c < .05) c -= .012 * fbm3(p * 26.);
  if (c < r.x) { r = vec2(c, 7.); if (gW) { vec3 q = c1 <= min(c2, c3) ? q1 : c2 <= c3 ? q2 : q3; gS = atan(q.z, q.y) * .155; } }
  dollop(r, p, dol);
  return r; }

float crag(vec3 p){ return .03 * ridge(p * 6.5) + .008 * vn(p * 28.); }
vec2 sFried(vec3 p){
  vec2 r = plateR(p);
  float a = sdSph(p - vec3(-.40, .19, .02), .17);
  a = smin(a, sdSph(p - vec3(-.22, .21, .12), .18), .12);
  a = smin(a, sdSph(p - vec3(-.33, .23, .21), .13), .12);
  a = smin(a, sdSph(p - vec3(-.21, .19, -.07), .12), .12);
  float b = sdSph(p - vec3(.16, .20, -.30), .20);
  b = smin(b, sdSph(p - vec3(.34, .18, -.21), .15), .12);
  b = smin(b, sdSph(p - vec3(.28, .22, -.42), .14), .12);
  b = smin(b, sdSph(p - vec3(.08, .17, -.12), .12), .12);
  float d = sdRCone(p, vec3(-.04, .19, .20), vec3(.27, .15, .36), .15, .07);
  float m = min(min(a, b), d);
  if (m < .08) m -= crag(p);
  if (m < r.x) { r = vec2(m, 2.); if (gW) gS = d < min(a, b) + .02 ? around(p, vec3(-.04, .19, .20), vec3(.27, .15, .36), .12) : dot(p, N1); }
  float bone = min(sdCap(p, vec3(.23, .15, .34), vec3(.44, .13, .45), .035), smin(sdSph(p - vec3(.47, .13, .43), .05), sdSph(p - vec3(.44, .13, .50), .048), .03));
  if (bone < r.x) { r = vec2(bone, 6.); if (gW) gS = around(p, vec3(.23, .15, .34), vec3(.44, .13, .45), .035); }
  return r; }

float fry(vec3 p, vec3 c, float yaw, float pitch, float len, out vec3 q){ q = p - c; q.xz = rot(yaw) * q.xz; q.yz = rot(pitch) * q.yz;
  vec3 k = q; k.x += .025 * (k.z * k.z / (len * len)) * sign(sin(c.x * 37. + c.z * 11.)); float tp = 1. - .16 * ss(.5, 1., abs(k.z) / len);
  k.xy /= tp; return sdRBox(k, vec3(.044, .040, len), .018) * tp; }
/* a heap of sweet potato fries: eight on the plate, four on them, two on top (centre.xyz, yaw deg; pitch deg, half length) */
const vec4 FC[14] = vec4[14](
  vec4(-.30, .100, .05, 10.), vec4(-.10, .100, .24, -25.), vec4(.20, .100, .20, 35.), vec4(.33, .100, -.06, 80.),
  vec4(.05, .100, -.26, -70.), vec4(-.26, .100, -.22, 55.), vec4(.00, .100, .01, 5.), vec4(-.44, .100, .30, -60.),
  vec4(-.13, .178, .05, -40.), vec4(.13, .178, .03, 62.), vec4(.00, .178, -.12, 15.), vec4(.06, .176, .15, -82.),
  vec4(-.03, .256, .02, 30.), vec4(.09, .250, -.05, -55.));
const vec2 FP[14] = vec2[14](
  vec2(0., .30), vec2(0., .27), vec2(0., .30), vec2(0., .26), vec2(0., .29), vec2(0., .25), vec2(0., .32), vec2(0., .21),
  vec2(4., .29), vec2(-5., .28), vec2(3., .27), vec2(0., .24), vec2(5., .26), vec2(-4., .23));
vec2 sBoniato(vec3 p){
  vec2 r = plateR(p);
  float bd = length(p.xz - vec2(-.05, .02)) - .76; if (bd > .06) { r.x = min(r.x, bd); return r; }   /* outside the heap: skip the fries */
  vec3 q, qb = vec3(0.); float f = 1e5;
  for (int i = 0; i < 14; i++) {
    if (length(p - FC[i].xyz) - FP[i].y - .09 > f) continue;          /* its bounding sphere is farther than the best: skip */
    float g = fry(p, FC[i].xyz, FC[i].w * D, FP[i].x * D, FP[i].y, q); if (g < f) { f = g; qb = q; } }
  if (f < .03) f -= .004 * vn(p * 30.);
  if (f < r.x) { r = vec2(f, 3.); if (gW) gS = atan(qb.x, qb.y) * .055; }
  return r; }

/* a wedge cut from an ellipsoidal potato (radius R, half length L): the sector between a flat face on the plate
   (q.y = 0) and a second face at angle a; sc is its stroke coordinate: around the skin, parallel to the edge on the faces */
float wedge(vec3 q, float R, float L, float a, out float sc){
  float e = sdEll(q, vec3(R, R, L)), f1 = -q.y, f2 = dot(q.xy, vec2(-sin(a), cos(a)));
  float f = max(f1, f2);
  sc = e > f ? atan(q.y, q.x) * R : length(q.xy) + .5 * R;
  return max(e, f) - .004; }

/* pollo al carbón, trussed: a tall body with the keel between two breasts, thighs, drumsticks tied toward the front
   with the bone ends up, wings tucked; roast potatoes beside it */
vec2 sPollo(vec3 p){
  vec2 r = plateR(p);
  vec3 q = p - vec3(-.03, .06, -.12); q.xz = rot(-63. * D) * q.xz;     /* chicken frame: x toward the legs (toward the viewer), y up */
  vec3 m = vec3(q.x, q.y, abs(q.z));                                    /* both sides */
  float body = sdEll(q - vec3(-.04, .19, 0.), vec3(.40, .21, .29));
  float br = sdEll(m - vec3(.00, .25, .095), vec3(.31, .16, .135));     /* two breasts: the keel is the valley between them */
  float th = sdEll(m - vec3(.14, .16, .22), vec3(.19, .13, .12));
  vec3 ka = vec3(.20, .17, .22), kb = vec3(.47, .22, .09);
  float dr = sdRCone(m, ka, kb, .105, .05);
  float wg = sdEll(m - vec3(-.25, .17, .26), vec3(.15, .08, .09));
  float sk = smin(smin(smin(body, br, .06), smin(th, dr, .06), .07), wg, .05);
  if (sk < .03) sk -= .004 * vn(p * 16.);
  if (sk < r.x) { r = vec2(sk, 4.); if (gW) gS = dr < min(body, br) ? around(m, ka, kb, .09) : atan(q.z, q.y - .02) * .30 + .05 * q.x; }
  float bn = min(sdCap(m, vec3(.46, .22, .092), vec3(.53, .235, .082), .021), smin(sdSph(m - vec3(.545, .24, .065), .027), sdSph(m - vec3(.545, .23, .098), .026), .02));
  if (bn < r.x) { r = vec2(bn, 6.); if (gW) gS = around(m, vec3(.46, .22, .092), vec3(.55, .24, .08), .03); }
  /* roast potato wedges: a sector of a potato lying on one cut face, the other face turned up to the light and the
     skin on the outside, so each wedge shows two flat cut faces and a curved back */
  float s1, s2, s3;
  vec3 w1 = p - vec3(-.49, .062, .25); w1.xz = rot(62. * D) * w1.xz;
  vec3 w2 = p - vec3(-.60, .062, -.08); w2.xz = rot(-8. * D) * w2.xz; w2.x = -w2.x;
  vec3 w3 = p - vec3(-.25, .062, .50); w3.xz = rot(-38. * D) * w3.xz;
  float e1 = wedge(w1, .115, .15, 68. * D, s1), e2 = wedge(w2, .105, .135, 72. * D, s2), e3 = wedge(w3, .10, .125, 64. * D, s3);
  float w = min(e1, min(e2, e3));
  if (w < .02) w -= .004 * vn(p * 36.);                                 /* a little crust, the cut faces stay flat */
  if (w < r.x) { r = vec2(w, 3.); if (gW) gS = e1 < min(e2, e3) ? s1 : e2 < e3 ? s2 : s3; }
  return r; }

vec2 map(vec3 p){
  if (uScene == 0) return sCroq(p, vec3(.52, .06, -.04));
  if (uScene == 1) return sCroq(p, vec3(.46, .06, -.24));
  if (uScene == 2) return sFried(p);
  if (uScene == 3) return sBoniato(p);
  return sPollo(p); }
vec3 nrm(vec3 p){ const vec2 k = vec2(1., -1.); float e = .0012;
  return normalize(k.xyy * map(p + k.xyy * e).x + k.yyx * map(p + k.yyx * e).x + k.yxy * map(p + k.yxy * e).x + k.xxx * map(p + k.xxx * e).x); }
float occ(vec3 p, vec3 n){ float s = 0.;
  s += (.04 - map(p + n * .04).x) * 1.; s += (.09 - map(p + n * .09).x) * .5; s += (.15 - map(p + n * .15).x) * .25;
  return clamp(1. - s * 6., 0., 1.); }
/* soft shadow toward a light direction (IQ): two directions are baked, the shade pass blends them by azimuth */
float shadow(vec3 ro, vec3 rd){ float r = 1., t = .015;
  for (int i = 0; i < 48; i++) { if (i >= uShSteps) break; float h = map(ro + rd * t).x; r = min(r, 9. * h / t); t += clamp(h, .008, .1); if (r < .002 || t > 2.2) break; }
  return clamp(r, 0., 1.); }
vec2 pk(float v){ float k = floor(clamp(v, 0., 1.) * 65535. + .5); return vec2(floor(k / 256.), mod(k, 256.)) / 255.; }
void main(){
  o0 = vec4(0.); o1 = vec4(0.); o2 = vec4(0.); o3 = vec4(0.);
  vec2 uv = gl_FragCoord.xy / uRes * 2. - 1.;
  vec3 rd = normalize(uFw + (uv.x * uRes.x / uRes.y * uRt + uv.y * uUp) * uTan), ro = uCam;
  vec3 oc = ro - vec3(0., .22, 0.); float b = dot(oc, rd), c = dot(oc, oc) - 1.28 * 1.28, disc = b * b - c;
  if (disc < 0.) return;
  float sq = sqrt(disc), t = max(-b - sq, 0.), t1 = min(-b + sq, 9.), px = 2. * uTan / uRes.y;
  float best = 1e5, bt = t; bool hit = false;
  for (int i = 0; i < 128; i++) {
    if (i >= uSteps || t > t1) break;
    float d = map(ro + rd * t).x;
    float ratio = d / (px * t);
    if (ratio < best) { best = ratio; bt = t; }
    if (d < .0008 * t) { hit = true; break; }
    t += d * uStepK;
  }
  float cov = hit ? 1. : clamp(1. - best * 1.2, 0., 1.);   /* rays that pass within a pixel give a soft edge */
  if (cov <= 0.) return;
  if (!hit) t = bt;
  vec3 p = ro + rd * t; vec3 n = nrm(p);
  gW = true; vec2 h = map(p); gW = false;
  vec3 q = (p + 2.) / 4.;
  o0 = vec4(n * .5 + .5, h.y / 7.);
  o1 = vec4(pk(q.x), pk(q.y));
  o2 = vec4(pk(q.z), occ(p, n), cov);
  vec3 so = p + n * .006;
  o3 = vec4(pk(gS / 8. + .5), shadow(so, normalize(uLa - p)), shadow(so, normalize(uLb - p)));
}`;

  /* ---------- pass B: light, hatch and colour per frame (spec 5.1) ---------- */
  const SHADE = `#version 300 es
precision highp float; precision highp int;
uniform highp sampler2D uT0, uT1, uT2, uT3;
uniform vec2 uRes, uGRes; uniform vec3 uCam, uTarget;
uniform float uAz, uEl, uL, uDensity, uExpo, uElLift, uGamma, uShW, uPxK; uniform vec2 uPlate;
out vec4 o;
const float D = .0174533;
const vec3 CARBON = vec3(.051, .047, .043), PIEDRA = vec3(.647, .620, .580), AJO = vec3(.922, .898, .851), LUZ = vec3(1., .957, .878), TOSTADO = vec3(.780, .604, .420);
${COMMON}
float up(vec2 v){ return (v.x * 65280. + v.y * 255.) / 65535.; }
float hatch(float ph, float w){ float tri = abs(fract(ph) - .5) * 2.; float fw = fwidth(ph), aa = clamp(fw * 1.5, .001, .5);
  float l = w < .01 ? 0. : smoothstep(1. - w - aa, 1. - w + aa, tri);
  return mix(l, w * .35, ss(.4, .8, fw)); }   /* lines packed tighter than a pixel fade out (no moire, no grey smear) */
void main(){
  ivec2 ip = ivec2(floor(gl_FragCoord.xy * uGRes / uRes));
  vec4 t0 = texelFetch(uT0, ip, 0), t1 = texelFetch(uT1, ip, 0), t2 = texelFetch(uT2, ip, 0), t3 = texelFetch(uT3, ip, 0);
  float cov = t2.a;
  if (cov < .004) { o = vec4(0.); return; }
  vec3 N = normalize(t0.xyz * 2. - 1.); int m = int(t0.w * 7. + .5);
  vec3 p = vec3(up(t1.xy), up(t1.zw), up(t2.xy)) * 4. - 2.;
  float ao = t2.z, s = (up(t3.xy) - .5) * 8.;
  vec3 V = normalize(uCam - p);
  float el = uEl + uElLift;
  vec3 Ls = uTarget + 3.2 * vec3(sin(uAz) * cos(el), sin(el), cos(uAz) * cos(el));
  vec3 Lv = Ls - p; float dl = length(Lv); vec3 Ld = Lv / dl;
  vec3 axis = normalize(uTarget - Ls);
  float spot = ss(cos(34. * D), cos(18. * D), dot(-Ld, axis));
  float att = 1. / (1. + .15 * dl * dl);
  float nl = dot(N, Ld);
  float diff = m == 5 ? max((nl + .3) / 1.3, 0.) : max(nl, 0.);
  vec3 H = normalize(Ld + V); float nh = max(dot(N, H), 0.);
  float alb = .6, ks = .4, sh = 64.;
  if (m == 1) { alb = .3 * mix(.6, 1., ss(.2, .8, length(p.xz))); ks = .5; sh = 90.; }
  else if (m == 2 || m == 7) { alb = .78 + .22 * fbm3(p * 9.); ks = .25; sh = 24.; }
  else if (m == 3) { alb = 1.3; ks = .35; sh = 22.; }   /* sweet potato: the brightest, most golden food on the pass */
  else if (m == 4) { alb = .75 * mix(.45, 1., ss(.28, .62, fbm3(p * 6.))); ks = .55; sh = 40.; }
  else if (m == 5) { alb = .95; ks = 1.; sh = 96.; }
  else if (m == 6) { alb = .9; ks = .3; sh = 32.; }
  float spec = pow(nh, sh) * ks * step(0., nl);
  float shd = mix(.1, 1., mix(t3.z, t3.w, uShW));                      /* baked soft shadow, blended between its two lights */
  float I = uL * uExpo * spot * att * (diff * alb * mix(.55, 1., ao) + spec) * shd + .015;
  if (m == 4) I += .25 * pow(1. - max(dot(N, V), 0.), 3.) * uL;
  if (m == 3 && h13(floor(p * 90.)) > .985 && N.y > .5) I += .5 * uL;
  float ink; vec3 lc;
  if (m == 1) {
    /* the plate: a few contours (rim crest, well edge, lip, one stroke round the side) and sparse straight strokes
       on the well that follow the light and vanish in shadow; most of the face stays black */
    /* contours are at least about 1.2 px wide: each distance is measured in pixels, with one pixel's footprint at
       this depth (pw) as the floor, so a ring never breaks into dashes where the derivatives collapse */
    float pw = uPxK * length(uCam - p);
    float r = length(p.xz), lit = clamp(I, 0., 1.), fr = max(fwidth(r), pw);
    /* where the rim is seen edge-on (the far side of the crest, at the front) r jumps across a texel: no ring is drawn
       there, so the rings do not break into dashes along the crest's silhouette */
    float gz = 1. - ss(3., 6., fwidth(r) / pw);
    float c1 = (1. - ss(.9, 2., abs(r - .745) / fr)) * gz;
    float c2 = (1. - ss(.9, 2., abs(r - .716) / max(fwidth(r), .3 * pw))) * gz * ss(.2, .45, dot(N, V));   /* on the back wall r barely moves: a tighter floor keeps this ring a line, not a band */
    float lip = length(vec2(max(.80 - r, 0.), max(.06 - p.y, 0.)));
    float c3 = 1. - ss(.9, 2., lip / max(fwidth(lip), pw));
    float side = 1. - ss(.25, .55, abs(N.y)), fy = max(fwidth(p.y), pw * 1.2);
    float c4 = side * max(1. - ss(.9, 2., abs(p.y - .03) / fy), 1. - ss(.9, 2., abs(p.y - .007) / fy));
    float cont = max(max(c1, c2), max(c3, c4)) * mix(.4, 1., ss(.05, .5, lit));
    vec2 ld = normalize(vec2(sin(uAz), cos(uAz)));
    float phf = dot(p.xz, vec2(-ld.y, ld.x)) * uDensity * uPlate.x;
    float wf = ss(.3, .8, lit) * uPlate.y * step(.5, N.y) * (1. - ss(.68, .71, r));
    ink = max(cont, hatch(phf, wf));
    lc = mix(PIEDRA, AJO, ss(.2, .8, lit));
  } else {
    float ph1 = s * uDensity;
    float crumb = 1.;
    if (m == 7) {                                                       /* breadcrumb: broken strokes and lit crumbs */
      float c1 = vn(p * 62.), c2 = vn(p * 23. + 7.);
      ph1 += .35 * c2;
      crumb = mix(ss(.1, .24, c1), 1., .75 * ss(.6, .9, I));          /* crumbs break the strokes; in the highlights they only grey the white */
      I += .45 * uL * spot * ss(.72, .9, c1) * max(nl, 0.);
    } else if (m == 2) ph1 += .3 * vn(p * 3.);
    else if (m == 4) {                                                  /* roast skin: a fine, nearly straight burin and charred flecks */
      ph1 = s * uDensity * 1.55 + .12 * vn(p * 5.);
      crumb = mix(.6, 1., ss(.15, .4, vn(p * 18. + 3.)));
    }
    else ph1 += .2 * vn(p * 3.);
    /* One burin, following the form: its lines widen with the light and merge in the highlights (white cut from black),
       thin out in the mid-tones and vanish in shadow. No second set crosses the highlights. */
    float w1 = clamp(pow(max(I, 0.), uGamma), 0., 1.) * .8 + .15 * ss(.7, .95, I);
    ink = hatch(ph1, w1) * crumb;
    float mid = ss(.18, .3, I) * (1. - ss(.45, .6, I));
    if (m == 4)                                                         /* sparse cross strokes in the mid-tones break the long bands */
      ink = max(ink, hatch(dot(p, normalize(vec3(-.5, .8, .35))) * uDensity * 1.1, .25 * mid) * step(.7, vn(p * 34.)));
    else                                                                /* elsewhere short crossing strokes, mid-tones only: the black ground still shows */
      ink = max(ink, hatch(dot(p, normalize(vec3(1., .15, -.6))) * uDensity * .9, .3 * mid) * step(.62, vn(p * 38. + 5.)));
    if (m == 5 && I > .9) ink = mix(ink, 1., ss(.9, 1.1, I));
    /* white lines with at most a third of Tostado in the mid-tones; highlights are pure Ajo */
    lc = m == 5 ? LUZ : m == 6 ? AJO : mix(TOSTADO, AJO, .65 + .35 * ss(.45, .9, I));
  }
  vec3 col = max(mix(CARBON, lc, ink), CARBON) + (h12(gl_FragCoord.xy) - .5) / 255.;
  float lk = ss(.05, .3, uL);                                           /* an unlit stage is black: nothing floats in the dark */
  o = vec4(col * cov * lk, cov * lk);
}`;

  /* ---------- allioli macro: a lit heightfield, no raymarch (spec 5.2) ----------
     The sauce fills a central ellipse (the same footprint as the CSS fallback) and falls to Carbón at the edges,
     so the step list at the bottom-left and the rim hint at the top always sit on black. */
  const MACRO = `#version 300 es
precision highp float;
uniform vec2 uRes, uHL; uniform float uDens, uGrain, uFilm, uEdge, uSpiral, uTwist, uThick, uBind, uL, uAz, uEl;
out vec4 o;
const vec3 CARBON = vec3(.051, .047, .043), PIEDRA = vec3(.647, .620, .580), AJO = vec3(.922, .898, .851), LUZ = vec3(1., .957, .878);
${COMMON}
float asp; vec2 C, RR;   /* aspect; heightfield centre (aspect units); footprint radii (uv units) */
/* garlic grains: round bumps of random size in three cells out of four */
float grains(vec2 p){
  vec2 i = floor(p), f = fract(p); float b = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)), c = i + g;
    float h = h12(c), sz = .2 + .3 * h12(c + 7.1);
    vec2 o = vec2(h12(c + 3.3), h12(c + 5.7)) * .7 + .15;
    float d = length(g + o - f) / sz;
    b = max(b, (1. - ss(0., 1., d)) * step(.25, h) * (.6 + .4 * h));
  }
  return b; }
float gr;   /* grain part of the last height, kept out of the line displacement */
float film(vec2 q){ return 1. - ss(uEdge - .12, uEdge + .12, q.x / asp * .8 + q.y * .2); }   /* the swept side is the filmed side */
float hgt(vec2 q){
  vec2 d = (q - C) / vec2(asp, 1.) / RR * .45; float r = length(d), th = atan(d.y, d.x);   /* footprint space: the bowl's mouth seen at an angle */
  float base = -.25 * r * r; gr = 0.;
  if (uGrain > .001) gr = uGrain * (.0065 * grains(q * 66.) + .004 * fbm2(q * 13.));
  gr *= 1. - .88 * film(q) * uFilm;                                     /* the film levels the grains (spec: h*.12 + base*.88) */
  float h = base + gr;
  if (uSpiral > .001) h += uSpiral * .012 * ss(.2, 1., sin(26. * r + th - uTwist)) * ss(.62, .1, r);
  return h; }
float hatch(float ph, float w){ float tri = abs(fract(ph) - .5) * 2.; float fw = fwidth(ph), aa = clamp(fw * 1.5, .001, .5);
  float l = w < .01 ? 0. : smoothstep(1. - w - aa, 1. - w + aa, tri); return mix(l, w * .35, ss(.4, .8, fw)); }
void main(){
  asp = uRes.x / uRes.y; C = vec2(.52 * asp, .55);
  RR = vec2(.42, min(.25, .26 * asp));                                    /* a wide, low ellipse: 84% of the width, at most half the height */
  vec2 uv = vec2(gl_FragCoord.x / uRes.x, 1. - gl_FragCoord.y / uRes.y);
  vec2 q = vec2(uv.x * asp, uv.y);
  float e = 1. / uRes.y, h = hgt(q), hg = gr;
  float hx = hgt(q + vec2(e, 0.)), gx = gr, hy = hgt(q + vec2(0., e)), gy = gr;
  vec2 g = vec2(hx - h, hy - h) / e, gg = vec2(gx - hg, gy - hg) / e;
  float hl0 = h - hg * .4;                                                 /* the grains bend the lines: the paste reads as crushed garlic */
  vec3 n = normalize(vec3(-g * .5, 1.)), nb = normalize(vec3(-(g - gg) * .5, 1.));   /* with and without the garlic grains */
  float re = length((uv - vec2(.52, .55)) / RR);                        /* 1 at the edge of the sauce ellipse */
  vec3 Ld = normalize(vec3(sin(uAz) * cos(uEl), -cos(uAz) * cos(uEl), sin(uEl)));
  vec2 hl = vec2(uHL.x * asp, uHL.y);
  vec3 H = normalize(vec3(.5 * (hl - C) * .5, 1.));                      /* the gloss peaks where the page puts --hx/--hy */
  float db = max((dot(nb, Ld) + .45) / 1.45, 0.), dg = max((dot(n, Ld) + .45) / 1.45, 0.);
  float diff = db * mix(1., clamp(dg / max(db, .02), .85, 1.5), .5);     /* grains catch the light: they never read as dark pits */
  float fl = film(q) * uFilm;                                             /* oil only where the film has spread */
  float gloss = mix(10., 140., fl), spec = pow(max(dot(nb, H), 0.), gloss) * mix(.15, 1.2, fl);   /* the oil sheen follows the surface, not each grain */
  spec += uGrain * (1. - fl) * .4 * pow(max(dot(n, normalize(Ld + vec3(0., 0., 1.))), 0.), 30.);   /* wet glints on the paste */
  float I = uL * (.55 * diff + spec) * (1. - ss(.55, .98, re)) + uBind * .72 * (1. - ss(.66, .98, re));
  float ph1 = (q.y + hl0 * .26) * uDens, ph2 = (q.x + q.y * .3 - hl0 * .18) * uDens * .9;
  float w1 = pow(clamp(I, 0., 1.), mix(.85, .55, uThick)) * .92, w2 = clamp((I - .55) / .45, 0., 1.) * .85;
  float ink = max(hatch(ph1, w1), hatch(ph2, w2));
  ink = mix(ink, .985, ss(.86, 1.2, I) * uBind);   /* near-solid Luz: the groove still shows through */
  vec3 col = mix(CARBON, mix(mix(PIEDRA, AJO, .55), LUZ, uFilm), ink);
  float rim = (1. - ss(.004, .02, abs(re - 1.06) * .44)) * ss(0., -.7, (uv.y - .55) / RR.y);   /* the bowl rim, concentric, far side only */
  col = mix(col, PIEDRA, rim * hatch(ph1, .45) * .75);
  col = max(col, CARBON) + (h12(gl_FragCoord.xy) - .5) / 255.;
  o = vec4(col, 1.);
}`;

  /* ---------- haze (WebGL1, spec 5.3) ---------- */
  const HVS = `attribute vec2 aP; void main(){ gl_Position = vec4(aP, 0., 1.); }`;
  const HFS = `precision highp float;
uniform vec2 uRes, uBulb, uDir; uniform float uS, uHalf, uLen, uLight, uDensity, uTime; uniform vec3 uLamp;
float ss(float a, float b, float x){ float t = clamp((x - a) / (b - a), 0., 1.); return t * t * (3. - 2. * t); }
float h12(vec2 p){ vec3 q = fract(vec3(p.xyx) * .1031); q += dot(q, q.yzx + 33.33); return fract((q.x + q.y) * q.z); }
float vn2(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h12(i), h12(i + vec2(1., 0.)), f.x), mix(h12(i + vec2(0., 1.)), h12(i + vec2(1., 1.)), f.x), f.y); }
float fbm4(vec2 p){ float s = 0., a = .5; for (int i = 0; i < 4; i++) { s += a * vn2(p); p = p * 2.03 + vec2(1.7, 9.2); a *= .5; } return s / .9375; }
void main(){
  vec2 fr = gl_FragCoord.xy / uS;
  vec2 v = fr - uBulb; float a = dot(v, uDir);
  float ang = atan(length(v - a * uDir), max(a, .001));
  float cone = step(0., a) * ss(uHalf, uHalf * .55, ang) * ss(uLen * 1.15, uLen * .7, a) * ss(0., 40., a);
  float n = fbm4(fr / uRes.y * 3. + vec2(0., -uTime * .02));
  float hz = cone * (.35 + .65 * n) * uLight * uDensity / (1. + a / uLen);
  vec3 cap = vec3(.165, .149, .133);
  vec3 col = min(mix(cap, vec3(.780, .604, .420), .10) * hz * 1.6, cap);
  col += uLamp * exp(-dot(v, v) / (2. * 18. * 18.)) * uLight;
  col = max(col + (h12(gl_FragCoord.xy) - .5) / 255. * step(.002, hz), 0.);
  gl_FragColor = vec4(col, max(col.r, max(col.g, col.b)));   /* premultiplied: light only, transparent elsewhere */
}`;

  /* ============================== GL helpers ============================== */
  /* Compile and link without blocking: with KHR_parallel_shader_compile the driver works in the background and we
     poll once per frame; without it, the first status query simply waits. done(list) gets {p, u} or null per program. */
  function buildAll(gl, pairs, done) {
    const ext = gl.getExtension("KHR_parallel_shader_compile");
    const jobs = pairs.map(([vs, fs]) => {
      const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; };
      const v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs), p = gl.createProgram();
      gl.attachShader(p, v); gl.attachShader(p, f); gl.linkProgram(p);
      return { p, v, f };
    });
    const finish = () => done(jobs.map(({ p, v, f }) => {
      const good = gl.getProgramParameter(p, gl.LINK_STATUS);
      gl.deleteShader(v); gl.deleteShader(f);
      if (!good) { gl.deleteProgram(p); return null; }
      const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
      for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); if (a) u[a.name.replace(/\[0\]$/, "")] = gl.getUniformLocation(p, a.name); }
      return { p, u };
    }));
    /* Without the extension any status query waits for the compiler. WebGL2: a fence after the links is signalled
       only once the driver has compiled them, and polling it (timeout 0) never waits, so the query that follows is
       cheap. WebGL1: flush, give the driver a few frames of its own, then ask. */
    if (!ext) {
      let sync = null; try { sync = gl.fenceSync ? gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0) : null; } catch (e) { sync = null; }
      gl.flush();
      const t0 = performance.now(); let k = 0;
      const later = () => {
        if (gl.isContextLost()) return;
        if (sync) {
          const st = gl.clientWaitSync(sync, 0, 0);
          if (st === gl.TIMEOUT_EXPIRED && performance.now() - t0 < 30000) { requestAnimationFrame(later); return; }
          gl.deleteSync(sync); finish(); return;
        }
        if (++k < 6) requestAnimationFrame(later); else finish();
      };
      requestAnimationFrame(later); return;
    }
    const poll = () => {
      if (gl.isContextLost()) return;
      if (jobs.every(j => gl.getProgramParameter(j.p, ext.COMPLETION_STATUS_KHR))) finish(); else requestAnimationFrame(poll);
    };
    poll();
  }
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = a => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

  /* Camera (spec 5.1): elevation 35 deg, azimuth 0 (camera on +z), vertical FOV 30 deg, never top-down.
     The spec's width rule (plate = 82% of the width) pushes the near rim out of a 16:10 frame, so the distance and a
     vertical pan are solved instead: the whole plate and the food fit (plate <= 78% of the width, 4% margin top and
     bottom) and the plate's centre lands on the page's pool when there is room (oy, in NDC). */
  const CAMS = {};
  function camera(aspect, oy) {
    oy = Math.round((oy || 0) * 50) / 50;
    const key = aspect.toFixed(3) + ":" + oy; if (CAMS[key]) return CAMS[key];
    const tan = Math.tan(15 * DEG), el = 35 * DEG, pts = [];
    for (let a = 0; a < 32; a++) { const t = a / 32 * Math.PI * 2, c = Math.cos(t), s = Math.sin(t); pts.push([c * .80, 0, s * .80], [c * .78, .104, s * .78]); }
    pts.push([0, .5, 0], [-.3, .42, .1], [.3, .42, -.1]);
    const mk = (T, dist) => { const C = [T[0], T[1] + dist * Math.sin(el), T[2] + dist * Math.cos(el)], fw = norm(sub(T, C)), rt = norm(cross(fw, [0, 1, 0])); return { C, T, fw, rt, up: cross(rt, fw), tan, dist }; };
    const proj = (c, p) => { const v = sub(p, c.C), z = dot(v, c.fw); return [dot(v, c.rt) / (z * tan * aspect), dot(v, c.up) / (z * tan)]; };
    const pan = (c, dy) => { const o = dy * c.dist * tan; return [c.T[0] - c.up[0] * o, c.T[1] - c.up[1] * o, c.T[2] - c.up[2] * o]; };
    const span = c => { let y0 = 1e9, y1 = -1e9; pts.forEach(p => { const y = proj(c, p)[1]; y0 = Math.min(y0, y); y1 = Math.max(y1, y); }); return [y0, y1]; };
    let T = [0, .18, 0], cam = mk(T, 3.2), xm = .78;
    for (let it = 0; it < 6; it++) {
      let lo = 1.5, hi = 30;
      for (let k = 0; k < 32; k++) { const d = (lo + hi) / 2, c = mk(T, d); if (pts.every(p => Math.abs(proj(c, p)[0]) <= xm)) hi = d; else lo = d; }
      cam = mk(T, hi);
      T = pan(cam, oy - proj(cam, [0, .03, 0])[1]); cam = mk(T, hi);
      let [y0, y1] = span(cam);
      if (y0 < -.92) T = pan(cam, -.92 - y0); else if (y1 > .92) T = pan(cam, .92 - y1);
      cam = mk(T, hi);
      [y0, y1] = span(cam);
      if (y1 - y0 > 1.84) xm *= .96; else break;              /* too tall for the frame: step back */
    }
    return CAMS[key] = cam;
  }
  /* Where the pool's centre falls in a host (NDC y, up positive). */
  function poolY(host, pool) {
    if (!host || !pool) return 0;
    const a = host.getBoundingClientRect(), b = pool.getBoundingClientRect();
    if (!a.height) return 0;
    return clamp(-((b.top + b.height / 2) - (a.top + a.height / 2)) / (a.height / 2), -.5, .5);
  }
  const pitch = () => ML.phone() ? 3.0 : 3.5;        /* CSS px between engraved lines (spec 5.1), independent of DPR */
  const HERO_PITCH = () => ML.phone() ? 2.4 : 2.8;   /* the hero still is small: a finer burin keeps the croquetas legible */
  const lineDensity = (cam, cssH, pc) => (cssH / (2 * cam.dist * cam.tan)) / (pc || pitch());
  /* Soft shadows are baked for the two ends of each scene's light sweep (azimuths, elevation incl. the lamp lift, deg)
     and blended by azimuth per frame: the hero's single key; the page's -40..+40 sweep; the pollo's -55..+25. */
  const SHADOW = s => s === 0 ? [-15, -15, 62] : s === 4 ? [-55, 25, 40] : [-40, 40, 48];
  const lightPos = (T, az, el) => [T[0] + 3.2 * Math.sin(az * DEG) * Math.cos(el * DEG), T[1] + 3.2 * Math.sin(el * DEG), T[2] + 3.2 * Math.cos(az * DEG) * Math.cos(el * DEG)];

  /* ============================== engrave engine (WebGL2) ============================== */
  const E = {
    cv: ML.el.engrave, gl: null, ready: false, bakeP: null, shadeP: null, macroP: null, tex: [], fbo: null, gw: 0, gh: 0,
    lost: false, broken: false, cap: OPT.cap || (LOW ? 1 : ML.phone() ? 2 : 1.5), stills: null,   /* LOW devices start at DPR 1 */
    place: "platos",
    scene: -1, key: "", cam: null,  /* what the G-buffer holds: scene (0 hero, 1..4 dishes), "scene:WxH", its camera */
    want: 0,                        /* the dish the page shows */
    bake: null,                     /* { scene, w, h, cssH, oy, pc, band, then } */
    heroPending: true, heroKey: "",
    hero: null,                     /* the hero still's own target: { fbo, tex, w, h } (the shared canvas is never resized for it) */
    hread: null,                    /* a hero readback in flight: { pbo, sync, w, h, cw, ch, d } */
    wantT: 0,                       /* when the page last changed dish: bakes wait until it settles */
    typo: new Set(TYPO), okP: false, okA: false, dirtyP: true, dirtyA: true,
    light: { az: 0, el: 38 * DEG, L: STATIC ? 1 : 0 },
    raf: 0, reqT: 0, lat: [], heavy: 0,
    n: { bake: 0, shade: 0, macro: 0, hero: 0 }   /* counters for tests */
  };
  const dprE = () => Math.min(DPR(), E.cap);

  function engInit() {
    const gl = E.cv.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, preserveDrawingBuffer: false });
    if (!gl) return false;
    E.gl = gl;
    return true;
  }
  function engResources() {
    const gl = E.gl;
    E.ready = false; E.macroP = null; M.busy = false; M.failed = false;
    buildAll(gl, [[VS2, BAKE], [VS2, SHADE]], ([b, s]) => {
      if (gl.isContextLost()) return;
      if (!b || !s) { engBreak(); return; }                   /* no engraving on this device: the plates stay */
      E.bakeP = b; E.shadeP = s;
      if (ML.gl.hero) setTimeout(macroBuild, 1200);           /* after a context restore: the hero still is already there */
      E.tex = [0, 1, 2, 3].map(() => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
        for (const [k, v] of [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]]) gl.texParameteri(gl.TEXTURE_2D, k, v);
        return t; });
      E.fbo = gl.createFramebuffer(); E.gw = E.gh = 0; E.scene = -1; E.key = ""; E.cam = null; E.hero = null; E.hread = null;
      gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
      E.ready = true; E.dirtyP = E.dirtyA = true;
      kick();
    });
  }
  /* The macro program (allioli) compiles on its own, after the hero still is up or when its stage comes near, so the
     first compile is as short as it can be. Until it is ready (or if it fails) the CSS sauce shows. */
  const M = { busy: false, failed: false };
  function macroBuild() {
    if (M.busy || M.failed || E.macroP || !E.ready || E.lost || E.broken) return;
    M.busy = true;
    const gl = E.gl;
    buildAll(gl, [[VS2, MACRO]], ([m]) => {
      M.busy = false;
      if (gl.isContextLost() || !E.ready) return;
      if (!m) { M.failed = true; return; }
      E.macroP = m; E.dirtyA = true; kick();
    });
  }
  function gbAlloc(w, h) {
    const gl = E.gl;
    if (w === E.gw && h === E.gh) return true;
    E.tex.forEach(t => { gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null); });
    gl.bindFramebuffer(gl.FRAMEBUFFER, E.fbo);
    E.tex.forEach((t, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0));
    gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1, gl.COLOR_ATTACHMENT2, gl.COLOR_ATTACHMENT3]);
    const good = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    E.gw = w; E.gh = h; E.scene = -1; E.key = "";
    return good;
  }
  /* Bake a scene into the G-buffer: one horizontal scissor band per frame (4 frames), all four at once when static. */
  function startBake(o) {
    if (!gbAlloc(o.w, o.h)) { engBreak(); return false; }
    E.scene = -1; E.key = "";                                  /* the buffer is being overwritten */
    E.bake = Object.assign({ band: 0 }, o);
    return true;
  }
  function bakeStep() {
    const gl = E.gl, b = E.bake, P = E.bakeP, cam = camera(b.w / b.h, b.oy), bands = 4;
    gl.bindFramebuffer(gl.FRAMEBUFFER, E.fbo);
    gl.viewport(0, 0, b.w, b.h);
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uRes, b.w, b.h); gl.uniform3fv(P.u.uCam, cam.C); gl.uniform3fv(P.u.uFw, cam.fw); gl.uniform3fv(P.u.uRt, cam.rt); gl.uniform3fv(P.u.uUp, cam.up);
    gl.uniform1f(P.u.uTan, cam.tan); gl.uniform1i(P.u.uScene, b.scene); gl.uniform1f(P.u.uDens, lineDensity(cam, b.cssH, b.pc));
    gl.uniform1i(P.u.uSteps, ML.phone() ? 72 : 96); gl.uniform1f(P.u.uStepK, b.scene === 2 ? .65 : b.scene === 4 ? .85 : .9);
    const [sa, sb, se] = SHADOW(b.scene);
    gl.uniform3fv(P.u.uLa, lightPos(cam.T, sa, se)); gl.uniform3fv(P.u.uLb, lightPos(cam.T, sb, se)); gl.uniform1i(P.u.uShSteps, ML.phone() ? 28 : 40);
    gl.enable(gl.SCISSOR_TEST); gl.clearColor(0, 0, 0, 0);
    for (let k = 0, n = STATIC ? bands : 1; k < n && b.band < bands; k++, b.band++) {
      const y0 = Math.floor(b.band * b.h / bands), y1 = Math.floor((b.band + 1) * b.h / bands);
      gl.scissor(0, y0, b.w, y1 - y0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    gl.disable(gl.SCISSOR_TEST); gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    if (b.band >= bands) { E.bake = null; E.scene = b.scene; E.cam = cam; E.key = b.scene + ":" + b.w + "x" + b.h; E.n.bake++; if (b.then) b.then(); }
  }
  function sizeCanvas(w, h) { if (E.cv.width !== w || E.cv.height !== h) { E.cv.width = w; E.cv.height = h; return true; } return false; }
  const hostPx = (host, k) => [Math.max(2, Math.round(host.offsetWidth * k)), Math.max(2, Math.round(host.offsetHeight * k))];
  /* Pass B into the canvas, or into tgt { fbo, w, h }. o: { az, el, L, cssH, pitch?, lift? } */
  function shade(o, tgt) {
    const gl = E.gl, P = E.shadeP, cam = E.cam || camera(E.gw / E.gh, 0);
    const W = tgt ? tgt.w : E.cv.width, H = tgt ? tgt.h : E.cv.height;
    gl.bindFramebuffer(gl.FRAMEBUFFER, tgt ? tgt.fbo : null);
    gl.viewport(0, 0, W, H);
    gl.useProgram(P.p);
    E.tex.forEach((t, i) => { gl.activeTexture(gl.TEXTURE0 + i); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(P.u["uT" + i], i); });
    gl.uniform2f(P.u.uRes, W, H); gl.uniform2f(P.u.uGRes, E.gw, E.gh);
    gl.uniform3fv(P.u.uCam, cam.C); gl.uniform3fv(P.u.uTarget, cam.T);
    gl.uniform1f(P.u.uAz, o.az); gl.uniform1f(P.u.uEl, o.el); gl.uniform1f(P.u.uL, o.L);
    gl.uniform1f(P.u.uDensity, lineDensity(cam, o.cssH, o.pitch));
    /* The pass lamp hangs above the plate: its light arrives 12 deg higher than the page's key elevation, so tops catch it. */
    const [sa, sb] = SHADOW(E.scene);
    gl.uniform1f(P.u.uShW, sb === sa ? 0 : clamp((o.az / DEG - sa) / (sb - sa)));
    gl.uniform2f(P.u.uPlate, OPT.plateK || .42, OPT.plateW || .55);   /* the plate: sparse face strokes (density factor, weight) */
    gl.uniform1f(P.u.uPxK, 2 * Math.tan(15 * DEG) / H);                  /* one target pixel, in world units per unit of depth */
    gl.uniform1f(P.u.uExpo, OPT.expo || 2.5); gl.uniform1f(P.u.uElLift, o.lift != null ? o.lift : (OPT.elLift == null ? 12 : OPT.elLift) * DEG); gl.uniform1f(P.u.uGamma, OPT.gamma || 1);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (tgt) gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    E.n.shade++;
  }
  function clearCanvas() { const gl = E.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, E.cv.width, E.cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  function macro() {
    const gl = E.gl, P = E.macroP, s = ML.state.allioli;
    if (!P || s.P == null) return false;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, E.cv.width, E.cv.height);
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uRes, E.cv.width, E.cv.height);
    gl.uniform2f(P.u.uHL, s.highlight ? s.highlight[0] : .55, s.highlight ? s.highlight[1] : .47);
    gl.uniform1f(P.u.uDens, ML.el.alliHost.offsetHeight / pitch());
    for (const k of ["uGrain", "uFilm", "uEdge", "uSpiral", "uTwist", "uThick", "uBind", "uL"]) gl.uniform1f(P.u[k], +s[k] || 0);
    gl.uniform1f(P.u.uAz, s.az || 0); gl.uniform1f(P.u.uEl, s.el || 45 * DEG);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    E.n.macro++;
    return true;
  }

  const platosOn = () => seen("platosVisible", ML.el.platosStage), alliOn = () => seen("allioliVisible", ML.el.alliStage);
  /* The canvas may be resized for the hero bake only while no stage is showing it. */
  const canvasFree = () => !(E.place === "platos" && E.okP && platosOn()) && !(E.place === "allioli" && alliOn());

  /* Hero bake (spec 5.1): scene 0 at the hero box size x DPR x 1.5, shaded at az -15, el 62, L 1 into its own
     texture, read back without stalling (pixel buffer + fence, polled once per frame), then drawn downscaled
     (anti-aliased) into the 2D #hero-plate. The shared canvas is never resized for it and nothing waits on the GPU. */
  function heroTarget(w, h) {
    const gl = E.gl;
    if (E.hero && E.hero.w === w && E.hero.h === h) return E.hero;
    if (E.hero) { gl.deleteFramebuffer(E.hero.fbo); gl.deleteTexture(E.hero.tex); }
    const tex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    const fbo = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return E.hero = { fbo, tex, w, h };
  }
  function heroBake() {
    const box = ML.el.heroPlateBox, cw = box.offsetWidth, ch = box.offsetHeight;
    E.heroPending = false;
    if (!cw || !ch) return false;
    const d = Math.min(DPR(), OPT.cap || (LOW ? 1 : 2)), w = Math.round(cw * d * 1.5), h = Math.round(ch * d * 1.5);
    E.heroKey = cw + "x" + ch;
    return startBake({ scene: 0, w, h, cssH: ch, pc: HERO_PITCH(), oy: poolY(box, ML.el.hero.querySelector(".hero-pool")), then: () => {
      E.dirtyP = E.dirtyA = true;
      const gl = E.gl, t = heroTarget(w, h);
      shade({ az: -15 * DEG, el: 62 * DEG, L: 1, cssH: ch, pitch: HERO_PITCH(), lift: 0 }, t);
      const pbo = gl.createBuffer();
      gl.bindBuffer(gl.PIXEL_PACK_BUFFER, pbo); gl.bufferData(gl.PIXEL_PACK_BUFFER, w * h * 4, gl.STREAM_READ);
      gl.bindFramebuffer(gl.FRAMEBUFFER, t.fbo); gl.readPixels(0, 0, w, h, gl.RGBA, gl.UNSIGNED_BYTE, 0);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0); gl.flush();
      if (E.hread) heroDrop();
      E.hread = { pbo, sync, w, h, cw, ch, d };
    } });
  }
  function heroDrop() { const gl = E.gl, r = E.hread; E.hread = null; if (!r || !gl) return; try { gl.deleteSync(r.sync); gl.deleteBuffer(r.pbo); } catch (e) {} }
  /* Once the GPU has finished, copy the pixels out (un-premultiplied, flipped) and draw them into #hero-plate. */
  function heroPoll() {
    const gl = E.gl, r = E.hread;
    const st = gl.clientWaitSync(r.sync, 0, 0);
    if (st === gl.TIMEOUT_EXPIRED) return false;
    if (st === gl.WAIT_FAILED) { heroDrop(); E.heroPending = !ML.gl.hero; return true; }
    const px = new Uint8Array(r.w * r.h * 4);
    gl.bindBuffer(gl.PIXEL_PACK_BUFFER, r.pbo); gl.getBufferSubData(gl.PIXEL_PACK_BUFFER, 0, px); gl.bindBuffer(gl.PIXEL_PACK_BUFFER, null);
    heroDrop();
    const tmp = document.createElement("canvas"); tmp.width = r.w; tmp.height = r.h;
    const tg = tmp.getContext("2d"), hp = ML.el.heroPlate, g = hp.getContext("2d");
    if (!tg || !g) return true;
    const img = tg.createImageData(r.w, r.h), out = img.data, row = r.w * 4;
    for (let y = 0; y < r.h; y++) {
      const si = (r.h - 1 - y) * row, di = y * row;
      for (let x = 0; x < row; x += 4) {
        const a = px[si + x + 3];
        if (!a) continue;
        const k = 255 / a;
        out[di + x] = Math.min(255, px[si + x] * k); out[di + x + 1] = Math.min(255, px[si + x + 1] * k); out[di + x + 2] = Math.min(255, px[si + x + 2] * k); out[di + x + 3] = a;
      }
    }
    tg.putImageData(img, 0, 0);
    hp.width = Math.round(r.cw * r.d); hp.height = Math.round(r.ch * r.d);
    g.clearRect(0, 0, hp.width, hp.height); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = "high";
    g.drawImage(tmp, 0, 0, hp.width, hp.height);
    E.n.hero++;
    ML.ok("hero");
    setTimeout(macroBuild, 1200);
    return true;
  }

  /* One canvas, two stages: it lives in El pase, and moves to the allioli stage while only that one is in view. */
  function place() {
    const pv = platosOn(), av = alliOn();
    const want = (av && !pv && E.macroP) ? "allioli" : "platos";
    if (want === E.place) return;
    E.place = want;
    (want === "allioli" ? ML.el.alliHost : ML.el.platosHost).appendChild(E.cv);
    if (want === "allioli") { E.dirtyA = true; E.cv.style.visibility = ""; }
    else { E.dirtyP = true; if (E.okA && av) { ML.fail("allioli"); E.okA = false; } if (E.stills) E.cv.style.visibility = "hidden"; }
  }

  function kick() { if (!E.raf && E.ready && !E.lost && !E.broken) { E.reqT = performance.now(); E.raf = requestAnimationFrame(frame); } }
  function frame(t) {
    E.raf = 0;
    if (!E.ready || E.lost || E.broken || document.hidden) return;
    try {
      place();
      if (E.hread && !heroPoll()) { kick(); return; }          /* the hero still is on its way back: touch nothing that would wait on the GPU */
      if (E.bake && E.bake.scene > 0 && (E.bake.scene !== E.want + 1 || !platosOn())) { E.bake = null; E.scene = -1; E.key = ""; }   /* flown past: drop it */
      if (E.bake) { bakeStep(); probe("bake"); kick(); return; }
      if (E.heroPending && canvasFree() && heroBake()) { kick(); return; }
      if (E.place === "platos") platosFrame(t); else alliFrame();
    } catch (e) { engBreak(); }
  }
  function platosFrame(t) {
    if (!platosOn()) return;                                   /* off screen: nothing to draw, nothing to bake (the "visible" event kicks) */
    const host = ML.el.platosHost, [w, h] = hostPx(host, dprE());
    if (sizeCanvas(w, h)) E.dirtyP = true;
    const i = E.want, scene = i + 1;
    if (E.typo.has(i)) { if (E.dirtyP) { clearCanvas(); E.dirtyP = false; stillsHide(); } return; }   /* the page shows its plate */
    const on = platosOn(), dark = E.light.L < .03 || !on;
    /* a new dish always bakes (the page holds the light at 0 until baked); a new size waits for a dark or idle moment */
    if (E.key !== scene + ":" + w + "x" + h && (E.scene !== scene || dark)) {
      if (E.scene !== scene) { clearCanvas(); stillsHide(); }   /* never let the previous dish show while this one bakes */
      const wait = 180 - (performance.now() - E.wantT);         /* a dish scrolled past in a flick is never baked */
      if (wait > 0) { setTimeout(kick, wait + 4); return; }
      startBake({ scene, w, h, cssH: host.offsetHeight, oy: poolY(host, ML.el.platosStage.querySelector(".pase-pool")), then: () => {
        E.dirtyP = true;
        if (E.stills) stillsBuild();
        ML.baked("platos", i);
      } });
      kick(); return;
    }
    if (E.stills) { stillsApply(); return; }
    if (!E.dirtyP || (!on && E.okP)) return;                   /* render on demand, and only in view */
    E.dirtyP = false;
    shade({ az: E.light.az, el: E.light.el, L: E.light.L, cssH: host.offsetHeight });
    probe("shade");
    if (!E.okP) { E.okP = true; ML.ok("platos"); }
  }
  function alliFrame() {
    const host = ML.el.alliHost, [w, h] = hostPx(host, Math.min(dprE(), E.stills ? 1 : 2));
    if (sizeCanvas(w, h)) E.dirtyA = true;
    if (!E.dirtyA) return;
    E.dirtyA = false;
    if (macro() && !E.okA) { E.okA = true; ML.ok("allioli"); }
  }

  /* ---------- adaptive quality (spec 5.1), measured as frame latency ----------
     After a frame that drew El pase (or a bake band), how long until the browser runs the next frame: about 16ms
     when the device keeps up, much more when it does not (frames are throttled behind a busy GPU or a busy thread).
     Slow samples are counted, never discarded, in a sliding window of 12: 8 slow ones (> 30ms) step dprE down
     2 -> 1.5 -> 1, then to stills. A bake band followed by a frame more than 66ms later is heavy: two heavy bands in
     a row step the bake size down. */
  function probe(kind) {
    if (!OPT.adapt || STATIC || E.place !== "platos") return;
    const t0 = performance.now();
    requestAnimationFrame(() => adapt(kind, Math.min(performance.now() - t0, 250)));
  }
  function adapt(kind, lat) {
    if (E.lost || E.broken) return;
    if (kind === "bake") { if (lat > 66) { if (++E.heavy >= 2 && dprE() > 1.01) { E.heavy = 0; E.cap = dprE() > 1.5 ? 1.5 : 1; } } else E.heavy = 0; return; }
    E.lat.push(lat); if (E.lat.length > 12) E.lat.shift();
    if (E.lat.length >= 10 && E.lat.filter(x => x > 30).length >= 8) { E.lat = []; degrade(); }
  }
  function degrade() {
    const cur = dprE();
    if (cur > 1.01) { E.cap = cur > 1.5 ? 1.5 : 1; E.dirtyP = true; return; }   /* the new size re-bakes in the next dark window */
    if (!E.stills) stillsEnter();
  }
  /* Stills mode: three frames pre-shaded at L 1 (az -40, 0, +40; pollo -55, -15, +25), crossfaded by az, L as opacity. */
  function stillsEnter() {
    const box = document.createElement("div");
    box.className = "gl-stills"; box.setAttribute("aria-hidden", "true");
    box.style.cssText = "position:absolute;inset:0;pointer-events:none;opacity:0";
    const cs = [0, 1, 2].map(() => { const c = document.createElement("canvas"); c.style.cssText = "position:absolute;inset:0;width:100%;height:100%;opacity:0"; box.appendChild(c); return c; });
    ML.el.platosHost.appendChild(box);
    E.stills = { box, cs };
    if (E.place === "platos") E.cv.style.visibility = "hidden";
    if (E.key && E.scene === E.want + 1) stillsBuild();
  }
  const stillAz = i => i === 3 ? [[-55, 28], [-15, 28], [25, 28]] : [[-40, 30], [0, 36], [40, 42]];
  function stillsBuild() {
    const S = E.stills, host = ML.el.platosHost;
    S.cs.forEach((c, k) => {
      const [az, el] = stillAz(E.want)[k];
      shade({ az: az * DEG, el: el * DEG, L: 1, cssH: host.offsetHeight });
      c.width = E.cv.width; c.height = E.cv.height;
      const g = c.getContext("2d"); if (!g) return;
      g.clearRect(0, 0, c.width, c.height); g.drawImage(E.cv, 0, 0);
    });
    if (!E.okP) { E.okP = true; ML.ok("platos"); }
    stillsApply();
  }
  function stillsApply() {
    const S = E.stills; if (!S) return;
    const a = E.light.az / DEG, s = clamp(E.want === 3 ? (a + 55) / 40 : (a + 40) / 40, 0, 2), k = Math.min(1, Math.floor(s)), f = s - k;
    S.cs.forEach((c, j) => { c.style.opacity = j === k ? "1" : j === k + 1 ? f.toFixed(3) : "0"; });
    const L = clamp(E.light.L), u = clamp((L - .05) / .25);
    S.box.style.opacity = E.typo.has(E.want) ? "0" : (L * u * u * (3 - 2 * u)).toFixed(3);   /* dark below L .05, as in the shader */
  }
  function stillsHide() { if (E.stills) E.stills.box.style.opacity = "0"; }
  function stillsDrop() { if (E.stills) { E.stills.box.remove(); E.stills = null; E.cv.style.visibility = ""; } }

  function engBreak() {
    E.broken = true; E.bake = null;
    if (!ML.gl.hero) ML.fail("hero");                            /* no engraved still: the type plate shows now */
    if (E.okP) ML.fail("platos"); if (E.okA) ML.fail("allioli");
    E.okP = E.okA = false;
    stillsDrop();
  }

  /* ---------- page events ---------- */
  function engWire() {
    ML.on("platos", s => {
      if (!s || !s.key) return;
      E.light = { az: s.key.az, el: s.key.el, L: s.key.L };
      if (typeof s.i === "number" && s.i !== E.want) { E.want = s.i; E.wantT = performance.now(); }
      E.dirtyP = true; kick();
    });
    ML.on("platos:scene", d => { if (d) { if (d.i !== E.want) E.wantT = performance.now(); E.want = d.i; E.dirtyP = true; kick(); } });
    ML.on("typo", d => { if (d && d.stage === "platos") { if (d.on) E.typo.add(d.i); else E.typo.delete(d.i); E.dirtyP = true; kick(); } });
    ML.on("allioli", () => { E.dirtyA = true; kick(); });
    ML.on("visible", d => { if (d && (d.stage === "platos" || d.stage === "allioli")) { if (d.stage === "allioli") macroBuild(); E.dirtyP = E.dirtyA = true; kick(); } });
    const re = () => {
      const box = ML.el.heroPlateBox;
      if (box && box.offsetWidth + "x" + box.offsetHeight !== E.heroKey) E.heroPending = true;
      E.dirtyP = E.dirtyA = true; kick();
    };
    ML.on("resize", re); ML.on("fonts", re);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) { E.dirtyP = E.dirtyA = true; kick(); } });
    E.cv.addEventListener("webglcontextlost", e => {
      e.preventDefault(); E.lost = true; E.ready = false; E.bake = null; E.hread = null; E.hero = null;
      if (E.raf) cancelAnimationFrame(E.raf); E.raf = 0;
      if (E.okP) ML.fail("platos"); if (E.okA) ML.fail("allioli");    /* the hero keeps its 2D still */
      E.okP = E.okA = false;
      if (!ML.gl.hero) E.heroPending = true;
      stillsDrop();
    }, false);
    E.cv.addEventListener("webglcontextrestored", () => { E.lost = false; E.broken = false; engResources(); }, false);
  }

  /* ============================== haze engine (WebGL1, spec 5.3) ============================== */
  const Z = { cv: ML.el.haze, gl: null, P: null, buf: null, ready: false, lost: false, broken: false, raf: 0, last: -1e9, t0: performance.now(), ok: false, need: true, col: "", n: 0 };
  function hzInit() {
    if (!Z.cv) return false;
    const gl = Z.cv.getContext("webgl", { alpha: true, antialias: false, depth: false, stencil: false, premultipliedAlpha: true, preserveDrawingBuffer: false });
    if (!gl) return false;
    Z.gl = gl;
    hzResources();
    return true;
  }
  function hzResources() {
    const gl = Z.gl;
    Z.ready = false;
    buildAll(gl, [[HVS, HFS]], ([P]) => {
      if (gl.isContextLost()) return;
      if (!P) { Z.broken = true; return; }
      Z.P = P;
      Z.buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, Z.buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(P.p, "aP"); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      Z.ready = true; Z.need = true; hzKick();
    });
  }
  function hzDraw(time) {
    const gl = Z.gl, P = Z.P, st = ML.state.haze, host = st.el || Z.cv.parentNode;
    if (!host || !st.bulb || !st.dir) return false;
    const W = host.clientWidth, Hh = host.clientHeight; if (!W || !Hh) return false;
    const s = .5 * Math.min(DPR(), 2), w = Math.max(1, Math.round(W * s)), h = Math.max(1, Math.round(Hh * s));   /* half resolution */
    if (Z.cv.width !== w || Z.cv.height !== h) { Z.cv.width = w; Z.cv.height = h; }
    gl.viewport(0, 0, w, h);
    gl.useProgram(P.p);
    gl.uniform2f(P.u.uRes, W, Hh); gl.uniform1f(P.u.uS, s);
    gl.uniform2f(P.u.uBulb, st.bulb[0], Hh - st.bulb[1]);      /* CSS px, y up */
    gl.uniform2f(P.u.uDir, st.dir[0], -st.dir[1]);
    gl.uniform1f(P.u.uHalf, st.half || 20 * DEG); gl.uniform1f(P.u.uLen, Math.max(1, st.len || 1));
    gl.uniform1f(P.u.uLight, st.light == null ? 1 : st.light); gl.uniform1f(P.u.uDensity, st.density || 1);
    gl.uniform1f(P.u.uTime, time);
    Z.col = st.lampCol || ML.lampCol || "#FFF4E0";
    gl.uniform3fv(P.u.uLamp, rgb(Z.col, [1, .957, .878]));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    Z.n++;
    return true;
  }
  const hzOn = () => ML.state.haze.host === "noche" ? seen("nocheVisible", document.getElementById("esta-noche")) : seen("heroVisible", ML.el.hero);
  function hzKick() { if (!Z.raf && Z.ready && !Z.lost && !Z.broken) Z.raf = requestAnimationFrame(hzFrame); }
  function hzFrame(t) {
    Z.raf = 0;
    if (!Z.ready || Z.lost || Z.broken || document.hidden || !hzOn()) return;   /* paused: "visible" and events restart it */
    try {
      if (STATIC) { if (Z.need && hzDraw(0)) { Z.need = false; hzOk(); } return; }   /* one frame per change, uTime 0 */
      if (Z.need || t - Z.last >= 33) { if (hzDraw((t - Z.t0) / 1000)) { Z.last = t; Z.need = false; hzOk(); } }
    } catch (e) { Z.broken = true; if (Z.ok) ML.fail("haze"); Z.ok = false; return; }
    Z.raf = requestAnimationFrame(hzFrame);                  /* 30fps while in view: the smoke drifts */
  }
  function hzOk() { if (!Z.ok) { Z.ok = true; ML.ok("haze"); } }
  function hzWire() {
    const go = () => { Z.need = true; hzKick(); };
    ML.on("haze", go); ML.on("haze:host", go); ML.on("resize", go);
    ML.on("status", s => { if (s && s.lampCol !== Z.col) go(); });
    ML.on("visible", d => { if (d && (d.stage === "hero" || d.stage === "noche")) go(); });
    document.addEventListener("visibilitychange", () => { if (!document.hidden) go(); });
    Z.cv.addEventListener("webglcontextlost", e => { e.preventDefault(); Z.lost = true; Z.ready = false; if (Z.raf) cancelAnimationFrame(Z.raf); Z.raf = 0; if (Z.ok) ML.fail("haze"); Z.ok = false; }, false);
    Z.cv.addEventListener("webglcontextrestored", () => { Z.lost = false; Z.broken = false; hzResources(); }, false);
  }

  /* ============================== start ============================== */
  /* A device without WebGL2 shows its type plate straight away. Creating the context is itself a long call on some
     devices, so it waits, with the shader compile and the hero bake, until the hero intro has finished and the page is
     idle: the intro never waits on the GPU. With no intro (reduced motion, no GSAP) they start at the first idle moment. */
  let compiled = false, started = false;
  const compile = () => { if (compiled || E.broken) return; compiled = true; try { if (!E.lost) engResources(); } catch (e) { engBreak(); } };
  const start = () => {
    if (started) return; started = true;
    try { if (engInit()) compile(); else { E.broken = true; ML.fail("hero"); } } catch (e) { E.broken = true; ML.fail("hero"); }
  };
  const idle = () => { if (window.requestIdleCallback) requestIdleCallback(start, { timeout: 700 }); else setTimeout(start, 60); };
  try { if (hzInit()) hzWire(); } catch (e) { Z.broken = true; }
  /* the haze's WebGL1 context is made at load anyway: when even that fails, WebGL2 will too, so the type plate shows now */
  const noGL = !!Z.cv && !Z.gl;
  try {
    if (typeof WebGL2RenderingContext === "undefined" || noGL) ML.fail("hero");
    else {
      TYPO.forEach(i => ML.typo("platos", i));
      E.want = typeof ML.state.platos.i === "number" ? ML.state.platos.i : 0;
      if (ML.state.platos.key) E.light = { az: ML.state.platos.key.az, el: ML.state.platos.key.el, L: ML.state.platos.key.L };
      engWire();
      if (ML.introDone || STATIC) idle();
      else { ML.on("intro", idle); setTimeout(start, 4000); }
    }
  } catch (e) { E.broken = true; ML.fail("hero"); }
  ML.engines = { engrave: E, haze: Z, opt: OPT, degrade, src: { BAKE, SHADE, MACRO, VS2 } };   /* for tests and debugging */
})();
