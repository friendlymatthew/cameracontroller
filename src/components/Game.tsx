/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import React, { useRef, useEffect } from "react";
import { useRecoilValue } from "recoil";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { gameActionAtom } from "~/atoms/gameActionAtom";
import { ACTION } from "~/utilities/useModel";

export default function Game() {
  const gameAction = useRecoilValue(gameActionAtom);
  console.log("Game Action: ", gameAction); // Log current game action

  const mountRef = useRef<HTMLDivElement>(null);

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const runActionRef = useRef<THREE.AnimationAction | null>(null);
  const idleActionRef = useRef<THREE.AnimationAction | null>(null);

  useEffect(() => {
    if (!mountRef.current) {
      console.log("Mount ref is not available.");
      return;
    }

    console.log("Setting up the scene");

    // Scene, Camera, Renderer setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      1,
      100
    );
    camera.position.set(1, 2, -3);
    camera.lookAt(0, 1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    mountRef.current.appendChild(renderer.domElement);

    // Add Ambient Light for overall illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add Directional Light for more focused illumination
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 5, 5);
    scene.add(directionalLight);

    // Load Soldier Model
    const loader = new GLTFLoader();
    loader.load("/Soldier.glb", (gltf) => {
      console.log("Loaded Soldier model");

      const model = gltf.scene;
      scene.add(model);

      const mixer = new THREE.AnimationMixer(model);
      mixerRef.current = mixer;

      const runAnimation = gltf.animations.find((anim) => anim.name === "Run");
      const idleAnimation = gltf.animations.find(
        (anim) => anim.name === "Idle"
      );

      if (runAnimation && idleAnimation) {
        console.log("Found run and idle animations");
        runActionRef.current = mixer.clipAction(runAnimation);
        idleActionRef.current = mixer.clipAction(idleAnimation);

        if (gameAction === ACTION.RUN) {
          console.log("Playing run animation initially");
          runActionRef.current.play();
        } else {
          console.log("Playing idle animation initially");
          idleActionRef.current.play();
        }
      }
    });

    // Animation Loop
    const clock = new THREE.Clock();
    const animate = () => {
      requestAnimationFrame(animate);
      const delta = clock.getDelta();
      mixerRef.current?.update(delta);
      renderer.render(scene, camera);
    };
    animate();

    // ... (Rest of the resize handling and cleanup)
  }, []);

  useEffect(() => {
    // Animation update based on gameAction
    const mixer = mixerRef.current;
    const runAction = runActionRef.current;
    const idleAction = idleActionRef.current;

    if (!mixer || !runAction || !idleAction) {
      console.log("Mixer or actions not available for update");
      return;
    }

    if (gameAction === ACTION.RUN && !runAction.isRunning()) {
      console.log("Switching to run animation");
      idleAction.stop();
      runAction.play();
    } else if (gameAction !== ACTION.RUN && !idleAction.isRunning()) {
      console.log("Switching to idle animation");
      runAction.stop();
      idleAction.play();
    }
  }, [gameAction]); // Dependency on gameAction

  return <div className="flex-1" ref={mountRef}></div>;
}
