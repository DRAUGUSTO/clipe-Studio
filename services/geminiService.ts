import { GoogleGenAI, Type } from "@google/genai";
import { MovieMetadata, SubtitleData, AIOptions } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Converte arquivo para Base64 para envio à IA
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

export const generateMovieMetadata = async (file: File, options: AIOptions, currentMeta: MovieMetadata): Promise<MovieMetadata> => {
  try {
    // Se não precisa gerar nada de texto, retorna o atual
    if (!options.generateTitle && !options.generateDescription && !options.generateGenre && !options.generateRating) {
        return currentMeta;
    }

    // Converter arquivo para envio
    const filePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        filePart as any,
        { 
          text: `Analise este arquivo de mídia (vídeo ou áudio) com profundidade e gere metadados para streaming.
          O nome original do arquivo é "${file.name}".
          
          Se for áudio (música/podcast): Identifique o tema, humor ou letra.
          Se for vídeo: Analise a cena visualmente.
          
          Requisitos:
          ${options.generateTitle ? '- Gere um Título criativo baseado no conteúdo real.' : '- MANTENHA o título atual.'}
          ${options.generateDescription ? '- Gere uma Sinopse atraente (máx 3 frases) descrevendo o que acontece.' : '- MANTENHA a sinopse atual.'}
          ${options.generateGenre ? '- Identifique o Gênero real (ex: Terror, Comédia, Podcast, Vlog, Tutorial).' : '- MANTENHA o gênero atual.'}
          ${options.generateRating ? '- Estime a Classificação Indicativa (L, 10, 12, 14, 16, 18) baseada em violência/linguagem.' : '- MANTENHA a classificação atual.'}
          
          Retorne JSON.`
        }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            genre: { type: Type.STRING },
            ageRating: { type: Type.STRING, enum: ["L", "10", "12", "14", "16", "18"] }
          },
          required: ["title", "description", "genre", "ageRating"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text) as MovieMetadata;
      // Merge com o atual baseado nas opções
      return {
          title: options.generateTitle ? result.title : currentMeta.title,
          description: options.generateDescription ? result.description : currentMeta.description,
          genre: options.generateGenre ? result.genre : currentMeta.genre,
          ageRating: options.generateRating ? (result.ageRating as any) : currentMeta.ageRating,
      };
    }
    throw new Error("Resposta vazia da IA");
  } catch (error) {
    console.error("Erro ao gerar metadados:", error);
    return currentMeta;
  }
};

export const generateThumbnail = async (title: string, genre: string, description: string): Promise<string | null> => {
    try {
        // Enriquecendo o prompt com a descrição para a imagem ser mais fiel ao conteúdo
        const prompt = `Crie uma capa de filme (thumbnail) cinematográfica, 4k, estilo poster de streaming.
        Filme: "${title}"
        Gênero: "${genre}"
        Contexto Visual: "${description}"
        Sem textos na imagem, apenas arte visual impactante e coerente com o gênero.`;
        
        // Using Nano Banana for Image Generation
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: prompt }] },
            config: {
                // Nano Banana does not support responseMimeType for images
            }
        });

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData && part.inlineData.data) {
                    return `data:image/png;base64,${part.inlineData.data}`;
                }
            }
        }
        return null;
    } catch (error) {
        console.error("Erro ao gerar tambineio:", error);
        return null;
    }
};

export const generateSubtitles = async (file: File): Promise<SubtitleData> => {
  try {
    const filePart = await fileToGenerativePart(file);

    const prompt = `
      Transcreva o áudio para WebVTT (pt-BR).
      Se for música, tente transcrever a letra se for audível.
      Retorne JSON com 'hasSpeech' true se houver voz/letra.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        filePart as any, 
        { text: prompt }
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                hasSpeech: { type: Type.BOOLEAN },
                vttContent: { type: Type.STRING }
            }
        }
      }
    });

    if (response.text) {
        return JSON.parse(response.text) as SubtitleData;
    }
    throw new Error("Falha na geração de legendas");
  } catch (error) {
    console.error("Erro na legenda:", error);
    return { hasSpeech: false, vttContent: "" };
  }
};