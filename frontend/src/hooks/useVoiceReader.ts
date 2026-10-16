import { useState, useCallback, useEffect } from 'react';
import { getApiBaseUrl } from '../api/client';

export interface VovoVoicePreset {
  id: string;
  name: string;
  shortLabel: string;
  badge: string;
  description: string;
  detuneCents: number; // Ajuste fino de timbre fofinho no Web Audio API
  playbackRate: number;
  speechPitch: number; // Pitch para SpeechSynthesis
  speechRate: number;
  warmthFilterHz: number;
  samplePhrase: string;
}

export const VOVO_VOICE_PACK: VovoVoicePreset[] = [
  {
    id: 'vovo-helena',
    name: 'Vovó Helena (Doce & Fofinha — Padrão)',
    shortLabel: 'Vovó Helena (Padrão)',
    badge: 'Padrão da Casa',
    description: 'Voz feminina meiga, calma e acolhedora de vovó carinhosa.',
    detuneCents: 135,
    playbackRate: 0.94,
    speechPitch: 1.18,
    speechRate: 0.9,
    warmthFilterHz: 3700,
    samplePhrase:
      'Oi meu amor! Eu sou a Vovó Helena. Vou ler a receitinha e cuidar dos seus horários com todo o carinho!',
  },
  {
    id: 'vovo-zilda',
    name: 'Vovó Zilda (Bem Fofinha & Animada)',
    shortLabel: 'Vovó Zilda (Fofinha)',
    badge: 'Super Fofinha',
    description: 'Timbre mais agudo, doce e sorridente de vó fazendo bolo quentinho.',
    detuneCents: 215,
    playbackRate: 0.97,
    speechPitch: 1.26,
    speechRate: 0.94,
    warmthFilterHz: 4100,
    samplePhrase:
      'Que alegria ter você aqui na cozinha da Vovó Zilda! Hoje o nosso quitute vai ficar uma delícia!',
  },
  {
    id: 'vovo-clara',
    name: 'Vovó Clara (Mansa & Bem Pausada)',
    shortLabel: 'Vovó Clara (Pausada)',
    badge: 'Leitura Calma',
    description: 'Fala mais devagarzinho e articulada para acompanhar sem pressa.',
    detuneCents: 90,
    playbackRate: 0.86,
    speechPitch: 1.12,
    speechRate: 0.82,
    warmthFilterHz: 3300,
    samplePhrase:
      'Fique tranquila, meu bem. Eu sou a Vovó Clara e vou ler cada passo bem devagarzinho para você.',
  },
  {
    id: 'vovo-nana',
    name: 'Vovó Naná (Contadora de Histórias)',
    shortLabel: 'Vovó Naná (Acolhedora)',
    badge: 'Voz Quentinha',
    description: 'Timbre macio e aconchegante, ideal para ouvir chás e histórias.',
    detuneCents: 165,
    playbackRate: 0.91,
    speechPitch: 1.21,
    speechRate: 0.88,
    warmthFilterHz: 3500,
    samplePhrase:
      'Senta aqui pertinho da Vovó Naná, que a água do nosso chazinho já está fervendo no fogão!',
  },
  {
    id: 'tia-amelia',
    name: 'Tia Amélia (Professora de Culinária)',
    shortLabel: 'Tia Amélia (Clara)',
    badge: 'Passo a Passo',
    description: 'Voz feminina clara, firme e didática para o Modo Cozinha e Crochê.',
    detuneCents: 50,
    playbackRate: 0.98,
    speechPitch: 1.08,
    speechRate: 0.95,
    warmthFilterHz: 4500,
    samplePhrase:
      'Olá! Separe as xícaras e os ingredientes na bancada que eu vou te guiar passo a passo!',
  },
];

const STORAGE_VOICE_ID_KEY = 'caderno_vovo_voice_pack_id';
const DEFAULT_VOICE_ID = 'vovo-helena';

// Referências globais para interromper qualquer áudio em andamento ao trocar de fala
let activeAudioCtx: AudioContext | null = null;
let activeSourceNode: AudioBufferSourceNode | null = null;
let activeAbortController: AbortController | null = null;

function stopActiveWebAudio() {
  if (activeAbortController) {
    activeAbortController.abort();
    activeAbortController = null;
  }
  if (activeSourceNode) {
    try {
      activeSourceNode.stop();
      activeSourceNode.disconnect();
    } catch {
      // ignore
    }
    activeSourceNode = null;
  }
}

export function getSelectedVoicePresetId(): string {
  const saved = localStorage.getItem(STORAGE_VOICE_ID_KEY);
  if (saved && VOVO_VOICE_PACK.some((v) => v.id === saved)) {
    return saved;
  }
  return DEFAULT_VOICE_ID;
}

export function getSelectedVoicePreset(): VovoVoicePreset {
  const id = getSelectedVoicePresetId();
  return VOVO_VOICE_PACK.find((v) => v.id === id) || VOVO_VOICE_PACK[0];
}

export function setSelectedVoicePresetId(voiceId: string): void {
  if (VOVO_VOICE_PACK.some((v) => v.id === voiceId)) {
    localStorage.setItem(STORAGE_VOICE_ID_KEY, voiceId);
    window.dispatchEvent(new CustomEvent('vovo-voice-pack-changed', { detail: { voiceId } }));
  }
}

/**
 * Seleciona estritamente uma voz FEMININA em Português do Brasil no navegador,
 * bloqueando vozes masculinas robóticas (como Microsoft Daniel / Antonio).
 */
function pickBestFemalePtBrBrowserVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices || voices.length === 0) return null;

  const maleKeywords = [
    'daniel',
    'antonio',
    'fabio',
    'julio',
    'humberto',
    'nicolau',
    'valerio',
    'donato',
    'felipe',
    'ricardo',
    'male',
  ];

  const femalePriorityKeywords = [
    'francisca',
    'thalita',
    'yara',
    'manuela',
    'leila',
    'giovanna',
    'elza',
    'brenda',
    'maria',
    'luciana',
    'heloisa',
    'fernanda',
    'vitoria',
    'camila',
    'google português do brasil',
    'google portugues do brasil',
    'female',
  ];

  const ptVoices = voices.filter((v) => v.lang.toLowerCase().startsWith('pt'));
  const nonMalePtVoices = ptVoices.filter((v) => {
    const lowerName = v.name.toLowerCase();
    return !maleKeywords.some((m) => lowerName.includes(m));
  });

  // 1. Tenta encontrar uma voz feminina natural/neural conhecida da lista de prioridade
  for (const kw of femalePriorityKeywords) {
    const match = nonMalePtVoices.find((v) => v.name.toLowerCase().includes(kw));
    if (match) return match;
  }

  // 2. Qualquer voz pt-BR que não seja masculina
  const ptBrNonMale = nonMalePtVoices.find((v) => v.lang.toLowerCase().includes('pt-br'));
  if (ptBrNonMale) return ptBrNonMale;

  return nonMalePtVoices[0] || ptVoices[0] || null;
}

export function useVoiceReader() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceRate, setVoiceRate] = useState<number>(0.92);
  const [selectedVoiceId, setSelectedVoiceIdState] = useState<string>(() =>
    getSelectedVoicePresetId()
  );

  useEffect(() => {
    // Pré-carrega a lista de vozes do navegador no Windows/Chrome
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }

    const onVoiceChanged = (e: Event) => {
      const custom = e as CustomEvent<{ voiceId?: string }>;
      setSelectedVoiceIdState(custom.detail?.voiceId || getSelectedVoicePresetId());
    };
    window.addEventListener('vovo-voice-pack-changed', onVoiceChanged);
    return () => {
      window.removeEventListener('vovo-voice-pack-changed', onVoiceChanged);
    };
  }, []);

  const changeVoicePreset = useCallback((voiceId: string) => {
    setSelectedVoicePresetId(voiceId);
    setSelectedVoiceIdState(voiceId);
  }, []);

  const stopSpeaking = useCallback(() => {
    stopActiveWebAudio();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakWithBrowserFallback = useCallback(
    (text: string, preset: VovoVoicePreset, customRate?: number) => {
      if (!('speechSynthesis' in window)) {
        setIsSpeaking(false);
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'pt-BR';
      const rateMultiplier = customRate ? customRate / 0.92 : 1;
      utterance.rate = Math.max(0.75, Math.min(1.2, preset.speechRate * rateMultiplier));
      utterance.pitch = preset.speechPitch;

      const voices = window.speechSynthesis.getVoices();
      const bestFemale = pickBestFemalePtBrBrowserVoice(voices);
      if (bestFemale) {
        utterance.voice = bestFemale;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    },
    []
  );

  const speakText = useCallback(
    async (text: string, customRate?: number, overridePresetId?: string) => {
      const cleanText = text.trim();
      if (!cleanText) return;

      stopActiveWebAudio();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }

      const preset =
        VOVO_VOICE_PACK.find((v) => v.id === (overridePresetId || getSelectedVoicePresetId())) ||
        VOVO_VOICE_PACK[0];

      setIsSpeaking(true);

      // Se o navegador já possuir uma voz Neural Feminina Nativa (ex: Microsoft Francisca/Thalita Online Natural),
      // verificamos se devemos usar o Sintetizador Neural MP3 da Vovó com modelagem acústica Web Audio API
      try {
        const controller = new AbortController();
        activeAbortController = controller;

        const ttsUrl = `${getApiBaseUrl()}/api/tts/speak?text=${encodeURIComponent(cleanText)}`;
        const response = await fetch(ttsUrl, { signal: controller.signal });
        if (!response.ok) {
          throw new Error('Fallback to browser TTS');
        }

        const arrayBuffer = await response.arrayBuffer();
        if (controller.signal.aborted) return;

        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (!activeAudioCtx || activeAudioCtx.state === 'closed') {
          activeAudioCtx = new AudioCtx();
        }
        if (activeAudioCtx.state === 'suspended') {
          await activeAudioCtx.resume();
        }

        const audioBuffer = await activeAudioCtx.decodeAudioData(arrayBuffer);
        if (controller.signal.aborted) return;

        const source = activeAudioCtx.createBufferSource();
        source.buffer = audioBuffer;

        // Modelagem fofinha de timbre (detune em cents + velocidade acolhedora da Vovó)
        const rateRatio = customRate ? customRate / 0.92 : 1;
        source.playbackRate.value = Math.max(0.78, Math.min(1.18, preset.playbackRate * rateRatio));
        if (source.detune) {
          source.detune.value = preset.detuneCents;
        }

        // Filtro acústico aveludado para deixar a voz quentinha e suave
        const lowpass = activeAudioCtx.createBiquadFilter();
        lowpass.type = 'lowpass';
        lowpass.frequency.value = preset.warmthFilterHz;

        const warmthBoost = activeAudioCtx.createBiquadFilter();
        warmthBoost.type = 'peaking';
        warmthBoost.frequency.value = 360;
        warmthBoost.gain.value = 2.2;

        source.connect(warmthBoost);
        warmthBoost.connect(lowpass);
        lowpass.connect(activeAudioCtx.destination);

        activeSourceNode = source;
        source.onended = () => {
          if (activeSourceNode === source) {
            activeSourceNode = null;
            setIsSpeaking(false);
          }
        };

        source.start(0);
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          setIsSpeaking(false);
          return;
        }
        // Fallback automático para a melhor voz feminina pt-BR do navegador com pitch fofinho
        speakWithBrowserFallback(cleanText, preset, customRate ?? voiceRate);
      }
    },
    [speakWithBrowserFallback, voiceRate]
  );

  const previewVoicePreset = useCallback(
    (voiceId: string) => {
      const preset = VOVO_VOICE_PACK.find((v) => v.id === voiceId) || VOVO_VOICE_PACK[0];
      setSelectedVoicePresetId(preset.id);
      setSelectedVoiceIdState(preset.id);
      speakText(preset.samplePhrase, undefined, preset.id);
    },
    [speakText]
  );

  const activePreset =
    VOVO_VOICE_PACK.find((v) => v.id === selectedVoiceId) || VOVO_VOICE_PACK[0];

  return {
    isSpeaking,
    voiceRate,
    setVoiceRate,
    selectedVoiceId,
    activePreset,
    voicePack: VOVO_VOICE_PACK,
    changeVoicePreset,
    previewVoicePreset,
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
