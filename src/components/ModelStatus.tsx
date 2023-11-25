import type { Logs } from "@tensorflow/tfjs";
import { ModelState } from "~/atoms/modelStateAtom";

export type ModelStatusProps = {
  state: ModelState;
  logs?: Logs;
  epoch?: number;
  onClick?: () => void;
};

export default function Status({
  state,
  logs,
  epoch,
  onClick,
}: ModelStatusProps) {
  function renderStatus() {
    const content = state;

    if (state === ModelState.TRAIN_MODEL) {
      return (
        <div>
          <button onClick={onClick} className="border border-black">
            {content}
          </button>
        </div>
      );
    }

    if (state === ModelState.PREDICT) {
      return (
        <div>
          {epoch ? <p>Epoch: {epoch}</p> : <></>}
          {logs?.acc !== undefined ? (
            <p>Accuracy: {(logs.acc * 100).toFixed(2)}%</p>
          ) : (
            <></>
          )}
        </div>
      );
    }

    return <p>{content}</p>;
  }

  return (
    <div className={`border-b border-black bg-white px-4 py-2`}>
      {renderStatus()}
    </div>
  );
}
