import * as THREE from './vendor/three.module.js';

// The course keeps the simulation's flat coordinates; only the presentation has relief.
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const smooth = n => { n = clamp(n, 0, 1); return n * n * (3 - 2 * n); };
const TAU = Math.PI * 2;
const random = seed => () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
const point = (x, y, h = 0) => new THREE.Vector3(x - 450, h, y - 340);
const ellipseDistance = (x, y, e) => Math.hypot((x - e.x) / e.rx, (y - e.y) / e.ry);
const palette = { rough: '#598e43', fairway: '#79af49', green: '#99c653', sand: '#e8d6a0', water: '#2aa8b2' };

export class GolfScene {
  constructor(canvas, { course, round, finale = false, protestLevel = 0 } = {}) {
    this.course = course;
    this.round = round;
    this.finale = finale;
    this.width = 1;
    this.height = 1;
    this.panned = false;
    this.zoomLevel = 1;
    this.lastTime = 0;
    this.reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#8ba969');
    this.scene.fog = new THREE.Fog('#bdc89a', 1400, 2300);
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.02;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.camera = new THREE.OrthographicCamera(-200, 200, 300, -300, 1, 2400);
    this.focus = point(course.start.x, course.start.y);
    this.desired = this.focus.clone();
    this.cameraOffset = new THREE.Vector3(-330, 640, 630);
    this.raycaster = new THREE.Raycaster();
    this.plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    this.rayPoint = new THREE.Vector3();
    this.scratch = new THREE.Vector3();
    this.materials = new Map();
    this.scene.add(new THREE.HemisphereLight('#e5f3fb', '#668040', 1.55));
    this.sun = new THREE.DirectionalLight('#fff4de', 2.7);
    this.sun.position.set(-380, 700, -280);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -680, right: 680, top: 600, bottom: -600, near: 100, far: 1800 });
    this.sun.shadow.bias = -.00035;
    this.sun.shadow.normalBias = .65;
    this.sun.shadow.radius = 3;
    this.scene.add(this.sun);
    this.buildGround();
    this.buildWater();
    this.buildTrees();
    this.buildDetails();
    this.buildFlags();
    this.buildBall();
    this.buildAim();
    this.setProtestLevel(protestLevel);
    if (finale) this.buildAncient();
    this.resize(canvas.clientWidth || 390, canvas.clientHeight || 844);
    if (round) this.recenter(round, true);
  }

  material(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra }));
    return this.materials.get(key);
  }

  heightAt(x, y) {
    let h = 2.0 * Math.sin(x / 115) * Math.cos(y / 120) + 2.6 * Math.sin((x + y) / 205);
    for (const f of this.course.flags) {
      const d = ellipseDistance(x, y, { ...f, rx: 85, ry: 68 });
      h += 6.0 * (1 - smooth((d - .6) / .65));
    }
    for (const s of this.course.sand) {
      const d = ellipseDistance(x, y, s);
      if (d < 1.2) h -= 4 * (1 - smooth((d - .55) / .65));
    }
    for (const w of this.course.water) {
      const d = ellipseDistance(x, y, w);
      if (d < 1.16) h = THREE.MathUtils.lerp(-10, h, smooth((d - .82) / .34));
    }
    return h;
  }

  groundTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 2048; canvas.height = 1638;
    const ctx = canvas.getContext('2d');
    ctx.scale(canvas.width / 1150, canvas.height / 920);
    ctx.translate(125, 120);
    ctx.fillStyle = palette.rough; ctx.fillRect(-125, -120, 1150, 920);
    const rnd = random(4221 + this.course.index * 331 + this.course.variant * 11);
    // Broad changes in turf colour, rather than a noisy image, stay calm on a phone.
    for (let i = 0; i < 72; i++) {
      const x = rnd() * 1150 - 125, y = rnd() * 920 - 120, r = 40 + rnd() * 110;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, i % 2 ? '#c4cb5b14' : '#255f4414'); gradient.addColorStop(1, '#56824100');
      ctx.fillStyle = gradient; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const route = [this.course.start, ...this.course.flags];
    const fairway = new Path2D();
    fairway.moveTo(route[0].x, route[0].y);
    for (let i = 1; i < route.length; i++) fairway.lineTo(route[i].x, route[i].y);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#6a9a42'; ctx.lineWidth = 126; ctx.stroke(fairway);
    ctx.strokeStyle = palette.fairway; ctx.lineWidth = 108; ctx.stroke(fairway);
    // Mowing bands follow the fairway rather than forming a checkerboard.
    const mask = document.createElement('canvas'); mask.width = canvas.width; mask.height = canvas.height;
    const m = mask.getContext('2d'); m.scale(canvas.width / 1150, canvas.height / 920); m.translate(125, 120);
    m.lineCap = 'round'; m.lineJoin = 'round'; m.strokeStyle = '#fff'; m.lineWidth = 106; m.stroke(fairway);
    m.globalCompositeOperation = 'source-in';
    m.save(); m.rotate(-.44);
    for (let x = -1000; x < 1800; x += 28) { m.fillStyle = Math.round(x / 28) % 2 ? '#dae48712' : '#4d99400c'; m.fillRect(x, -1200, 28, 2800); }
    m.restore();
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mask, 0, 0); ctx.restore();
    const ellipse = (e, rx, ry, color) => { ctx.beginPath(); ctx.ellipse(e.x, e.y, rx, ry, 0, 0, TAU); ctx.fillStyle = color; ctx.fill(); };
    for (const f of this.course.flags) {
      ellipse(f, 77, 58, '#699940'); ellipse(f, 72, 53, '#8bb64a'); ellipse(f, 66, 48, palette.green);
      ctx.save(); ctx.beginPath(); ctx.ellipse(f.x, f.y, 66, 48, 0, 0, TAU); ctx.clip();
      ctx.translate(f.x, f.y); ctx.rotate(-.44);
      ctx.fillStyle = '#f4efb410';
      for (let x = -120; x < 120; x += 21) ctx.fillRect(x, -90, 10, 180);
      ctx.restore();
    }
    for (const s of this.course.sand) {
      ellipse(s, s.rx + 7, s.ry + 7, '#678e47'); ellipse(s, s.rx + 3, s.ry + 3, '#d1c090');
      ellipse(s, s.rx, s.ry, palette.sand);
      ctx.save(); ctx.beginPath(); ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, TAU); ctx.clip();
      ctx.strokeStyle = '#fff1ca58'; ctx.lineWidth = .45;
      for (let k = -s.ry; k < s.ry; k += 3.4) { ctx.beginPath(); ctx.ellipse(s.x + 18, s.y - s.ry, s.rx + k + s.ry, s.ry + k + s.ry, 0, 0, Math.PI); ctx.stroke(); }
      ctx.restore();
    }
    for (const w of this.course.water) {
      ellipse(w, w.rx + 11, w.ry + 11, '#648b4a'); ellipse(w, w.rx + 5, w.ry + 5, '#b3bd82'); ellipse(w, w.rx + 1, w.ry + 1, '#6baba0');
    }
    // Fine grass marks are almost imperceptible at playing distance.
    for (let i = 0; i < 6000; i++) {
      const x = rnd() * 1150 - 125, y = rnd() * 920 - 120;
      ctx.fillStyle = i % 2 ? '#ffffcc08' : '#25482308'; ctx.fillRect(x, y, .6, .8);
    }
    const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    return tex;
  }

  buildGround() {
    const geometry = new THREE.PlaneGeometry(1150, 920, 154, 124);
    geometry.rotateX(-Math.PI / 2);
    const pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) pos.setY(i, this.heightAt(pos.getX(i) + 450, pos.getZ(i) + 340));
    geometry.computeVertexNormals();
    this.ground = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: this.groundTexture(), roughness: 1 }));
    this.ground.receiveShadow = true; this.scene.add(this.ground);
    const beyond = new THREE.Mesh(new THREE.PlaneGeometry(4200, 4200), this.material(palette.rough));
    beyond.rotation.x = -Math.PI / 2; beyond.position.y = -9; beyond.receiveShadow = true; this.scene.add(beyond);
  }

  buildWater() {
    this.ripples = [];
    for (const w of this.course.water) {
      const shape = new THREE.Shape(); shape.absellipse(0, 0, w.rx * .985, w.ry * .985, 0, TAU, false, 0);
      const geo = new THREE.ShapeGeometry(shape, 80); geo.rotateX(-Math.PI / 2);
      const mesh = new THREE.Mesh(geo, this.material(palette.water, { roughness: .36, metalness: .08 }));
      mesh.position.copy(point(w.x, w.y, -5.6)); mesh.receiveShadow = true; this.scene.add(mesh);
      const inner = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshBasicMaterial({ color: '#8dd3ca', transparent: true, opacity: .22 }));
      inner.rotation.x = -Math.PI / 2; inner.scale.set(w.rx * .86, w.ry * .81, 1); inner.position.copy(point(w.x + 2, w.y - 4, -5.5)); this.scene.add(inner);
      for (let i = 0; i < 7; i++) {
        const points = [], cy = w.y - w.ry * .66 + i * w.ry * .2, extent = w.rx * Math.sqrt(Math.max(0, 1 - ((cy - w.y) / w.ry) ** 2));
        const start = -extent * .55 + Math.sin(i * 5) * extent * .2;
        for (let j = 0; j <= 12; j++) points.push(point(w.x + start + j / 12 * extent * .52, cy + Math.sin(j / 12 * Math.PI) * .7, -5.35));
        const ripple = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), new THREE.LineBasicMaterial({ color: '#c2e6da', transparent: true, opacity: .23 }));
        this.scene.add(ripple); this.ripples.push(ripple);
      }
    }
  }

  mesh(geometry, material, x, y, h = 0, group = this.scene) {
    const mesh = new THREE.Mesh(geometry, material); mesh.position.copy(point(x, y, h)); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }

  buildTrees() {
    const rnd = random(804 + this.course.variant * 19 + this.course.index * 33);
    this.trees = new THREE.Group(); this.scene.add(this.trees);
    const positions = [...this.course.trees];
    // The landscape continues beyond the playable turf. There is no miniature board edge.
    for (let i = 0; i < 22; i++) {
      positions.push({ x: -65 + (i % 11) * 99 + rnd() * 35, y: i < 11 ? -48 - rnd() * 45 : 727 + rnd() * 55, r: 25 + rnd() * 10 });
    }
    const bark = this.material('#80684b');
    const treeColors = ['#306e48', '#367b4e', '#28704b', '#427c4b', '#528546'];
    const pineGeometry = new THREE.ConeGeometry(1, 1, 10, 1);
    const crownGeometry = new THREE.IcosahedronGeometry(1, 1);
    for (let i = 0; i < positions.length; i++) {
      const t = positions[i], base = this.heightAt(t.x, t.y), height = t.r * (2.5 + rnd() * .7), broad = i % 5 === 1;
      const trunk = this.mesh(new THREE.CylinderGeometry(2, 3.8, height * .58, 7), bark, t.x, t.y, base + height * .29, this.trees);
      const mat = this.material(treeColors[i % treeColors.length]);
      if (broad) {
        for (let k = 0; k < 5; k++) {
          const a = k * 2.399, r = k ? t.r * .42 : 0;
          const leaf = this.mesh(crownGeometry, mat, t.x + Math.cos(a) * r, t.y + Math.sin(a) * r, base + height * (.68 + rnd() * .15), this.trees);
          leaf.scale.set(t.r * .8, t.r * .82, t.r * .76); leaf.rotation.set(rnd(), rnd(), rnd());
        }
      } else {
        for (let k = 0; k < 4; k++) {
          const leaf = this.mesh(pineGeometry, mat, t.x + Math.sin(i + k) * 1.4, t.y + Math.cos(i + k) * 1.4, base + height * (.40 + k * .155), this.trees);
          leaf.scale.set(t.r * (.92 - k * .19), height * (.59 - k * .07), t.r * (.86 - k * .175)); leaf.rotation.y = k * .65 + i;
        }
      }
      // A little warm mulch visible under the trunks grounds every tree.
      const mulch = new THREE.Mesh(new THREE.CircleGeometry(t.r * .2, 12), this.material('#8b8055'));
      mulch.rotation.x = -Math.PI / 2; mulch.position.copy(point(t.x, t.y, base + .12)); this.trees.add(mulch);
    }
  }

  buildDetails() {
    const rnd = random(7146 + this.course.index);
    // A pair of discreet tee markers, not a separate start screen.
    const s = this.course.start;
    for (const side of [-1, 1]) {
      const x = s.x + side * 13, y = s.y + 8;
      this.mesh(new THREE.BoxGeometry(4, 3, 4), this.material('#faf4de'), x, y, this.heightAt(x, y) + 1.5);
    }
    for (const w of this.course.water) {
      for (let i = 0; i < 7; i++) {
        const a = 1 + i * .21, x = w.x + Math.cos(a) * (w.rx + 5), y = w.y + Math.sin(a) * (w.ry + 5);
        const rock = this.mesh(new THREE.IcosahedronGeometry(1, 0), this.material(i % 2 ? '#a3a58c' : '#929c85'), x, y, this.heightAt(x, y) + 1.1);
        rock.scale.set(2 + rnd() * 3, 1.5 + rnd() * 1.5, 2 + rnd() * 3); rock.rotation.y = rnd() * TAU;
      }
    }
  }

  buildFlags() {
    this.flags = [];
    const colors = ['#d36c4e', '#d7a443', '#d46f71', '#628da8', '#9c81a6'];
    for (const f of this.course.flags) {
      const h = this.heightAt(f.x, f.y);
      const cup = new THREE.Mesh(new THREE.CircleGeometry(4.6, 24), this.material('#294d32'));
      cup.rotation.x = -Math.PI / 2; cup.position.copy(point(f.x, f.y, h + .14)); this.scene.add(cup);
      const rim = new THREE.Mesh(new THREE.RingGeometry(4.6, 5.05, 24), this.material('#d2d6a4')); rim.rotation.x = -Math.PI / 2; rim.position.copy(point(f.x, f.y, h + .16)); this.scene.add(rim);
      const group = new THREE.Group(); group.position.copy(point(f.x, f.y, h)); this.scene.add(group);
      const pole = new THREE.Mesh(new THREE.CylinderGeometry(.75, .85, 60, 8), this.material('#fff7df')); pole.position.y = 30; pole.castShadow = true; group.add(pole);
      const finial = new THREE.Mesh(new THREE.SphereGeometry(1.3, 10, 8), this.material('#fff7df')); finial.position.y = 60.6; group.add(finial);
      const geo = new THREE.PlaneGeometry(23, 15, 12, 3);
      geo.translate(11.7, 51, 0);
      const flag = new THREE.Mesh(geo, this.material(this.finale ? '#78627c' : colors[f.id], { side: THREE.DoubleSide })); flag.castShadow = true; flag.rotation.y = -.25; group.add(flag);
      this.flags.push({ group, flag, id: f.id });
    }
  }

  buildBall() {
    this.ball = new THREE.Mesh(new THREE.SphereGeometry(4.25, 20, 16), this.material('#fffdf0', { roughness: .28 }));
    this.ball.castShadow = false; this.scene.add(this.ball);
    this.ballRing = new THREE.Mesh(new THREE.RingGeometry(8.6, 9.35, 48), new THREE.MeshBasicMaterial({ color: '#fffce5', transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }));
    this.ballRing.rotation.x = -Math.PI / 2; this.scene.add(this.ballRing);
    this.ballShadow = new THREE.Mesh(new THREE.CircleGeometry(5.2, 24), new THREE.MeshBasicMaterial({ color: '#264c35', transparent: true, opacity: .22, depthWrite: false }));
    this.ballShadow.rotation.x = -Math.PI / 2; this.scene.add(this.ballShadow);
  }

  buildAim() {
    this.aimPoints = new Float32Array(65 * 3);
    const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position', new THREE.BufferAttribute(this.aimPoints, 3));
    this.aim = new THREE.Line(geometry, new THREE.LineBasicMaterial({ color: '#fffdeb', transparent: true, opacity: .85, depthTest: false }));
    this.aim.frustumCulled = false; this.aim.renderOrder = 9; this.scene.add(this.aim);
    this.aimEnd = new THREE.Mesh(new THREE.RingGeometry(7.2, 8, 36), new THREE.MeshBasicMaterial({ color: '#fffdeb', transparent: true, opacity: .8, depthTest: false, side: THREE.DoubleSide }));
    this.aimEnd.rotation.x = -Math.PI / 2; this.aimEnd.renderOrder = 9; this.scene.add(this.aimEnd);
  }

  setProtestLevel(level) {
    this.protestLevel = clamp(level || 0, 0, 3);
    this.renderer.shadowMap.needsUpdate = true;
    if (this.crowd) { this.scene.remove(this.crowd); this.disposeGroup(this.crowd); }
    this.crowd = new THREE.Group(); this.scene.add(this.crowd);
    const total = [0, 12, 36, 108][this.protestLevel];
    const rnd = random(15125);
    for (let i = 0; i < total; i++) {
      const x = 215 + (i % 36) * 15 + rnd() * 4, y = 654 + Math.floor(i / 36) * 13 + rnd() * 5, h = this.heightAt(x, y);
      const body = this.mesh(new THREE.CylinderGeometry(2.2, 2.6, 9, 6), this.material(['#d3b480', '#667b83', '#ddcfad', '#d38c71'][i % 4]), x, y, h + 6.5, this.crowd);
      this.mesh(new THREE.SphereGeometry(2, 8, 6), this.material(i % 3 ? '#ba906c' : '#825d45'), x, y, h + 13, this.crowd);
      if (i % 4 === 0) {
        this.mesh(new THREE.CylinderGeometry(.35, .35, 16, 4), this.material('#ae9370'), x + 3, y, h + 12, this.crowd);
        const sign = this.mesh(new THREE.BoxGeometry(10, 6, .65), this.material('#f2e6c7'), x + 3, y, h + 22, this.crowd); sign.rotation.y = -.4;
      }
    }
  }

  buildAncient() {
    const w = this.course.water[0]; if (!w) return;
    this.ancient = new THREE.Group(); this.scene.add(this.ancient);
    const material = this.material('#435e54', { roughness: .5 });
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * TAU;
      const path = new THREE.CatmullRomCurve3([
        point(w.x + Math.cos(a) * 20, w.y + Math.sin(a) * 20, -8),
        point(w.x + Math.cos(a) * 43, w.y + Math.sin(a) * 33, 10 + i * 3),
        point(w.x + Math.cos(a + .4) * 59, w.y + Math.sin(a + .4) * 42, 22 + i * 3),
        point(w.x + Math.cos(a + .8) * 61, w.y + Math.sin(a + .8) * 46, 7)
      ]);
      const arm = new THREE.Mesh(new THREE.TubeGeometry(path, 28, 4.5 - i * .35, 8, false), material); arm.castShadow = true; this.ancient.add(arm);
    }
  }

  resize(width, height) {
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    this.baseSpan = this.width / this.height < 1.15 ? 440 : 360;
    this.autoSpan = this.round ? this.spanForRound(this.round) : this.baseSpan;
    this.setFrustum(); this.updateCamera();
  }

  setFrustum() {
    const aspect = this.width / this.height, span = this.autoSpan / this.zoomLevel;
    this.camera.left = -span * aspect / 2; this.camera.right = span * aspect / 2;
    this.camera.top = span / 2; this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix();
  }

  nextFlag(round) {
    let next = null, best = Infinity;
    for (const f of this.course.flags) {
      if (round.holes[f.id] !== null) continue;
      const d = Math.hypot(f.x - round.ball.x, f.y - round.ball.y);
      if (d < best) { best = d; next = f; }
    }
    return next;
  }

  spanForRound(round) {
    const next = this.nextFlag(round);
    if (!next || round.moving) return this.autoSpan || this.baseSpan;
    const dx = next.x - round.ball.x, dy = next.y - round.ball.y;
    const across = Math.abs(dx * .8859 + dy * .4639);
    const up = Math.abs(dx * .3101 - dy * .5923);
    const fit = Math.max((across + 95) / (this.width / this.height), up + 145);
    return Math.max(this.baseSpan, Math.min(780, fit));
  }

  updateCamera() {
    this.camera.position.copy(this.focus).add(this.cameraOffset);
    this.camera.lookAt(this.focus);
    this.camera.updateMatrixWorld();
  }

  frameTarget(round) {
    const next = this.nextFlag(round), b = round.ball;
    const dx = next ? next.x - b.x : 0, dy = next ? next.y - b.y : 0;
    const across = Math.abs(dx * .8859 + dy * .4639), up = Math.abs(dx * .3101 - dy * .5923);
    // In a forward shot the ball sits low in the frame; sideways shots share the frame.
    const t = round.moving ? .12 : across > up * 1.15 ? .5 : .65;
    return point(b.x + dx * t, b.y + dy * t, 0);
  }

  recenter(round = this.round, immediate = false) {
    this.panned = false; this.round = round;
    this.desired.copy(this.frameTarget(round));
    if (immediate) { this.focus.copy(this.desired); this.autoSpan = this.spanForRound(round); this.setFrustum(); this.updateCamera(); }
  }

  worldToScreen(p) {
    const h = p.height ?? this.heightAt(p.x, p.y);
    this.scratch.copy(point(p.x, p.y, h)).project(this.camera);
    return { x: (this.scratch.x + 1) * this.width / 2, y: (1 - this.scratch.y) * this.height / 2 };
  }

  screenToWorld(p) {
    const mouse = new THREE.Vector2(p.x / this.width * 2 - 1, 1 - p.y / this.height * 2);
    this.raycaster.setFromCamera(mouse, this.camera);
    this.plane.constant = 0;
    this.raycaster.ray.intersectPlane(this.plane, this.rayPoint);
    for (let i = 0; i < 3; i++) {
      this.plane.constant = -this.heightAt(this.rayPoint.x + 450, this.rayPoint.z + 340);
      this.raycaster.ray.intersectPlane(this.plane, this.rayPoint);
    }
    return { x: this.rayPoint.x + 450, y: this.rayPoint.z + 340 };
  }

  pan(dx, dy) {
    const origin = this.screenToWorld({ x: this.width / 2, y: this.height / 2 });
    const destination = this.screenToWorld({ x: this.width / 2 + dx, y: this.height / 2 + dy });
    this.focus.x = clamp(this.focus.x + origin.x - destination.x, -480, 480);
    this.focus.z = clamp(this.focus.z + origin.y - destination.y, -370, 370);
    this.desired.copy(this.focus); this.panned = true; this.updateCamera();
  }

  zoom(factor) {
    if (!Number.isFinite(factor) || factor <= 0) return;
    this.zoomLevel = clamp(this.zoomLevel * factor, .72, 1.75);
    this.panned = true; this.setFrustum();
  }

  updateAim(round, visible) {
    this.aim.visible = this.aimEnd.visible = visible && !round.moving && !round.finished;
    if (!this.aim.visible) return;
    const b = round.ball, speed = round.power * (round.club === 'wedge' ? .112 : .1), frames = round.club === 'wedge' ? 12 + round.power * .22 : 0;
    const range = round.club === 'wedge' ? speed * (1 - .992 ** frames) / .008 + speed * .992 ** frames / .065 : speed / .028;
    const dx = Math.cos(round.angle) * range, dy = Math.sin(round.angle) * range;
    for (let i = 0; i <= 64; i++) {
      const t = i / 64, x = b.x + dx * t, y = b.y + dy * t;
      const lift = round.club === 'wedge' ? Math.sin(Math.PI * t) * (18 + round.power * .38) : 0;
      this.aimPoints[i * 3] = x - 450; this.aimPoints[i * 3 + 1] = this.heightAt(x, y) + lift + 4; this.aimPoints[i * 3 + 2] = y - 340;
    }
    this.aim.geometry.attributes.position.needsUpdate = true;
    this.aimEnd.position.copy(point(b.x + dx, b.y + dy, this.heightAt(b.x + dx, b.y + dy) + .35));
  }

  render(round, { time = 0, drag = null, aimVisible = false } = {}) {
    this.round = round;
    const completed = round.holes.filter(n => n !== null).length;
    if (this.completedFlags !== completed) { this.completedFlags = completed; this.renderer.shadowMap.needsUpdate = true; }
    const dt = Math.min(.06, Math.max(.001, (time - this.lastTime) / 1000 || .016)); this.lastTime = time;
    if (!this.panned && !drag) {
      const span = this.spanForRound(round);
      this.autoSpan = THREE.MathUtils.lerp(this.autoSpan, span, this.reduceMotion ? 1 : 1 - Math.exp(-dt * 2.8));
      this.setFrustum();
      this.desired.copy(this.frameTarget(round));
      this.focus.lerp(this.desired, this.reduceMotion ? 1 : 1 - Math.exp(-dt * (round.moving ? 7 : 3.6)));
      this.updateCamera();
    }
    const b = round.ball;
    const lift = b.airTotal > 0 ? Math.sin(Math.PI * b.air / b.airTotal) * (18 + round.power * .4) : 0;
    this.ball.visible = this.ballShadow.visible = !round.finished;
    this.ball.position.copy(point(b.x, b.y, this.heightAt(b.x, b.y) + lift + 4.25));
    this.ballShadow.position.copy(point(b.x + lift * .2, b.y + lift * .14, this.heightAt(b.x, b.y) + .2));
    this.ballShadow.scale.setScalar(1 + lift * .015); this.ballShadow.material.opacity = .25 - lift * .0018;
    this.ballRing.visible = !round.moving && !round.finished;
    this.ballRing.position.copy(point(b.x, b.y, this.heightAt(b.x, b.y) + .3));
    this.ballRing.scale.setScalar(1 + (this.reduceMotion ? 0 : Math.sin(time / 700) * .06));
    for (const f of this.flags) {
      f.group.visible = round.holes[f.id] === null;
      if (!f.group.visible || this.reduceMotion) continue;
      const pos = f.flag.geometry.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        pos.setZ(i, Math.sin(x / 8 - time / 650 + f.id) * 1.35 * x / 23);
      }
      pos.needsUpdate = true;
    }
    this.updateAim(round, drag ? !drag.cancelled : aimVisible);
    this.renderer.render(this.scene, this.camera);
  }

  disposeGroup(group) {
    group.traverse(object => { object.geometry?.dispose(); });
  }

  destroy() {
    const textures = new Set(), materials = new Set(), geometry = new Set();
    this.scene.traverse(object => {
      if (object.geometry) geometry.add(object.geometry);
      if (object.material) for (const mat of Array.isArray(object.material) ? object.material : [object.material]) { materials.add(mat); if (mat.map) textures.add(mat.map); }
    });
    for (const resource of [...textures, ...materials, ...geometry]) resource.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}
