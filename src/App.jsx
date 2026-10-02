import { useState, useRef } from "react";
import DancingGirl from "./DancingGirl";

function App() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().catch((err) => {
        console.warn("Audio playback failed or file missing:", err);
      });
      setIsPlaying(true);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleSpeedChange = (newSpeed) => {
    setSpeed(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  };

  return (
    <div className="w-screen h-screen bg-[#0c0206] relative overflow-hidden font-sans select-none">
      {/* Ambient Warm Salsa Stage Glows */}
      <div className="absolute -top-32 -left-32 w-[28rem] h-[28rem] bg-rose-600/20 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-1/3 -right-32 w-[28rem] h-[28rem] bg-amber-500/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[40rem] h-64 bg-red-600/20 rounded-full blur-[110px] pointer-events-none" />

      {/* Top Header Overlay */}
      <header className="absolute top-0 left-0 w-full p-6 md:px-10 flex justify-between items-start z-10 pointer-events-none">
        <div>
        
          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-rose-400 to-red-500 drop-shadow-sm">
            SALSA FIESTA
          </h1>
        </div>

        {/* Camera Hint Pill */}
        <div className="hidden sm:flex items-center gap-2 bg-white/5 backdrop-blur-md border border-white/10 px-4 py-2 rounded-full text-xs text-amber-100/70 shadow-lg">
          <span>🖱️ Drag to Rotate</span>
          <span className="text-white/20">|</span>
          <span>Scroll to Zoom</span>
        </div>
      </header>

      {/* 3D Scene Canvas */}
      <DancingGirl isPlaying={isPlaying} speed={speed} />

      {/* Bottom Custom Glassmorphic Player & Tempo Bar */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 w-[92%] max-w-lg">
        <div className="bg-gradient-to-r from-[#240711]/85 via-[#18040b]/90 to-[#240711]/85 backdrop-blur-xl border border-rose-500/30 rounded-2xl p-4 shadow-[0_0_50px_rgba(225,29,72,0.25)] flex flex-col gap-3.5">
          
          <div className="flex items-center justify-between gap-3">
            {/* Play / Pause Button */}
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 via-rose-500 to-red-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer shrink-0"
              aria-label={isPlaying ? "Pause Salsa" : "Play Salsa"}
            >
              {isPlaying ? (
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg className="w-5 h-5 fill-current ml-0.5" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-amber-300 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded-md">
                  {isPlaying ? "Now Dancing" : "Paused"}
                </span>
                <span className="text-rose-200/50 text-xs truncate">
                  Rhythm Sync Active
                </span>
              </div>
              <p className="text-white font-bold text-sm md:text-base truncate mt-0.5">
                Clube de Salsa — Caliente Mix
              </p>
            </div>

            {/* Animated Rhythm Visualizer Bars */}
            <div className="flex items-end gap-1 h-7 px-2">
              {[0.5, 1, 0.7, 0.9, 0.6].map((h, idx) => (
                <span
                  key={idx}
                  className={`w-1 rounded-full bg-gradient-to-t from-rose-500 to-amber-300 transition-all duration-300 ${
                    isPlaying ? "animate-bounce" : "h-1.5 opacity-30"
                  }`}
                  style={{
                    height: isPlaying ? `${h * 100}%` : "6px",
                    animationDelay: `${idx * 120}ms`,
                    animationDuration: `${0.65 / speed}s`,
                  }}
                />
              ))}
            </div>

            {/* Mute / Unmute Button */}
            <button
              onClick={toggleMute}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-rose-200/80 border border-white/10 transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>

          {/* Dance Tempo / Speed Controls */}
          <div className="flex items-center justify-between pt-2.5 border-t border-white/10 text-xs">
            <span className="text-rose-200/60 font-medium tracking-wide">
              DANCE TEMPO
            </span>
            <div className="flex items-center gap-1.5">
              {[0.75, 1, 1.25, 1.5].map((rate) => (
                <button
                  key={rate}
                  onClick={() => handleSpeedChange(rate)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    speed === rate
                      ? "bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-md shadow-rose-500/20"
                      : "bg-white/5 text-rose-100/60 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        <audio ref={audioRef} loop src="/audio/salsa.mp3" />
      </div>
    </div>
  );
}

export default App;