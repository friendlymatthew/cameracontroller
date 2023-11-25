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
import { useRecoilState, useRecoilValue } from "recoil";
import { ModelState, modelStateAtom } from "~/atoms/modelStateAtom";
import { gameActionAtom } from "~/atoms/gameActionAtom";

export default function WebCamera({ mobilenet, model }: Models) {
  const [modelState, setModelState] = useRecoilState(modelStateAtom);
  const [gameAction, setGameAction] = useRecoilState(gameActionAtom);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [videoPlaying, setVideoPlaying] = useState(false);

  const [actionCounts, setActionCounts] = useState<Array<number>>([0, 0]);

  const canvasRef1 = useRef<HTMLCanvasElement | null>(null);
  const canvasRef2 = useRef<HTMLCanvasElement | null>(null);
  const canvasRefs = [canvasRef1, canvasRef2];

  const [trainingDataInputs, setTrainingDataInputs] = useState<tf.Tensor[]>([]);
  const [trainingDataOutputs, setTrainingDataOutputs] = useState<number[]>([]);
  const [predict, setPredict] = useState<boolean>(false);

  const [logs, setLogs] = useState<tf.Logs>();
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
    async function predictLoop() {
      let newGameControl = null; // Placeholder for new game control state

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
            .div(255);
          const resizedTensorFrame = tf.image.resizeBilinear(
            videoFrameAsTensor,
            [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
            true
          );
          const imageFeatures = mobilenet.predict(
            resizedTensorFrame.expandDims()
          ) as tf.Tensor;

          if (imageFeatures instanceof tf.Tensor) {
            const prediction = model.predict(imageFeatures) as tf.Tensor1D;
            // Print prediction Tensor for debugging
            prediction.print(true);

            const highestIndex: number | undefined = prediction
              .argMax(1)
              .dataSync()[0]; // Specify axis
            prediction.dispose();

            if (
              highestIndex !== undefined &&
              highestIndex < CLASS_NAMES.length
            ) {
              newGameControl = CLASS_NAMES[highestIndex];
            }
          }
        });
        console.log(newGameControl);
        setGameAction(newGameControl);

        window.requestAnimationFrame(predictLoop);
      }
    }

    if (model && mobilenet && model) {
      predictLoop().catch(console.error);
    }
  }, [model, predict, mobilenet]);

  const trainModel = useCallback(async (): Promise<void> => {
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
      batchSize: 5,
      epochs: 10,
      callbacks: { onEpochEnd: logProgress },
    });

    outputsAsTensor.dispose();
    oneHotOutputs.dispose();
    inputsAsTensor.dispose();

    setPredict(true);
  }, [model, trainingDataInputs, trainingDataOutputs]);

  const logProgress = (epoch: number, logs?: tf.Logs): void => {
    if (logs) {
      setEpoch(epoch);
      setLogs(logs);
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

        console.log("Shape of imageFeatures tensor:", imageFeatures.shape);
        console.log("Label being stored:", idx);

        setTrainingDataInputs((oldInputs) => [...oldInputs, imageFeatures]);
        setTrainingDataOutputs((oldOutputs) => [...oldOutputs, idx]);
      }
    },
    [videoPlaying, mobilenet]
  );

  const snap = useCallback(
    (idx: number) => {
      // number of frames to capture on each click
      const frameCount = 5;

      for (let i = 0; i < frameCount; i++) {
        // add a slight delay before capturing each frame
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
    },
    [collect, canvasRefs]
  );

  function determineState() {
    if (!model || !mobilenet) {
      return ModelState.LOADING;
    }

    if (model && mobilenet) {
      if (actionCounts.every((cnt) => cnt > 0)) {
        return ModelState.TRAIN_MODEL;
      }
      return ModelState.ADD_TRAINING_DATA;
    }

    if (predict) {
      return ModelState.PREDICT;
    }

    return ModelState.LOADING;
  }

  return (
    <div className="">
      <video
        ref={videoRef}
        autoPlay
        width="720"
        height="560"
        className="scale-x-[-1]"
      ></video>

      <div className="space-y-4 border border-black">
        <Status
          state={determineState()}
          logs={determineState() === ModelState.PREDICT ? logs : undefined}
          epoch={determineState() === ModelState.PREDICT ? epoch : undefined}
          onClick={
            determineState() === ModelState.TRAIN_MODEL ? trainModel : undefined
          }
        />

        {modelState !== ModelState.LOADING && (
          <div className="flex justify-center space-x-2 p-4">
            {CLASS_NAMES.map((action, idx) => (
              <div key={idx} className="text-center">
                <p>{action}</p>
                <canvas
                  key={idx}
                  ref={canvasRefs[idx]}
                  onClick={() => {
                    snap(idx);
                  }}
                  className={`scale-x-[-1] cursor-pointer border border-black ${
                    actionCounts[idx] === 0 && "bg-white"
                  } ${
                    gameAction != null &&
                    ((idx === 0 && gameAction === CLASS_NAMES[0]) ||
                      (idx === 1 && gameAction === CLASS_NAMES[1])) &&
                    "shadow-xl shadow-yellow-400"
                  }`}
                  width="200"
                  height="200"
                ></canvas>{" "}
                {actionCounts[idx]}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
