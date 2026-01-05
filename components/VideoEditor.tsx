import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MovieMetadata, SubtitleCue, ExportConfig, SubtitleStyle, ChannelVideo, AIOptions } from '../types';
import { generateMovieMetadata, generateSubtitles, generateThumbnail } from '../services/geminiService';
import { parseVTT, stringifyVTT, timeToSeconds } from '../utils/vttHelpers';

interface EditorProps {
  file: File;
  initialData?: ChannelVideo; 
  onBack: () => void;
  onDownload?: (metadata: MovieMetadata, filename: string, subtitles: string, config: ExportConfig, generatePublicCopy: boolean) => void;
  onSave?: (videoData: ChannelVideo) => void;
}

const formatTimeVTT = (seconds: number): string => {
    const date = new Date(0);
    date.setMilliseconds(seconds * 1000);
    return date.toISOString().substr(11, 12);
};

export const ClipStudioEditor: React.FC<EditorProps> = ({ file, initialData, onBack, onDownload, onSave }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoUrl = useMemo(() => URL.createObjectURL(file), [file]);
  
  // Detectar se é áudio
  const isAudio = file.type.startsWith('audio/');

  // State: Metadata & Thumbnail
  const [metadata, setMetadata] = useState<MovieMetadata>(
    initialData?.metadata || {
      title: file.name.replace(/\.[^/.]+$/, ""),
      description: '', genre: '', ageRating: 'L'
    }
  );
  
  const [thumbnail, setThumbnail] = useState<string | undefined>(initialData?.thumbnail);

  const [filename, setFilename] = useState(
    initialData ? initialData.id : file.name.replace(/\.[^/.]+$/, "")
  );

  // Subtitles Init
  const [cues, setCues] = useState<SubtitleCue[]>(
    initialData && initialData.subtitles ? parseVTT(initialData.subtitles) : []
  );
  const [isSubtitlesEnabled, setIsSubtitlesEnabled] = useState(
    initialData ? !!initialData.subtitles : false
  );

  // Config Init
  const [trimStart, setTrimStart] = useState(initialData?.config.trimStart || 0);
  const [trimEnd, setTrimEnd] = useState(initialData?.config.trimEnd || 0); 
  const [showWatermark, setShowWatermark] = useState(initialData?.config.showWatermark ?? true);
  const [allowSubtitleToggle, setAllowSubtitleToggle] = useState(initialData?.config.allowSubtitleToggle ?? true);
  const [adminPassword, setAdminPassword] = useState(initialData?.config.adminPassword || '');
  const [generatePublicCopy, setGeneratePublicCopy] = useState(false);
  
  const [subStyle, setSubStyle] = useState<SubtitleStyle>(
    initialData?.config.subStyle || {
      fontSize: 1.5,
      bottomOffset: 10,
      bgOpacity: 0.6
  });

  const [generatingPhase, setGeneratingPhase] = useState<'idle' | 'analyzing' | 'transcribing' | 'syncing' | 'painting'>('idle');
  const [activeTab, setActiveTab] = useState<'edit' | 'subs' | 'export'>('edit');
  const [subMode, setSubMode] = useState<'list' | 'style'>('list');

  // AI Modal State
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiOptions, setAiOptions] = useState<AIOptions>({
      generateTitle: true,
      generateDescription: true,
      generateGenre: true,
      generateRating: true,
      generateSubtitles: true,
      generateThumbnail: true
  });

  useEffect(() => () => URL.revokeObjectURL(videoUrl), [videoUrl]);

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
        const dur = videoRef.current.duration;
        setDuration(dur);
        if (!initialData || trimEnd === 0) {
            setTrimEnd(dur);
        }
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
        const t = videoRef.current.currentTime;
        setCurrentTime(t);
        if (trimEnd > 0 && t >= trimEnd) {
            videoRef.current.currentTime = trimStart;
        }
    }
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) videoRef.current.pause();
    else videoRef.current.play();
    setIsPlaying(!isPlaying);
  };

  const seek = (time: number) => {
    if (videoRef.current) {
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    }
  };

  // --- DOWNLOAD HELPERS ---
  const handleDownloadFile = () => {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  const handleDownloadThumb = () => {
      if(!thumbnail) return;
      const a = document.createElement('a');
      a.href = thumbnail;
      a.download = 'thumbnail.png';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
  };

  // --- AI LOGIC ---
  const triggerAIAnalysis = () => {
      setShowAIModal(true);
  };

  const confirmAIGeneration = async () => {
    setShowAIModal(false);
    setGeneratingPhase('analyzing');
    
    try {
      const metaPromise = generateMovieMetadata(file, aiOptions, metadata);
      const subPromise = aiOptions.generateSubtitles 
        ? generateSubtitles(file) 
        : Promise.resolve({ hasSpeech: false, vttContent: '' });

      const [metaRes, subRes] = await Promise.all([metaPromise, subPromise]);
      setMetadata(metaRes);
      
      if (aiOptions.generateSubtitles) {
          if (subRes.hasSpeech) {
             setCues(parseVTT(subRes.vttContent));
             setIsSubtitlesEnabled(true);
          } else {
             alert("Nenhuma voz detectada para legendas.");
          }
      }

      if (aiOptions.generateThumbnail) {
          setGeneratingPhase('painting');
          const titleToUse = aiOptions.generateTitle ? metaRes.title : metadata.title;
          const genreToUse = aiOptions.generateGenre ? metaRes.genre : metadata.genre;
          const descToUse = aiOptions.generateDescription ? metaRes.description : metadata.description;
          if(titleToUse) {
              const thumbUrl = await generateThumbnail(titleToUse, genreToUse || "Cinematic", descToUse);
              if(thumbUrl) setThumbnail(thumbUrl);
          }
      }

    } catch (e) {
        console.error(e);
        alert("Erro na geração IA.");
    } finally {
        setGeneratingPhase('idle');
    }
  };

  const handleThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) {
          const reader = new FileReader();
          reader.onloadend = () => setThumbnail(reader.result as string);
          reader.readAsDataURL(f);
      }
  };

  const updateCueText = (id: string, text: string) => updateCue(id, { text });
  const updateCueTime = (id: string, field: 'startTime' | 'endTime', value: string) => updateCue(id, { [field]: value });
  const updateCue = (id: string, changes: Partial<SubtitleCue>) => {
      setCues(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c));
  };
  const deleteCue = (id: string) => { if(confirm('Remover?')) setCues(prev => prev.filter(c => c.id !== id)); };
  const addCue = () => {
      const start = currentTime;
      const newCue: SubtitleCue = {
          id: Math.random().toString(36).substr(2, 9),
          startTime: formatTimeVTT(start),
          endTime: formatTimeVTT(Math.min(start + 2, duration)),
          text: 'Novo texto'
      };
      setCues([...cues, newCue].sort((a, b) => timeToSeconds(a.startTime) - timeToSeconds(b.startTime)));
  };

  const handleAction = () => {
      const finalVtt = isSubtitlesEnabled ? stringifyVTT(cues) : "";
      const safeTrimEnd = trimEnd > 0 ? trimEnd : (duration > 0 ? duration : 99999);
      
      const config: ExportConfig = { showWatermark, trimStart, trimEnd: safeTrimEnd, subStyle, allowSubtitleToggle, adminPassword };
      const videoData: ChannelVideo = {
          id: initialData?.id || Math.random().toString(36).substr(2, 9),
          file, metadata, subtitles: finalVtt, config, thumbnail
      };

      if (onSave) onSave(videoData);
      else if (onDownload) onDownload(metadata, filename, finalVtt, config, generatePublicCopy);
  };

  const activeCue = cues.find(c => currentTime >= timeToSeconds(c.startTime) && currentTime <= timeToSeconds(c.endTime));

  return (
    <div className="h-screen bg-[#0a0a0a] text-white flex flex-col overflow-hidden">
      
      <header className="h-16 border-b border-gray-800 bg-[#111] flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
            <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-800 text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
            </button>
            <h1 className="font-bold text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                {onSave ? 'EDITOR DE CANAL' : 'CLIP STUDIO'}
            </h1>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={triggerAIAnalysis} 
                disabled={generatingPhase !== 'idle'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50"
            >
               {generatingPhase === 'idle' ? 'ANALISAR COM IA' : generatingPhase === 'painting' ? 'GERANDO TAMBINEIO...' : 'PROCESSANDO...'}
            </button>
        </div>
      </header>

      {showAIModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
              <div className="bg-[#1a1a1a] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">
                  <h3 className="text-xl font-bold mb-4 text-white">Opções de Geração IA</h3>
                  <div className="space-y-3 mb-6">
                      <label className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-gray-800 cursor-pointer hover:border-indigo-500/50">
                          <span className="font-medium text-gray-300">Gerar Título</span>
                          <input type="checkbox" checked={aiOptions.generateTitle} onChange={e=>setAiOptions({...aiOptions, generateTitle:e.target.checked})} className="accent-indigo-500 w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-gray-800 cursor-pointer hover:border-indigo-500/50">
                          <span className="font-medium text-gray-300">Gerar Sinopse</span>
                          <input type="checkbox" checked={aiOptions.generateDescription} onChange={e=>setAiOptions({...aiOptions, generateDescription:e.target.checked})} className="accent-indigo-500 w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-gray-800 cursor-pointer hover:border-indigo-500/50">
                          <span className="font-medium text-gray-300">Gerar Legendas</span>
                          <input type="checkbox" checked={aiOptions.generateSubtitles} onChange={e=>setAiOptions({...aiOptions, generateSubtitles:e.target.checked})} className="accent-indigo-500 w-5 h-5" />
                      </label>
                      <label className="flex items-center justify-between p-3 bg-[#111] rounded-lg border border-gray-800 cursor-pointer hover:border-indigo-500/50">
                          <span className="font-medium text-gray-300 flex items-center gap-2">Gerar Tambineio <span className="text-[9px] bg-yellow-600 px-1 rounded text-black font-bold">NANO BANANA</span></span>
                          <input type="checkbox" checked={aiOptions.generateThumbnail} onChange={e=>setAiOptions({...aiOptions, generateThumbnail:e.target.checked})} className="accent-indigo-500 w-5 h-5" />
                      </label>
                  </div>
                  <div className="flex gap-3">
                      <button onClick={() => setShowAIModal(false)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl">CANCELAR</button>
                      <button onClick={confirmAIGeneration} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg">GERAR</button>
                  </div>
              </div>
          </div>
      )}

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-8 overflow-y-auto">
             <div className="relative w-full max-w-4xl aspect-video bg-[#050505] rounded-xl overflow-hidden shadow-2xl border border-gray-800 group">
                 <video ref={videoRef} src={videoUrl} className={`w-full h-full object-contain pointer-events-none ${isAudio ? 'hidden' : ''}`} onLoadedMetadata={handleLoadedMetadata} onTimeUpdate={handleTimeUpdate} poster={thumbnail} />
                 {isAudio && (
                     <div className="absolute inset-0 flex items-center justify-center bg-[#111]">
                         {thumbnail ? <img src={thumbnail} className="w-full h-full object-cover opacity-60" /> : <div className="text-center"><p className="text-gray-500 font-bold">ARQUIVO DE ÁUDIO</p></div>}
                     </div>
                 )}
                 {showWatermark && <div className="absolute top-4 right-4 opacity-50 pointer-events-none z-20"><h3 className="font-black text-white text-xl tracking-tighter"><span className="text-indigo-500">CLIP</span> STUDIO</h3></div>}
                 {isSubtitlesEnabled && activeCue && (
                     <div className="absolute left-0 right-0 text-center select-none z-20" style={{ bottom: `${subStyle.bottomOffset}%` }}>
                         <span className="px-2 py-1 rounded inline-block shadow-lg backdrop-blur-sm transition-all" style={{ fontSize: `${subStyle.fontSize}rem`, backgroundColor: `rgba(0,0,0,${subStyle.bgOpacity})` }}>{activeCue.text}</span>
                     </div>
                 )}
                 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                    {!isPlaying && <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-full flex items-center justify-center pointer-events-auto cursor-pointer" onClick={togglePlay}><svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>}
                 </div>
                 <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/90 to-transparent px-4 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                     <button onClick={togglePlay} className="text-white pointer-events-auto">{isPlaying ? <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg> : <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>}</button>
                     <input type="range" min={0} max={duration} step={0.1} value={currentTime} onChange={(e) => seek(parseFloat(e.target.value))} className="flex-1 accent-indigo-500 h-1 bg-gray-600 rounded-lg cursor-pointer pointer-events-auto" />
                 </div>
             </div>
        </div>

        <div className="w-96 bg-[#111] border-l border-gray-800 flex flex-col">
            <div className="flex border-b border-gray-800">
                <button onClick={() => setActiveTab('edit')} className={`flex-1 py-4 text-xs font-bold uppercase ${activeTab === 'edit' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Detalhes</button>
                <button onClick={() => setActiveTab('subs')} className={`flex-1 py-4 text-xs font-bold uppercase ${activeTab === 'subs' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>Legendas</button>
                <button onClick={() => setActiveTab('export')} className={`flex-1 py-4 text-xs font-bold uppercase ${activeTab === 'export' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-500'}`}>{onSave ? 'SALVAR' : 'EXPORTAR'}</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {activeTab === 'edit' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500">TAMBINEIO</label>
                            <div className="relative group aspect-video bg-[#222] rounded-lg border border-gray-700 overflow-hidden cursor-pointer">
                                {thumbnail ? <img src={thumbnail} className="w-full h-full object-cover" /> : <div className="flex flex-col items-center justify-center h-full text-gray-600"><span className="text-[10px] font-bold">UPLOAD</span></div>}
                                <input type="file" accept="image/*" onChange={handleThumbnailUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                        </div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">TÍTULO</label><input value={metadata.title} onChange={e => setMetadata({...metadata, title: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded p-2 text-sm focus:border-indigo-500 outline-none" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">SINOPSE</label><textarea rows={4} value={metadata.description} onChange={e => setMetadata({...metadata, description: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded p-2 text-sm focus:border-indigo-500 outline-none resize-none" /></div>
                        <div className="space-y-1"><label className="text-xs font-bold text-gray-500">GÊNERO</label><input value={metadata.genre} onChange={e => setMetadata({...metadata, genre: e.target.value})} className="w-full bg-[#222] border border-gray-700 rounded p-2 text-sm focus:border-indigo-500 outline-none" /></div>
                        
                        {/* ASSET DOWNLOADS */}
                        <div className="pt-4 border-t border-gray-800 space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase">BAIXAR ATIVOS ORIGINAIS</label>
                            <div className="flex gap-2">
                                <button onClick={handleDownloadFile} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg> VÍDEO/ÁUDIO
                                </button>
                                {thumbnail && (
                                    <button onClick={handleDownloadThumb} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-2 rounded text-xs font-bold flex items-center justify-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg> THUMB
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* SUBS TAB (UNCHANGED LOGIC - CONDENSED FOR XML LIMITS) */}
                {activeTab === 'subs' && (
                    <div className="space-y-4 h-full flex flex-col animate-fade-in">
                        <div className="flex items-center justify-between bg-[#222] p-3 rounded-lg border border-gray-700">
                            <span className="text-sm font-bold">Habilitar Legendas</span>
                            <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${isSubtitlesEnabled ? 'bg-indigo-600' : 'bg-gray-600'}`} onClick={() => setIsSubtitlesEnabled(!isSubtitlesEnabled)}>
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isSubtitlesEnabled ? 'translate-x-4' : 'translate-x-0'}`}></div>
                            </div>
                        </div>
                        {isSubtitlesEnabled && (
                            <div className="flex-1 flex flex-col min-h-0">
                                <div className="flex-1 space-y-3 overflow-y-auto pr-2 mt-4">
                                    {cues.map((cue) => (
                                        <div key={cue.id} className="p-3 rounded border bg-[#1a1a1a] border-gray-800">
                                            <div className="flex items-center gap-2 mb-2">
                                                <input className="bg-black border border-gray-700 rounded px-1 text-[10px] w-14 text-center text-gray-300" value={cue.startTime} onChange={e => updateCueTime(cue.id, 'startTime', e.target.value)} />
                                                <input className="bg-black border border-gray-700 rounded px-1 text-[10px] w-14 text-center text-gray-300" value={cue.endTime} onChange={e => updateCueTime(cue.id, 'endTime', e.target.value)} />
                                                <button onClick={() => deleteCue(cue.id)} className="ml-auto text-gray-500 hover:text-red-500">X</button>
                                            </div>
                                            <textarea rows={2} value={cue.text} onChange={(e) => updateCueText(cue.id, e.target.value)} className="w-full bg-transparent border-none text-xs text-gray-300 focus:text-white outline-none" />
                                        </div>
                                    ))}
                                    <button onClick={addCue} className="w-full py-2 border border-dashed border-gray-700 text-gray-500 rounded text-xs hover:border-gray-500">+ Adicionar</button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'export' && (
                    <div className="space-y-6 animate-fade-in">
                        <div className="bg-[#222] p-4 rounded-xl border border-gray-700 space-y-4">
                            <h3 className="text-xs font-bold text-gray-400 uppercase">Configurações</h3>
                            <label className="flex items-center justify-between cursor-pointer"><span className="text-sm text-gray-300">Marca d'água</span><input type="checkbox" checked={showWatermark} onChange={e => setShowWatermark(e.target.checked)} className="accent-indigo-500 w-4 h-4" /></label>
                        </div>
                        
                        <div className="bg-[#222] p-4 rounded-xl border border-gray-700 space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase">Proteção ADM (Anti-Invasão)</label>
                            <input type="text" placeholder="Definir Senha de Acesso (Opcional)" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} className="w-full bg-black border border-gray-600 rounded p-2 text-sm text-white focus:border-red-500 outline-none" />
                            <p className="text-[10px] text-gray-500">Se definido, o HTML pedirá senha para acessar o painel de administração.</p>
                            
                            {adminPassword && !onSave && (
                                <label className="flex items-start gap-2 pt-2 border-t border-gray-700 mt-2 cursor-pointer">
                                    <input type="checkbox" checked={generatePublicCopy} onChange={e => setGeneratePublicCopy(e.target.checked)} className="mt-1 accent-indigo-500 w-4 h-4" />
                                    <div>
                                        <span className="text-sm font-bold text-white block">Gerar Cópia Pública (Sem ADM)</span>
                                        <span className="text-[10px] text-gray-400">Baixa um segundo arquivo limpo (sem senha) junto.</span>
                                    </div>
                                </label>
                            )}
                        </div>

                        <button onClick={handleAction} className="w-full py-4 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-500 hover:to-teal-500 text-white font-black text-lg rounded-xl shadow-lg">
                            {onSave ? 'SALVAR NO CANAL' : 'BAIXAR'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
