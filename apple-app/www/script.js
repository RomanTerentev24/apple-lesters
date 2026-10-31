import * as THREE from 'three';

    // ============ АУДИО ДВИЖОК ============
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;
    let masterVolume = 0.5;

    function initAudio() {
        if (!audioCtx) audioCtx = new AudioContext();
        if (audioCtx.state === 'suspended') audioCtx.resume();
    }

    function playSound(type) {
        if (!audioCtx || masterVolume === 0) return;
        const now = audioCtx.currentTime;
        const gain = audioCtx.createGain();
        gain.connect(audioCtx.destination);
        gain.gain.value = masterVolume;

        if (type === 'shoot') {
            const osc = audioCtx.createOscillator(); const oscGain = audioCtx.createGain();
            osc.type = 'sine'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);
            oscGain.gain.setValueAtTime(0.8, now); oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
            osc.connect(oscGain); oscGain.connect(gain); osc.start(now); osc.stop(now + 0.1);

            const bufferSize = audioCtx.sampleRate * 0.1;
            const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
            const noise = audioCtx.createBufferSource(); noise.buffer = buffer;
            const noiseGain = audioCtx.createGain(); noiseGain.gain.setValueAtTime(0.5, now); noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            noise.connect(noiseGain); noiseGain.connect(gain); noise.start(now);
        } 
        else if (type === 'hit_head') {
            const osc = audioCtx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.05);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.05);
        }
        else if (type === 'hit_body') {
            const osc = audioCtx.createOscillator(); osc.type = 'triangle'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(200, now + 0.05);
            gain.gain.setValueAtTime(0.3, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.05);
        }
        else if (type === 'empty') {
            const osc = audioCtx.createOscillator(); osc.type = 'square'; osc.frequency.setValueAtTime(200, now);
            gain.gain.setValueAtTime(0.2, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.03);
            osc.connect(gain); osc.start(now); osc.stop(now + 0.03);
        }
        else if (type === 'reload') {
            const playClick = (delay) => {
                const osc = audioCtx.createOscillator(); const g = audioCtx.createGain();
                osc.type = 'square'; osc.frequency.setValueAtTime(300, now + delay);
                g.gain.setValueAtTime(0.2, now + delay); g.gain.exponentialRampToValueAtTime(0.01, now + delay + 0.05);
                osc.connect(g); g.connect(gain); osc.start(now + delay); osc.stop(now + delay + 0.05);
            };
            playClick(0); playClick(0.2);
        }
    }

    // ============ РЕНДЕРЕР И СЦЕНА ============
    const canvas = document.getElementById('game-canvas');
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.autoClear = false;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 20, 60);

    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 200);
    camera.position.set(0, 1.6, 8); camera.rotation.order = 'YXZ';

    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(15, 30, 10); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -30; sun.shadow.camera.right = 30; sun.shadow.camera.top = 30; sun.shadow.camera.bottom = -30;
    scene.add(sun);

    const floor = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshStandardMaterial({ color: 0x556655 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);

    const grid = new THREE.GridHelper(60, 60, 0x224422, 0x224422); grid.position.y = 0.01; scene.add(grid);

    const wallMat = new THREE.MeshStandardMaterial({ color: 0x888888 });
    function addWall(x, z, w, h, d) {
        const wall = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), wallMat);
        wall.position.set(x, h / 2, z); wall.castShadow = true; wall.receiveShadow = true; scene.add(wall);
    }
    addWall(0, -25, 60, 4, 1); addWall(0,  25, 60, 4, 1); addWall(-25, 0, 1, 4, 60); addWall( 25, 0, 1, 4, 60);
    addWall(-8, 5, 4, 2.5, 4); addWall( 8, 5, 4, 2.5, 4); addWall( 0, -8, 6, 3, 2);

    // ============ ОРУЖИЕ ============
    const weaponScene = new THREE.Scene();
    const weaponCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 10);
    weaponScene.add(new THREE.AmbientLight(0xffffff, 0.9));
    const wl = new THREE.DirectionalLight(0xffffff, 2.5); wl.position.set(2, 3, 2); weaponScene.add(wl);
    const wl2 = new THREE.DirectionalLight(0xaaccff, 1.0); wl2.position.set(-2, 1, -1); weaponScene.add(wl2);

    function buildRifle() {
        const g = new THREE.Group();
        const matMetal = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.8, roughness: 0.4 });
        const matPolymer = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, metalness: 0.1, roughness: 0.7 });
        const matDark = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, metalness: 0.5, roughness: 0.5 });

        const receiver = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.08, 0.32), matMetal); g.add(receiver);
        const handguard = new THREE.Mesh(new THREE.BoxGeometry(0.042, 0.06, 0.24), matPolymer); handguard.position.set(0, 0.01, -0.28); g.add(handguard);
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.25, 12), matDark); barrel.rotation.x = Math.PI / 2; barrel.position.set(0, 0.015, -0.45); g.add(barrel);
        const muzzle = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.05, 12), matMetal); muzzle.rotation.x = Math.PI / 2; muzzle.position.set(0, 0.015, -0.58); g.add(muzzle);
        const bufferTube = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.18, 12), matMetal); bufferTube.rotation.x = Math.PI / 2; bufferTube.position.set(0, 0.01, 0.23); g.add(bufferTube);
        const stock = new THREE.Mesh(new THREE.BoxGeometry(0.045, 0.09, 0.14), matPolymer); stock.position.set(0, -0.005, 0.3); g.add(stock);
        const grip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.1, 0.05), matPolymer); grip.position.set(0, -0.08, 0.08); grip.rotation.x = 0.3; g.add(grip);
        const mag = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.05), matPolymer); mag.position.set(0, -0.1, -0.05); mag.rotation.x = 0.15; g.add(mag);
        const rail = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.01, 0.45), matDark); rail.position.set(0, 0.045, -0.1); g.add(rail);
        const frontSight = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.015), matMetal); frontSight.position.set(0, 0.065, -0.35); g.add(frontSight);
        const rearSight = new THREE.Mesh(new THREE.BoxGeometry(0.025, 0.02, 0.015), matMetal); rearSight.position.set(0, 0.06, 0.05); g.add(rearSight);

        const flashMat = new THREE.MeshBasicMaterial({ color: 0xffdd44, transparent: true, opacity: 0, depthWrite: false });
        const flash = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 8), flashMat); flash.position.set(0, 0.015, -0.62); g.add(flash); g.userData.flash = flash;
        const muzzleLight = new THREE.PointLight(0xffaa00, 0, 2); muzzleLight.position.set(0, 0.015, -0.62); g.add(muzzleLight); g.userData.muzzleLight = muzzleLight;
        return g;
    }

    const weapon = buildRifle();
    weapon.position.set(0.14, -0.16, -0.45); weapon.rotation.y = 0.04; weaponScene.add(weapon);
    const weaponBasePos  = weapon.position.clone(); const weaponBaseRotX = weapon.rotation.x;

    // ============ МИШЕНИ ============
    const targets = []; const RESPAWN_DELAY = 2000; const PLAY_RADIUS = 20; const MIN_DIST_FROM_PLAYER = 6;

    function createTargetMesh() {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 16), new THREE.MeshStandardMaterial({ color: 0xff3333 }));
        body.position.y = 0.8; body.castShadow = true; body.userData.part = 'body';
        const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 16, 16), new THREE.MeshStandardMaterial({ color: 0xffcc00 }));
        head.position.y = 1.9; head.castShadow = true; head.userData.part = 'head';
        group.add(body, head); group.userData.isTarget = true; group.userData.health = 3; group.userData.meshes = [body, head];
        body.userData.targetGroup = group; head.userData.targetGroup = group;
        return group;
    }

    function findSpawnPoint() {
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = MIN_DIST_FROM_PLAYER + Math.random() * (PLAY_RADIUS - MIN_DIST_FROM_PLAYER);
            const x = camera.position.x + Math.cos(angle) * dist; const z = camera.position.z + Math.sin(angle) * dist;
            if (x > -22 && x < 22 && z > -22 && z < 22) return { x, z };
        }
        return { x: (Math.random() - 0.5) * 30, z: -15 };
    }

    function spawnTarget(x, z) {
        const t = createTargetMesh(); t.position.set(x, 0, z); scene.add(t); targets.push(t);
        t.scale.set(0.01, 0.01, 0.01); t.userData.spawnAnim = 0; return t;
    }

    spawnTarget(-6, -15); spawnTarget( 6, -15); spawnTarget( 0, -18); spawnTarget(-12, -10); spawnTarget( 12, -10);

    function destroyTarget(group) {
        group.userData.meshes.forEach(m => m.material.color.set(0x00ff00));
        const start = performance.now(); const startScale = group.scale.x;
        function shrink() {
            const t = Math.min((performance.now() - start) / 200, 1); const s = startScale * (1 - t); group.scale.set(s, s, s);
            if (t < 1) requestAnimationFrame(shrink);
            else {
                scene.remove(group); const idx = targets.indexOf(group); if (idx > -1) targets.splice(idx, 1);
                setTimeout(() => { const p = findSpawnPoint(); spawnTarget(p.x, p.z); }, RESPAWN_DELAY);
            }
        }
        shrink();
    }

    // ============ СОСТОЯНИЕ ============
    let isPlaying = false; let isCustomizing = false; let yaw = 0, pitch = 0;
    const PITCH_LIMIT = Math.PI / 2 - 0.05; const MOVE_SPEED = 0.12;
    let recoilPitch = 0; let recoilYaw = 0; let weaponKick = 0;
    let reloadStartTime = 0; let reloadAnimTilt = 0; let reloadAnimDrop = 0;
    const weaponState = { ammo: 30, maxAmmo: 30, fireRate: 95, reloading: false, reloadTime: 1500, lastShot: 0 };
    let isFiring = false;

    // ============ УПРАВЛЕНИЕ ============
    const joyZone = document.getElementById('joystick-zone'); const joyKnob = document.getElementById('joystick-knob');
    const joyMove = { x: 0, y: 0 }; let joyTouchId = null; let joyCenter = { x: 0, y: 0 }; const JOY_RADIUS = 50;

    joyZone.addEventListener('touchstart', (e) => {
        if (isCustomizing) return; e.preventDefault(); const t = e.changedTouches[0]; joyTouchId = t.identifier;
        const rect = joyZone.getBoundingClientRect(); joyCenter.x = rect.left + rect.width / 2; joyCenter.y = rect.top + rect.height / 2;
    }, { passive: false });

    joyZone.addEventListener('touchmove', (e) => {
        if (isCustomizing) return; e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier !== joyTouchId) continue;
            let dx = t.clientX - joyCenter.x; let dy = t.clientY - joyCenter.y;
            const len = Math.hypot(dx, dy);
            if (len > JOY_RADIUS) { dx = dx / len * JOY_RADIUS; dy = dy / len * JOY_RADIUS; }
            joyKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            joyMove.x = dx / JOY_RADIUS; joyMove.y = dy / JOY_RADIUS;
        }
    }, { passive: false });

    joyZone.addEventListener('touchend', (e) => {
        for (const t of e.changedTouches) {
            if (t.identifier === joyTouchId) { joyTouchId = null; joyMove.x = 0; joyMove.y = 0; joyKnob.style.transform = 'translate(-50%, -50%)'; }
        }
    });

    const lookZone = document.getElementById('look-zone'); let lookTouchId = null; let lastLook = { x: 0, y: 0 }; const LOOK_SENS = 0.005;
    lookZone.addEventListener('touchstart', (e) => {
        if (isCustomizing) return; e.preventDefault(); const t = e.changedTouches[0];
        if (lookTouchId === null) { lookTouchId = t.identifier; lastLook.x = t.clientX; lastLook.y = t.clientY; }
    }, { passive: false });

    lookZone.addEventListener('touchmove', (e) => {
        if (isCustomizing) return; e.preventDefault();
        for (const t of e.changedTouches) {
            if (t.identifier !== lookTouchId) continue;
            const dx = t.clientX - lastLook.x; const dy = t.clientY - lastLook.y;
            lastLook.x = t.clientX; lastLook.y = t.clientY;
            yaw -= dx * LOOK_SENS; pitch -= dy * LOOK_SENS; pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
        }
    }, { passive: false });

    lookZone.addEventListener('touchend', (e) => {
        for (const t of e.changedTouches) if (t.identifier === lookTouchId) lookTouchId = null;
    });

    // ============ СТРЕЛЬБА ============
    const raycaster = new THREE.Raycaster(); const screenCenter = new THREE.Vector2(0, 0);
    const fireBtn = document.getElementById('fire-button'); const scoreEl = document.getElementById('score');
    const ammoEl = document.getElementById('ammo'); const ammoCurrentEl = document.getElementById('ammo-current');
    let score = 0;

    function updateAmmoUI() { ammoCurrentEl.textContent = weaponState.reloading ? 'RELOAD' : weaponState.ammo; ammoEl.classList.toggle('reloading', weaponState.reloading); }
    function updateScoreUI() { scoreEl.textContent = 'Попаданий: ' + score; }

    function startReload() {
        if (weaponState.reloading || weaponState.ammo === weaponState.maxAmmo) return;
        weaponState.reloading = true; reloadStartTime = performance.now(); playSound('reload'); updateAmmoUI();
        setTimeout(() => { weaponState.ammo = weaponState.maxAmmo; weaponState.reloading = false; updateAmmoUI(); }, weaponState.reloadTime);
    }

    function applyRecoil() { recoilPitch += 0.018 + Math.random() * 0.008; recoilYaw += (Math.random() - 0.5) * 0.012; weaponKick = 1; }

    function showMuzzleFlash() {
        const flash = weapon.userData.flash; const light = weapon.userData.muzzleLight;
        flash.material.opacity = 1; flash.scale.setScalar(0.8 + Math.random() * 0.5); light.intensity = 2;
        setTimeout(() => { flash.material.opacity = 0; light.intensity = 0; }, 50);
    }

    function tryShoot() {
        if (!isPlaying || isCustomizing || weaponState.reloading) return;
        if (weaponState.ammo <= 0) { playSound('empty'); startReload(); return; }
        const now = performance.now();
        if (now - weaponState.lastShot < weaponState.fireRate) return;
        weaponState.lastShot = now; weaponState.ammo--; updateAmmoUI();
        applyRecoil(); showMuzzleFlash(); playSound('shoot');

        raycaster.setFromCamera(screenCenter, camera); raycaster.far = 100;
        const allMeshes = []; targets.forEach(g => allMeshes.push(...g.userData.meshes));
        const hits = raycaster.intersectObjects(allMeshes);

        if (hits.length > 0) {
            const hit = hits[0].object; const group = hit.userData.targetGroup; const part = hit.userData.part;
            if (group && group.parent) {
                const damage = (part === 'head') ? 3 : 1;
                group.userData.health -= damage; playSound(part === 'head' ? 'hit_head' : 'hit_body');
                if (group.userData.health <= 0) { score++; updateScoreUI(); destroyTarget(group); }
                else {
                    const origColor = hit.material.color.getHex(); hit.material.color.setHex(0x00ff00);
                    setTimeout(() => { if (hit.material) hit.material.color.setHex(origColor); }, 100);
                }
            }
        }
        if (weaponState.ammo === 0) startReload();
    }

    fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (!isFiring && !isCustomizing) { isFiring = true; tryShoot(); } }, { passive: false });
    fireBtn.addEventListener('touchend', () => { isFiring = false; }); fireBtn.addEventListener('touchcancel', () => { isFiring = false; });
    fireBtn.addEventListener('mousedown', (e) => { e.preventDefault(); if (!isFiring && !isCustomizing) { isFiring = true; tryShoot(); } });
    fireBtn.addEventListener('mouseup', () => { isFiring = false; }); fireBtn.addEventListener('mouseleave', () => { isFiring = false; });

    ammoEl.style.pointerEvents = 'auto'; ammoEl.style.cursor = 'pointer';
    ammoEl.addEventListener('touchstart', (e) => { e.preventDefault(); if(!isCustomizing) startReload(); }, { passive: false });
    ammoEl.addEventListener('click', () => { if(!isCustomizing) startReload(); });

    // ============ МЕНЮ И НАСТРОЙКИ ============
    const mainMenu = document.getElementById('main-menu'); const settingsMenu = document.getElementById('settings-menu');
    const pauseMenu = document.getElementById('pause-menu'); const customizePanel = document.getElementById('customize-panel');
    const pauseBtn = document.getElementById('pause-btn'); const crosshair = document.getElementById('crosshair');

    function showUI(show) {
        [pauseBtn, joyZone, fireBtn, lookZone, scoreEl, ammoEl].forEach(el => el.classList.toggle('hidden', !show));
        crosshair.classList.toggle('hidden', !show);
    }

    document.getElementById('play-btn').addEventListener('click', () => {
        initAudio(); mainMenu.classList.add('hidden'); showUI(true); isPlaying = true; updateAmmoUI();
    });

    document.getElementById('settings-btn').addEventListener('click', () => {
        mainMenu.classList.add('hidden'); settingsMenu.classList.remove('hidden');
    });

    document.getElementById('back-to-main-btn').addEventListener('click', () => {
        settingsMenu.classList.add('hidden'); mainMenu.classList.remove('hidden');
    });

    pauseBtn.addEventListener('click', () => {
        isPlaying = false; isFiring = false; showUI(false); pauseMenu.classList.remove('hidden');
    });

    document.getElementById('resume-btn').addEventListener('click', () => {
        pauseMenu.classList.add('hidden'); showUI(true); isPlaying = true;
    });

    document.getElementById('exit-btn').addEventListener('click', () => {
        pauseMenu.classList.add('hidden'); mainMenu.classList.remove('hidden');
        isPlaying = false; isFiring = false;
        camera.position.set(0, 1.6, 8); yaw = 0; pitch = 0; recoilPitch = 0; recoilYaw = 0; weaponKick = 0; score = 0;
        weaponState.ammo = weaponState.maxAmmo; weaponState.reloading = false;
        updateScoreUI(); updateAmmoUI();
    });

    document.getElementById('graphics-select').addEventListener('change', (e) => {
        const high = e.target.value === 'high';
        renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 2) : 1);
        renderer.shadowMap.enabled = high;
        scene.traverse(o => { if (o.isMesh) o.castShadow = o.receiveShadow = high; });
        sun.castShadow = high; localStorage.setItem('graphicsSetting', e.target.value);
    });

    document.getElementById('volume-slider').addEventListener('input', (e) => {
        masterVolume = parseFloat(e.target.value); localStorage.setItem('volumeSetting', masterVolume);
    });

    // ============ КАСТОМИЗАЦИЯ UI ============
    const uiElements = document.querySelectorAll('.ui-element');
    const uiOpacitySlider = document.getElementById('ui-opacity'); const uiScaleSlider = document.getElementById('ui-scale');
    const togglePanelBtn = document.getElementById('toggle-panel-btn');

    // Кнопка сворачивания панели
    togglePanelBtn.addEventListener('click', () => {
        customizePanel.classList.toggle('collapsed');
        if (customizePanel.classList.contains('collapsed')) {
            togglePanelBtn.textContent = 'Развернуть ▲';
        } else {
            togglePanelBtn.textContent = 'Свернуть ▼';
        }
    });

    function loadUIState() {
        const savedScale = localStorage.getItem('uiScale') || 1; const savedOpacity = localStorage.getItem('uiOpacity') || 1;
        uiScaleSlider.value = savedScale; uiOpacitySlider.value = savedOpacity;
        applyUIState(savedScale, savedOpacity);
        uiElements.forEach(el => {
            const savedPos = localStorage.getItem(`pos_${el.id}`);
            if (savedPos) {
                const pos = JSON.parse(savedPos); el.style.left = pos.left; el.style.top = pos.top;
                el.style.bottom = 'auto'; el.style.right = 'auto'; el.style.transform = 'none';
            }
        });
    }

    function applyUIState(scale, opacity) {
        uiElements.forEach(el => {
            el.style.opacity = opacity;
            let baseTransform = ''; if (el.id === 'ammo') baseTransform = 'translateX(-50%) ';
            el.style.transform = `${baseTransform}scale(${scale})`;
        });
    }

    uiScaleSlider.addEventListener('input', (e) => applyUIState(e.target.value, uiOpacitySlider.value));
    uiOpacitySlider.addEventListener('input', (e) => applyUIState(uiScaleSlider.value, e.target.value));

    // Перетаскивание (Drag & Drop)
    function makeDraggable(el) {
        let isDragging = false; let startX, startY, elStartX, elStartY;

        const onPointerDown = (e) => {
            if (!isCustomizing) return;
            isDragging = true;
            startX = e.clientX; startY = e.clientY;
            const rect = el.getBoundingClientRect();
            elStartX = rect.left; elStartY = rect.top;
            
            el.style.bottom = 'auto'; el.style.right = 'auto'; el.style.transform = 'none';
            el.style.left = `${elStartX}px`; el.style.top = `${elStartY}px`;
            
            // Поднимаем элемент над панелью при перетаскивании
            el.classList.add('dragging');
            
            el.setPointerCapture(e.pointerId); e.stopPropagation();
        };

        const onPointerMove = (e) => {
            if (!isDragging) return;
            const dx = e.clientX - startX; const dy = e.clientY - startY;
            el.style.left = `${elStartX + dx}px`; el.style.top = `${elStartY + dy}px`;
            e.preventDefault();
        };

        const onPointerUp = (e) => {
            if (!isDragging) return;
            isDragging = false;
            // Возвращаем z-index обратно
            el.classList.remove('dragging');
            el.releasePointerCapture(e.pointerId);
        };

        el.addEventListener('pointerdown', onPointerDown);
        el.addEventListener('pointermove', onPointerMove);
        el.addEventListener('pointerup', onPointerUp);
        el.addEventListener('pointercancel', onPointerUp);
    }

    uiElements.forEach(makeDraggable);

    document.getElementById('customize-btn').addEventListener('click', () => {
        settingsMenu.classList.add('hidden');
        isCustomizing = true;
        showUI(true); 
        customizePanel.classList.remove('hidden');
        customizePanel.classList.remove('collapsed'); // Сбрасываем свернутость при входе
        togglePanelBtn.textContent = 'Свернуть ▼';
        crosshair.classList.add('hidden'); 
        document.body.classList.add('customizing');
        isPlaying = false; 
    });

    document.getElementById('save-customize-btn').addEventListener('click', () => {
        uiElements.forEach(el => {
            localStorage.setItem(`pos_${el.id}`, JSON.stringify({ left: el.style.left, top: el.style.top }));
        });
        localStorage.setItem('uiScale', uiScaleSlider.value); localStorage.setItem('uiOpacity', uiOpacitySlider.value);

        isCustomizing = false;
        customizePanel.classList.add('hidden');
        document.body.classList.remove('customizing');
        showUI(false); mainMenu.classList.remove('hidden');
        applyUIState(uiScaleSlider.value, uiOpacitySlider.value);
    });

    loadUIState();

    // ============ ЦИКЛ ============
    function animate() {
        requestAnimationFrame(animate);

        if (isPlaying && !isCustomizing) {
            if (isFiring) { const now = performance.now(); if (now - weaponState.lastShot >= weaponState.fireRate) tryShoot(); }
            recoilPitch *= 0.88; recoilYaw *= 0.88; weaponKick *= 0.82;
            if (weaponState.reloading) {
                const elapsed = performance.now() - reloadStartTime; const progress = Math.min(elapsed / weaponState.reloadTime, 1);
                const curve = Math.sin(progress * Math.PI); reloadAnimTilt = -curve * 0.8; reloadAnimDrop = -curve * 0.15;
            } else { reloadAnimTilt = 0; reloadAnimDrop = 0; }

            camera.rotation.y = yaw + recoilYaw;
            camera.rotation.x = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch + recoilPitch));

            const forward = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
            const right   = new THREE.Vector3( Math.cos(yaw), 0, -Math.sin(yaw));
            const move = new THREE.Vector3(); move.addScaledVector(forward, -joyMove.y); move.addScaledVector(right, joyMove.x);
            if (move.lengthSq() > 0) { move.normalize().multiplyScalar(MOVE_SPEED); camera.position.add(move); }
            camera.position.x = Math.max(-24, Math.min(24, camera.position.x)); camera.position.z = Math.max(-24, Math.min(24, camera.position.z)); camera.position.y = 1.6;

            for (const t of targets) {
                if (t.userData.spawnAnim !== undefined && t.userData.spawnAnim < 1) {
                    t.userData.spawnAnim = Math.min(t.userData.spawnAnim + 0.08, 1); const s = t.userData.spawnAnim; t.scale.set(s, s, s);
                }
            }

            weapon.position.copy(weaponBasePos); weapon.position.z += weaponKick * 0.05; weapon.position.y += (weaponKick * 0.02) + reloadAnimDrop; 
            weapon.rotation.x = weaponBaseRotX + (weaponKick * 0.12) + reloadAnimTilt;
            const speed2D = Math.hypot(joyMove.x, joyMove.y);
            if (speed2D > 0.1) { const bobT = performance.now() * 0.008; weapon.position.x += Math.sin(bobT) * 0.008 * speed2D; weapon.position.y += Math.sin(bobT * 2) * 0.006 * speed2D; }
        }

        renderer.clear(); renderer.render(scene, camera);
        if (isPlaying || isCustomizing) { renderer.clearDepth(); renderer.render(weaponScene, weaponCamera); }
    }
    animate();

    window.addEventListener('resize', () => {
        const w = window.innerWidth, h = window.innerHeight;
        camera.aspect = w / h; camera.updateProjectionMatrix(); weaponCamera.aspect = w / h; weaponCamera.updateProjectionMatrix(); renderer.setSize(w, h);
    });