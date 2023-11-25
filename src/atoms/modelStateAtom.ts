import { atom } from "recoil";

export enum ModelState {
  LOADING = "loading...",
  TRAIN_MODEL = "train model",
  ADD_TRAINING_DATA = "please add training data",
  PREDICT = "ready to predict",
}

export const modelStateAtom = atom({
  key: "TensorflowModelState",
  default: ModelState.LOADING,
});
