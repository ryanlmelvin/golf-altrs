import * as THREE from './vendor/three.module.js';

// Illustrative places to look around, rather than scale reconstructions of the sites.
const TAU = Math.PI * 2;
const hash = value => [...String(value)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 19);
const random = seed => () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };

export class DetourScene {
  constructor(canvas, { detour, foundIds = [], onInspect, onLayout } = {}) {
    this.canvas = canvas;
    this.detour = detour;
    this.onInspect = onInspect;
    this.onLayout = onLayout;
    this.foundIds = new Set(foundIds);
    this.materials = new Map();
    this.spotModels = new Map();
    this.width = 390; this.height = 844;
    this.destroyed = false;
    this.rnd = random(hash(detour.id));
    this.reduceMotion = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color('#9ab47c');
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(globalThis.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.04;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.camera = new THREE.OrthographicCamera(-110, 110, 200, -200, 1, 1600);
    this.camera.position.set(-100, 310, 400);
    this.camera.lookAt(0, 24, 4);
    this.camera.updateMatrixWorld();
    this.scene.add(new THREE.HemisphereLight('#e7f2fb', '#7a8a54', 1.7));
    this.sun = new THREE.DirectionalLight('#fff1d5', 2.8);
    this.sun.position.set(-170, 340, -150);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    Object.assign(this.sun.shadow.camera, { left: -250, right: 250, top: 260, bottom: -260, near: 60, far: 900 });
    this.sun.shadow.normalBias = .35;
    this.sun.shadow.bias = -.0003;
    this.scene.add(this.sun);
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.scratch = new THREE.Vector3();
    this.buildGround();
    this.buildLandscape();
    this.buildSpots();
    this.setFoundIds(foundIds);
    this.controller = new AbortController();
    const options = { signal: this.controller.signal };
    canvas.addEventListener('pointerdown', event => { this.press = { x: event.clientX, y: event.clientY }; }, options);
    canvas.addEventListener('pointerup', event => this.inspectAt(event), options);
    canvas.addEventListener('pointercancel', () => { this.press = null; }, options);
    this.resizeObserver = new ResizeObserver(entries => {
      const rect = entries[0]?.contentRect;
      if (rect) this.resize(rect.width, rect.height);
    });
    this.resizeObserver.observe(canvas.parentElement || canvas);
    this.resize(canvas.clientWidth || 390, canvas.clientHeight || 844);
    this.animate = time => {
      if (this.destroyed) return;
      this.render(time);
      this.frame = requestAnimationFrame(this.animate);
    };
    this.frame = requestAnimationFrame(this.animate);
    queueMicrotask(() => { if (!this.destroyed) this.emitLayout(); });
  }

  mat(color, extra = {}) {
    const key = color + JSON.stringify(extra);
    if (!this.materials.has(key)) this.materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: .92, ...extra }));
    return this.materials.get(key);
  }

  mesh(group, geometry, material, x = 0, y = 0, z = 0) {
    const mesh = new THREE.Mesh(geometry, typeof material === 'string' ? this.mat(material) : material);
    mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
  }
  box(g, w, h, d, color, x = 0, y = 0, z = 0) { return this.mesh(g, new THREE.BoxGeometry(w, h, d), color, x, y, z); }
  cylinder(g, top, bottom, h, color, x = 0, y = 0, z = 0, sides = 20) { return this.mesh(g, new THREE.CylinderGeometry(top, bottom, h, sides), color, x, y, z); }
  sphere(g, r, color, x = 0, y = 0, z = 0, detail = 1) { return this.mesh(g, new THREE.IcosahedronGeometry(r, detail), color, x, y, z); }
  beam(g, a, b, radius, color, sides = 8) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const beam = this.cylinder(g, radius, radius, direction.length(), color, ...start.clone().add(end).multiplyScalar(.5).toArray(), sides);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize()); return beam;
  }
  roof(g, w, d, height, color, y, z = 0) {
    const shape = new THREE.Shape(); shape.moveTo(-w / 2, 0); shape.lineTo(0, height); shape.lineTo(w / 2, 0); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
    return this.mesh(g, geo, color, 0, y, z - d / 2);
  }

  buildGround() {
    const canvas = document.createElement('canvas'); canvas.width = canvas.height = 1024;
    const ctx = canvas.getContext('2d'); ctx.scale(1024 / 560, 1024 / 560); ctx.translate(280, 280);
    const urban = ['industrial', 'theatre', 'studio', 'depot', 'mural'].includes(this.detour.theme);
    ctx.fillStyle = urban ? '#98ac79' : '#82aa59'; ctx.fillRect(-280, -280, 560, 560);
    for (let i = 0; i < 80; i++) {
      const x = this.rnd() * 560 - 280, y = this.rnd() * 560 - 280, r = 15 + this.rnd() * 40;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r); grad.addColorStop(0, '#c5d27815'); grad.addColorStop(1, '#9fb86b00');
      ctx.fillStyle = grad; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    const path = new Path2D(); path.moveTo(-10, 220); path.bezierCurveTo(-20, 130, 25, 100, 0, 5);
    path.moveTo(-5, 90); path.quadraticCurveTo(-50, 65, -65, 42);
    path.moveTo(1, 80); path.quadraticCurveTo(35, 98, 58, 70);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = '#769750'; ctx.lineWidth = 36; ctx.stroke(path);
    ctx.strokeStyle = urban ? '#c5bea2' : '#d7c799'; ctx.lineWidth = 29; ctx.stroke(path);
    ctx.beginPath(); ctx.ellipse(0, 2, 65, 49, 0, 0, TAU); ctx.fillStyle = urban ? '#c4bda3' : '#d7c799'; ctx.fill();
    if (urban) { ctx.strokeStyle = '#a7a58c55'; ctx.lineWidth = .65; for (let i = -65; i < 75; i += 9) { ctx.beginPath(); ctx.moveTo(i, -38); ctx.lineTo(i, 48); ctx.stroke(); } }
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = i % 2 ? '#ffffff0b' : '#35562b0c'; ctx.fillRect(this.rnd() * 560 - 280, this.rnd() * 560 - 280, .6, .7); }
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace; texture.anisotropy = 4;
    const ground = this.mesh(this.scene, new THREE.PlaneGeometry(560, 560), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }));
    ground.rotation.x = -Math.PI / 2; ground.castShadow = false;
    const beyond = this.mesh(this.scene, new THREE.PlaneGeometry(3000, 3000), '#82aa59', 0, -.5, 0); beyond.rotation.x = -Math.PI / 2; beyond.castShadow = false;
  }

  tree(x, z, scale = 1, pine = false) {
    const group = new THREE.Group(); group.position.set(x, 0, z); group.scale.setScalar(scale); this.scene.add(group);
    this.cylinder(group, 2.2, 3.7, 38, '#80654a', 0, 19, 0, 8);
    if (pine) {
      for (let k = 0; k < 4; k++) this.cylinder(group, 0, 18 - k * 3.7, 32 - k * 4, ['#39774c', '#39774c', '#407d4e', '#46844e'][k], 0, 28 + k * 10, 0, 10);
    } else {
      this.beam(group, [0, 22, 0], [12, 39, -5], 2, '#80654a'); this.beam(group, [0, 24, 0], [-12, 36, 6], 2, '#80654a');
      for (let k = 0; k < 6; k++) { const a = k * 2.4, r = k ? 9 : 0; const crown = this.sphere(group, 15 + this.rnd() * 3, k % 2 ? '#538848' : '#467e44', Math.cos(a) * r, 42 + this.rnd() * 8, Math.sin(a) * r); crown.scale.y = .86; }
    }
    return group;
  }

  buildLandscape() {
    const wet = ['bay', 'birds'].includes(this.detour.theme);
    for (const [x, z, scale] of [[-112, -45, 1.3], [112, -55, 1.35], [-80, -105, 1], [80, -122, 1.15], [-118, 108, 1.2], [135, 92, 1.05], [8, -157, 1.25]]) {
      if (wet && z < -50) continue;
      this.tree(x, z, scale, this.detour.theme === 'trail' || this.detour.theme === 'cabin' || this.rnd() > .65);
    }
    for (let i = 0; i < 20; i++) {
      const side = i % 2 ? -1 : 1, x = side * (85 + this.rnd() * 80), z = this.rnd() * 230 - 100;
      const bush = this.sphere(this.scene, 4 + this.rnd() * 4, '#658b48', x, 4, z); bush.scale.y = .65;
      if (i % 3 === 0) this.sphere(this.scene, 1.6, ['#e2cb65', '#e0a4a1', '#e8dbbb'][i % 3], x - 2, 7, z);
    }
  }

  buildSpots() {
    const landmarkSpot = this.detour.spots.find(spot => spot.kind === 'landmark') || this.detour.spots[0];
    for (const spot of this.detour.spots) {
      const group = new THREE.Group(); group.position.set(spot.x || 0, 0, spot.z || 0); group.userData.spotId = spot.id; this.scene.add(group);
      let height = 8, item = null;
      if (spot === landmarkSpot) {
        height = this.buildLandmark(group);
      } else if (spot.kind === 'bench') {
        this.bench(group); height = 14;
      } else if (spot.kind === 'sign' || spot.kind === 'plaque') {
        this.sign(group); height = 23;
      } else {
        // Small finds sit within reach on a low piece of stone or a park bench.
        this.box(group, 24, 7, 16, '#b9b7a0', 0, 3.5, 0);
        this.box(group, 26, 2, 18, '#d4d0b6', 0, 8, 0);
        item = new THREE.Group(); group.add(item); item.position.y = 9.3;
        this.souvenir(item, spot.kind); height = 13;
      }
      const glint = this.sphere(group, .95, this.mat('#fff3c5', { emissive: '#dac36a', emissiveIntensity: .25 }), 0, height + 2.5, 0, 0);
      glint.castShadow = false;
      this.spotModels.set(spot.id, { spot, group, item, glint, height });
    }
  }

  bench(g, x = 0, z = 0) {
    for (const bx of [-10, 10]) { this.box(g, 2, 10, 14, '#556a57', x + bx, 5, z); this.box(g, 2, 19, 2, '#556a57', x + bx, 10, z - 6); }
    for (let i = 0; i < 4; i++) this.box(g, 28, 1.6, 2.4, '#b69464', x, 10.2, z - 4.4 + i * 3);
    for (let i = 0; i < 3; i++) this.box(g, 28, 2.2, 1.5, '#b69464', x, 14 + i * 3, z - 6);
  }

  sign(g) {
    this.box(g, 2.4, 23, 2.4, '#78674b', -7, 11.5, 0); this.box(g, 2.4, 23, 2.4, '#78674b', 7, 11.5, 0);
    this.box(g, 23, 14, 1.7, '#ebe0bd', 0, 23, 0);
    this.box(g, 25, 1.7, 3, '#586e52', 0, 31, 0);
    for (let i = 0; i < 4; i++) this.box(g, 13 - i * 1.5, .45, .16, '#a19d7f', -1, 26 - i * 2.1, .94);
  }

  souvenir(g, kind) {
    if (['card', 'ticket', 'rubbing', 'postcard', 'paper', 'map', 'letter', 'leaflet'].includes(kind)) {
      const sheet = this.box(g, kind === 'ticket' ? 9 : 11, .35, kind === 'ticket' ? 5 : 8, '#fff0cf', 0, .2, 0); sheet.rotation.y = -.25;
      for (let i = 0; i < 3; i++) this.box(g, 5 - i * .8, .12, .22, '#a2a17f', -1, .45, -1.7 + i * 1.3);
      if (kind === 'postcard') this.box(g, 3, .15, 2.5, '#8aaa83', 2.6, .46, -.8);
    } else if (kind === 'flower') {
      this.beam(g, [-4, .4, -2], [5, .6, 3], .35, '#66804a');
      for (let i = 0; i < 6; i++) this.sphere(g, 1.6, '#e3bc70', -3 + Math.cos(i / 6 * TAU) * 2, 1, -2 + Math.sin(i / 6 * TAU) * 2, 0);
      this.sphere(g, 1, '#9b784b', -3, 1.5, -2, 0);
    } else if (kind === 'feather') {
      this.beam(g, [-5, .4, 0], [5, .4, 1], .2, '#b7af93');
      const feather = this.sphere(g, 3.2, '#f0ead6', 0, .8, 0); feather.scale.set(1.9, .12, .55); feather.rotation.y = -.1;
    } else if (kind === 'shell') {
      const shell = this.sphere(g, 3.1, '#edceb2', 0, 1.1, 0); shell.scale.set(1.2, .45, 1); shell.rotation.y = .6;
      for (let i = 0; i < 5; i++) this.beam(g, [0, 1.5, 2], [(i - 2) * 1.3, 1.5, -2], .12, '#bda88d');
    } else {
      const stone = this.sphere(g, 3.2, '#979f91', 0, 1.4, 0); stone.scale.set(1.4, .65, 1); stone.rotation.set(.2, -.4, .3);
    }
  }

  buildLandmark(g) {
    const theme = this.detour.theme;
    if (this.detour.id === 'highland-peanuts') return this.peanut(g);
    if (this.detour.id === 'shoals-wright') return this.wrightHouse(g);
    if (this.detour.id === 'magnolia-carnival') return this.carnival(g);
    if (this.detour.id === 'oxmoor-sloss') return this.furnaces(g);
    if (theme === 'monument') return this.monument(g);
    if (theme === 'ballpark') return this.ballpark(g);
    if (theme === 'industrial') return this.industrial(g);
    if (theme === 'trail') return this.trail(g);
    if (theme === 'garden') return this.garden(g);
    if (theme === 'tower') return this.tower(g);
    if (theme === 'fountain') return this.fountain(g);
    if (theme === 'house') return this.house(g);
    if (theme === 'crater') return this.crater(g);
    if (theme === 'theatre') return this.theatre(g);
    if (theme === 'oak') return this.oak(g);
    if (theme === 'depot') return this.depot(g);
    if (theme === 'rocket') return this.rocket(g);
    if (theme === 'bridge') return this.bridge(g);
    if (theme === 'studio') return this.studio(g);
    if (theme === 'cabin') return this.cabin(g);
    if (theme === 'mural') return this.mural(g);
    if (theme === 'bay') return this.bay(g);
    if (theme === 'boulders') return this.boulders(g);
    if (theme === 'birds') return this.birds(g);
    return this.garden(g);
  }

  monument(g) {
    const stone = '#c7bd9e', iron = '#61766a';
    this.box(g, 45, 4, 40, '#d9ceb1', 0, 2, 0);
    this.box(g, 35, 6, 31, stone, 0, 7, 0);
    this.box(g, 27, 55, 25, stone, 0, 37, 0);
    this.box(g, 33, 4, 31, '#ddd2b4', 0, 66, 0);
    for (let i = 0; i < 7; i++) this.box(g, 27.2, .5, 25.2, '#b3aa91', 0, 13 + i * 7.6, 0);
    this.box(g, 10, 17, .6, '#918f79', 0, 39, 12.8);
    // A working figure, anvil and raised spear evoke Vulcan without a photograph.
    this.beam(g, [-6, 69, 0], [-5, 88, 0], 3.1, iron); this.beam(g, [7, 69, 1], [5, 88, 0], 3.1, iron);
    this.box(g, 16, 9, 10, iron, 0, 89, 0);
    const torso = this.sphere(g, 11, iron, 0, 101, 0); torso.scale.set(.85, 1.2, .55);
    this.cylinder(g, 3, 3.5, 4, iron, 0, 113, 0);
    this.sphere(g, 5.6, iron, 0, 119, 0);
    this.beam(g, [-7, 106, 0], [-15, 96, 1], 2.8, iron); this.beam(g, [-15, 96, 1], [-20, 95, 4], 2.6, iron);
    this.beam(g, [7, 107, 0], [15, 114, 0], 2.8, iron); this.beam(g, [15, 114, 0], [18, 128, 0], 2.4, iron);
    this.beam(g, [21, 100, 0], [21, 144, 0], .9, iron);
    this.cylinder(g, 0, 2.3, 7, iron, 21, 146, 0, 4);
    this.box(g, 14, 4, 8, iron, -19, 83, 4); this.box(g, 6, 12, 6, iron, -19, 76, 4);
    return 80;
  }

  ballpark(g) {
    const infield = this.mesh(g, new THREE.CircleGeometry(52, 64, 0, Math.PI), '#bc8c61', 0, .2, 9); infield.rotation.x = -Math.PI / 2;
    for (const [x, z] of [[0, 36], [-23, 13], [23, 13], [0, -10]]) { const base = this.box(g, 4, .3, 4, '#f4eed6', x, .6, z); base.rotation.y = Math.PI / 4; }
    for (const [x, z] of [[-23, 13], [23, 13]]) this.beam(g, [0, .7, 36], [x, .7, z], .25, '#f5ead0');
    for (let i = 0; i < 5; i++) { this.box(g, 91, 3, 8, '#708974', 0, 2 + i * 3.4, -36 - i * 7); }
    this.box(g, 102, 3, 47, '#426c59', 0, 30, -48);
    for (const x of [-44, 44]) this.box(g, 2, 29, 2, '#b8b79a', x, 15, -29);
    this.box(g, 28, 20, 2, '#355b4b', 48, 34, -50);
    for (let i = 0; i < 4; i++) this.box(g, 3, 4, .3, '#e6dab4', 39 + i * 6, 36, -48.7);
    return 17;
  }

  industrial(g) {
    this.box(g, 70, 39, 45, '#b27e5c', 0, 19.5, 0); this.roof(g, 76, 51, 12, '#637771', 39);
    for (const x of [-24, -8, 8, 24]) { this.box(g, 10, 14, .6, '#496b70', x, 24, 22.9); this.box(g, 11, 1.3, 2, '#d7b38a', x, 16.5, 23); }
    this.cylinder(g, 7, 11, 95, '#a47758', -46, 47.5, -15, 16); this.cylinder(g, 8, 8, 3, '#d0b28e', -46, 95, -15, 16);
    for (const x of [37, 49]) { this.cylinder(g, 7, 7, 29, '#a1a999', x, 14.5, -17); this.cylinder(g, 0, 7, 5, '#bcc1ac', x, 31.5, -17); }
    this.beam(g, [37, 22, -10], [37, 22, 24], 2.1, '#6a8178');
    return 33;
  }

  trail(g) {
    if (this.detour.id === 'silver-ladiga') {
      this.box(g, 29, .5, 190, '#9aab94', 0, .4, -15);
      for (let i = 0; i < 12; i++) this.box(g, .7, .1, 5, '#e7d7a0', 0, .8, 63 - i * 14);
      for (const x of [-21, 21]) { this.box(g, 2, 23, 2, '#918765', x, 11.5, -23); this.box(g, 2, 23, 2, '#918765', x, 11.5, -72); this.beam(g, [x, 17, -23], [x, 17, -72], 1.1, '#b6ab85'); }
      const marker = new THREE.Group(); marker.position.set(-37, 0, 4); this.sign(marker); g.add(marker);
      // Two bicycle wheels lean beside the route marker.
      for (const z of [-3, 9]) { const wheel = this.mesh(g, new THREE.TorusGeometry(5, .5, 6, 24), '#566e62', -34, 5.5, z); wheel.rotation.y = Math.PI / 2; }
      this.beam(g, [-34, 5.5, -3], [-34, 11, 3], .5, '#a87959'); this.beam(g, [-34, 11, 3], [-34, 5.5, 9], .5, '#a87959');
      return 12;
    }
    this.water(g, 140, 24, 0, -23);
    for (let i = 0; i < 13; i++) this.box(g, 22, 1.7, 4.5, '#b7a27b', 0, 5, 13 - i * 5);
    for (const x of [-13, 13]) { this.beam(g, [x, 18, 13], [x, 18, -47], 1, '#8b8867'); for (const z of [12, -17, -46]) this.box(g, 1.8, 18, 1.8, '#8b8867', x, 9, z); }
    for (let i = 0; i < 10; i++) { const rock = this.sphere(g, 3 + this.rnd() * 3, '#a8ae94', -61 + i * 13, 1.4, -8); rock.scale.y = .5; }
    return 13;
  }

  garden(g) {
    for (const x of [-26, 26]) for (const z of [-15, 15]) this.box(g, 3, 37, 3, '#c8bea0', x, 18.5, z);
    this.box(g, 61, 3, 39, '#d8ceb0', 0, 38, 0);
    for (let i = 0; i < 9; i++) this.box(g, 2.2, 4, 47, '#b9b79a', -29 + i * 7.2, 41, 0);
    for (let i = 0; i < 18; i++) { const x = (this.rnd() - .5) * 65, z = (this.rnd() - .5) * 35; const leaf = this.sphere(g, 7, '#638b54', x, 42 + this.rnd() * 3, z); leaf.scale.y = .35; if (i % 2) this.sphere(g, 3, '#bdabc2', x, 40, z); }
    for (const x of [-43, 43]) { this.box(g, 15, 5, 47, '#a5a785', x, 2.5, 4); for (let i = 0; i < 11; i++) this.sphere(g, 3.5, ['#d7a4a8', '#e6cd6b', '#9fadc2'][i % 3], x + (this.rnd() - .5) * 10, 7, -17 + i * 4); }
    return 33;
  }

  tower(g) {
    const stone = '#b8b59b';
    this.box(g, 38, 5, 38, '#d1c8aa', 0, 2.5, 0);
    this.box(g, 29, 69, 29, stone, 0, 39, 0);
    this.box(g, 34, 4, 34, '#d4cdb0', 0, 75, 0);
    for (let i = 0; i < 10; i++) {
      this.box(g, 29.2, .55, 29.2, '#9d9e87', 0, 10 + i * 6.2, 0);
      for (const x of [-8, 5]) this.box(g, .35, 5.7, .12, '#a4a58d', x + i % 2 * 3, 13 + i * 6.2, 14.7);
    }
    this.box(g, 9, 21, .6, '#5d6c5f', 0, 16, 14.9);
    for (const x of [-10, 10]) this.box(g, 3, 12, 3, '#c3bea3', x, 83, 11);
    for (const x of [-10, 10]) this.box(g, 3, 12, 3, '#c3bea3', x, 83, -11);
    this.box(g, 31, 2.5, 31, '#cdc6a8', 0, 89, 0);
    for (const x of [-8, 8]) this.box(g, 5, 13, .6, '#61776c', x, 60, 14.9);
    for (let i = 0; i < 4; i++) this.box(g, 17 + i * 3, 2, 6, '#c8c2a6', 0, 1 + i * 2, 32 - i * 5);
    return 61;
  }

  water(g, w, d, x = 0, z = 0) {
    const water = this.box(g, w, .7, d, this.mat('#55b0b0', { roughness: .32, metalness: .06 }), x, .5, z);
    for (let i = 0; i < 8; i++) { const line = this.box(g, w * (.12 + this.rnd() * .12), .08, .35, '#a9d9cd', x + (this.rnd() - .5) * w * .7, .91, z + (this.rnd() - .5) * d * .8); line.castShadow = false; }
    return water;
  }

  fountain(g) {
    if (this.detour.id === 'capitol-well') {
      this.box(g, 106, 29, 19, '#ae8665', 0, 14.5, -49);
      this.box(g, 112, 3, 23, '#6f8275', 0, 30, -49);
      for (let i = 0; i < 7; i++) this.box(g, 8, 13, .7, '#71918a', -43 + i * 14.3, 18, -39);
    }
    this.cylinder(g, 36, 38, 5, '#d0c6a4', 0, 2.5, 0, 48);
    this.cylinder(g, 32, 32, .8, this.mat('#5caeb1', { roughness: .3 }), 0, 5.2, 0, 48);
    this.cylinder(g, 5, 8, 25, '#d3c9ad', 0, 17, 0);
    this.cylinder(g, 18, 9, 6, '#dcd2b5', 0, 31, 0, 32);
    this.cylinder(g, 15, 15, .7, '#74bfc1', 0, 34.4, 0, 32);
    this.cylinder(g, 3, 4.5, 18, '#d3c9ad', 0, 43, 0);
    this.cylinder(g, 10, 5, 4, '#ded5ba', 0, 53, 0, 28);
    this.sphere(g, 2.2, '#e4dfc8', 0, 57, 0);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; this.beam(g, [Math.cos(a) * 15, 33, Math.sin(a) * 15], [Math.cos(a) * 20, 5.8, Math.sin(a) * 20], .4, '#a8d6cc', 6); }
    return 34;
  }

  house(g) {
    this.box(g, 73, 45, 48, '#e8dfc4', 0, 27, -2); this.box(g, 81, 7, 54, '#b4aa8d', 0, 3.5, -2);
    this.roof(g, 82, 58, 21, '#6c8178', 50, -2);
    this.box(g, 81, 4, 22, '#d5ceb5', 0, 4.5, 31);
    this.box(g, 84, 3, 24, '#e5dcc2', 0, 39, 32);
    for (const x of [-34, -17, 17, 34]) this.cylinder(g, 1.7, 2, 33, '#f0e8d0', x, 22, 39, 10);
    for (const x of [-24, 24]) { this.box(g, 12, 18, .6, '#688b8d', x, 29, 22.5); for (const side of [-1, 1]) this.box(g, 4, 20, 1, '#58776b', x + side * 9, 29, 23); }
    this.box(g, 12, 25, 1, '#826f50', 0, 20, 23); this.box(g, 10, 7, 1.2, '#a2bdaf', 0, 28, 23.6);
    this.box(g, 9, 22, 9, '#b68e71', 23, 64, -11);
    return 37;
  }

  crater(g) {
    const rim = this.mesh(g, new THREE.TorusGeometry(47, 12, 10, 64), '#718c52', 0, 2, -4); rim.rotation.x = -Math.PI / 2; rim.scale.set(1.3, .82, .72);
    const basin = this.cylinder(g, 44, 44, .4, '#78985e', 0, .5, -4, 64); basin.scale.x = 1.3;
    for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; const rock = this.sphere(g, 7 + this.rnd() * 5, '#9b9e82', Math.cos(a) * 59, 3, Math.sin(a) * 41 - 4); rock.scale.y = .5; }
    this.box(g, 32, 3, 19, '#b7a780', 0, 8, 44); for (const x of [-14, 14]) this.box(g, 1.5, 15, 1.5, '#7e8366', x, 14, 36);
    this.beam(g, [-14, 21, 36], [14, 21, 36], .9, '#7e8366');
    return 16;
  }

  theatre(g) {
    this.box(g, 79, 70, 32, '#ae765b', 0, 35, -7); this.box(g, 86, 4, 36, '#dac8a3', 0, 71, -7);
    for (const x of [-27, 27]) { this.box(g, 11, 49, 2, '#c8ad87', x, 35, 10); this.box(g, 6, 29, 1, '#627e7b', x, 39, 11.5); }
    for (const x of [-13, 0, 13]) { this.box(g, 10, 22, 1.6, '#365c5b', x, 12, 10.5); this.box(g, .7, 20, .6, '#c6b884', x, 12, 11.4); }
    this.box(g, 54, 12, 20, '#e6d9ac', 0, 33, 18); this.box(g, 56, 2.5, 22, '#ad8054', 0, 40, 18);
    for (let i = 0; i < 11; i++) this.sphere(g, .9, '#fff1b1', -25 + i * 5, 28, 29, 0);
    this.box(g, 10, 45, 7, '#5c8177', 0, 64, 14);
    for (let i = 0; i < 5; i++) this.box(g, 4, 4, .8, '#ead69b', 0, 48 + i * 8, 18);
    return 42;
  }

  oak(g) {
    if (this.detour.id === 'national-toomers') {
      this.box(g, 61, 41, 32, '#ba9975', 32, 20.5, -53);
      this.box(g, 65, 3, 35, '#dfd3b3', 32, 42, -53);
      this.box(g, 65, 4, 14, '#758a65', 32, 23, -31);
      for (const x of [11, 32, 53]) this.box(g, 15, 15, .7, '#83a89b', x, 12, -36.4);
      for (const x of [13, 50]) this.box(g, 12, 12, .7, '#83988b', x, 33, -36.4);
    } else {
      for (const [x, z, h] of [[-28, 22, 16], [34, 17, 12]]) {
        this.box(g, 13, 3, 9, '#a8ac94', x, 1.5, z);
        this.box(g, 9, h, 3, '#c7c9ad', x, h / 2 + 3, z);
        this.box(g, 5, .5, .2, '#a3aa91', x, h * .75, z + 1.6);
      }
    }
    this.cylinder(g, 5.5, 10, 43, '#827659', 0, 21.5, 0, 10);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU, dx = Math.cos(a), dz = Math.sin(a);
      this.beam(g, [0, 28, 0], [dx * 30, 43, dz * 28], 3.2, '#827659');
      this.beam(g, [dx * 30, 43, dz * 28], [dx * 53, 48 + i % 3 * 4, dz * 48], 1.7, '#827659');
      const crown = this.sphere(g, 20, i % 2 ? '#688847' : '#5b7b42', dx * 34, 52, dz * 32); crown.scale.set(1.1, .54, 1);
      for (let k = 0; k < 3; k++) this.cylinder(g, .5, .25, 10 + k * 3, '#a5af87', dx * 35 + k * 3, 40 - k * 2, dz * 33, 5);
      this.beam(g, [0, 3, 0], [dx * 21, .8, dz * 18], 2.5, '#827659');
    }
    return 32;
  }

  depot(g) {
    this.box(g, 85, 5, 55, '#bda885', 0, 2.5, 0); this.box(g, 66, 32, 32, '#dccca5', 0, 21, -7); this.roof(g, 91, 58, 17, '#677f6c', 38, 0);
    for (const x of [-34, 34]) this.box(g, 2.5, 31, 2.5, '#b59872', x, 21, 22);
    for (const x of [-23, 0, 23]) this.box(g, 10, 17, .6, '#5a8080', x, 23, 9.5);
    for (let i = 0; i < 16; i++) this.box(g, 4.5, 1.1, 20, '#8e7a5b', -65 + i * 9, 1.1, 45);
    for (const z of [39, 51]) this.box(g, 147, 1.3, 1.5, '#79887f', 0, 2, z);
    return 28;
  }

  rocket(g) {
    this.cylinder(g, 26, 29, 5, '#c4c2a9', 0, 2.5, 0, 32);
    this.cylinder(g, 9, 9, 68, '#f0ead6', 0, 44, 0, 28);
    this.cylinder(g, 9.1, 9.1, 10, '#5a6863', 0, 21, 0, 28); this.cylinder(g, 9.1, 9.1, 5, '#596c68', 0, 68, 0, 28);
    this.cylinder(g, 5, 9, 18, '#f0ead6', 0, 87, 0, 28); this.cylinder(g, 5, 5, 18, '#f0ead6', 0, 105, 0, 24);
    this.cylinder(g, 0, 5, 15, '#ebe4d0', 0, 121.5, 0, 24);
    for (let i = 0; i < 4; i++) { const a = i / 4 * TAU, fin = this.box(g, 3, 17, 12, '#b4b9a9', Math.cos(a) * 10, 14, Math.sin(a) * 10); fin.rotation.y = -a; }
    for (const x of [-3.5, 3.5]) this.cylinder(g, 1.5, 2.6, 6, '#4e625d', x, 7, 0, 10);
    this.box(g, 1.3, 13, .4, '#b38263', 0, 52, 9.2);
    return 72;
  }

  bridge(g) {
    this.water(g, 155, 61, 0, -2);
    if (this.detour.id === 'hampton-spring') {
      const red = '#ae6651';
      for (let i = 0; i < 21; i++) {
        const x = -51 + i * 5.1, y = 8 + Math.sin(i / 20 * Math.PI) * 12;
        this.box(g, 5.5, 2.6, 25, '#c49870', x, y, 0);
        if (i % 2 === 0) for (const z of [-14, 14]) this.box(g, 1.6, 15, 1.6, red, x, y + 7, z);
      }
      for (const z of [-14, 14]) {
        const pts = []; for (let i = 0; i <= 20; i++) pts.push(new THREE.Vector3(-51 + i * 5.1, 24 + Math.sin(i / 20 * Math.PI) * 12, z));
        this.mesh(g, new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 1, 8, false), red);
      }
      for (const x of [-62, 62]) { this.cylinder(g, 1.5, 2.5, 30, '#8b7856', x, 15, -25); for (let i = 0; i < 5; i++) { const crown = this.sphere(g, 9, '#dcaeb1', x + Math.cos(i * 2.4) * 7, 33 + i % 2 * 4, -25 + Math.sin(i * 2.4) * 6); crown.scale.y = .7; } }
      return 25;
    }
    // Masonry arch, with the stream visible through the opening.
    const shape = new THREE.Shape(); shape.moveTo(-57, 0); shape.lineTo(-57, 40); shape.lineTo(57, 40); shape.lineTo(57, 0);
    shape.lineTo(30, 0); shape.absarc(0, 0, 30, 0, Math.PI, false); shape.lineTo(-57, 0);
    this.mesh(g, new THREE.ExtrudeGeometry(shape, { depth: 29, bevelEnabled: false }), '#b4b49b', 0, 2, -14.5);
    this.box(g, 119, 3, 34, '#d4ccb0', 0, 43, 0);
    for (let i = 0; i < 10; i++) this.box(g, 10, .4, .2, '#949c86', -50 + i * 11.2, 36, 14.8);
    for (let i = 0; i < 9; i++) { const a = i / 8 * Math.PI, block = this.box(g, 7, 4, 30, '#ccc6a9', Math.cos(a) * 33, 2 + Math.sin(a) * 33, 0); block.rotation.z = a + Math.PI / 2; }
    return 35;
  }

  studio(g) {
    this.box(g, 77, 31, 42, '#bd9270', 0, 15.5, 0); this.roof(g, 86, 49, 10, '#668477', 32);
    for (const x of [-24, 22]) this.box(g, 17, 12, 1, '#739793', x, 19, 21.5);
    this.box(g, 12, 24, 1.2, '#527c78', 0, 12, 21.7);
    this.box(g, 48, 9, 1.5, '#ede0bb', 0, 31, 23);
    for (let i = 0; i < 9; i++) this.box(g, 1.5, 2 + Math.sin(i * .9) ** 2 * 4, .3, '#749084', -17 + i * 4, 31, 24);
    this.box(g, 27, 3, 15, '#cdc3a3', 0, 2, 30);
    return 23;
  }

  cabin(g) {
    for (let i = 0; i < 10; i++) {
      const front = this.cylinder(g, 2.2, 2.2, 60, i % 2 ? '#ac8a5d' : '#b59669', 0, 5 + i * 4, 20, 8); front.rotation.z = Math.PI / 2;
      const back = this.cylinder(g, 2.2, 2.2, 60, '#a58a61', 0, 5 + i * 4, -20, 8); back.rotation.z = Math.PI / 2;
      for (const x of [-27, 27]) { const side = this.cylinder(g, 2.2, 2.2, 45, '#9c8057', x, 5 + i * 4, 0, 8); side.rotation.x = Math.PI / 2; }
    }
    this.roof(g, 68, 55, 22, '#657d69', 45); this.box(g, 61, 4, 19, '#b49b72', 0, 3, 31);
    this.box(g, 12, 26, 1.3, '#7d7150', 5, 16, 22.5); this.box(g, 11, 12, 1.4, '#92aaa0', -16, 27, 22.5);
    this.box(g, 13, 60, 14, '#b4b19a', 28, 30, -9);
    return 28;
  }

  mural(g) {
    this.box(g, 104, 57, 5, '#ba8e72', 0, 28.5, -3); this.box(g, 108, 3, 8, '#dbccb0', 0, 58, -3);
    const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 384;
    const ctx = canvas.getContext('2d'); ctx.fillStyle = '#7eb9b4'; ctx.fillRect(0, 0, 768, 384);
    ctx.fillStyle = '#e6ce7e'; ctx.beginPath(); ctx.arc(567, 107, 65, 0, TAU); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#476f67', '#598c71', '#83a46d', '#bdbe75'][i]; ctx.beginPath(); ctx.moveTo(0, 150 + i * 50); for (let x = 0; x <= 768; x += 64) ctx.lineTo(x, 150 + i * 52 + Math.sin(x / 120 + i) * 43); ctx.lineTo(768, 384); ctx.lineTo(0, 384); ctx.fill(); }
    // The painted railroad wheel and fields give the walk's small find something to point to.
    ctx.strokeStyle = '#3e665f'; ctx.lineWidth = 9; ctx.beginPath(); ctx.arc(598, 263, 47, 0, TAU); ctx.stroke();
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ctx.beginPath(); ctx.moveTo(598, 263); ctx.lineTo(598 + Math.cos(a) * 45, 263 + Math.sin(a) * 45); ctx.stroke(); }
    ctx.fillStyle = '#4f7667'; ctx.fillRect(488, 192, 178, 31);
    ctx.strokeStyle = '#efe4bc'; ctx.lineWidth = 11; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(88, 310); ctx.bezierCurveTo(190, 240, 286, 320, 395, 204); ctx.stroke();
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const art = this.mesh(g, new THREE.PlaneGeometry(94, 46), new THREE.MeshStandardMaterial({ map: texture, roughness: 1 }), 0, 30, -.35);
    return 29;
  }

  bay(g) {
    this.water(g, 190, 130, 0, -34);
    if (this.detour.id === 'lakewood-jubilee') {
      this.box(g, 190, 1, 18, '#cbbd8c', 0, 1, 37);
      for (let i = 0; i < 12; i++) {
        const x = -65 + i * 12, z = 31 - this.rnd() * 14;
        const crab = this.sphere(g, 1.3, '#9b8760', x, 1.6, z, 0); crab.scale.set(1.4, .35, 1);
        for (const side of [-1, 1]) this.beam(g, [x + side, 1.5, z], [x + side * 3.4, 1.6, z + 1], .2, '#9b8760');
      }
      return 6;
    }
    for (let i = 0; i < 17; i++) this.box(g, 28, 1.8, 5.5, '#b7a27c', 0, 7, 50 - i * 6.3);
    for (const z of [-48, -16, 16, 44]) for (const x of [-16, 16]) this.cylinder(g, 1.6, 1.6, 16, '#927f5c', x, 8, z, 8);
    this.beam(g, [-16, 15, 44], [-16, 15, -48], .8, '#ded2aa'); this.beam(g, [16, 15, 44], [16, 15, -48], .8, '#ded2aa');
    if (this.detour.id === 'lakewood-porches') {
      this.box(g, 123, 4, 72, '#c8c09d', -19, 2.5, -96);
      const cottage = new THREE.Group(); cottage.position.set(-25, 3, -92); cottage.scale.setScalar(.86); this.house(cottage); g.add(cottage);
    } else {
      this.cylinder(g, 25, 25, 3, '#b7a27c', 0, 7, -62, 24);
      for (const x of [-16, 16]) for (const z of [-76, -48]) this.box(g, 2, 30, 2, '#d4ceb3', x, 22, z);
      this.cylinder(g, 0, 29, 15, '#749482', 0, 44, -62, 4).rotation.y = Math.PI / 4;
    }
    return 16;
  }

  boulders(g) {
    for (const [x, y, z, r, sy] of [[-30, 18, 0, 27, .8], [24, 23, -9, 32, .9], [6, 8, 25, 22, .55], [-13, 44, -13, 27, .55], [38, 9, 23, 17, .6]]) {
      const rock = this.sphere(g, r, this.rnd() > .5 ? '#a4aa91' : '#939e8a', x, y, z); rock.scale.set(1, sy, .85); rock.rotation.set(.1, this.rnd(), .13);
    }
    for (let i = 0; i < 7; i++) { const moss = this.sphere(g, 5, '#81915b', (this.rnd() - .5) * 80, 7 + this.rnd() * 13, 20); moss.scale.y = .25; }
    return 29;
  }

  birds(g) {
    for (let i = 0; i < 19; i++) this.box(g, 91, 1.7, 4, '#b3a17b', 0, 19, 38 - i * 4.3);
    for (const x of [-46, 46]) { this.beam(g, [x, 35, 38], [x, 35, -40], .9, '#858668'); for (const z of [36, 0, -38]) this.box(g, 1.8, 35, 1.8, '#858668', x, 17.5, z); }
    for (const [x, z, color] of [[-27, -21, '#a49976'], [0, -36, '#68796a'], [27, -17, '#9f8b67']]) {
      this.cylinder(g, 1.5, 1.8, 39, '#927f5d', x, 30, z, 8); this.beam(g, [x - 7, 49, z], [x + 7, 49, z], 1.2, '#927f5d');
      const body = this.sphere(g, 4.3, color, x, 55, z); body.scale.set(.8, 1.3, .8);
      this.sphere(g, 3, '#c5b997', x, 61, z + .5);
      for (const side of [-1, 1]) this.sphere(g, .55, '#e8d481', x + side * 1.2, 61, z + 3.2, 0);
      this.box(g, .7, 1.5, 1.2, '#927b55', x, 59.5, z + 3.6);
      const wing = this.sphere(g, 3, color, x + 3, 54, z); wing.scale.set(.45, 1.7, .7);
    }
    return 43;
  }

  heron(g, x, z) {
    this.beam(g, [x - 1, 1, z], [x - 1, 10, z], .25, '#b29f6f'); this.beam(g, [x + 1, 1, z], [x + 1, 10, z], .25, '#b29f6f');
    const body = this.sphere(g, 3.2, '#d6e0d4', x, 11, z); body.scale.set(.8, 1, 1.4);
    this.beam(g, [x, 13, z], [x, 21, z - 2], .65, '#d6e0d4'); this.sphere(g, 1.6, '#e6e7d5', x, 22, z - 2);
    this.beam(g, [x, 22, z - 3], [x, 21, z - 9], .35, '#c7a96b');
  }

  peanut(g) {
    this.cylinder(g, 23, 27, 5, '#c4bba0', 0, 2.5, 0, 24);
    const lower = this.sphere(g, 17, '#c5a06a', 0, 24, 0, 2); lower.scale.set(.77, 1.15, .73);
    const upper = this.sphere(g, 14, '#d2b078', 0, 48, 0, 2); upper.scale.set(.84, 1.02, .77);
    for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; this.beam(g, [Math.cos(a) * 10, 13, Math.sin(a) * 10], [Math.cos(a) * 11, 32, Math.sin(a) * 11], .45, '#a88757'); }
    this.cylinder(g, 12, 13, 8, '#668e91', 0, 63, 0, 16); this.cylinder(g, 18, 18, 1.5, '#739b99', 0, 59, 0, 24);
    this.box(g, 18, 7, 1.6, '#7b9d9c', 0, 36, 12);
    for (const x of [-4, 4]) this.sphere(g, 1.1, '#5f6856', x, 49, 11, 0);
    return 41;
  }

  wrightHouse(g) {
    this.box(g, 111, 3, 68, '#baac8a', 0, 1.5, 0);
    this.box(g, 97, 23, 47, '#b78d6a', 0, 15, -4);
    this.box(g, 116, 4, 62, '#637e70', 0, 29, -1);
    this.box(g, 54, 2, 31, '#7c8d72', 28, 34, -22);
    for (let i = 0; i < 8; i++) { this.box(g, 7.5, 16, 1, '#89ada5', -38 + i * 9, 16, 20); this.box(g, 1.1, 19, 1.5, '#987c53', -42 + i * 9, 16, 21); }
    this.box(g, 17, 37, 19, '#ad8061', 34, 19, -10);
    this.box(g, 44, 2, 20, '#c7b792', -28, 3, 36);
    return 23;
  }

  carnival(g) {
    this.box(g, 111, 3, 75, '#dbd3b5', 0, 1.5, 0);
    this.box(g, 111, 70, 3, '#d8c8aa', 0, 38, -36);
    for (const x of [-53, 53]) this.box(g, 3, x < 0 ? 18 : 70, 73, '#dcd1b7', x, x < 0 ? 12 : 38, 0);
    for (const [x, color] of [[-31, '#8f697c'], [0, '#71988b'], [31, '#af8870']]) {
      this.cylinder(g, 16, 18, 3, '#c4b28d', x, 4, -5, 24);
      this.cylinder(g, 4.5, 14, 35, color, x, 23, -5, 24);
      this.sphere(g, 5, color, x, 44, -5); this.box(g, 16, 3, 5, '#d6bb74', x, 44, -5);
      this.sphere(g, 3.5, '#c5b393', x, 52, -5);
      this.cylinder(g, 5, 4.5, 3, '#d7b76d', x, 57, -5, 10);
      for (let k = 0; k < 5; k++) this.cylinder(g, 0, 1, 4, '#e4c67b', x + Math.cos(k / 5 * TAU) * 4, 60, -5 + Math.sin(k / 5 * TAU) * 4, 4);
      this.beam(g, [x, 8, 8], [x, 40, 0], .65, '#e2c984');
    }
    this.box(g, 31, 24, 1, '#9a8a65', 0, 51, -33.9); this.box(g, 25, 18, 1.2, '#d3b875', 0, 51, -33.1);
    return 42;
  }

  furnaces(g) {
    this.box(g, 108, 5, 68, '#b8ad8e', 0, 2.5, 0);
    for (const x of [-25, 25]) {
      this.cylinder(g, 10, 16, 47, '#987d60', x, 28, -10, 16);
      this.cylinder(g, 8, 10, 18, '#a08a6b', x, 60, -10, 16);
      this.cylinder(g, 6, 7, 30, '#887d65', x, 84, -10, 16);
      this.cylinder(g, 7, 7, 3, '#bdad87', x, 100, -10, 16);
      this.beam(g, [x, 60, -10], [x, 60, 25], 5, '#9a8a6c', 12);
      this.cylinder(g, 5, 5, 56, '#a19476', x, 32, 25, 12);
      this.box(g, 21, 3, 28, '#778879', x, 48, -10);
      for (let i = 0; i < 10; i++) this.box(g, 5, .7, 1, '#b5b69a', x + 13, 9 + i * 5, 3);
    }
    this.box(g, 80, 3, 10, '#778879', 0, 70, -25);
    for (const x of [-43, 43]) { this.box(g, 2, 70, 2, '#6b7e70', x, 35, -25); this.beam(g, [x, 10, -25], [x > 0 ? 15 : -15, 65, -25], 1.1, '#6b7e70'); }
    return 58;
  }

  resize(width, height) {
    if (this.destroyed) return;
    this.width = Math.max(1, width); this.height = Math.max(1, height);
    this.renderer.setSize(this.width, this.height, false);
    const aspect = this.width / this.height;
    const span = aspect < .85 ? 205 / aspect : aspect < 1.2 ? 310 : 285;
    this.camera.left = -span * aspect / 2; this.camera.right = span * aspect / 2;
    this.camera.top = span / 2; this.camera.bottom = -span / 2;
    this.camera.updateProjectionMatrix(); this.camera.updateMatrixWorld();
    this.emitLayout();
  }

  worldToScreen({ x, z, height = 0, y }) {
    this.scratch.set(x, y ?? height, z).project(this.camera);
    return { x: (this.scratch.x + 1) * this.width / 2, y: (1 - this.scratch.y) * this.height / 2, visible: this.scratch.z > -1 && this.scratch.z < 1 && Math.abs(this.scratch.x) < 1 && Math.abs(this.scratch.y) < 1 };
  }

  getSpotPositions() {
    return [...this.spotModels.values()].map(({ spot, height }) => ({ id: spot.id, label: spot.label, ...this.worldToScreen({ x: spot.x || 0, z: spot.z || 0, height }) }));
  }

  emitLayout() { this.onLayout?.(this.getSpotPositions()); }

  setFoundIds(ids) {
    this.foundIds = new Set(ids);
    for (const { spot, item, glint } of this.spotModels.values()) {
      const found = this.foundIds.has(spot.id);
      if (item && spot.collectible) item.visible = !found;
      glint.visible = !found;
    }
    this.renderer.shadowMap.needsUpdate = true;
  }

  inspectAt(event) {
    const press = this.press; this.press = null;
    if (!press || Math.hypot(event.clientX - press.x, event.clientY - press.y) > 8) return;
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.set((event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects([...this.spotModels.values()].map(item => item.group), true);
    for (const hit of hits) {
      let object = hit.object;
      while (object && !object.userData.spotId) object = object.parent;
      if (object) { this.onInspect?.(object.userData.spotId); return; }
    }
  }

  render(time = 0) {
    if (this.destroyed) return;
    for (const { glint, height, spot } of this.spotModels.values()) {
      if (!glint.visible) continue;
      const phase = time / 800 + hash(spot.id) % 20;
      glint.position.y = height + 2.5 + (this.reduceMotion ? 0 : Math.sin(phase) * .65);
      glint.scale.setScalar(this.reduceMotion ? 1 : .86 + Math.sin(phase) * .14);
    }
    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true; cancelAnimationFrame(this.frame); this.controller.abort(); this.resizeObserver.disconnect();
    const resources = new Set();
    this.scene.traverse(object => {
      if (object.geometry) resources.add(object.geometry);
      if (object.material) for (const material of Array.isArray(object.material) ? object.material : [object.material]) { resources.add(material); if (material.map) resources.add(material.map); }
    });
    for (const resource of resources) resource.dispose();
    this.renderer.dispose(); this.renderer.forceContextLoss();
  }
}
