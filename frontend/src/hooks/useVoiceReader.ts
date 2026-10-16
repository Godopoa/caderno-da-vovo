import { useState, useCallback, useEffect } from 'react';

export function useVoiceReader() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceRate, setVoiceRate] = useState<number>(0.88); // Velocidade calma ideal para idosos

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string, customRate?: number) => {
      if (!('speechSynthesis' in window)) {
        alert('Seu navegador não possui leitor de voz integrado.');
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      utterance.rate = customRate ?? voiceRate;
      utterance.pitch = 1.0;

      // Procura uma voz em Português do Brasil se disponível no Windows/Android
      const voices = window.speechSynthesis.getVoices();
      const ptVoice =
        voices.find((v) => v.lang.toLowerCase().includes('pt-br') && v.name.toLowerCase().includes('natural')) ||
        voices.find((v) => v.lang.toLowerCase().includes('pt-br')) ||
        voices.find((v) => v.lang.toLowerCase().startsWith('pt'));

      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    [voiceRate]
  );

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return {
    isSpeaking,
    voiceRate,
    setVoiceRate,
    speakText,
    stopSpeaking,
  };
}

/**
 * Toca um alarme sonoro alto e agradável usando Web Audio API quando o relógio do forno/fogo termina!
 */
export function playKitchenAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioCtx();
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]; // Acorde Dó Maior alegre e claro

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;

      const startTime = ctx.currentTime + idx * 0.28;
      gain.gain.setValueAtTime(0.01, startTime);
      gain.gain.exponentialRampToValueAtTime(0.5, startTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.26);
    });
  } catch {
    // Fallback silencioso
  }
}
