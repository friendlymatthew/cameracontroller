import Head from "next/head";
import React, { useEffect, useState } from "react";
import {
  loadMobileNetFeatureModel,
  initializeModel,
  type Models,
} from "~/utilities/useModel";
import WebCamera from "~/components/WebCamera";
import { useSetRecoilState } from "recoil";
import { ModelState, modelStateAtom } from "~/atoms/modelStateAtom";

export default function Home() {
  const setModelState = useSetRecoilState(modelStateAtom);

  const [models, setModels] = useState<Models>({
    mobilenet: null,
    model: null,
  });

  useEffect(() => {
    const loadModels = async (): Promise<void> => {
      const mobilenet = await loadMobileNetFeatureModel();
      const model = initializeModel();
      setModels({ mobilenet, model });
      setModelState(ModelState.ADD_TRAINING_DATA);
    };

    loadModels().catch((error) => {
      console.error(error);
      setModelState(ModelState.LOADING);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Webcam Controller</title>
        <meta name="description" content="Created by Matthew Kim" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex h-screen w-screen flex-col items-center justify-center">
        <WebCamera mobilenet={models.mobilenet} model={models.model} />
      </main>
    </>
  );
}
