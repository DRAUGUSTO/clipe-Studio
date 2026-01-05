import React, { useState } from 'react';
import { VideoUploader } from './components/VideoUploader';
import { ClipStudioEditor } from './components/VideoEditor'; 
import { ChannelSetup } from './components/ChannelSetup';
import { ChannelVideoManager } from './components/ChannelVideoManager';
import { HubManager } from './components/HubManager';
import { MovieMetadata, ExportConfig, ChannelMetadata, ChannelVideo, Playlist, HubMetadata, ChannelPackage } from './types';
import { generateStandaloneHtml, generateChannelHtml, generateHubHtml } from './utils/htmlGenerator';

type AppMode = 'home' | 'single' | 'channel-setup' | 'channel-manager' | 'channel-editor' | 'hub-manager' | 'hub-channel-setup' | 'hub-channel-content';

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>('home');
  const [file, setFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // --- CHANNEL MODE STATE ---
  const [channelData, setChannelData] = useState<ChannelMetadata | null>(null);
  const [channelVideos, setChannelVideos] = useState<ChannelVideo[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  
  // --- HUB MODE STATE ---
  const [hubData, setHubData] = useState<HubMetadata | null>(null);
  const [hubChannels, setHubChannels] = useState<ChannelPackage[]>([]);
  const [currentHubChannelIndex, setCurrentHubChannelIndex] = useState<number | null>(null);

  // --- EDITOR STATE (SHARED) ---
  const [editingVideo, setEditingVideo] = useState<ChannelVideo | null>(null);
  const [editingFile, setEditingFile] = useState<File | null>(null);

  // --- HELPER: Read File to Base64 ---
  const readFileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  };

  // --- SINGLE MODE DOWNLOAD (Updated for Dual Gen) ---
  const downloadSingle = (metadata: MovieMetadata, filename: string, subtitles: string, config: ExportConfig, generatePublicCopy: boolean) => {
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      
      // 1. Generate Main File (with Config as passed)
      const htmlMain = generateStandaloneHtml(base64, file.type, metadata, subtitles, config);
      triggerDownload(htmlMain, filename + (config.adminPassword ? "_ADM" : ""));

      // 2. Generate Public Copy if requested
      if (generatePublicCopy && config.adminPassword) {
           const publicConfig = { ...config, adminPassword: '' };
           const htmlPublic = generateStandaloneHtml(base64, file.type, metadata, subtitles, publicConfig);
           setTimeout(() => {
               triggerDownload(htmlPublic, filename + "_PUBLIC");
           }, 500); // Slight delay to ensure browser handles two downloads
      }
    };
  };

  // --- CHANNEL FLOW ---
  const handleChannelSetupComplete = (data: ChannelMetadata) => {
    setChannelData({ ...data, id: 'main' });
    setCurrentHubChannelIndex(null); 
    setMode('channel-manager');
  };

  // --- HUB FLOW ---
  const startHub = () => {
      setHubData({ name: 'Clip Hub', design: 'netflix' });
      setHubChannels([]);
      setCurrentHubChannelIndex(null);
      setMode('hub-manager');
  };

  const handleCreateChannelInHub = () => {
      setMode('hub-channel-setup');
  };

  const handleHubChannelSetupDone = (data: ChannelMetadata) => {
      const newPkg: ChannelPackage = {
          metadata: { ...data, id: Math.random().toString(36).substr(2, 9) },
          videos: [],
          playlists: []
      };
      setHubChannels([...hubChannels, newPkg]);
      setMode('hub-manager');
  };

  const handleManageHubChannel = (index: number) => {
      setCurrentHubChannelIndex(index);
      setMode('hub-channel-content');
  };

  const updateHubChannelContent = (videos: ChannelVideo[], pls: Playlist[]) => {
      if (currentHubChannelIndex === null) return;
      setHubChannels(prev => {
          const updated = [...prev];
          if (updated[currentHubChannelIndex]) {
              updated[currentHubChannelIndex] = { ...updated[currentHubChannelIndex], videos: videos, playlists: pls };
          }
          return updated;
      });
  };

  const handleAddVideo = (file: File) => {
      setEditingFile(file);
      setEditingVideo(null);
      if (mode === 'channel-manager') {
          setMode('channel-editor');
      }
  };

  const handleEditVideo = (video: ChannelVideo) => {
      setEditingFile(video.file);
      setEditingVideo(video);
      if (mode === 'channel-manager') {
          setMode('channel-editor');
      }
  };

  const handleSaveEditor = (videoData: ChannelVideo) => {
      if (mode === 'hub-channel-content' && currentHubChannelIndex !== null) {
          setHubChannels(prev => {
              const updated = [...prev];
              if (currentHubChannelIndex >= updated.length) return prev;
              const currentPkg = updated[currentHubChannelIndex];
              const exists = currentPkg.videos.find(v => v.id === videoData.id);
              let newVideos = [];
              if(exists) {
                  newVideos = currentPkg.videos.map(v => v.id === videoData.id ? videoData : v);
              } else {
                  newVideos = [...currentPkg.videos, videoData];
              }
              updated[currentHubChannelIndex] = { ...currentPkg, videos: newVideos };
              return updated;
          });
      } 
      else if (mode === 'channel-editor' || mode === 'channel-manager') {
          setChannelVideos(prev => {
              const exists = prev.find(v => v.id === videoData.id);
              return exists ? prev.map(v => v.id === videoData.id ? videoData : v) : [...prev, videoData];
          });
          setMode('channel-manager');
      }
      setEditingFile(null);
      setEditingVideo(null);
  };

  const handleCancelEditor = () => {
      setEditingFile(null);
      setEditingVideo(null);
      if (mode === 'channel-editor') {
          setMode('channel-manager');
      }
  };

  // --- GENERATION HANDLERS ---
  const handleFinishChannel = async () => {
      if (!channelData) return;
      if (channelVideos.length === 0) return alert("Adicione pelo menos um vídeo antes de gerar.");
      
      setIsGenerating(true);
      try {
          const processedVideos = await Promise.all(channelVideos.map(async (v) => ({
              src: await readFileToBase64(v.file), type: v.file.type, data: v
          })));
          const htmlContent = generateChannelHtml(channelData, processedVideos, playlists);
          triggerDownload(htmlContent, channelData.name);
      } catch (e) { console.error(e); alert('Erro ao gerar HTML.'); } finally { setIsGenerating(false); }
  };

  const handleFinishHub = async (finalHubData: HubMetadata, generatePublicCopy: boolean) => {
      if (hubChannels.length === 0) return alert("Adicione pelo menos um canal.");
      const totalVideos = hubChannels.reduce((acc, curr) => acc + curr.videos.length, 0);
      if (totalVideos === 0) return alert("Seus canais estão vazios. Adicione vídeos neles.");

      setIsGenerating(true);
      try {
          const applyLimit = hubChannels.length > 5;
          const processedChannels = await Promise.all(hubChannels.map(async (pkg) => {
              let videosToProcess = pkg.videos;
              if (applyLimit && videosToProcess.length > 10) videosToProcess = videosToProcess.slice(0, 10);
              
              const processedVideos = await Promise.all(videosToProcess.map(async (v) => ({
                  src: await readFileToBase64(v.file), type: v.file.type, data: v
              })));

              return { metadata: pkg.metadata, videos: processedVideos, playlists: pkg.playlists };
          }));

          // 1. Main Download (ADM)
          const htmlContent = generateHubHtml(finalHubData, processedChannels);
          triggerDownload(htmlContent, "Clip_Hub_ADM");

          // 2. Public Copy Download
          if (generatePublicCopy && finalHubData.adminPassword) {
              const publicData = { ...finalHubData, adminPassword: '' };
              const htmlPublic = generateHubHtml(publicData, processedChannels);
              setTimeout(() => {
                  triggerDownload(htmlPublic, "Clip_Hub_PUBLICO");
              }, 1000);
          }
      } catch (e) { console.error(e); alert('Erro crítico ao gerar Hub.'); } finally { setIsGenerating(false); }
  };

  const triggerDownload = (content: string, name: string) => {
      const blob = new Blob([content], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name.replace(/[^a-z0-9]/gi, '_')}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
  };

  if (isGenerating) {
      return (
          <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6">
              <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
              <h2 className="text-2xl font-bold mt-4">Compilando...</h2>
              <p className="text-gray-400">Isso pode levar um minuto. Não feche a aba.</p>
          </div>
      );
  }

  if (mode === 'hub-manager') {
      return <HubManager 
          hubData={hubData!} 
          channels={hubChannels} 
          onUpdateHub={setHubData}
          onAddChannel={handleCreateChannelInHub}
          onManageChannel={handleManageHubChannel}
          onDeleteChannel={(idx) => setHubChannels(prev => prev.filter((_, i) => i !== idx))}
          onGenerate={handleFinishHub}
          onBack={() => setMode('home')}
      />;
  }

  if (mode === 'hub-channel-setup') {
      return <ChannelSetup onNext={handleHubChannelSetupDone} onBack={() => setMode('hub-manager')} />;
  }

  if (mode === 'hub-channel-content' && currentHubChannelIndex !== null) {
      if (editingFile) {
          return <ClipStudioEditor 
              file={editingFile}
              initialData={editingVideo || undefined}
              onBack={handleCancelEditor}
              onSave={handleSaveEditor}
          />;
      }
      const pkg = hubChannels[currentHubChannelIndex];
      if (!pkg) { setMode('hub-manager'); return null; }
      return <ChannelVideoManager 
          channelInfo={pkg.metadata}
          videos={pkg.videos}
          playlists={pkg.playlists}
          onAddVideo={handleAddVideo}
          onEditVideo={handleEditVideo}
          onDeleteVideo={(id) => updateHubChannelContent(pkg.videos.filter(v => v.id !== id), pkg.playlists)}
          onAddPlaylist={(pl) => updateHubChannelContent(pkg.videos, [...pkg.playlists, pl])}
          onDeletePlaylist={(id) => updateHubChannelContent(pkg.videos, pkg.playlists.filter(p => p.id !== id))}
          onFinish={() => setMode('hub-manager')} 
          onBack={() => setMode('hub-manager')}
      />;
  }

  if ((mode === 'channel-editor') && editingFile) {
      return <ClipStudioEditor 
          file={editingFile}
          initialData={editingVideo || undefined}
          onBack={handleCancelEditor}
          onSave={handleSaveEditor}
      />;
  }

  if (mode === 'channel-setup') return <ChannelSetup onNext={handleChannelSetupComplete} onBack={() => setMode('home')} />;
  if (mode === 'channel-manager' && channelData) return <ChannelVideoManager channelInfo={channelData} videos={channelVideos} playlists={playlists} onAddVideo={handleAddVideo} onEditVideo={handleEditVideo} onDeleteVideo={(id) => setChannelVideos(prev => prev.filter(v => v.id !== id))} onAddPlaylist={(pl) => setPlaylists(prev => [...prev, pl])} onDeletePlaylist={(id) => setPlaylists(prev => prev.filter(p => p.id !== id))} onFinish={handleFinishChannel} onBack={() => setMode('home')} />;
  if (mode === 'single' && file) return <ClipStudioEditor file={file} onBack={() => setFile(null)} onDownload={downloadSingle} />;
  if (mode === 'single' && !file) return <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6"><button onClick={() => setMode('home')} className="mb-4 text-gray-500">Voltar</button><div className="bg-[#111] border border-gray-800 p-1 rounded-3xl"><VideoUploader onFileSelect={setFile} isLoading={false} /></div></div>;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      <div className="flex-1 flex flex-col items-center justify-center relative p-6">
        <div className="relative z-10 w-full max-w-5xl text-center space-y-12 animate-fade-in">
          <div className="space-y-2">
              <h1 className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                CLIP STUDIO
              </h1>
              <p className="text-xl text-gray-400 font-light tracking-wide">
                A Suíte Definitiva de Criação de Streaming
              </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <button onClick={() => setMode('single')} className="group relative bg-[#111] border border-gray-800 p-8 rounded-3xl hover:border-indigo-500 transition-all text-left">
                <div className="absolute top-6 right-6 text-gray-700 group-hover:text-indigo-500 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-indigo-400">Vídeo Único</h3>
                <p className="text-sm text-gray-500">Crie um player standalone HTML5 profissional.</p>
             </button>

             <button onClick={() => setMode('channel-setup')} className="group relative bg-[#111] border border-gray-800 p-8 rounded-3xl hover:border-red-600 transition-all text-left">
                <div className="absolute top-6 right-6 text-gray-700 group-hover:text-red-600 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/></svg></div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-red-500">Canal Completo</h3>
                <p className="text-sm text-gray-500">Crie sua própria "Mini Netflix" com séries e temporadas.</p>
             </button>

             <button onClick={startHub} className="group relative bg-[#111] border border-gray-800 p-8 rounded-3xl hover:border-yellow-500 transition-all text-left">
                <div className="absolute top-6 right-6 text-gray-700 group-hover:text-yellow-500 transition-colors"><svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/></svg></div>
                <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-yellow-400">Clip Hub</h3>
                <p className="text-sm text-gray-500">Agregue múltiplos canais em um único aplicativo.</p>
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default App;
