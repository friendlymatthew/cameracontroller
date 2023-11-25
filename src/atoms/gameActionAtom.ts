import { atom } from "recoil";
import type { ACTION } from "~/utilities/useModel";

export const gameActionAtom = atom<ACTION | null>({
  key: "GameAction",
  default: null,
});
