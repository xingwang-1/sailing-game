import * as T from "three";
const $ = (q) => document.querySelector(q),
  canvas = $("#sea"),
  renderer = new T.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
const scene = new T.Scene();
scene.background = new T.Color("#91d4d7");
scene.fog = new T.FogExp2("#91d4d7", 0.0015);
const camera = new T.PerspectiveCamera(39, innerWidth / innerHeight, 0.1, 1200);
camera.position.set(-18, 16, 34);
scene.add(new T.HemisphereLight(0xd9f7ff, 0x38545a, 2));
const sun = new T.DirectionalLight(0xffefd1, 3);
sun.position.set(-50, 90, 35);
sun.castShadow = true;
scene.add(sun);
const uniforms = {
  time: { value: 0 },
  sun: { value: new T.Vector3(-0.55, 0.78, 0.32).normalize() },
};
const vertexShader = [
  "uniform float time;",
  "varying vec3 wp; varying float wave;",
  "void main(){vec3 p=position;float a=sin(p.x*.035+time*.75)*.22;float b=sin(p.y*.052-time*1.05+p.x*.018)*.15;float d=sin((p.x+p.y)*.085+time*1.55)*.05;p.z+=a+b+d;wave=a+b+d;vec4 w=modelMatrix*vec4(p,1.);wp=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}",
].join("\n");
const fragmentShader = [
  "uniform float time; uniform vec3 sun; varying vec3 wp; varying float wave;",
  "void main(){vec3 v=normalize(cameraPosition-wp);float h=pow(1.-max(dot(v,vec3(0.,1.,0.)),0.),2.);float pattern=sin(wp.x*.16+wp.z*.09+time*.7+wave*7.)*sin(wp.x*.43-wp.z*.31+time*1.2);float g=smoothstep(.9,.995,pattern)*(.3+.7*max(dot(v,sun),0.));vec3 col=mix(vec3(.012,.19,.24),vec3(.08,.47,.52),.35+h*.46+wave*.17);col=mix(col,vec3(.7,.88,.78),g*.28);gl_FragColor=vec4(col,1.);",
  " #include <tonemapping_fragment>",
  "#include <colorspace_fragment>",
  "}",
].join("\n");
const sea = new T.Mesh(
  new T.PlaneGeometry(1400, 1400, 180, 180),
  new T.ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    side: T.DoubleSide,
  }),
);
sea.rotation.x = -Math.PI / 2;
sea.position.y = -0.2;
scene.add(sea);
const world = new T.Group();
scene.add(world);
const mat = (color) => new T.MeshStandardMaterial({ color, roughness: 0.55 }),
  cream = mat("#fff0d5"),
  gold = mat("#e7b85e");
function createBoat() {
  const b = new T.Group(),
    rings = [
      [-2.6, 0.04, 0.36],
      [-2.1, 0.25, 0.5],
      [-1.3, 0.4, 0.56],
      [0, 0.43, 0.55],
      [1, 0.37, 0.5],
      [1.9, 0.2, 0.38],
    ],
    v = [],
    ix = [];
  for (const [z, w, y] of rings)
    v.push(-w, y, z, w, y, z, -w * 0.7, 0.02, z, w * 0.7, 0.02, z);
  for (let i = 0; i < rings.length - 1; i++) {
    let a = i * 4,
      n = a + 4;
    ix.push(
      a,
      n,
      a + 1,
      a + 1,
      n,
      n + 1,
      a,
      a + 2,
      n,
      a + 1,
      n + 1,
      a + 3,
      a + 2,
      a + 3,
      n + 2,
      a + 3,
      n + 3,
      n + 2,
    );
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(v, 3));
  g.setIndex(ix);
  g.computeVertexNormals();
  const hull = new T.Mesh(g, mat("#e96e50"));
  hull.castShadow = true;
  b.add(hull);
  const deck = new T.Mesh(new T.BoxGeometry(0.82, 0.1, 2.7), cream);
  deck.position.set(0, 0.4, 0);
  b.add(deck);
  const keel = new T.Mesh(new T.BoxGeometry(0.12, 0.9, 0.8), mat("#173d42"));
  keel.position.y = -0.2;
  b.add(keel);
  const mast = new T.Mesh(new T.CylinderGeometry(0.05, 0.08, 5.5, 9), gold);
  mast.position.set(0, 3, 0.05);
  b.add(mast);
  const rig = new T.Group();
  rig.position.set(0, 0.5, 0.1);
  b.add(rig);
  function sail(p, color) {
    const q = new T.BufferGeometry();
    q.setAttribute("position", new T.Float32BufferAttribute(p.flat(), 3));
    q.setIndex([0, 1, 2, 2, 1, 3]);
    q.computeVertexNormals();
    rig.add(
      new T.Mesh(q, new T.MeshStandardMaterial({ color, side: T.DoubleSide })),
    );
  }
  sail(
    [
      [0, 0.5, 0],
      [0, 5.2, 0],
      [0.3, 0.5, 0.3],
      [2, 1, 0.8],
    ],
    "#fff4dc",
  );
  sail(
    [
      [0, 0.5, -0.1],
      [0, 4.3, -1.2],
      [0.15, 0.5, -1.3],
      [1.1, 0.7, -1.2],
    ],
    "#efc889",
  );
  b.userData.rig = rig;
  return b;
}
const boat = createBoat();
boat.position.z = 1;
world.add(boat);
function island(x, z, k) {
  const group = new T.Group(),
    base = new T.Mesh(
      new T.CylinderGeometry(11 * k, 15 * k, 4 * k, 9),
      mat("#d9be8a"),
    ),
    hill = new T.Mesh(new T.ConeGeometry(9 * k, 13 * k, 8, 3), mat("#477b64")),
    peak = new T.Mesh(new T.ConeGeometry(3.5 * k, 7 * k, 7), mat("#70857c"));
  base.position.y = 1;
  hill.position.y = 7;
  peak.position.set(-2, 15, -1);
  group.add(base, hill, peak);
  group.position.set(x, -1, z);
  world.add(group);
}
island(-55, -90, 1.5);
island(62, -180, 1.8);
island(-76, -290, 1.2);
const course = [
  [-2, -30],
  [12, -76],
  [20, -124],
  [8, -174],
  [-13, -224],
  [-23, -274],
  [-7, -324],
];
course.forEach(([x, z], i) => {
  const group = new T.Group();
  for (const side of [-1, 1]) {
    const px = x + side * 9,
      post = new T.Mesh(new T.CylinderGeometry(0.08, 0.1, 5, 8), cream),
      buoy = new T.Mesh(
        new T.SphereGeometry(0.75, 12, 8),
        mat(i % 2 ? "#eab950" : "#e87357"),
      );
    post.position.set(px, 2.4, z);
    buoy.position.set(px, 0.4, z);
    group.add(post, buoy);
  }
  const bar = new T.Mesh(new T.CylinderGeometry(0.05, 0.05, 18, 8), cream);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(x, 4.8, z);
  group.add(bar);
  const ring = new T.Mesh(
    new T.TorusGeometry(2, 0.06, 8, 32),
    new T.MeshBasicMaterial({ color: "#f5d083" }),
  );
  ring.position.set(x, 6, z);
  group.add(ring);
  world.add(group);
});
const clouds = new T.Group();
const cloudmat = new T.MeshBasicMaterial({
  color: "#fff7e7",
  transparent: true,
  opacity: 0.55,
});
for (let i = 0; i < 14; i++) {
  const cl = new T.Group();
  for (let j = 0; j < 5; j++) {
    const p = new T.Mesh(new T.SphereGeometry(3, 10, 8), cloudmat);
    p.position.set(j * 3, Math.sin(j) * 0.5, 0);
    p.scale.set(1.5, 0.55, 0.8);
    cl.add(p);
  }
  cl.position.set(Math.sin(i * 32) * 130, 38 + (i % 3) * 4, -25 - i * 27);
  scene.add(cl);
}
const ui = {
  intro: $("#intro"),
  hud: $("#hud"),
  finish: $("#finish"),
  dialog: $("#howto-dialog"),
  toast: $("#toast"),
  time: $("#timer"),
  speed: $("#speed"),
  gate: $("#gate-count"),
  best: $("#best-time"),
  wind: $("#wind-value"),
  arrow: $("#wind-arrow"),
  gust: $("#gust"),
};
const st = {
  run: false,
  yaw: 0,
  speed: 0,
  gate: 0,
  time: 0,
  best: +localStorage.sailBest || 0,
  boost: 0,
  cool: 0,
  steer: 0,
  zoom: 1,
  follow: true,
};
const fmt = (t) =>
  String(Math.floor(t / 60)).padStart(2, "0") +
  ":" +
  (t % 60).toFixed(2).padStart(5, "0");
let toastTimer;
function toast(x) {
  ui.toast.textContent = x;
  ui.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => ui.toast.classList.remove("show"), 1700);
}
let prevZ = 1;
function start() {
  st.run = true;
  st.yaw = st.speed = st.gate = st.time = st.cool = st.boost = 0;
  boat.position.set(0, 0, 1);
  boat.rotation.set(0, 0, 0);
  prevZ = 1;
  ui.intro.classList.add("hidden");
  ui.finish.classList.add("hidden");
  ui.hud.classList.add("show");
  document.querySelector(".brand").classList.add("racing");
  toast("风从西南来 · 顺风扬帆");
}
function gust() {
  if (st.run) {
    if (st.cool) return toast("阵风还在聚力");
    st.boost = 2.3;
    st.cool = 7;
    toast("阵风！抓住这条线");
  }
}
function finish() {
  st.run = false;
  const record = !st.best || st.time < st.best;
  if (record) {
    st.best = st.time;
    localStorage.sailBest = st.best;
  }
  $("#final-time").textContent = fmt(st.time);
  $("#finish-best").textContent = record
    ? "新纪录已保存"
    : "最佳时间 " + fmt(st.best);
  ui.finish.classList.remove("hidden");
  ui.hud.classList.remove("show");
  document.querySelector(".brand").classList.remove("racing");
}
$("#start").onclick = start;
$("#help").onclick = () => ui.dialog.showModal();
$("#dialog-close").onclick = () => ui.dialog.close();
$("#gust").onclick = gust;
$("#again").onclick = start;
$("#home").onclick = () => {
  ui.finish.classList.add("hidden");
  ui.intro.classList.remove("hidden");
  document.querySelector(".brand").classList.remove("racing");
};
$("#reduce-motion").onclick = () => (st.follow = !st.follow);
$("#zoom-in").onclick = () => (st.zoom = Math.max(0.7, st.zoom - 0.12));
$("#zoom-out").onclick = () => (st.zoom = Math.min(1.6, st.zoom + 0.12));
for (const [id, val] of [
  ["left", -1],
  ["right", 1],
]) {
  const el = $("#" + id);
  el.onpointerdown = (e) => {
    e.preventDefault();
    st.steer = val;
  };
  for (const n of ["pointerup", "pointercancel", "pointerleave"])
    el.addEventListener(n, () => {
      if (st.steer === val) st.steer = 0;
    });
}
const keys = new Set();
addEventListener("keydown", (e) => {
  if (["ArrowLeft", "ArrowRight", " "].includes(e.key)) e.preventDefault();
  keys.add(e.key.toLowerCase());
  if (e.code === "Space" && !e.repeat) gust();
  if (e.key.toLowerCase() === "r" && !e.repeat) start();
});
addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
addEventListener("blur", () => {
  keys.clear();
  st.steer = 0;
});
const clock = new T.Clock(),
  target = new T.Vector3(),
  camPos = new T.Vector3();
function update(dt) {
  uniforms.time.value += dt;
  if (st.run) {
    st.time += dt;
    const l = keys.has("a") || keys.has("arrowleft") || st.steer < 0,
      rr = keys.has("d") || keys.has("arrowright") || st.steer > 0,
      turn = (rr ? 1 : 0) - (l ? 1 : 0);
    st.speed +=
      (8.8 * (0.6 + 0.35 * Math.cos(Math.sin(st.yaw + 0.5))) -
        st.speed * 0.42) *
      dt;
    if (st.boost > 0) {
      st.boost -= dt;
      st.speed += 7 * dt;
    }
    st.cool = Math.max(0, st.cool - dt);
    st.speed = T.MathUtils.clamp(st.speed, 0, 23);
    st.yaw += turn * dt * (0.22 + st.speed * 0.018);
    boat.position.x -= Math.sin(st.yaw) * st.speed * dt;
    boat.position.z -= Math.cos(st.yaw) * st.speed * dt;
    boat.position.y = Math.sin(uniforms.time.value * 2) * 0.1;
    boat.rotation.y = st.yaw;
    boat.rotation.z = -turn * 0.04;
    boat.userData.rig.rotation.y =
      Math.sin(st.yaw + 0.5) * 0.3 + Math.sin(uniforms.time.value) * 0.02;
    if (
      st.gate < 7 &&
      prevZ >= course[st.gate][1] &&
      boat.position.z < course[st.gate][1]
    ) {
      if (Math.abs(boat.position.x - course[st.gate][0]) < 12) {
        st.gate++;
        toast(
          st.gate === 7
            ? "冲过终点线"
            : "浮标门 " + String(st.gate).padStart(2, "0") + " / 07",
        );
        if (st.gate === 7) finish();
      } else toast("错过浮标门，调整航线");
    }
    prevZ = boat.position.z;
    ui.time.textContent = fmt(st.time);
    ui.speed.textContent = Math.round(st.speed * 1.7);
    ui.gate.textContent = String(st.gate).padStart(2, "0") + " / 07";
    ui.wind.textContent =
      Math.round(12 + Math.sin(uniforms.time.value * 0.25) * 3) + " kn";
    ui.arrow.style.transform = "rotate(" + (-30 + st.yaw * 30) + "deg)";
    ui.gust.disabled = st.cool > 0;
    ui.gust.innerHTML = st.cool
      ? "GUST <small>" + Math.ceil(st.cool) + "s</small>"
      : "GUST　↗";
    target.set(boat.position.x * 0.6, 2.5, boat.position.z - 13);
    camPos.set(
      boat.position.x + Math.sin(st.yaw) * 3,
      12,
      boat.position.z + 16,
    );
    camera.position.lerp(camPos, st.follow ? 1 - Math.exp(-dt * 2.5) : 1);
    camera.fov = T.MathUtils.lerp(
      camera.fov,
      39 * st.zoom,
      1 - Math.exp(-dt * 2),
    );
    camera.updateProjectionMatrix();
    camera.lookAt(target);
  } else {
    boat.position.y = Math.sin(uniforms.time.value) * 0.1;
    boat.rotation.y = Math.sin(uniforms.time.value * 0.2) * 0.12;
    boat.userData.rig.rotation.y = Math.sin(uniforms.time.value * 0.5) * 0.2;
    camera.position.lerp(new T.Vector3(-18, 16, 34), 1 - Math.exp(-dt * 0.7));
    camera.lookAt(0, 3, -8);
  }
  ui.best.textContent = st.best ? fmt(st.best) : "--:--.--";
}
function frame() {
  update(Math.min(clock.getDelta(), 0.04));
  renderer.render(scene, camera);
  requestAnimationFrame(frame);
}
frame();
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.7));
});
