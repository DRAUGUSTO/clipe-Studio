import React, { useState } from 'react';
import { ChannelMetadata, ChannelVideo, Playlist } from '../types';

interface ManagerProps {
  channelInfo: ChannelMetadata;
  videos: ChannelVideo[];
  playlists: Playlist[];
  onAddVideo: (file: File) => void;
  onEditVideo: (video: ChannelVideo) => void;
  onDeleteVideo: (id: string) => void;
  onAddPlaylist: (playlist: Playlist) => void;
  onDeletePlaylist: (id: string) => void;
  onFinish: () => void;
  onBack: () => void;
}

export const ChannelVideoManager: React.FC<ManagerProps> = ({ 
  channelInfo, videos, playlists, onAddVideo, onEditVideo, onDeleteVideo, onAddPlaylist, onDeletePlaylist, onFinish, onBack 
}) => {
  const [activeTab, setActiveTab] = useState<'videos' | 'series'>('videos');
  
  // State for Creating Playlist
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  const [newPlaylistTitle, setNewPlaylistTitle] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState<string[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onAddVideo(e.target.files[0]);
    }
  };

  const handleCreatePlaylist = () => {
    if (!newPlaylistTitle) return alert("Digite um nome para a série.");
    if (selectedVideoIds.length === 0) return alert("Selecione pelo menos um vídeo.");
    
    onAddPlaylist({
        id: Math.random().toString(36).substr(2, 9),
        title: newPlaylistTitle,
        videoIds: selectedVideoIds
    });
    
    // Reset
    setNewPlaylistTitle('');
    setSelectedVideoIds([]);
    setIsCreatingPlaylist(false);
  };

  const toggleVideoSelection = (vidId: string) => {
      setSelectedVideoIds(prev => 
        prev.includes(vidId) ? prev.filter(id => id !== vidId) : [...prev, vidId]
      );
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      
      {/* Top Bar */}
      <header className="h-20 bg-[#111] border-b border-gray-800 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
           {channelInfo.logoBase64 && (
             <img src={channelInfo.logoBase64} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-700" />
           )}
           <div>
             <h1 className="font-bold text-xl">{channelInfo.name}</h1>
             <p className="text-xs text-gray-500">Painel de Conteúdo</p>
           </div>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm font-bold">VOLTAR AO MENU</button>
      </header>

      {/* Tabs */}
      <div className="flex border-b border-gray-800 bg-[#0f0f0f] px-8">
          <button 
            onClick={() => setActiveTab('videos')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'videos' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              TODOS OS VÍDEOS ({videos.length})
          </button>
          <button 
            onClick={() => setActiveTab('series')}
            className={`py-4 px-6 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'series' ? 'border-red-600 text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
          >
              SÉRIES / PLAYLISTS ({playlists.length})
              <span className="bg-red-900/40 text-red-500 text-[9px] px-1 rounded">PARTE 5</span>
          </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        
        {activeTab === 'videos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
                {/* Add New Card */}
                <label className="border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-10 cursor-pointer hover:border-red-500 hover:bg-gray-900/30 transition-all min-h-[250px]">
                    <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    </div>
                    <span className="font-bold text-gray-400">ADICIONAR VÍDEO</span>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                </label>

                {/* Video Cards */}
                {videos.map((video) => (
                    <div key={video.id} className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-lg group hover:border-gray-600 transition-colors flex flex-col">
                        <div className="h-32 bg-gray-900 flex items-center justify-center relative">
                            <svg className="w-12 h-12 text-gray-700" fill="currentColor" viewBox="0 0 24 24"><path d="M10 16.5l6-4.5-6-4.5v9zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/></svg>
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-bold text-base mb-1 line-clamp-1">{video.metadata.title}</h3>
                            <p className="text-gray-500 text-xs line-clamp-2 mb-3 flex-1">{video.metadata.description || 'Sem descrição.'}</p>
                            <div className="flex gap-2 mt-auto">
                                <button onClick={() => onEditVideo(video)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-1.5 rounded text-xs font-bold">EDITAR</button>
                                <button onClick={() => onDeleteVideo(video.id)} className="w-8 flex items-center justify-center bg-gray-900 hover:bg-red-900/50 text-gray-500 hover:text-red-500 rounded"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {activeTab === 'series' && (
            <div className="animate-fade-in h-full flex flex-col">
                {!isCreatingPlaylist ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                         <button 
                            onClick={() => setIsCreatingPlaylist(true)}
                            className="border-2 border-dashed border-gray-700 rounded-2xl flex flex-col items-center justify-center p-10 hover:border-red-500 hover:bg-gray-900/30 transition-all min-h-[200px]"
                         >
                            <span className="text-3xl font-black text-gray-600 mb-2">+</span>
                            <span className="font-bold text-gray-400">CRIAR NOVA SÉRIE</span>
                         </button>

                         {playlists.map(pl => (
                             <div key={pl.id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 relative group">
                                 <h3 className="text-xl font-bold mb-2">{pl.title}</h3>
                                 <div className="text-sm text-gray-500 mb-4">{pl.videoIds.length} episódio(s)</div>
                                 <div className="flex -space-x-2 mb-4 overflow-hidden">
                                     {pl.videoIds.slice(0, 5).map(vidId => (
                                         <div key={vidId} className="w-8 h-8 rounded-full bg-gray-700 border border-[#111] flex items-center justify-center text-[8px] text-gray-400">VID</div>
                                     ))}
                                 </div>
                                 <button onClick={() => onDeletePlaylist(pl.id)} className="absolute top-4 right-4 text-gray-600 hover:text-red-500"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
                             </div>
                         ))}
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
                        <div className="p-6 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="font-bold text-lg">Nova Série</h2>
                            <button onClick={() => setIsCreatingPlaylist(false)} className="text-sm text-gray-500 hover:text-white">Cancelar</button>
                        </div>
                        <div className="p-6 flex-1 overflow-y-auto">
                            <div className="mb-6">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Nome da Série</label>
                                <input 
                                    className="w-full bg-black border border-gray-700 rounded p-3 text-white focus:border-red-500 outline-none" 
                                    placeholder="Ex: Temporada 1, Maratona de Terror..."
                                    value={newPlaylistTitle}
                                    onChange={e => setNewPlaylistTitle(e.target.value)}
                                />
                            </div>
                            <div className="mb-2">
                                <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Selecionar Episódios ({selectedVideoIds.length})</label>
                                <div className="space-y-2">
                                    {videos.length === 0 && <p className="text-gray-500 text-sm">Nenhum vídeo disponível no canal.</p>}
                                    {videos.map(video => (
                                        <div 
                                            key={video.id} 
                                            onClick={() => toggleVideoSelection(video.id)}
                                            className={`flex items-center gap-4 p-3 rounded cursor-pointer border ${selectedVideoIds.includes(video.id) ? 'bg-red-900/20 border-red-500' : 'bg-gray-900/30 border-transparent hover:bg-gray-800'}`}
                                        >
                                            <div className={`w-5 h-5 rounded border flex items-center justify-center ${selectedVideoIds.includes(video.id) ? 'bg-red-600 border-red-600' : 'border-gray-500'}`}>
                                                {selectedVideoIds.includes(video.id) && <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg>}
                                            </div>
                                            <span className="text-sm font-medium">{video.metadata.title}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-800 bg-black/50">
                             <button onClick={handleCreatePlaylist} className="w-full py-3 bg-red-600 hover:bg-red-500 rounded-lg font-bold">CRIAR SÉRIE</button>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>

      {/* Footer Actions */}
      <footer className="h-24 border-t border-gray-800 bg-[#111] flex items-center justify-end px-8">
          <div className="flex items-center gap-6">
             <div className="text-right">
                 <p className="text-sm text-gray-400">Resumo</p>
                 <p className="text-xs text-gray-500">
                    <span className="text-white font-bold">{videos.length}</span> Vídeos • <span className="text-white font-bold">{playlists.length}</span> Séries
                 </p>
             </div>
             <button 
                onClick={onFinish}
                disabled={videos.length === 0}
                className="px-8 py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2"
             >
                 GERAR CANAL FINAL <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3"/></svg>
             </button>
          </div>
      </footer>
    </div>
  );
};