import type { Logs } from "@tensorflow/tfjs";
import { ModelState } from "./WebCamera";
import ModelGraph from "./ModelGraph";

export type ModelStatusProps = {
  state: ModelState;
  logs: Logs[];
  epoch: number;
  onClick?: () => void;
};

export default function Status({
  state,
  logs,
  epoch,
  onClick,
}: ModelStatusProps) {
  function renderStatus() {
    if (state === ModelState.TRAIN) {
      return (
        <div>
          <button onClick={onClick} className="border border-black">
            {state}
          </button>
        </div>
      );
    }

    if (state === ModelState.TRAINING) {
      return (
        <div>
          <p> Epoch: {epoch} </p>
        </div>
      );
    }

    if (state === ModelState.PREDICT) {
      const lastLog = logs.length > 0 ? logs[logs.length - 1] : null;

      return (
        <div>{lastLog && <p> Accuracy: {lastLog.acc?.toFixed(5)} </p>}</div>
      );
    }

    return <p>{state}</p>;
  }

  const showGraph =
    state === ModelState.TRAINING || state === ModelState.PREDICT;

  return (
    <div
      className={`${
        state === ModelState.PREDICT && "cursor-pointer"
      } group relative`}
    >
      <div className={`border-b border-black bg-white p-2`}>
        {renderStatus()}
      </div>
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
