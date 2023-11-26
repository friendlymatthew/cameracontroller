import * as tf from "@tensorflow/tfjs";

export interface Models {
  mobilenet: tf.GraphModel | null;
  model: tf.LayersModel | null;
}

export enum ACTION {
  STOP = "Stop",
  RUN = "Run",
  WALK = "Walk",
}
export const STOP_DATA_GATHER = -1;
export const CLASS_NAMES = [ACTION.STOP, ACTION.WALK, ACTION.RUN];
export const MOBILE_NET_INPUT_WIDTH = 224;
export const MOBILE_NET_INPUT_HEIGHT = 224;

export function initializeModel() {
  const model = tf.sequential();
  model.add(
    tf.layers.dense({ inputShape: [1024], units: 128, activation: "relu" })
  );
  model.add(
    tf.layers.dense({ units: CLASS_NAMES.length, activation: "softmax" })
  );
  model.summary();
  model.compile({
    optimizer: "adam",
    loss: 2 === 2 ? "binaryCrossentropy" : "categoricalCrossentropy",
    metrics: ["accuracy"],
  });

  return model; // return the model
}

export async function loadMobileNetFeatureModel() {
  const URL =
    "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
  const mobilenet = await tf.loadGraphModel(URL, { fromTFHub: true }); // assign to local variable
  console.log("MobileNet v3 loaded successfully!");

  // Warm up the model by passing zeros through it once.
  tf.tidy(function () {
    const dummyData = tf.zeros([
      1,
      MOBILE_NET_INPUT_HEIGHT,
      MOBILE_NET_INPUT_WIDTH,
      3,
    ]);
    const result = mobilenet?.predict(dummyData);
    if (result) {
      console.log(result);
    }
  });

  return mobilenet; // return the mobilenet model
}
