/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useRef, useEffect } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { gameActionAtom } from "~/atoms/gameActionAtom";
import { ACTION } from "~/utilities/useModel";

export default function Game() {
  const gameAction = useRecoilValue(gameActionAtom);
  console.log("Game Action: ", gameAction); // Log current game action

  const mountRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const walkActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.log("Mount ref is not available.");
      return;
    }

    if (!rendererRef.current) {
      rendererRef.current = new THREE.WebGLRenderer({ antialias: true });
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      rendererRef.current.shadowMap.enabled = true;
      mountRef.current.appendChild(rendererRef.current.domElement);
    }

    const renderer = rendererRef.current;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    camera.position.set(0, 2, -10);
    camera.lookAt(0, 1, 0);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    const planeGeometry = new THREE.PlaneGeometry(100, 100);
    const planeMaterial = new THREE.MeshPhongMaterial({
      color: "#ffffff",
      shininess: 200,
    }); // Green, for example
    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = 0;
    scene.add(plane);

    const axesHelper = new THREE.AxesHelper(5);
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(10, 10);
    scene.add(gridHelper);

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    const loader = new GLTFLoader();

    loader.load("/Soldier.glb", (gltf) => {
      console.log("Loaded Soldier model");

      modelRef.current = gltf.scene;
      scene.add(modelRef.current);

      const mixer = new THREE.AnimationMixer(modelRef.current);
      mixerRef.current = mixer;

      const runAnimation = gltf.animations.find((anim) => anim.name === "Run");
      const walkAnimation = gltf.animations.find(
        (anim) => anim.name === "Walk"
      );
      const idleAnimation = gltf.animations.find(
        (anim) => anim.name === "Idle"
      );

      if (runAnimation && idleAnimation && walkAnimation) {
        console.log("Found run and idle animations");
        const runAction = mixer.clipAction(runAnimation);
        runActionRef.current = runAction;

        const walkAction = mixer.clipAction(walkAnimation);
        walkActionRef.current = walkAction;

        const idleAction = mixer.clipAction(idleAnimation);
        idleActionRef.current = idleAction;

        idleActionRef.current.play();
      }
    });

    const onWindowResize = () => {
      if (rendererRef.current && camera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        rendererRef.current.setSize(window.innerWidth, window.innerHeight);
      }
    };

    window.addEventListener("resize", onWindowResize);

    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixerRef.current?.update(delta);

      if (gameAction === ACTION.RUN && modelRef.current) {
        plane.position.z += 0.1 * delta;
      }

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }

      window.removeEventListener("resize", onWindowResize);
    };
  }, []);

  useEffect(() => {
    // Animation update based on gameAction
    const mixer = mixerRef.current;
    const runAction = runActionRef.current;
    const walkAction = walkActionRef.current;
    const idleAction = idleActionRef.current;

    if (!mixer || !runAction || !idleAction || !walkAction) {
      return;
    }

    idleAction.stop();
    runAction.stop();
    walkAction.stop();

    // Play the action based on gameAction
    switch (gameAction) {
      case ACTION.RUN:
        runAction.play();
        break;
      case ACTION.WALK:
        walkAction.play();
        break;
      case ACTION.STOP:
      default:
        idleAction.play();
        break;
    }
  }, [gameAction]); // Dependency on gameAction

  return <div className="flex-1" ref={mountRef}></div>;
}
