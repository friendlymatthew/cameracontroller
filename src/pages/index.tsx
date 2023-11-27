import Head from "next/head";
import React, { useEffect, useState } from "react";
import {
  loadMobileNetFeatureModel,
  initializeModel,
  type Models,
} from "~/utilities/useModel";
import WebCamera from "~/components/WebCamera";
import Game from "~/components/Game";
import Link from "~/components/Link";
import Help from "~/components/Help";

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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin={"use-credentials"}
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@300;400&family=Roboto+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main className="relative flex w-screen flex-col font-noto-sans font-thin">
        <div className="absolute left-0 top-0 z-10">
          <WebCamera mobilenet={models.mobilenet} model={models.model} />
        </div>
        <div className="absolute bottom-4 right-4 z-20 flex flex-col items-end font-roboto-mono">
          <div className="group flex cursor-pointer flex-col items-end space-y-20">
            <Help />
            <p className="duration-125 text-gray-600 transition ease-in group-hover:text-black">
              about/help
            </p>
          </div>
          <Link
            title="friendlymatthew"
            href="https://github.com/friendlymatthew"
          />
          <Link
            title="source code"
            href="https://github.com/friendlymatthew/cameracontroller"
          />
        </div>
        <Game />
      </main>
    </>
  );
}
