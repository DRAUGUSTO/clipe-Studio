export interface MovieMetadata {
  title: string;
  description: string;
  genre: string;
  ageRating: 'L' | '10' | '12' | '14' | '16' | '18';
}

export interface SubtitleData {
  vttContent: string;
  hasSpeech: boolean;
}

export interface SubtitleCue {
  id: string;
  startTime: string;
  endTime: string;
  text: string;
}

export interface SubtitleStyle {
  fontSize: number; // em REM
  bottomOffset: number; // em %
  bgOpacity: number; // 0 a 1
}

export interface ExportConfig {
  showWatermark: boolean;
  trimStart: number;
  trimEnd: number;
  subStyle: SubtitleStyle;
  allowSubtitleToggle: boolean;
  adminPassword?: string; // Nova propriedade para senha de proteção
}

// Novos tipos para o Modo Canal
export interface ChannelMetadata {
  id: string; // Adicionado ID para o Hub saber quem é quem
  name: string;
  description: string;
  logoBase64: string | null;
  backgroundMusicBase64?: string | null;
}

export interface ChannelVideo {
  id: string;
  file: File;
  metadata: MovieMetadata;
  subtitles: string; // VTT content
  thumbnail?: string;
  config: ExportConfig;
}

export interface Playlist {
  id: string;
  title: string;
  videoIds: string[];
}

export interface AIOptions {
  generateTitle: boolean;
  generateDescription: boolean;
  generateGenre: boolean;
  generateRating: boolean;
  generateSubtitles: boolean;
  generateThumbnail: boolean;
}

// --- PARTE 6: CLIP HUB ---
export type HubDesign = 'netflix' | 'youtube' | 'custom';

export interface HubMetadata {
  name: string;
  design: HubDesign;
  adminPassword?: string; // Senha global para o Hub
}

export interface ChannelPackage {
  metadata: ChannelMetadata;
  videos: ChannelVideo[];
  playlists: Playlist[];
}