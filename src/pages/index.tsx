import Head from "next/head";
import React, { useEffect, useState } from "react";
import {
  loadMobileNetFeatureModel,
  initializeModel,
  type Models,
} from "~/utilities/useModel";
import WebCamera from "~/components/WebCamera";
import Game from "~/components/Game";

export default function Home() {
  const [models, setModels] = useState<Models>({
    mobilenet: null,
    model: null,
  });

  useEffect(() => {
    const loadModels = async (): Promise<void> => {
      const mobilenet = await loadMobileNetFeatureModel();
      const model = initializeModel();
      setModels({ mobilenet, model });
    };

    loadModels().catch((error) => {
      console.error(error);
    });
  }, []);

  return (
    <>
      <Head>
        <title>Webcam Controller</title>
        <meta name="description" content="Created by Matthew Kim" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="relative flex w-screen flex-col">
        <div className="absolute left-0 top-0 z-10">
          <WebCamera mobilenet={models.mobilenet} model={models.model} />
        </div>
        <Game />
      </main>
    </>
  );
}
