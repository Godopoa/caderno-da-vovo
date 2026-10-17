import React, { useEffect, useState } from 'react';
import { playKitchenAlarmSound, useVoiceReader } from '../hooks/useVoiceReader';
import { UserProfile } from '../types';
import { CloudSyncNotice } from '../components/CloudSyncNotice';
import { pushLocalDataToCloudIfLoggedIn } from '../api/client';

interface HealthWellnessHubPageProps {
  highContrastDark: boolean;
  user: UserProfile | null;
  onOpenAuthModal: (mode: 'login' | 'register' | 'vip') => void;
}

interface TeaGuideItem {
  id: string;
  name: string;
  goalCategory: string;
  benefitSummary: string;
  ingredients: string;
  preparation: string;
  contraindication: string;
  bestTime: string;
}

interface PillReminder {
  id: string;
  name: string;
  time: string; // HH:MM
  dosage: string;
  notes: string;
  takenToday: boolean;
}

interface BpGlucoseEntry {
  id: string;
  dateLabel: string;
  systolic: number; // ex: 120 (ou 12)
  diastolic: number; // ex: 80 (ou 8)
  glucoseMgDl: number; // ex: 95
  notes: string;
}

interface SosEmergencyCardData {
  bloodType: string;
  allergies: string;
  susOrPlanNumber: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  doctorNotes: string;
}

function classifyBpAndGlucose(sysRaw: number, diaRaw: number, glucose: number) {
  // Aceita tanto 12x8 quanto 120x80
  const sys = sysRaw < 30 ? sysRaw * 10 : sysRaw;
  const dia = diaRaw < 20 ? diaRaw * 10 : diaRaw;

  if (sys >= 140 || dia >= 90 || glucose >= 140) {
    return {
      level: 'alert' as const,
      badge: 'Atenção: Acima do Ideal',
      colorClass:
        'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 border-rose-300 dark:border-rose-800',
      advice:
        'Sua medição está um pouquinho alta. Descanse, beba água, tome sua medicação no horário e mostre ao seu médico.',
    };
  }
  if (sys < 90 || dia < 60 || (glucose > 0 && glucose < 70)) {
    return {
      level: 'warn' as const,
      badge: 'Atenção: Pressão ou Glicose Baixa',
      colorClass:
        'bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-800',
      advice:
        'Medição mais baixa que o habitual. Sente-se com calma e avise um familiar se sentir tontura.',
    };
  }
  return {
    level: 'ok' as const,
    badge: 'Medição Ótima & Controlada',
    colorClass:
      'bg-emerald-50 dark:bg-emerald-950/50 text-[#1E7E5A] dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
    advice: 'Parabéns! Sua pressão e glicemia estão dentro da faixa saudável esperada.',
  };
}

const NATURAL_TEAS: TeaGuideItem[] = [
  {
    id: 'camomila-erva-doce',
    name: 'Infusão Calmante de Camomila com Erva-Doce',
    goalCategory: 'Dormir & Calma',
    benefitSummary: 'Acalma a mente, alivia gases leves e prepara o corpo para um sono tranquilo e profundo.',
    ingredients: '1 colher (sopa) de flores secas de camomila + 1 colher (chá) de sementes de erva-doce + 250 ml de água.',
    preparation: 'Ferva a água, desligue o fogo, adicione as ervas e tampe a xícara com um pires por 8 minutos. Coe e tome morno.',
    contraindication: 'Seguro para a maioria dos idosos. Evitar adoçar com muito açúcar antes de dormir.',
    bestTime: '30 minutos antes de deitar',
  },
  {
    id: 'hortela-gengibre',
    name: 'Chá Digestivo de Hortelã com Lascas de Gengibre',
    goalCategory: 'Digestão & Estômago',
    benefitSummary: 'Excelente após almoços mais pesados, reduz a sensação de estufamento e enjoos.',
    ingredients: '8 folhas frescas de hortelã + 2 rodelinhas finas de gengibre fresco + 250 ml de água.',
    preparation: 'Ferva a água com o gengibre por 3 minutos. Desligue, junte as folhas de hortelã, abafe por 5 minutos e coe.',
    contraindication: 'Pessoas com pressão alta descontrolada devem usar apenas a hortelã, sem exagerar no gengibre.',
    bestTime: '20 minutos após o almoço',
  },
  {
    id: 'guaco-mel-limao',
    name: 'Chá Caseiro de Guaco com Limão e Mel para Garganta',
    goalCategory: 'Gripe & Garganta',
    benefitSummary: 'Ajuda a soltar a tosse, limpa as vias respiratórias e aquece o peito nos dias frios.',
    ingredients: '4 folhas de guaco bem lavadas + ½ limão espremido + 1 colher (chá) de mel puro + 250 ml de água.',
    preparation: 'Despeje a água fervente sobre as folhas de guaco, abafe por 10 minutos, coe e adicione o limão e o mel quando estiver morno.',
    contraindication: 'Quem usa medicamentos anticoagulantes ou tem diabetes (no caso do mel) deve consultar o médico antes.',
    bestTime: 'Tarde ou início da noite',
  },
  {
    id: 'erva-cidreira-limao',
    name: 'Chá Fresco de Capim-Cidreira (Capim-Santo)',
    goalCategory: 'Dormir & Calma',
    benefitSummary: 'Diminui a agitação, auxilia no controle natural da pressão leve causada pelo estresse e perfuma a casa.',
    ingredients: '5 folhas de capim-cidreira frescas cortadas em pedaços + 250 ml de água.',
    preparation: 'Coloque as folhas em uma xícara, cubra com água recém-fervida e abafe por 7 minutos.',
    contraindication: 'Pode causar sonolência leve; ideal para o fim da tarde.',
    bestTime: 'Fim de tarde (17h às 20h)',
  },
  {
    id: 'cavalinha-hibisco-leve',
    name: 'Infusão Suave de Cavalinha com Casca de Abacaxi',
    goalCategory: 'Inchaço & Circulação',
    benefitSummary: 'Auxilia na redução da retenção de líquidos nas pernas e tornozelos de forma suave.',
    ingredients: '1 colher (chá) de cavalinha seca + 2 pedaços de casca de abacaxi bem lavada + 300 ml de água.',
    preparation: 'Ferva a casca de abacaxi por 5 minutos, desligue o fogo, adicione a cavalinha e abafe por 5 minutos.',
    contraindication: 'Não recomendado para quem possui insuficiência renal ou restrição médica de líquidos.',
    bestTime: 'Pela manhã (até as 14h)',
  },
  {
    id: 'alecrim-memoria',
    name: 'Chá Aromático de Alecrim da Horta (Disposição & Memória)',
    goalCategory: 'Memória & Disposição',
    benefitSummary: 'Estimula a concentração, melhora o ânimo matinal e alivia dores de cabeça tensionais.',
    ingredients: '1 raminho pequeno de alecrim fresco + 250 ml de água.',
    preparation: 'Despeje água quente sobre o raminho de alecrim e abafe por 5 a 7 minutos. Retire o ramo antes de beber.',
    contraindication: 'Hipertensos devem consumir com moderação e preferir durante o dia.',
    bestTime: 'Manhã, após o café',
  },
];

export const HealthWellnessHubPage: React.FC<HealthWellnessHubPageProps> = ({
  highContrastDark,
  user,
  onOpenAuthModal,
}) => {
  const [selectedGoal, setSelectedGoal] = useState<string>('Todos');
  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  // --- Estado do Hidratômetro (8 Copos d'Água) ---
  const [waterGlasses, setWaterGlasses] = useState<number>(() => {
    const saved = localStorage.getItem('caderno_vovo_water_glasses');
    return saved ? Number(saved) : 3;
  });

  useEffect(() => {
    localStorage.setItem('caderno_vovo_water_glasses', String(waterGlasses));
    pushLocalDataToCloudIfLoggedIn();
  }, [waterGlasses]);

  // --- Estado do Despertador de Remédios ---
  const [reminders, setReminders] = useState<PillReminder[]>(() => {
    try {
      const raw = localStorage.getItem('caderno_vovo_pill_reminders');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'rem-1',
        name: 'Vitamina D / Cálcio',
        time: '08:30',
        dosage: '1 comprimido',
        notes: 'Tomar junto com o café da manhã',
        takenToday: true,
      },
      {
        id: 'rem-2',
        name: 'Remédio da Pressão',
        time: '14:00',
        dosage: '1 comprimido',
        notes: 'Beber com 1 copo cheio de água',
        takenToday: false,
      },
    ];
  });

  const [pillName, setPillName] = useState('');
  const [pillTime, setPillTime] = useState('09:00');
  const [pillDosage, setPillDosage] = useState('1 comprimido');
  const [pillNotes, setPillNotes] = useState('Após a refeição');

  useEffect(() => {
    localStorage.setItem('caderno_vovo_pill_reminders', JSON.stringify(reminders));
    pushLocalDataToCloudIfLoggedIn();
  }, [reminders]);

  // --- Estado do Diário de Pressão Arterial & Glicemia ---
  const [bpLogs, setBpLogs] = useState<BpGlucoseEntry[]>(() => {
    try {
      const raw = localStorage.getItem('caderno_vovo_bp_glucose_logs');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      {
        id: 'bp-1',
        dateLabel: 'Hoje, 08:00 (Jejum)',
        systolic: 120,
        diastolic: 80,
        glucoseMgDl: 94,
        notes: 'Sentindo-se muito bem após o café',
      },
    ];
  });

  const [sysInput, setSysInput] = useState('120');
  const [diaInput, setDiaInput] = useState('80');
  const [glucoseInput, setGlucoseInput] = useState('95');
  const [bpNoteInput, setBpNoteInput] = useState('Medição da manhã');

  useEffect(() => {
    localStorage.setItem('caderno_vovo_bp_glucose_logs', JSON.stringify(bpLogs));
    pushLocalDataToCloudIfLoggedIn();
  }, [bpLogs]);

  const handleAddBpLog = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = Number(sysInput) || 120;
    const dia = Number(diaInput) || 80;
    const gluc = Number(glucoseInput) || 95;
    const nowStr = new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

    const entry: BpGlucoseEntry = {
      id: `bp-${Date.now()}`,
      dateLabel: nowStr,
      systolic: sys < 30 ? sys * 10 : sys,
      diastolic: dia < 20 ? dia * 10 : dia,
      glucoseMgDl: gluc,
      notes: bpNoteInput || 'Medição anotada',
    };

    setBpLogs((prev) => [entry, ...prev.slice(0, 14)]);
    const status = classifyBpAndGlucose(entry.systolic, entry.diastolic, entry.glucoseMgDl);
    speakText(
      `Medição anotada no caderno: pressão ${Math.round(entry.systolic / 10)} por ${Math.round(
        entry.diastolic / 10
      )} e glicemia ${entry.glucoseMgDl}. ${status.advice}`
    );
  };

  const shareBpReportWhatsApp = () => {
    const lines = bpLogs
      .slice(0, 7)
      .map(
        (l) =>
          `• *${l.dateLabel}*: Pressão *${l.systolic}/${l.diastolic} mmHg* | Glicemia: *${l.glucoseMgDl} mg/dL* (${l.notes})`
      )
      .join('\n');
    const text = `🩺 *Relatório de Pressão e Glicemia — Caderno da Vovó*\nPaciente: ${
      user?.name || 'Vovó / Familiar'
    }\n\n${lines}\n\n_Gerado pelo aplicativo Caderno da Vovó_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // --- Estado do Cartão SOS de Emergência Médica ---
  const [sosCard, setSosCard] = useState<SosEmergencyCardData>(() => {
    try {
      const raw = localStorage.getItem('caderno_vovo_sos_card');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {
      bloodType: 'O+',
      allergies: 'Nenhuma alergia grave conhecida',
      susOrPlanNumber: 'Cartão SUS / Convênio Familiar',
      emergencyContactName: 'Filho(a) / Neto(a) Responsável',
      emergencyContactPhone: '11999999999',
      doctorNotes: 'Hipertensão controlada com medicação diária',
    };
  });

  useEffect(() => {
    localStorage.setItem('caderno_vovo_sos_card', JSON.stringify(sosCard));
    pushLocalDataToCloudIfLoggedIn();
  }, [sosCard]);

  const handleSendSosWhatsApp = () => {
    const cleanPhone = sosCard.emergencyContactPhone.replace(/\D/g, '');
    const msg = `🚨 *ALERTA SOS FAMÍLIA — CADERNO DA VOVÓ*\nOlá *${
      sosCard.emergencyContactName
    }*, preciso de atenção/ajuda agora!\n\n📋 *Ficha Rápida:*\n• Tipo Sanguíneo: ${
      sosCard.bloodType
    }\n• Alergias: ${sosCard.allergies}\n• Convênio/SUS: ${
      sosCard.susOrPlanNumber
    }\n• Observações: ${sosCard.doctorNotes}`;
    const targetUrl = cleanPhone
      ? `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(targetUrl, '_blank');
  };

  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pillName.trim()) return;
    const next: PillReminder = {
      id: `rem-${Date.now()}`,
      name: pillName.trim(),
      time: pillTime,
      dosage: pillDosage,
      notes: pillNotes,
      takenToday: false,
    };
    setReminders((prev) => [...prev, next]);
    setPillName('');
  };

  const toggleTaken = (id: string) => {
    setReminders((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const nextTaken = !r.takenToday;
          if (nextTaken) {
            speakText(`Muito bem! Você marcou o medicamento ${r.name} como tomado hoje.`);
          }
          return { ...r, takenToday: nextTaken };
        }
        return r;
      })
    );
  };

  const deleteReminder = (id: string) => {
    setReminders((prev) => prev.filter((r) => r.id !== id));
  };

  const testAlarmVoice = (rem: PillReminder) => {
    playKitchenAlarmSound();
    speakText(
      `Atenção! Lembrete de saúde da Vovó Helena: está na hora de tomar ${rem.name}, dose ${rem.dosage}. ${rem.notes}. Não se esqueça de beber um copo de água!`
    );
  };

  const filteredTeas =
    selectedGoal === 'Todos'
      ? NATURAL_TEAS
      : NATURAL_TEAS.filter((t) => t.goalCategory === selectedGoal);

  return (
    <div className="space-y-8">
      {/* Cabeçalho de Saúde & Bem-Estar */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-gradient-to-r from-[#1E7E5A] via-emerald-700 to-teal-800 text-white border-emerald-900'
        }`}
      >
        <div className="max-w-3xl space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-emerald-100 text-xs font-extrabold uppercase tracking-wider">
            <i className="fa-solid fa-heart-pulse" />
            <span>Saúde Sênior, Pressão, Remédios, SOS & Chás</span>
          </span>
          <h1 className="font-serif-vovo text-3xl sm:text-4xl font-extrabold">
            Central de Saúde da Vovó: Remédios, Pressão, Glicemia & Chás
          </h1>
          <p className="text-emerald-50 text-sm sm:text-base leading-relaxed">
            Cuide de quem cuida da família inteira: anote sua pressão e glicemia para levar ao médico, configure seu Cartão SOS de Emergência, lembre dos remédios com voz e consulte chás naturais.
          </p>
        </div>
      </div>

      {/* Aviso de Salvamento Permanente na Nuvem vs. Modo Sem Login */}
      <CloudSyncNotice
        user={user}
        onOpenAuthModal={onOpenAuthModal}
        moduleName="sua Caixinha de Remédios, Diário de Pressão/Glicemia, Cartão SOS e Hidratômetro"
        priorityAlert
      />

      {/* SEÇÃO SUPERIOR: DESPERTADOR DE REMÉDIOS + CONTADOR DE 8 COPOS D'ÁGUA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Coluna 1 (7 cols): Lembrete de Remédios com Aviso por Voz */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-capsules text-[#C83E5B]" />
                <span>Caixinha de Remédios & Horários</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Toque no botão de som para ouvir o aviso da Vovó ou marque quando já tiver tomado.
              </p>
            </div>
            {user ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#1E7E5A] dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full">
                <i className="fa-solid fa-cloud-arrow-up" />
                Salvo na conta de {user.name.split(' ')[0]}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => onOpenAuthModal('register')}
                className="inline-flex items-center gap-1.5 text-xs font-extrabold text-amber-800 dark:text-amber-200 bg-amber-100 dark:bg-amber-950/60 hover:bg-amber-200 border border-amber-300 dark:border-amber-700 px-3 py-1 rounded-full transition"
              >
                <i className="fa-solid fa-triangle-exclamation text-amber-600 dark:text-amber-400" />
                <span>Sem Login: Salvar Remédios na Conta</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {reminders.map((rem) => (
              <div
                key={rem.id}
                className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition overflow-hidden ${
                  rem.takenToday
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-800/80 text-stone-700 dark:text-stone-100'
                    : highContrastDark
                    ? 'bg-stone-950 border-stone-800'
                    : 'bg-[#F8F6F2] border-stone-200'
                }`}
              >
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="px-3.5 py-2 rounded-2xl bg-[#C83E5B] text-white font-mono font-black text-base shadow-2xs shrink-0">
                    {rem.time}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-extrabold text-base flex flex-wrap items-center gap-2">
                      <span className="truncate">{rem.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-200">
                        {rem.dosage}
                      </span>
                    </h3>
                    <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5 truncate">{rem.notes}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => testAlarmVoice(rem)}
                    title="Ouvir lembrete em voz alta"
                    className="px-3 py-2 rounded-xl bg-white dark:bg-stone-800 hover:bg-rose-50 dark:hover:bg-stone-700 text-[#C83E5B] dark:text-rose-300 border border-stone-200 dark:border-stone-700 text-xs font-extrabold flex items-center gap-1.5"
                  >
                    <i className="fa-solid fa-volume-high" />
                    <span>Ouvir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleTaken(rem.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition ${
                      rem.takenToday
                        ? 'bg-[#1E7E5A] text-white shadow-2xs'
                        : 'bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-300 dark:border-stone-700 hover:border-[#1E7E5A]'
                    }`}
                  >
                    <i className={`fa-solid ${rem.takenToday ? 'fa-circle-check' : 'fa-circle'}`} />
                    <span>{rem.takenToday ? 'Tomado Hoje' : 'Marcar Tomado'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteReminder(rem.id)}
                    title="Remover horário"
                    className="p-2 text-stone-400 hover:text-rose-600"
                  >
                    <i className="fa-solid fa-trash-can text-xs" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Adicionar novo remédio */}
          <form
            onSubmit={handleAddReminder}
            className="p-4 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-3"
          >
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
              <i className="fa-solid fa-plus text-[#C83E5B]" />
              <span>Adicionar Novo Horário na Caixinha:</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <input
                type="text"
                required
                value={pillName}
                onChange={(e) => setPillName(e.target.value)}
                placeholder="Nome do remédio/vitamina"
                className="sm:col-span-2 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold"
              />
              <input
                type="time"
                required
                value={pillTime}
                onChange={(e) => setPillTime(e.target.value)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold"
              />
              <input
                type="text"
                value={pillDosage}
                onChange={(e) => setPillDosage(e.target.value)}
                placeholder="Dose (ex: 1 cp)"
                className="px-3 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={pillNotes}
                onChange={(e) => setPillNotes(e.target.value)}
                placeholder="Observação (ex: Tomar após o almoço)"
                className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition shrink-0"
              >
                Salvar Horário
              </button>
            </div>
          </form>
        </div>

        {/* Coluna 2 (5 cols): Hidratômetro da Vovó (8 Copos d'Água) */}
        <div
          className={`lg:col-span-5 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-5 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-stone-800">
            <div>
              <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-glass-water text-sky-600" />
                <span>Hidratômetro Diário</span>
              </h2>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Meta recomendada: 8 copos de água por dia ({waterGlasses * 250} ml bebidos hoje)
              </p>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-full bg-sky-50 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800 text-xs font-extrabold">
              {waterGlasses} / 8 copos
            </span>
          </div>

          <div className="grid grid-cols-4 gap-3">
            {Array.from({ length: 8 }).map((_, idx) => {
              const drank = idx < waterGlasses;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    const next = idx + 1 === waterGlasses ? idx : idx + 1;
                    setWaterGlasses(next);
                    if (next === 8) {
                      speakText('Parabéns! Você completou os 8 copos de água de hoje!');
                    }
                  }}
                  className={`p-3 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition transform active:scale-95 ${
                    drank
                      ? 'bg-sky-500 text-white border-sky-600 shadow-sm'
                      : 'bg-[#F8F6F2] dark:bg-stone-950 text-stone-400 border-stone-200 dark:border-stone-800 hover:border-sky-300'
                  }`}
                >
                  <i className="fa-solid fa-glass-water text-xl" />
                  <span className="text-[11px] font-extrabold">{idx + 1}º copo</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={() => setWaterGlasses(0)}
              className="text-xs font-bold text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
            >
              Zerar contagem do dia
            </button>
            <button
              type="button"
              onClick={() => setWaterGlasses((w) => Math.min(8, w + 1))}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <i className="fa-solid fa-plus" />
              <span>Bebi +1 Copo d’Água</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO DO MEIO (NOVIDADE v6.0): DIÁRIO DE PRESSÃO & GLICEMIA + CARTÃO SOS DE EMERGÊNCIA MÉDICA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Diário de Pressão Arterial & Glicemia (7 cols) */}
        <div
          className={`lg:col-span-7 rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-stone-800">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                <i className="fa-solid fa-heart-pulse text-[#C83E5B]" />
                <span>Diário de Pressão Arterial & Glicemia</span>
              </h2>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                Anote seus valores do dia para acompanhar a saúde e enviar para o médico ou filhos no WhatsApp.
              </p>
            </div>

            <button
              type="button"
              onClick={shareBpReportWhatsApp}
              className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs flex items-center gap-2 shadow-sm shrink-0 transition"
            >
              <i className="fa-brands fa-whatsapp text-sm" />
              <span>Enviar Relatório Médico</span>
            </button>
          </div>

          <form
            onSubmit={handleAddBpLog}
            className="p-4 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-3"
          >
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Pressão Máxima (Sistólica)
                </label>
                <input
                  type="number"
                  value={sysInput}
                  onChange={(e) => setSysInput(e.target.value)}
                  placeholder="Ex: 120 ou 12"
                  className="w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-extrabold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Pressão Mínima (Diastólica)
                </label>
                <input
                  type="number"
                  value={diaInput}
                  onChange={(e) => setDiaInput(e.target.value)}
                  placeholder="Ex: 80 ou 8"
                  className="w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-extrabold text-base"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                  Glicemia / Açúcar (mg/dL)
                </label>
                <input
                  type="number"
                  value={glucoseInput}
                  onChange={(e) => setGlucoseInput(e.target.value)}
                  placeholder="Ex: 95"
                  className="w-full min-w-0 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-extrabold text-base"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                value={bpNoteInput}
                onChange={(e) => setBpNoteInput(e.target.value)}
                placeholder="Como você está se sentindo? (Ex: Em jejum, após caminhada...)"
                className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#1E7E5A] hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm shrink-0 transition"
              >
                <i className="fa-solid fa-notes-medical" />
                <span>Anotar Medição</span>
              </button>
            </div>
          </form>

          {/* Histórico de Medições com Classificação Colorida */}
          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {bpLogs.map((entry) => {
              const st = classifyBpAndGlucose(entry.systolic, entry.diastolic, entry.glucoseMgDl);
              return (
                <div
                  key={entry.id}
                  className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${st.colorClass}`}
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider opacity-80">
                        {entry.dateLabel}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-stone-900/80 text-[11px] font-extrabold border border-current/20">
                        {st.badge}
                      </span>
                    </div>
                    <p className="text-base sm:text-lg font-black">
                      Pressão: {entry.systolic}/{entry.diastolic} mmHg{' '}
                      <span className="text-xs font-bold opacity-80">
                        ({Math.round(entry.systolic / 10)}x{Math.round(entry.diastolic / 10)})
                      </span>{' '}
                      • Glicemia: {entry.glucoseMgDl} mg/dL
                    </p>
                    <p className="text-xs opacity-90">{entry.notes}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      speakText(
                        `Medição de ${entry.dateLabel}: Pressão ${Math.round(
                          entry.systolic / 10
                        )} por ${Math.round(entry.diastolic / 10)}, glicemia ${
                          entry.glucoseMgDl
                        }. ${st.advice}`
                      )
                    }
                    className="self-start sm:self-center px-3 py-1.5 rounded-xl bg-white/90 dark:bg-stone-900 text-stone-800 dark:text-stone-100 font-extrabold text-xs flex items-center gap-1.5 shrink-0 shadow-2xs"
                  >
                    <i className="fa-solid fa-volume-high text-[#C83E5B]" />
                    <span>Ouvir</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Cartão SOS de Emergência da Vovó (5 cols) */}
        <div
          className={`lg:col-span-5 rounded-3xl border-2 border-rose-300 dark:border-rose-800 p-6 sm:p-8 shadow-sm space-y-4 overflow-hidden ${
            highContrastDark ? 'bg-stone-900 text-stone-100' : 'bg-rose-50/40 text-stone-800'
          }`}
        >
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-rose-200/70 dark:border-stone-800">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-[#C83E5B] text-white flex items-center justify-center text-xl shrink-0 shadow-sm">
                <i className="fa-solid fa-kit-medical" />
              </div>
              <div className="min-w-0">
                <h2 className="font-serif-vovo text-xl sm:text-2xl font-bold leading-tight">
                  Cartão SOS de Emergência
                </h2>
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  Ficha médica rápida para emergências e contato dos filhos
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Tipo Sanguíneo:
              </label>
              <select
                value={sosCard.bloodType}
                onChange={(e) => setSosCard((p) => ({ ...p, bloodType: e.target.value }))}
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-extrabold text-sm"
              >
                {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'Não sei informar'].map(
                  (bt) => (
                    <option key={bt} value={bt}>
                      Sangue {bt}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Cartão SUS / Plano:
              </label>
              <input
                type="text"
                value={sosCard.susOrPlanNumber}
                onChange={(e) => setSosCard((p) => ({ ...p, susOrPlanNumber: e.target.value }))}
                placeholder="Nº do Cartão ou Convênio"
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
              Alergias a Medicamentos ou Alimentos:
            </label>
            <input
              type="text"
              value={sosCard.allergies}
              onChange={(e) => setSosCard((p) => ({ ...p, allergies: e.target.value }))}
              placeholder="Ex: Dipirona, Penicilina, Camarão..."
              className="w-full min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Familiar de Emergência:
              </label>
              <input
                type="text"
                value={sosCard.emergencyContactName}
                onChange={(e) =>
                  setSosCard((p) => ({ ...p, emergencyContactName: e.target.value }))
                }
                placeholder="Nome do filho(a) ou neto(a)"
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-extrabold uppercase text-stone-500 dark:text-stone-400 mb-1">
                Telefone / WhatsApp (DDD):
              </label>
              <input
                type="tel"
                value={sosCard.emergencyContactPhone}
                onChange={(e) =>
                  setSosCard((p) => ({ ...p, emergencyContactPhone: e.target.value }))
                }
                placeholder="Ex: 11999999999"
                className="w-full min-w-0 px-3 py-2 rounded-xl bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 font-bold text-xs"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
            <a
              href={`tel:${sosCard.emergencyContactPhone.replace(/\D/g, '')}`}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <i className="fa-solid fa-phone-volume" />
              <span>Ligar para Familiar</span>
            </a>

            <button
              type="button"
              onClick={handleSendSosWhatsApp}
              className="flex-1 py-3 px-4 rounded-2xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <i className="fa-brands fa-whatsapp text-sm" />
              <span>Pedir Ajuda no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO INFERIOR: FARMACINHA NATURAL & GUIA DE CHÁS DA VOVÓ */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-serif-vovo text-2xl sm:text-3xl font-bold flex items-center gap-2.5">
              <i className="fa-solid fa-mug-hot text-[#1E7E5A]" />
              <span>Farmacinha Natural & Guia de Chás da Vovó</span>
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Escolha o que você deseja aliviar e ouça o preparo correto da infusão em voz alta.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              'Todos',
              'Dormir & Calma',
              'Digestão & Estômago',
              'Gripe & Garganta',
              'Inchaço & Circulação',
              'Memória & Disposição',
            ].map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => setSelectedGoal(goal)}
                className={`px-3.5 py-2 rounded-xl font-bold text-xs transition ${
                  selectedGoal === goal
                    ? 'bg-[#1E7E5A] text-white shadow-sm'
                    : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:border-[#1E7E5A]'
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeas.map((tea) => (
            <div
              key={tea.id}
              className={`rounded-3xl border p-6 shadow-sm flex flex-col justify-between gap-4 overflow-hidden ${
                highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#1E7E5A] dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-extrabold">
                    {tea.goalCategory}
                  </span>
                  <span className="text-[11px] font-bold text-stone-400">
                    <i className="fa-regular fa-clock mr-1" />
                    {tea.bestTime}
                  </span>
                </div>

                <h3 className="font-serif-vovo text-xl font-bold leading-snug">{tea.name}</h3>
                <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                  {tea.benefitSummary}
                </p>

                <div className="p-3.5 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800 space-y-2 text-xs">
                  <p>
                    <strong className="text-[#1E7E5A] dark:text-emerald-400">Medidas:</strong> {tea.ingredients}
                  </p>
                  <p>
                    <strong className="text-[#C83E5B] dark:text-rose-400">Como fazer a infusão:</strong> {tea.preparation}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800">
                <p className="text-[11px] text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/70 px-3 py-1.5 rounded-xl font-semibold">
                  <i className="fa-solid fa-triangle-exclamation mr-1 text-amber-600 dark:text-amber-400" />
                  {tea.contraindication}
                </p>

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else
                      speakText(
                        `${tea.name}. Indicado para ${tea.goalCategory}. ${tea.benefitSummary} Ingredientes: ${tea.ingredients}. Modo de preparo: ${tea.preparation}. Atenção: ${tea.contraindication}`
                      );
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-50 dark:bg-stone-800 hover:bg-[#C83E5B] text-[#C83E5B] dark:text-rose-300 hover:text-white border border-rose-200 dark:border-stone-700 font-extrabold text-xs flex items-center justify-center gap-2 transition"
                >
                  <i className="fa-solid fa-volume-high" />
                  <span>Ouvir Receita do Chá em Voz Alta</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
