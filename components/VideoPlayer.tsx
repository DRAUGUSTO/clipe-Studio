import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VideoPlayerProps {
  file: File;
  onBack: () => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ file, onBack }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const videoUrl = React.useMemo(() => URL.createObjectURL(file), [file]);

  // Lock body scroll when player is active
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Clean up URL on unmount
  useEffect(() => {
    return () => URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  // Hide controls logic
  const resetIdleTimer = useCallback(() => {
    setShowControls(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    
    if (!isLocked && isPlaying) {
      idleTimer.current = setTimeout(() => {
        setShowControls(false);
      }, 3000); // Hide after 3s of inactivity
    }
  }, [isLocked, isPlaying]);

  useEffect(() => {
    const handleMouseMove = () => resetIdleTimer();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleMouseMove);
    window.addEventListener('keydown', handleMouseMove);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleMouseMove);
      window.removeEventListener('keydown', handleMouseMove);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [resetIdleTimer]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!videoRef.current) return;
      
      switch(e.code) {
        case 'Space':
        case 'k':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          skip(10);
          break;
        case 'ArrowLeft':
          skip(-10);
          break;
        case 'KeyF':
          toggleFullscreen();
          break;
        case 'KeyM':
          toggleMute();
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLocked]); // Re-bind if lock state changes implies different behavior? currently strict.

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const skip = (seconds: number) => {
    if (!videoRef.current || isLocked) return;
    videoRef.current.currentTime += seconds;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    setCurrentTime(videoRef.current.currentTime);
    const progressPercent = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setProgress(progressPercent);
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!videoRef.current || isLocked) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    const percent = x / width;
    videoRef.current.currentTime = percent * videoRef.current.duration;
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "00:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 bg-black z-50 flex items-center justify-center overflow-hidden font-sans select-none"
      onDoubleClick={toggleFullscreen}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        className="w-full h-full object-contain"
        autoPlay
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={() => { setIsPlaying(false); setShowControls(true); }}
        onClick={(e) => { e.stopPropagation(); if(!isLocked) togglePlay(); }}
      />

      {/* Watermark - Always visible but subtle */}
      <div className="absolute top-6 right-8 pointer-events-none z-40 opacity-50 flex flex-col items-end">
        <h2 className="text-white font-black text-2xl tracking-tighter drop-shadow-md">
          <span className="text-red-600">CINE</span>PLAYER
        </h2>
        <span className="text-[10px] text-gray-300 tracking-widest uppercase">Reprodutor 8K</span>
      </div>

      {/* Main Overlay */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 transition-opacity duration-500 flex flex-col justify-between p-8
          ${showControls ? 'opacity-100 cursor-default' : 'opacity-0 cursor-none pointer-events-none'}
        `}
      >
        
        {/* Top Bar */}
        <div className={`flex justify-between items-center transition-transform duration-300 ${isLocked ? '-translate-y-full' : 'translate-y-0'}`}>
          <div className="flex items-center gap-4">
             <button 
               onClick={onBack}
               className="text-gray-300 hover:text-white transition-colors hover:scale-110"
               title="Voltar / Fechar"
             >
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
             </button>
             <div>
               <h1 className="text-white text-lg font-bold drop-shadow-md max-w-md truncate">{file.name}</h1>
               <span className="text-xs text-gray-400 font-medium bg-gray-800 px-2 py-0.5 rounded">HD</span>
             </div>
          </div>
        </div>

        {/* Center Controls (Play/Pause Big) */}
        {!isLocked && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center gap-12 pointer-events-auto">
             <button onClick={() => skip(-10)} className="group text-white/70 hover:text-white transition-all hover:scale-110">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z" /></svg>
                <span className="text-xs font-bold block text-center mt-1 group-hover:text-red-500">-10s</span>
             </button>

             <button 
               onClick={togglePlay}
               className="bg-white/10 hover:bg-red-600/90 text-white rounded-full p-6 backdrop-blur-sm border border-white/20 hover:border-red-500 transition-all hover:scale-110 shadow-2xl group"
             >
                {isPlaying ? (
                   <svg className="w-12 h-12 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                ) : (
                   <svg className="w-12 h-12 fill-current ml-1" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                )}
             </button>

             <button onClick={() => skip(10)} className="group text-white/70 hover:text-white transition-all hover:scale-110">
                <svg className="w-12 h-12" viewBox="0 0 24 24" fill="currentColor"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>
                <span className="text-xs font-bold block text-center mt-1 group-hover:text-red-500">+10s</span>
             </button>
          </div>
        )}

        {/* Lock Status (Visible when Locked) */}
        {isLocked && (
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 pointer-events-auto">
                <button 
                  onClick={() => setIsLocked(false)}
                  className="bg-white text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 hover:bg-gray-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.3)] animate-pulse"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>
                    Toque para Desbloquear
                </button>
            </div>
        )}

        {/* Bottom Controls */}
        <div className={`transition-transform duration-300 ${isLocked ? 'translate-y-full' : 'translate-y-0'}`}>
           
           {/* Timeline */}
           <div 
             className="relative h-4 group cursor-pointer mb-4 flex items-center"
             onClick={handleSeek}
           >
              {/* Background Line */}
              <div className="absolute w-full h-1 bg-gray-600/50 rounded-full group-hover:h-2 transition-all duration-200"></div>
              
              {/* Progress Line */}
              <div 
                className="absolute h-1 bg-red-600 rounded-full group-hover:h-2 transition-all duration-200 shadow-[0_0_10px_rgba(220,38,38,0.7)]"
                style={{ width: `${progress}%` }}
              ></div>
              
              {/* Thumb/Scrubber */}
              <div 
                className="absolute h-4 w-4 bg-red-600 rounded-full scale-0 group-hover:scale-100 transition-transform duration-200 shadow-lg border-2 border-white"
                style={{ left: `${progress}%`, transform: `translateX(-50%) ${showControls ? 'scale(1)' : 'scale(0)'}` }}
              ></div>
           </div>

           <div className="flex justify-between items-center px-2">
              <div className="flex items-center gap-6">
                 {/* Play Mini */}
                 <button onClick={togglePlay} className="text-white hover:text-red-500 transition-colors">
                    {isPlaying ? (
                        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
                    ) : (
                        <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    )}
                 </button>

                 {/* Volume */}
                 <div className="flex items-center gap-2 group/volume">
                    <button onClick={toggleMute} className="text-white hover:text-gray-300">
                        {isMuted ? (
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" /></svg>
                        ) : (
                             <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
                        )}
                    </button>
                    <input 
                      type="range" min="0" max="1" step="0.1" 
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          setVolume(val);
                          setIsMuted(val === 0);
                          if(videoRef.current) videoRef.current.volume = val;
                      }}
                      className="w-0 group-hover/volume:w-24 transition-all duration-300 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer accent-red-600"
                    />
                 </div>

                 {/* Time */}
                 <div className="text-sm font-medium text-gray-300 tracking-wide">
                    {formatTime(currentTime)} <span className="text-gray-600 mx-1">/</span> {formatTime(duration)}
                 </div>
              </div>

              <div className="flex items-center gap-6">
                  {/* Lock Button */}
                  <button 
                    onClick={() => setIsLocked(true)} 
                    className="text-gray-400 hover:text-white transition-colors flex flex-col items-center group"
                    title="Bloquear Tela"
                  >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                  </button>

                  {/* Fullscreen */}
                  <button onClick={toggleFullscreen} className="text-white hover:text-red-500 transition-colors">
                      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
                  </button>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};