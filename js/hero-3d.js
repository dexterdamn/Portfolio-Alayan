/**
 * Hero WebGL decoration + perspective tilt. Skips when prefers-reduced-motion.
 */
(function () {
  const canvas = document.querySelector(".hero-canvas");
  const visual = document.querySelector(".hero-visual[data-tilt]");
  if (!canvas || !visual) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    canvas.classList.add("hero-canvas--static");
    return;
  }

  /* ---- 3D tilt (CSS variables) ---- */
  let tiltRaf = 0;
  let targetX = 0;
  let targetY = 0;
  let curX = 0;
  let curY = 0;

  const setTiltFromEvent = (clientX, clientY) => {
    const rect = visual.getBoundingClientRect();
    const px = (clientX - rect.left) / rect.width - 0.5;
    const py = (clientY - rect.top) / rect.height - 0.5;
    targetX = Math.max(-1, Math.min(1, -py * 2)) * 8;
    targetY = Math.max(-1, Math.min(1, px * 2)) * 10;
  };

  const loopTilt = () => {
    curX += (targetX - curX) * 0.08;
    curY += (targetY - curY) * 0.08;
    visual.style.setProperty("--tilt-x", `${curX}deg`);
    visual.style.setProperty("--tilt-y", `${curY}deg`);
    tiltRaf = requestAnimationFrame(loopTilt);
  };

  visual.addEventListener(
    "pointermove",
    e => {
      if (e.pointerType === "touch") return;
      setTiltFromEvent(e.clientX, e.clientY);
    },
    { passive: true }
  );

  visual.addEventListener(
    "pointerleave",
    () => {
      targetX = 0;
      targetY = 0;
    },
    { passive: true }
  );

  requestAnimationFrame(loopTilt);

  /* ---- Three.js scene ---- */
  if (typeof THREE === "undefined") return;

  const scene = new THREE.Scene();
  const w = visual.clientWidth || 400;
  const h = visual.clientHeight || 500;
  const camera = new THREE.PerspectiveCamera(42, w / h, 0.1, 100);
  camera.position.z = 6;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: "low-power"
  });
  renderer.setSize(w, h, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));

  const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#c17f3b";
  const meshColor = new THREE.Color(accent);

  const group = new THREE.Group();
  const geo = new THREE.IcosahedronGeometry(1.35, 0);
  const mat = new THREE.MeshStandardMaterial({
    color: meshColor,
    metalness: 0.35,
    roughness: 0.4,
    wireframe: true,
    transparent: true,
    opacity: 0.55
  });
  const mesh = new THREE.Mesh(geo, mat);
  group.add(mesh);

  const inner = new THREE.Mesh(
    new THREE.TorusKnotGeometry(0.45, 0.12, 100, 12, 2, 3),
    new THREE.MeshStandardMaterial({
      color: meshColor,
      metalness: 0.5,
      roughness: 0.35,
      transparent: true,
      opacity: 0.22
    })
  );
  group.add(inner);

  scene.add(group);
  scene.add(new THREE.AmbientLight(0xffffff, 0.85));
  const key = new THREE.DirectionalLight(0xffeedd, 1.1);
  key.position.set(4, 6, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0x8ab4ff, 0.35);
  fill.position.set(-5, -2, 4);
  scene.add(fill);

  let mx = 0;
  let my = 0;
  const onMove = e => {
    const rect = visual.getBoundingClientRect();
    mx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    my = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  window.addEventListener("mousemove", onMove, { passive: true });

  let t = 0;
  const tick = () => {
    t += 0.008;
    group.rotation.x = 0.35 + my * 0.15;
    group.rotation.y = t + mx * 0.2;
    group.rotation.z = Math.sin(t * 0.4) * 0.12;
    inner.rotation.x = t * 0.5;
    inner.rotation.y = t * 0.35;
    renderer.render(scene, camera);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  const onResize = () => {
    const width = visual.clientWidth;
    const height = visual.clientHeight;
    if (width < 1 || height < 1) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  window.addEventListener("resize", onResize, { passive: true });
  if (window.ResizeObserver) {
    new ResizeObserver(onResize).observe(visual);
  }
})();
