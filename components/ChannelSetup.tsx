import React, { useState } from 'react';
import { ChannelMetadata } from '../types';

interface ChannelSetupProps {
  onNext: (data: ChannelMetadata) => void;
  onBack: () => void;
}

export const ChannelSetup: React.FC<ChannelSetupProps> = ({ onNext, onBack }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [logo, setLogo] = useState<string | null>(null);
  const [music, setMusic] = useState<string | null>(null);
  const [musicName, setMusicName] = useState<string>('');

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMusicName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => setMusic(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleContinue = () => {
    if (!name) return alert("Por favor, dê um nome ao seu canal.");
    onNext({ 
      name, 
      description, 
      logoBase64: logo,
      backgroundMusicBase64: music
    });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="w-full max-w-2xl">
        <button onClick={onBack} className="mb-8 text-gray-500 hover:text-white flex items-center gap-2 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18"/></svg>
          Voltar ao Menu
        </button>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
              CRIAR SEU CANAL
            </h2>
            <p className="text-gray-400">Configure a identidade da sua "Mini Netflix"</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Logo */}
            <div className="flex flex-col items-center gap-4">
              <label className="relative group cursor-pointer">
                <div className={`w-32 h-32 rounded-full border-2 border-dashed flex items-center justify-center overflow-hidden transition-all ${logo ? 'border-red-500' : 'border-gray-700 hover:border-gray-500'}`}>
                  {logo ? (
                    <img src={logo} alt="Logo Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-center">
                        <svg className="w-8 h-8 mx-auto text-gray-600 group-hover:text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-[10px] text-gray-500 uppercase font-bold">Logo</span>
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 bg-red-600 rounded-full p-2 shadow-lg hover:scale-110 transition-transform">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              </label>
            </div>

            {/* Right Column: Inputs */}
            <div className="md:col-span-2 space-y-5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nome do Canal</label>
                <input 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: CineMundo"
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition-colors"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Descrição / Slogan</label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="O melhor do cinema independente..."
                  rows={2}
                  className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none transition-colors resize-none"
                />
              </div>

              <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                      Música de Fundo (Ambiente) 
                      <span className="bg-red-900/30 text-red-400 text-[9px] px-1 rounded">PARTE 4</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 bg-[#0a0a0a] border border-gray-700 rounded-lg cursor-pointer hover:border-gray-500 transition-colors group">
                      <div className="bg-gray-800 p-2 rounded-full group-hover:bg-gray-700">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                      </div>
                      <div className="flex-1 overflow-hidden">
                          <p className="text-sm font-medium text-gray-300 truncate">{musicName || "Selecione um arquivo de áudio (.mp3)"}</p>
                      </div>
                      <input type="file" accept="audio/*" className="hidden" onChange={handleMusicUpload} />
                  </label>
              </div>
            </div>
          </div>

          <button 
            onClick={handleContinue}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg rounded-xl shadow-lg transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
          >
            PRÓXIMO: GERENCIAR CONTEÚDO <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
};