import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { RefereeKitColor } from '../game/rules';

interface Referee3DShowcaseProps {
  kitColor: RefereeKitColor;
  activeCard?: 'none' | 'yellow' | 'red' | 'both';
}

export const Referee3DShowcase: React.FC<Referee3DShowcaseProps> = ({
  kitColor,
  activeCard = 'both',
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const kitColorRef = useRef<RefereeKitColor>(kitColor);
  const activeCardRef = useRef(activeCard);
  const accentMatRef = useRef<THREE.MeshStandardMaterial | null>(null);

  useEffect(() => {
    kitColorRef.current = kitColor;
    if (accentMatRef.current) {
      const hex =
        kitColor === 'cyber_pink'
          ? 0xf43f5e
          : kitColor === 'classic_black'
          ? 0xfbbf24
          : 0xd9f99d;
      accentMatRef.current.color.setHex(hex);
      accentMatRef.current.emissive.setHex(hex);
    }
  }, [kitColor]);

  useEffect(() => {
    activeCardRef.current = activeCard;
  }, [activeCard]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 180;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090e18);

    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 50);
    camera.position.set(0, 0.9, 5.2);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: isHeadless,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isHeadless ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced warm/cool studio lighting
    const hemiLight = new THREE.HemisphereLight(0x93c5fd, 0x0f172a, 0.9);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfffbeb, 2.2);
    keyLight.position.set(4, 6, 5);
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 1.4);
    rimLight.position.set(-4, 2, -4);
    scene.add(rimLight);

    // Root showcase group
    const rootGroup = new THREE.Group();
    scene.add(rootGroup);

    // 1. Multi-part Metallic Referee Pea-Whistle (8 distinct parts)
    const whistleGroup = new THREE.Group();
    whistleGroup.position.set(-0.25, 0.05, 0.2);
    rootGroup.add(whistleGroup);

    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.92,
      roughness: 0.14,
    });

    const darkChamberMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.4,
      roughness: 0.65,
    });

    const initialAccentHex =
      kitColorRef.current === 'cyber_pink'
        ? 0xf43f5e
        : kitColorRef.current === 'classic_black'
        ? 0xfbbf24
        : 0xd9f99d;

    const accentMat = new THREE.MeshStandardMaterial({
      color: initialAccentHex,
      emissive: initialAccentHex,
      emissiveIntensity: 0.2,
      metalness: 0.5,
      roughness: 0.3,
    });
    accentMatRef.current = accentMat;

    // Part 1: Main cylindrical resonance barrel
    const barrelGeo = new THREE.CylinderGeometry(0.48, 0.48, 0.52, 32);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMesh = new THREE.Mesh(barrelGeo, chromeMat);
    whistleGroup.add(barrelMesh);

    // Part 2 & 3: Raised side bezel rings
    const ringGeo = new THREE.TorusGeometry(0.48, 0.045, 16, 32);
    const frontRing = new THREE.Mesh(ringGeo, accentMat);
    frontRing.position.z = 0.26;
    whistleGroup.add(frontRing);

    const backRing = new THREE.Mesh(ringGeo, accentMat);
    backRing.position.z = -0.26;
    whistleGroup.add(backRing);

    // Part 4: Sound window cutout chamber
    const windowGeo = new THREE.BoxGeometry(0.42, 0.35, 0.48);
    const windowMesh = new THREE.Mesh(windowGeo, darkChamberMat);
    windowMesh.position.set(0.26, 0.25, 0);
    whistleGroup.add(windowMesh);

    // Part 5: Tapered mouthpiece beak
    const beakGeo = new THREE.BoxGeometry(0.75, 0.28, 0.44);
    const beakMesh = new THREE.Mesh(beakGeo, chromeMat);
    beakMesh.position.set(0.58, 0.18, 0);
    beakMesh.rotation.z = 0.12;
    whistleGroup.add(beakMesh);

    // Part 6: Mouthpiece cushioned grip tip
    const gripGeo = new THREE.BoxGeometry(0.28, 0.32, 0.46);
    const gripMesh = new THREE.Mesh(gripGeo, accentMat);
    gripMesh.position.set(0.84, 0.21, 0);
    gripMesh.rotation.z = 0.12;
    whistleGroup.add(gripMesh);

    // Part 7: Internal Golden Cork Pea
    const peaGeo = new THREE.SphereGeometry(0.16, 16, 16);
    const peaMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      roughness: 0.7,
      metalness: 0.1,
    });
    const peaMesh = new THREE.Mesh(peaGeo, peaMat);
    peaMesh.position.set(0.1, 0.12, 0);
    whistleGroup.add(peaMesh);

    // Part 8: Rear lanyard bail ring
    const bailGeo = new THREE.TorusGeometry(0.18, 0.04, 14, 28);
    const bailMesh = new THREE.Mesh(bailGeo, chromeMat);
    bailMesh.position.set(-0.58, 0, 0);
    whistleGroup.add(bailMesh);

    // 2. Floating Yellow & Red Disciplinary Cards
    const cardShape = new THREE.Shape();
    const cw = 0.72;
    const ch = 1.05;
    const cr = 0.08;
    cardShape.moveTo(-cw / 2 + cr, -ch / 2);
    cardShape.lineTo(cw / 2 - cr, -ch / 2);
    cardShape.quadraticCurveTo(cw / 2, -ch / 2, cw / 2, -ch / 2 + cr);
    cardShape.lineTo(cw / 2, ch / 2 - cr);
    cardShape.quadraticCurveTo(cw / 2, ch / 2, cw / 2 - cr, ch / 2);
    cardShape.lineTo(-cw / 2 + cr, ch / 2);
    cardShape.quadraticCurveTo(-cw / 2, ch / 2, -cw / 2, ch / 2 - cr);
    cardShape.lineTo(-cw / 2, -ch / 2 + cr);
    cardShape.quadraticCurveTo(-cw / 2, -ch / 2, -cw / 2 + cr, -ch / 2);

    const cardExtrude = new THREE.ExtrudeGeometry(cardShape, {
      depth: 0.035,
      bevelEnabled: true,
      bevelThickness: 0.01,
      bevelSize: 0.01,
      bevelSegments: 2,
    });

    const yellowCardMat = new THREE.MeshStandardMaterial({
      color: 0xfacc15,
      emissive: 0xca8a04,
      emissiveIntensity: 0.18,
      roughness: 0.22,
      metalness: 0.15,
    });
    const yellowCard = new THREE.Mesh(cardExtrude, yellowCardMat);
    yellowCard.position.set(-1.35, 0.12, -0.35);
    yellowCard.rotation.set(0.08, 0.35, 0.18);
    rootGroup.add(yellowCard);

    const redCardMat = new THREE.MeshStandardMaterial({
      color: 0xef4444,
      emissive: 0x991b1b,
      emissiveIntensity: 0.22,
      roughness: 0.22,
      metalness: 0.15,
    });
    const redCard = new THREE.Mesh(cardExtrude, redCardMat);
    redCard.position.set(1.25, 0.12, -0.25);
    redCard.rotation.set(0.06, -0.38, -0.16);
    rootGroup.add(redCard);

    // Contact shadow disc beneath props
    const shadowGeo = new THREE.CircleGeometry(2.1, 32);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x020617,
      transparent: true,
      opacity: 0.55,
      depthWrite: false,
    });
    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.position.y = -0.78;
    scene.add(shadowMesh);

    renderer.compile(scene, camera);

    const clock = new THREE.Clock();
    let rafId = 0;
    let lastRenderTime = 0;

    const animate = (nowMs: number) => {
      rafId = requestAnimationFrame(animate);
      if (isHeadless && nowMs - lastRenderTime < 66) {
        return; // Throttle to ~15 FPS in headless CPU rendering
      }
      lastRenderTime = nowMs;

      const elapsed = clock.getElapsedTime();
      whistleGroup.rotation.y = elapsed * 0.65;
      whistleGroup.rotation.z = Math.sin(elapsed * 1.5) * 0.08;
      whistleGroup.position.y = 0.05 + Math.sin(elapsed * 2.0) * 0.05;

      peaMesh.position.y = 0.12 + Math.abs(Math.sin(elapsed * 6.0)) * 0.08;

      yellowCard.position.y = 0.12 + Math.sin(elapsed * 1.8 + 1.0) * 0.06;
      yellowCard.rotation.y = 0.35 + Math.sin(elapsed * 0.9) * 0.12;

      redCard.position.y = 0.12 + Math.cos(elapsed * 1.8) * 0.06;
      redCard.rotation.y = -0.38 + Math.cos(elapsed * 0.9) * 0.12;

      renderer.render(scene, camera);
    };

    rafId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth || 320;
      const h = container.clientHeight || 180;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handleResize);
      barrelGeo.dispose();
      ringGeo.dispose();
      windowGeo.dispose();
      beakGeo.dispose();
      gripGeo.dispose();
      peaGeo.dispose();
      bailGeo.dispose();
      cardExtrude.dispose();
      shadowGeo.dispose();
      chromeMat.dispose();
      darkChamberMat.dispose();
      accentMat.dispose();
      yellowCardMat.dispose();
      redCardMat.dispose();
      shadowMat.dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-40 rounded-lg overflow-hidden border border-slate-800 bg-[#090E18]">
      <div
        ref={mountRef}
        data-testid="referee-3d-canvas"
        className="w-full h-full"
        aria-label="3D metallic referee whistle and disciplinary cards"
      />
      <div className="pointer-events-none absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
        <span>3D KIT INSPECTOR · PBR WHISTLE &amp; CARDS</span>
        <span className="text-amber-400 uppercase">{kitColor.replace('_', ' ')}</span>
      </div>
    </div>
  );
};
