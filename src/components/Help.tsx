export default function Help() {
  const instructions = [
    {
      step: "Capture training data",
      desc: "Click on any of the three canvases to capture a burst of pictures for a specific action (Stop, Walk, Run). Make sure you strike a distinct pose for each action to provide varied data for the model.",
    },
    {
      step: "Train model",
      desc: "Press 'Train Model' to start the learning process.",
    },
    {
      step: "Test your poses",
      desc: "After training, replicate the poses in front of the camera. Watch how the solider responds with the corresponding animations. P.S. notice the smooth blending of actions as you switch between poses.",
    },
  ];

  return (
    <div className="hidden w-1/3 space-y-8 bg-white p-4 shadow-lg group-hover:block">
      <h1 className="font-medium italic">
        Turn your camera into a controller using a neural network.
      </h1>
      <ul className="space-y-4">
        {instructions.map(({ step, desc }, idx) => (
          <li key={idx}>
            <strong className="font-medium">{step}</strong>
            <p>{desc}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
