import type { Logs } from "@tensorflow/tfjs";
import { ModelState } from "./WebCamera";
import ModelGraph from "./ModelGraph";

export type ModelStatusProps = {
  state: ModelState;
  customEpoch: number;
  customBatch: number;

  // todo: make it customizable
  //setCustomEpoch: (epoch: number | ((prevEpoch: number) => number)) => void;
  //setCustomBatch: (batch: number | ((prevBatch: number) => number)) => void;
  logs: Logs[];
  epoch: number;
  onClick?: () => void;
};

export default function Status({
  state,
  logs,
  customBatch,
  customEpoch,
  epoch,
  onClick,
}: ModelStatusProps) {
  function renderStatus() {
    if (state === ModelState.TRAIN) {
      return (
        <button
          onClick={onClick}
          className="w-full animate-pulse p-2 font-semibold transition duration-300 ease-in hover:animate-none hover:bg-emerald-300"
        >
          <p>{state}</p>
        </button>
      );
    }

    if (state === ModelState.TRAINING) {
      return (
        <div className="p-2">
          <p> Epoch: {epoch} </p>
        </div>
      );
    }

    if (state === ModelState.PREDICT) {
      const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

      return (
        <div className="bg-emerald-400 p-2">
          {lastLog && <p> Accuracy: {lastLog.acc?.toFixed(5)} </p>}
        </div>
      );
    }

    return <p className="p-2">{state}</p>;
  }

  const modelInformation = [
    {
      title: "Optimizer",
      value: "Adam",
    },
    {
      title: "Batch size",
      value: customBatch,
    },
    {
      title: "Epochs",
      value: customEpoch,
    },
  ];

  const showGraph =
    state === ModelState.TRAINING || state === ModelState.PREDICT;

  return (
    <div
      className={`${
        state === ModelState.PREDICT && "cursor-pointer"
      } group relative`}
    >
      <div
        className={`cursor-pointer border-b border-gray-400 bg-white text-center`}
      >
        {renderStatus()}
      </div>

      {!showGraph && (
        <div
          className={`absolute left-44 top-0 z-20 hidden w-64 space-y-2 bg-white p-4 shadow-lg group-hover:block`}
        >
          <p className="text-center font-roboto-mono font-normal">
            Model information
          </p>
          <ul className="">
            {modelInformation.map(({ title, value }, idx) => {
              return (
                <li key={idx} className="flex justify-between">
                  <strong className="">{title}</strong>
                  <p>{value}</p>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      {showGraph && (
        <div
          className={`absolute left-44 top-0 z-10 bg-white p-2 shadow-lg ${
            state === ModelState.PREDICT && "hidden group-hover:block"
          }`}
        >
          <ModelGraph logs={logs} />
        </div>
      )}
    </div>
  );
}
