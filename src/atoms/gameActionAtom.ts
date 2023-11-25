import { atom } from "recoil";
import { ACTION } from "~/utilities/useModel";

export const gameActionAtom = atom<ACTION>({
  key: "GameAction",
  default: ACTION.STOP,
});
