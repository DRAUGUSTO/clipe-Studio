import React, { useState } from 'react';
import { HubMetadata, ChannelPackage, HubDesign } from '../types';

interface HubManagerProps {
  hubData: HubMetadata;
  channels: ChannelPackage[];
  onUpdateHub: (data: HubMetadata) => void;
  onAddChannel: () => void;
  onManageChannel: (index: number) => void;
  onDeleteChannel: (index: number) => void;
  onGenerate: (data: HubMetadata, generatePublic: boolean) => void;
  onBack: () => void;
}

export const HubManager: React.FC<HubManagerProps> = ({
  hubData,
  channels,
  onUpdateHub,
  onAddChannel,
  onManageChannel,
  onDeleteChannel,
  onGenerate,
  onBack
}) => {
  const maxChannels = 15;
  const isVideoLimitActive = channels.length > 5;
  const [generatePublic, setGeneratePublic] = useState(false);

  const handleDesignSelect = (design: HubDesign) => {
    onUpdateHub({ ...hubData, design });
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col font-sans">
      
      {/* Header */}
      <header className="h-20 bg-[#111] border-b border-gray-800 flex items-center justify-between px-8">
        <div className="flex items-center gap-4">
           <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center font-black text-black text-xl">
             H
           </div>
           <div>
             <h1 className="font-bold text-xl">CLIP HUB MANAGER</h1>
             <p className="text-xs text-gray-500">Central de Multi-Canais</p>
           </div>
        </div>
        <button onClick={onBack} className="text-gray-500 hover:text-white text-sm font-bold">VOLTAR AO MENU</button>
      </header>

      <div className="flex-1 flex overflow-hidden">
        
        {/* Main Content: Channel Grid */}
        <div className="flex-1 p-8 overflow-y-auto">
          
          <div className="mb-8">
            <h2 className="text-2xl font-black mb-2">SEUS CANAIS ({channels.length}/{maxChannels})</h2>
            {isVideoLimitActive && (
              <div className="bg-yellow-900/30 border border-yellow-600/50 text-yellow-500 p-4 rounded-xl flex items-center gap-3">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
                <p className="text-sm font-bold">Aviso de Performance: Como você tem mais de 5 canais, cada canal será limitado a 10 vídeos na exportação final.</p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <button onClick={onAddChannel} disabled={channels.length >= maxChannels} className="border-2 border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-10 hover:border-yellow-500 hover:bg-gray-900/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed min-h-[200px]">
              <span className="text-4xl text-gray-600 font-light mb-2">+</span>
              <span className="font-bold text-gray-400">NOVO CANAL</span>
            </button>
            {channels.map((pkg, idx) => (
              <div key={pkg.metadata.id} className="bg-[#111] border border-gray-800 rounded-2xl p-6 relative group hover:border-gray-600 transition-colors">
                 <div className="flex items-center gap-4 mb-4">
                    {pkg.metadata.logoBase64 ? <img src={pkg.metadata.logoBase64} className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold">{pkg.metadata.name.substring(0,2)}</div>}
                    <div><h3 className="font-bold text-lg leading-tight">{pkg.metadata.name}</h3><p className="text-xs text-gray-500">{pkg.videos.length} Vídeos • {pkg.playlists.length} Séries</p></div>
                 </div>
                 <div className="flex gap-2 mt-4">
                   <button onClick={() => onManageChannel(idx)} className="flex-1 bg-gray-800 hover:bg-white hover:text-black text-white py-2 rounded-lg text-sm font-bold transition-colors">GERENCIAR</button>
                   <button onClick={() => onDeleteChannel(idx)} className="w-10 flex items-center justify-center bg-gray-900 hover:bg-red-900 text-gray-500 hover:text-red-500 rounded-lg transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg></button>
                 </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Config */}
        <div className="w-96 bg-[#111] border-l border-gray-800 p-8 flex flex-col">
          <h3 className="text-sm font-bold text-gray-500 uppercase mb-6">Configuração do Hub</h3>
          <div className="space-y-6 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400">NOME DO APLICATIVO</label>
              <input value={hubData.name} onChange={e => onUpdateHub({...hubData, name: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none" placeholder="Clip Hub" />
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-red-500 uppercase flex items-center gap-2">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                    SENHA DE ACESSO (ADM)
                </label>
                <input type="text" value={hubData.adminPassword || ''} onChange={e => onUpdateHub({...hubData, adminPassword: e.target.value})} className="w-full bg-[#0a0a0a] border border-gray-700 rounded-lg p-3 text-white focus:border-red-500 outline-none" placeholder="Opcional: Bloquear App" />
                <p className="text-[10px] text-gray-500">Se preenchido, será exigida senha ao abrir o arquivo.</p>
                
                {hubData.adminPassword && (
                    <label className="flex items-start gap-2 pt-2 border-t border-gray-700 mt-2 cursor-pointer">
                        <input type="checkbox" checked={generatePublic} onChange={e => setGeneratePublic(e.target.checked)} className="mt-1 accent-yellow-500 w-4 h-4" />
                        <div>
                            <span className="text-sm font-bold text-white block">Gerar Cópia Pública (Sem ADM)</span>
                            <span className="text-[10px] text-gray-400">Baixa um segundo arquivo limpo (sem senha) junto.</span>
                        </div>
                    </label>
                )}
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-800">
              <label className="text-xs font-bold text-gray-400">DESIGN DO HUB</label>
              <div onClick={() => handleDesignSelect('netflix')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${hubData.design === 'netflix' ? 'border-red-600 bg-red-900/10' : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-600'}`}>
                <div className="flex items-center justify-between mb-2"><span className="font-bold">Estilo Streamer</span>{hubData.design === 'netflix' && <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_red]"></div>}</div>
              </div>
              <div onClick={() => handleDesignSelect('youtube')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${hubData.design === 'youtube' ? 'border-red-600 bg-red-900/10' : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-600'}`}>
                <div className="flex items-center justify-between mb-2"><span className="font-bold">Estilo Social</span>{hubData.design === 'youtube' && <div className="w-3 h-3 bg-red-600 rounded-full shadow-[0_0_10px_red]"></div>}</div>
              </div>
              <div onClick={() => handleDesignSelect('custom')} className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${hubData.design === 'custom' ? 'border-indigo-600 bg-indigo-900/10' : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-600'}`}>
                <div className="flex items-center justify-between mb-2"><span className="font-bold">Design Clip Modern</span>{hubData.design === 'custom' && <div className="w-3 h-3 bg-indigo-600 rounded-full shadow-[0_0_10px_indigo]"></div>}</div>
              </div>
            </div>
          </div>

          <button onClick={() => onGenerate(hubData, generatePublic)} disabled={channels.length === 0} className="w-full py-4 bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl shadow-lg transition-all">
            GERAR CLIP HUB
          </button>
        </div>
      </div>
    </div>
  );
};
