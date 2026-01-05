import React from 'react';

interface VideoUploaderProps {
  onFileSelect: (file: File) => void;
  isLoading: boolean;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onFileSelect, isLoading }) => {
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    // Aceita video/* e audio/*
    if (e.dataTransfer.files?.[0]) {
        const f = e.dataTransfer.files[0];
        if(f.type.startsWith('video/') || f.type.startsWith('audio/')) {
            onFileSelect(f);
        }
    }
  };

  return (
    <div 
      className={`border-2 border-dashed border-gray-700 rounded-2xl p-16 text-center transition-all cursor-pointer group bg-black/40 backdrop-blur-sm ${isLoading ? 'opacity-50' : 'hover:border-red-600 hover:bg-black/60'}`}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={() => document.getElementById('fileInput')?.click()}
    >
      <input 
        id="fileInput"
        type="file" 
        className="hidden" 
        accept="video/*,audio/*" 
        onChange={(e) => e.target.files?.[0] && onFileSelect(e.target.files[0])} 
        disabled={isLoading}
      />
      
      <div className="flex flex-col items-center gap-6">
        <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center group-hover:bg-red-600 transition-colors">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
        </div>
        <div>
            <h3 className="text-2xl font-bold text-white mb-2">Arraste seu Mídia aqui</h3>
            <p className="text-gray-400">Suporta Vídeo (MP4) e Música (MP3)</p>
        </div>
      </div>
    </div>
  );
};