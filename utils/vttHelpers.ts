import { SubtitleCue } from "../types";

// Helper to convert time string (00:00:00.000) to seconds
export const timeToSeconds = (timeStr: string): number => {
  const parts = timeStr.split(':');
  const seconds = parts[2].split('.');
  return parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(seconds[0]) + (parseInt(seconds[1] || '0') / 1000);
};

// Helper to parse VTT string to Array
export const parseVTT = (vttText: string): SubtitleCue[] => {
  const lines = vttText.split('\n');
  const cues: SubtitleCue[] = [];
  let currentCue: Partial<SubtitleCue> | null = null;

  lines.forEach((line) => {
    line = line.trim();
    if (line.includes('-->')) {
      const [start, end] = line.split('-->').map(t => t.trim());
      currentCue = {
        id: Math.random().toString(36).substr(2, 9),
        startTime: start,
        endTime: end,
        text: ''
      };
    } else if (currentCue && line !== '' && !line.startsWith('WEBVTT') && !line.match(/^\d+$/)) {
      currentCue.text = currentCue.text ? currentCue.text + '\n' + line : line;
    } else if (line === '' && currentCue) {
        if(currentCue.text) cues.push(currentCue as SubtitleCue);
        currentCue = null;
    }
  });
  
  // Push last one if exists
  if(currentCue && currentCue.text) cues.push(currentCue as SubtitleCue);
  
  return cues;
};

// Helper to stringify Array back to VTT
export const stringifyVTT = (cues: SubtitleCue[]): string => {
  let output = "WEBVTT\n\n";
  cues.forEach((cue, index) => {
    output += `${index + 1}\n`;
    output += `${cue.startTime} --> ${cue.endTime}\n`;
    output += `${cue.text}\n\n`;
  });
  return output;
};