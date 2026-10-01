import DancingGirl from "./DancingGirl";

function App() {
  return (
    <div className="w-screen h-screen bg-black relative">
      <DancingGirl />

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10">
        <audio
          controls
          loop
          src="/audio/salsa.mp3"
        />
      </div>
    </div>
  );
}

export default App;