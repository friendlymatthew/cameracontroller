import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  CLASS_NAMES,
  MOBILE_NET_INPUT_HEIGHT,
  MOBILE_NET_INPUT_WIDTH,
  STOP_DATA_GATHER,
  type Models,
} from "~/utilities/useModel";
import * as tf from "@tensorflow/tfjs";
import Status from "./ModelStatus";
import { useRecoilState } from "recoil";
import { gameActionAtom } from "~/atoms/gameActionAtom";
import { HotKeys } from "react-hotkeys";

export enum ModelState {
  LOADING = "loading...",
  ADD_TRAINING_DATA = "add training data",
  TRAIN = "train model",
  TRAINING = "training model...",
  PREDICT = "ready to predict",
}

export default function WebCamera({ mobilenet, model }: Models) {
  const [gameAction, setGameAction] = useRecoilState(gameActionAtom);
  const [modelState, setModelState] = useState<ModelState>(ModelState.LOADING);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const [actionCounts, setActionCounts] = useState<Array<number>>([0, 0, 0]);

  const canvasRefs = [
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
    useRef<HTMLCanvasElement | null>(null),
  ];

  const [trainingDataInputs, setTrainingDataInputs] = useState<tf.Tensor[]>([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState<number[]>([]);
  const [predict, setPredict] = useState<boolean>(false);

  const [customEpoch, setCustomEpoch] = useState<number>(20);
  const [customBatch, setCustomBatch] = useState<number>(5);

  const [logs, setLogs] = useState<tf.Logs[]>([]);
  const [epoch, setEpoch] = useState<number>(0);

  useEffect(() => {
    const startVideo = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });

        const video = videoRef.current;
        if (!video) {
          console.error("Missing video element ref");
          return;
        }
        video.srcObject = stream;
        setVideoPlaying(true);
      } catch (error) {
        console.error("An error occurred while accessing camera: ", error);
      }
    };
    startVideo().catch(console.error);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/require-await
    async function predictLoop() {
      let newGameControl = CLASS_NAMES[0]; // Placeholder for new game control state

      if (predict) {
        tf.tidy(() => {
          if (videoRef.current === null) {
            throw new Error("current camera not found");
          }

          if (mobilenet == null || model == null) {
            return;
          }

          const videoFrameAsTensor = tf.browser
            .fromPixels(videoRef.current)
            .toFloat();

          const resizedTensorFrame = tf.image.resizeBilinear(
            videoFrameAsTensor,
            [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
            true
          );

          const batchedTensor = resizedTensorFrame.div(255).expandDims(0);
          const imageFeatures = mobilenet.predict(batchedTensor) as tf.Tensor;

          if (imageFeatures instanceof tf.Tensor) {
            const prediction = model.predict(imageFeatures) as tf.Tensor1D;
            prediction.print(true);

            const highestIndex: number | undefined = prediction
              .argMax(1)
              .dataSync()[0];
            prediction.dispose();

            if (
              highestIndex !== undefined &&
              highestIndex < CLASS_NAMES.length
            ) {
              newGameControl = CLASS_NAMES[highestIndex];
            }
          }
        });

        if (newGameControl !== undefined) {
          setGameAction(newGameControl);
        }

        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        window.requestAnimationFrame(predictLoop);
      }
    }

    if (model && mobilenet && model) {
      predictLoop().catch(console.error);
    }
  }, [model, predict, mobilenet, setGameAction]);

  const trainModel = useCallback(async (): Promise<void> => {
    setModelState(ModelState.TRAINING);
    tf.util.shuffleCombo(trainingDataInputs, trainingDataOutputs);

    const outputsAsTensor = tf.tensor1d(trainingDataOutputs, "int32");
    const oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
    const inputsAsTensor = tf.stack(trainingDataInputs);

    if (model === null) {
      console.error("Model is not defined");
      return;
    }

    await model.fit(inputsAsTensor, oneHotOutputs, {
      shuffle: true,
      batchSize: customBatch,
      epochs: customEpoch,
      callbacks: { onEpochEnd: logProgress },
    });

    outputsAsTensor.dispose();
    oneHotOutputs.dispose();
    inputsAsTensor.dispose();
  }, [
    model,
    trainingDataInputs,
    trainingDataOutputs,
    customBatch,
    customEpoch,
  ]);

  const logProgress = (epoch: number, logs?: tf.Logs): void => {
    if (logs) {
      setEpoch(epoch);
      setLogs((oldLogs) => [...oldLogs, logs]);
      console.log("Data for epoch " + epoch, logs);
    }
  };

  const collect = useCallback(
    (idx: number, canvas: HTMLCanvasElement) => {
      if (videoPlaying && idx !== STOP_DATA_GATHER) {
        const imageFeatures = tf.tidy(function () {
          if (!canvas) {
            throw new Error("Canvas is null");
          }
          const videoFrameAsTensor = tf.browser.fromPixels(canvas);
          const resizedTensorFrame = tf.image.resizeBilinear(
            videoFrameAsTensor,
            [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
            true
          );
          const normalizedTensorFrame = resizedTensorFrame.div(255);

          if (mobilenet == null) {
            throw new Error("Mobilenet model is not loaded yet");
          }

          const prediction = mobilenet.predict(
            normalizedTensorFrame.expandDims()
          );
          if (prediction instanceof tf.Tensor) {
            return prediction.squeeze();
          } else {
            throw new Error("Prediction is not a Tensor");
          }
        });

        setTrainingDataInputs((oldInputs) => [...oldInputs, imageFeatures]);
        setTrainingDataOutputs((oldOutputs) => [...oldOutputs, idx]);
      }
    },
    [videoPlaying, mobilenet]
  );

  const snap = useCallback(
    (idx: number) => {
      if (modelState === ModelState.ADD_TRAINING_DATA) {
        const frameCount = 5;

        for (let i = 0; i < frameCount; i++) {
          setTimeout(() => {
            const video = videoRef.current;
            const canvas = canvasRefs[idx]?.current;
            if (!video || !canvas) {
              console.error("Missing video or canvas element ref");
              return;
            }

            const context = canvas.getContext("2d");
            if (!context) {
              console.error("Unable to get canvas context");
              return;
            }
            console.log("collecting: ", idx, " for: ", canvas);

            collect(idx, canvas);

            setActionCounts((currCount) =>
              currCount.map((count, action_index) =>
                action_index === idx ? count + 1 : count
              )
            );

            context.drawImage(video, 0, 0, canvas.width, canvas.height);
          }, i * 150);
        }
      }
    },
    [collect, canvasRefs, modelState]
  );

  useEffect(() => {
    if (model === null || mobilenet === null) {
      setModelState(ModelState.LOADING);
    }

    if (actionCounts.every((cnt) => cnt > 0)) {
      if (predict) {
        setModelState(ModelState.PREDICT);
      } else {
        setModelState(ModelState.TRAIN);
      }
    } else {
      setModelState(ModelState.ADD_TRAINING_DATA);
    }
  }, [
    actionCounts,
    model,
    mobilenet,
    predict,
    trainingDataInputs,
    trainingDataOutputs,
  ]);

  const keyMap = {
    SNAP_ONE: "1",
    SNAP_TWO: "2",
    SNAP_THREE: "3",
  };

  const handlers = {
    SNAP_ONE: () => snap(0),
    SNAP_TWO: () => snap(1),
    SNAP_THREE: () => snap(2),
  };

  return (
    <HotKeys keyMap={keyMap} handlers={handlers}>
      <div className="w-40 shadow-xl">
        <video ref={videoRef} autoPlay className="w-full scale-x-[-1]"></video>

        <Status
          state={modelState}
          customBatch={customBatch}
          customEpoch={customEpoch}
          logs={logs}
          epoch={epoch}
          onClick={() => {
            trainModel()
              .then(() => {
                setPredict(true);
              })
              .catch((error) => console.error(error));
          }}
        />

        {mobilenet && model && (
          <div className="flex w-full flex-col items-center space-y-4 bg-white py-2">
            {CLASS_NAMES.map((action, idx) => (
              <div key={idx} className="group text-center text-base">
                <p
                  className={`${
                    predict && gameAction === action && "font-semibold"
                  } transition duration-200 ease-in group-hover:font-semibold`}
                >
                  {action}
                </p>
                <button
                  onClick={() => {
                    snap(idx);
                  }}
                  className="relative h-24 w-24 cursor-pointer border"
                >
                  {actionCounts[idx] === 0 && (
                    <div className="absolute left-0 top-0 z-10 flex h-full w-full flex-col justify-center">
                      <p className="text-center text-3xl font-bold text-gray-500">
                        {idx + 1}
                      </p>
                    </div>
                  )}
                  <canvas
                    key={idx}
                    ref={canvasRefs[idx]}
                    className={`h-24 w-24 scale-x-[-1] cursor-pointer  
                  ${actionCounts[idx] === 0 && "animate-pulse bg-gray-200"} 
                  ${
                    predict &&
                    gameAction === action &&
                    "shadow-lg shadow-yellow-400"
                  }`}
                  ></canvas>
                </button>
                <p>{!predict && actionCounts[idx]}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </HotKeys>
  );
}
