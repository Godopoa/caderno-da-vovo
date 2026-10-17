import React, { useEffect, useState } from 'react';
import { useVoiceReader } from '../hooks/useVoiceReader';
import { pushLocalDataToCloudIfLoggedIn } from '../api/client';
import { CloudSyncNotice } from '../components/CloudSyncNotice';
import { UserProfile } from '../types';

interface HomeCraftsHubPageProps {
  highContrastDark: boolean;
  user?: UserProfile | null;
  onOpenAuthModal?: (tab?: 'login' | 'register' | 'vip') => void;
}

type HomeSubTab = 'stains' | 'garden' | 'crafts' | 'birthdays';

interface FamilyBirthday {
  id: string;
  name: string;
  relation: string; // Filho(a), Neto(a), Bisneto(a), Irmão(ã), etc.
  day: number;
  month: number; // 1 a 12
  favoriteCake: string;
}

const STAIN_SOLUTIONS = [
  {
    title: 'Mancha de Café ou Chá em Toalha de Mesa Branca',
    category: 'Roupas & Tecidos',
    mixture: 'Água morna + 1 colher (sopa) de bicarbonato de sódio + detergente neutro.',
    instructions:
      'Não deixe secar! Jogue água morna pelo avesso do tecido, aplique uma pastinha de bicarbonato com detergente neutro, deixe agir 15 minutos e enxágue.',
  },
  {
    title: 'Mancha de Vinho Tinto ou Molho de Tomate',
    category: 'Roupas & Tecidos',
    mixture: 'Sal refinado na hora + Vinagre branco de álcool + Sabão de coco.',
    instructions:
      'Cubra a mancha fresca imediatamente com sal para absorver o líquido. Depois, aplique vinagre branco de álcool, esfregue suavemente com sabão de coco e lave.',
  },
  {
    title: 'Fundo de Panela Queimada ou Inox Sem Brilho',
    category: 'Cozinha & Panelas',
    mixture: '2 colheres de bicarbonato + ½ xícara de vinagre branco + água quente.',
    instructions:
      'Coloque o bicarbonato e o vinagre na panela, complete com um dedinho de água e ferva por 5 minutos. Desligue, espere amornar e a crosta sairá facilmente com a esponja macia.',
  },
  {
    title: 'Gordura Grudada nos Armários da Cozinha e Azulejos',
    category: 'Cozinha & Panelas',
    mixture: '250 ml de água morna + 2 colheres de vinagre de álcool + 1 colher de detergente neutro.',
    instructions:
      'Umedeça um pano de microfibra macio na mistura morna, passe nos armários e finalize com um pano seco. Tira toda a película engordurada sem estragar a madeira.',
  },
  {
    title: 'Mau Cheiro na Geladeira ou Potes Plásticos',
    category: 'Geladeira & Casa',
    mixture: 'Pires com bicarbonato de sódio ou borra de café seca.',
    instructions:
      'Deixe um potinho aberto com 3 colheres de bicarbonato ou café no fundo da geladeira (troque a cada 30 dias). Para potes com cheiro de alho, lave e deixe de molho com água e 1 colher de bicarbonato.',
  },
  {
    title: 'Limpar Talheres de Prata ou Baixelas Antigas',
    category: 'Cozinha & Panelas',
    mixture: 'Folha de papel-alumínio + 1 litro de água fervente + 2 colheres de bicarbonato.',
    instructions:
      'Forre o fundo de uma bacia com papel-alumínio (lado brilhante para cima), acomode as peças de prata, polvilhe o bicarbonato e despeje água fervente. Em 10 minutos o escuro sai sozinho!',
  },
];

const SEASONAL_HARVEST: Record<
  number,
  { monthName: string; fruits: string[]; veggies: string[]; greens: string[] }
> = {
  0: {
    monthName: 'Janeiro',
    fruits: ['Abacaxi', 'Melancia', 'Manga', 'Maracujá', 'Uva', 'Coco verde'],
    veggies: ['Abobrinha', 'Tomate', 'Quiabo', 'Milho verde', 'Beterraba'],
    greens: ['Alface', 'Couve', 'Cebolinha', 'Hortelã', 'Manjericão'],
  },
  1: {
    monthName: 'Fevereiro',
    fruits: ['Abacate', 'Goiaba', 'Maçã nacional', 'Pera', 'Uva', 'Figo'],
    veggies: ['Abóbora', 'Berinjela', 'Milho verde', 'Chuchu', 'Gengibre'],
    greens: ['Escarola', 'Hortelã', 'Repolho', 'Salsinha'],
  },
  2: {
    monthName: 'Março',
    fruits: ['Banana-maçã', 'Goiaba', 'Limão', 'Maçã', 'Tangerina', 'Abacate'],
    veggies: ['Abóbora', 'Berinjela', 'Chuchu', 'Inhame', 'Jiló', 'Tomate'],
    greens: ['Acelga', 'Alface', 'Coentro', 'Endívia', 'Repolho'],
  },
  3: {
    monthName: 'Abril',
    fruits: ['Caqui', 'Abacate', 'Banana', 'Jaca', 'Kiwi', 'Tangerina'],
    veggies: ['Abóbora', 'Batata-doce', 'Berinjela', 'Cenoura', 'Mandioca', 'Chuchu'],
    greens: ['Almeirão', 'Catalonha', 'Escarola', 'Repolho'],
  },
  4: {
    monthName: 'Maio',
    fruits: ['Tangerina Ponkan', 'Laranja-pera', 'Caqui', 'Abacate', 'Maçã'],
    veggies: ['Batata-doce', 'Cenoura', 'Inhame', 'Mandioca', 'Mandioquinha', 'Abobrinha'],
    greens: ['Agrião', 'Alho-poró', 'Brócolis', 'Louro', 'Rúcula'],
  },
  5: {
    monthName: 'Junho',
    fruits: ['Laranja', 'Mexerica', 'Carambola', 'Kiwi', 'Pinhão'],
    veggies: ['Abóbora', 'Batata-doce', 'Gengibre', 'Inhame', 'Mandioca', 'Milho'],
    greens: ['Agrião', 'Brócolis', 'Couve-flor', 'Espinafre', 'Erva-doce'],
  },
  6: {
    monthName: 'Julho',
    fruits: ['Laranja-lima', 'Mexerica', 'Morango', 'Tangerina', 'Carambola'],
    veggies: ['Cenoura', 'Abóbora', 'Batata-doce', 'Mandioca', 'Nabo', 'Pepino'],
    greens: ['Agrião', 'Chicória', 'Couve', 'Espinafre', 'Mostarda', 'Salsão'],
  },
  7: {
    monthName: 'Agosto',
    fruits: ['Morango', 'Mamão', 'Laranja-pera', 'Lima-da-pérsia', 'Caju', 'Banana-nanica'],
    veggies: ['Cenoura', 'Abobrinha', 'Cará', 'Ervilha', 'Fava', 'Mandioquinha'],
    greens: ['Agrião', 'Alho-poró', 'Brócolis', 'Coentro', 'Couve', 'Couve-flor', 'Rúcula'],
  },
  8: {
    monthName: 'Setembro',
    fruits: ['Jabuticaba', 'Abacaxi', 'Banana-prata', 'Caju', 'Laranja', 'Mamão', 'Mexerica'],
    veggies: ['Abóbora', 'Abobrinha', 'Alcachofra', 'Beterraba', 'Ervilha', 'Vagem'],
    greens: ['Almeirão', 'Brócolis', 'Chicória', 'Couve', 'Couve-flor', 'Espinafre', 'Orégano'],
  },
  9: {
    monthName: 'Outubro',
    fruits: ['Jabuticaba', 'Manga', 'Abacaxi', 'Acerola', 'Banana', 'Caju', 'Laranja', 'Pêssego'],
    veggies: ['Abobrinha', 'Alcachofra', 'Aspargo', 'Beterraba', 'Cenoura', 'Pepino', 'Tomate'],
    greens: ['Alho-poró', 'Almeirão', 'Brócolis', 'Catalonha', 'Cebolinha', 'Coentro', 'Hortelã'],
  },
  10: {
    monthName: 'Novembro',
    fruits: ['Manga', 'Melancia', 'Melão', 'Abacaxi', 'Acerola', 'Caju', 'Coco', 'Goiaba', 'Pêssego'],
    veggies: ['Abobrinha', 'Berinjela', 'Beterraba', 'Cenoura', 'Inhame', 'Maxixe', 'Pepino', 'Pimentão'],
    greens: ['Alho-poró', 'Almeirão', 'Brócolis', 'Cebolinha', 'Espinafre', 'Manjericão', 'Salsinha'],
  },
  11: {
    monthName: 'Dezembro',
    fruits: ['Melancia', 'Abacaxi', 'Ameixa', 'Cereja', 'Figo', 'Lichia', 'Manga', 'Pêssego', 'Uva'],
    veggies: ['Abobrinha', 'Beterraba', 'Cenoura', 'Cogumelo', 'Pimentão', 'Tomate', 'Vagem'],
    greens: ['Almeirão', 'Cebolinha', 'Coentro', 'Hortelã', 'Orégano', 'Rúcula', 'Salsinha'],
  },
};

const HERB_POTS_GUIDE = [
  {
    name: 'Manjericão',
    sun: '4 a 5 horas de sol direto por dia',
    water: 'Regar dia sim, dia não (gosta da terra úmida, sem encharcar)',
    secret: 'Corte sempre as florzinhas que nascerem nas pontas para a planta continuar produzindo folhas largas e perfumadas por anos!',
  },
  {
    name: 'Alecrim',
    sun: 'Bastante sol (janela bem iluminada ou quintal)',
    water: 'Pouca água! Regue apenas 1 a 2 vezes por semana quando a terra estiver bem seca.',
    secret: 'O maior inimigo do alecrim é o excesso de água na raiz. Coloque pedrinhas ou argila expandida no fundo do vaso.',
  },
  {
    name: 'Hortelã',
    sun: 'Meia-sombra ou sol da manhã',
    water: 'Gosta de bastante água (regar quase todos os dias nos meses quentes)',
    secret: 'Plante a hortelã sempre em um vaso só para ela, pois as raízes se espalham rápido e tomam conta de outras plantinhas.',
  },
  {
    name: 'Cebolinha & Salsinha',
    sun: '3 a 4 horas de sol da manhã',
    water: 'Terra levemente úmida (3 a 4 vezes por semana)',
    secret: 'Na hora de colher a cebolinha, corte as folhas de fora bem rente à base em vez de cortar só a pontinha; ela engrossa o dobro!',
  },
];

const CRAFTS_TUTORIALS = [
  {
    title: 'Bico de Crochê Carreira Única para Pano de Prato (Clássico da Vovó)',
    category: 'Crochê & Panos de Prato',
    materials: 'Linha 100% algodão (tipo Anne ou Cléa dupla), agulha de crochê 1.75 mm e 1 pano de prato com bainha.',
    steps: [
      '1. Faça o caseado simples na borda do pano de prato dando espaço de 0,5 cm com 3 correntinhas entre cada ponto baixo alongado.',
      '2. No primeiro espacinho, suba 3 correntinhas e faça 3 pontos altos dentro do mesmo espaço.',
      '3. Vire o trabalho, suba 4 correntinhas e prenda com ponto baixo no topo do primeiro ponto alto.',
      '4. Vire novamente para a frente, suba 3 correntinhas e trabalhe 3 pétalas de 3 pontos altos fechados com ponto baixíssimo na argolinha, formando uma florzinha delicada!',
    ],
    sellTip: 'Um pano de prato simples de R$ 4,50 com esse bico de crochê pode ser vendido por R$ 22,00 a R$ 28,00 em kits semanais!',
  },
  {
    title: 'Sousplat Redondo de Barbante Econômico (Jogo Americano de Crochê)',
    category: 'Mesa Posta & Decoração',
    materials: 'Barbante nº 6 na cor cru ou verde-sálvia e agulha de crochê 3.5 mm.',
    steps: [
      '1. Inicie com o anel mágico e trabalhe 12 pontos altos dentro dele, fechando com ponto baixíssimo.',
      '2. Na 2ª carreira, faça 2 pontos altos para cada ponto de base (total de 24 pontos altos).',
      '3. Siga aumentando proporcionalmente por 9 carreiras intercaladas por 1 correntinha de espaço.',
      '4. Finalize a borda com bico rendado de leques (3 pontos altos, 2 correntinhas, 3 pontos altos no mesmo espaço).',
    ],
    sellTip: 'Jogos com 4 ou 6 lugares são campeões de encomendas para presentes de casamento e Dia das Mães.',
  },
  {
    title: 'Sachês Perfumados de Lavanda e Cravo para Gavetas (Anti-Traças)',
    category: 'Costura Fácil & Perfumaria do Lar',
    materials: 'Retalhos de tecido tricoline floral ou tule, flores secas de lavanda, cravos-da-índia, fibra siliconada e fita de cetim.',
    steps: [
      '1. Corte quadradinhos de tecido de 12x12 cm e costure 3 lados pelo avesso (à mão mesmo com ponto atrás ou na máquina).',
      '2. Desvire o saquinho, preencha metade com fibra macia e adicione 2 colheres de sopa de lavanda seca misturada com 10 cravos-da-índia.',
      '3. Amarre a boca do saquinho com um laço duplo de fita de cetim.',
      '4. Coloque nas gavetas de roupas de cama e guarda-roupas: perfuma por meses e afasta traças naturalmente!',
    ],
    sellTip: 'Ótima opção de lembrancinha econômica para presentear visitas e netos.',
  },
];

export const HomeCraftsHubPage: React.FC<HomeCraftsHubPageProps> = ({
  highContrastDark,
  user,
  onOpenAuthModal,
}) => {
  const [subTab, setSubTab] = useState<HomeSubTab>('stains');
  const [selectedMonth, setSelectedMonth] = useState<number>(() => new Date().getMonth());
  const [stainSearch, setStainSearch] = useState('');
  const { isSpeaking, speakText, stopSpeaking } = useVoiceReader();

  const currentHarvest = SEASONAL_HARVEST[selectedMonth] || SEASONAL_HARVEST[9];

  const filteredStains = STAIN_SOLUTIONS.filter(
    (s) =>
      s.title.toLowerCase().includes(stainSearch.toLowerCase()) ||
      s.mixture.toLowerCase().includes(stainSearch.toLowerCase()) ||
      s.instructions.toLowerCase().includes(stainSearch.toLowerCase())
  );

  // --- Estado do Caderninho de Aniversários da Família (Local + Nuvem) ---
  const [birthdays, setBirthdays] = useState<FamilyBirthday[]>(() => {
    try {
      const raw = localStorage.getItem('caderno_vovo_family_birthdays');
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return [
      { id: 'b-1', name: 'Lucas (Neto Querido)', relation: 'Neto(a)', day: 14, month: new Date().getMonth() + 1, favoriteCake: 'Bolo de Cenoura com Chocolate' },
      { id: 'b-2', name: 'Mariana (Filha)', relation: 'Filho(a)', day: 22, month: new Date().getMonth() + 1, favoriteCake: 'Bolo de Fubá Cremoso' },
    ];
  });

  const [bName, setBName] = useState('');
  const [bRelation, setBRelation] = useState('Neto(a)');
  const [bDay, setBDay] = useState('15');
  const [bMonth, setBMonth] = useState(String(new Date().getMonth() + 1));
  const [bCake, setBCake] = useState('Bolo de Chocolate da Vovó');

  useEffect(() => {
    localStorage.setItem('caderno_vovo_family_birthdays', JSON.stringify(birthdays));
    pushLocalDataToCloudIfLoggedIn();
  }, [birthdays]);

  const handleAddBirthday = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) return;
    const nextItem: FamilyBirthday = {
      id: `bday-${Date.now()}`,
      name: bName.trim(),
      relation: bRelation,
      day: Math.min(31, Math.max(1, Number(bDay) || 1)),
      month: Math.min(12, Math.max(1, Number(bMonth) || 1)),
      favoriteCake: bCake.trim() || 'Bolo Caseiro',
    };
    setBirthdays((prev) => [...prev, nextItem]);
    setBName('');
  };

  const deleteBirthday = (id: string) => {
    setBirthdays((prev) => prev.filter((b) => b.id !== id));
  };

  const currentMonthNum = new Date().getMonth() + 1;
  const currentMonthBirthdays = birthdays.filter((b) => b.month === currentMonthNum);

  return (
    <div className="space-y-8">
      {/* Cabeçalho Casa, Horta & Artesanato */}
      <div
        className={`rounded-3xl border p-6 sm:p-8 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6 ${
          highContrastDark
            ? 'bg-stone-900 border-stone-800 text-white'
            : 'bg-gradient-to-r from-amber-700 via-[#C83E5B] to-rose-700 text-white border-amber-300'
        }`}
      >
        <div className="space-y-2 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-extrabold uppercase tracking-wider">
            <i className="fa-solid fa-house-chimney-window" />
            <span>Sabedoria do Lar, Horta Caseira, Crochê & Aniversários</span>
          </span>
          <h1 className="font-serif-vovo text-3xl sm:text-4xl font-extrabold">
            SOS Tira-Manchas, Safra, Crochê & Aniversários da Família
          </h1>
          <p className="text-rose-50 text-sm sm:text-base leading-relaxed">
            Os melhores segredos de dona de casa para limpar sem esforço, comprar na época certa,
            fazer artesanato e nunca esquecer o aniversário dos filhos e netos queridos.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          {[
            { id: 'stains', label: 'SOS Tira-Manchas', icon: 'fa-spray-can-sparkles' },
            { id: 'garden', label: 'Safra & Horta', icon: 'fa-seedling' },
            { id: 'crafts', label: 'Crochê & Arte', icon: 'fa-scissors' },
            { id: 'birthdays', label: 'Aniversários', icon: 'fa-cake-candles' },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as HomeSubTab)}
              className={`px-4 py-3 rounded-2xl font-extrabold text-xs sm:text-sm flex items-center gap-2 transition ${
                subTab === t.id
                  ? 'bg-white text-[#C83E5B] shadow-md'
                  : 'bg-black/20 hover:bg-black/30 text-white'
              }`}
            >
              <i className={`fa-solid ${t.icon}`} />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </div>


      {/* SUB-ABA 1: SOS TIRA-MANCHAS & LIMPEZA CASEIRA SEGURA */}
      {subTab === 'stains' && (
        <div className="space-y-6">
          {/* Alerta Importante de Segurança Doméstica */}
          <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/50 border-2 border-amber-300 dark:border-amber-700 text-amber-950 dark:text-amber-100 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl shrink-0">
              <i className="fa-solid fa-shield-heart" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif-vovo text-lg font-extrabold">
                Regra de Ouro de Segurança da Vovó na Limpeza:
              </h3>
              <p className="text-xs sm:text-sm font-semibold mt-0.5 leading-relaxed">
                <strong>NUNCA misture Água Sanitária (Cândida/Cloro) com Vinagre, Álcool, Amônia ou Desinfetantes!</strong>{' '}
                Essas misturas liberam gases tóxicos perigosos para os pulmões. Use sempre receitinhas naturais suaves com bicarbonato, vinagre de álcool e sabão de coco separadamente.
              </p>
            </div>
          </div>

          {/* Busca de Manchas */}
          <div className="max-w-xl">
            <input
              type="search"
              value={stainSearch}
              onChange={(e) => setStainSearch(e.target.value)}
              placeholder="Qual mancha ou limpeza você quer resolver? (ex: vinho, café, panela, prata)..."
              className="w-full min-w-0 px-5 py-3.5 rounded-2xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-sm font-bold shadow-2xs focus:border-[#C83E5B] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredStains.map((item, idx) => (
              <div
                key={idx}
                className={`rounded-3xl border p-6 shadow-sm space-y-3 flex flex-col justify-between overflow-hidden ${
                  highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="space-y-2.5">
                  <span className="inline-block px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#C83E5B] dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold">
                    {item.category}
                  </span>
                  <h3 className="font-serif-vovo text-xl font-bold">{item.title}</h3>
                  <div className="p-3 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800 text-xs">
                    <strong className="text-[#1E7E5A] dark:text-emerald-400 block mb-0.5">Misturinha Caseira:</strong>
                    <span>{item.mixture}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                    {item.instructions}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    if (isSpeaking) stopSpeaking();
                    else speakText(`${item.title}. Você vai usar: ${item.mixture}. Passo a passo: ${item.instructions}`);
                  }}
                  className="self-start px-4 py-2 rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-[#C83E5B] hover:text-white text-stone-700 dark:text-stone-200 font-extrabold text-xs flex items-center gap-1.5 transition"
                >
                  <i className="fa-solid fa-volume-high" />
                  <span>Ouvir Explicação</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-ABA 2: CALENDÁRIO DA SAFRA DO MÊS & HORTA EM VASOS */}
      {subTab === 'garden' && (
        <div className="space-y-8">
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div className="min-w-0 flex-1">
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-apple-whole text-[#C83E5B] shrink-0" />
                  <span>Calendário da Feira: Safra de {currentHarvest.monthName}</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Comprar alimentos da época garante frutas mais doces, verduras fresquinhas e até 40% de economia na feira!
                </p>
              </div>

              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#F8F6F2] dark:bg-stone-800 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 font-extrabold text-sm shrink-0"
              >
                {Object.entries(SEASONAL_HARVEST).map(([mIndex, data]) => (
                  <option key={mIndex} value={Number(mIndex)}>
                    Mês de {data.monthName}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 space-y-3 text-stone-900 dark:text-stone-100">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#C83E5B] dark:text-rose-300 flex items-center gap-2">
                  <i className="fa-solid fa-lemon" />
                  <span>Frutas da Época</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentHarvest.fruits.map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-stone-900 border border-rose-200 dark:border-rose-800 text-stone-800 dark:text-stone-100 text-xs font-bold shadow-2xs"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-3 text-stone-900 dark:text-stone-100">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-2">
                  <i className="fa-solid fa-carrot" />
                  <span>Legumes Mais Baratos</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentHarvest.veggies.map((v) => (
                    <span
                      key={v}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-stone-900 border border-amber-200 dark:border-amber-800 text-stone-800 dark:text-stone-100 text-xs font-bold shadow-2xs"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 space-y-3 text-stone-900 dark:text-stone-100">
                <h3 className="font-extrabold text-sm uppercase tracking-wider text-[#1E7E5A] dark:text-emerald-400 flex items-center gap-2">
                  <i className="fa-solid fa-seedling" />
                  <span>Verduras & Ervas Frescas</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {currentHarvest.greens.map((g) => (
                    <span
                      key={g}
                      className="px-3 py-1 rounded-xl bg-white dark:bg-stone-900 border border-emerald-200 dark:border-emerald-800 text-stone-800 dark:text-stone-100 text-xs font-bold shadow-2xs"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Guia da Horta em Vasos */}
          <div className="space-y-4">
            <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
              <i className="fa-solid fa-leaf text-[#1E7E5A]" />
              <span>Como Cuidar dos Temperos da Vovó em Vasos sem Deixar Morrer</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {HERB_POTS_GUIDE.map((herb) => (
                <div
                  key={herb.name}
                  className={`rounded-3xl border p-6 shadow-sm space-y-3 overflow-hidden ${
                    highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                  }`}
                >
                  <h3 className="font-serif-vovo text-xl font-bold text-[#1E7E5A] dark:text-emerald-400 flex items-center gap-2">
                    <i className="fa-solid fa-plant-wilt" />
                    <span>{herb.name}</span>
                  </h3>
                  <div className="space-y-1.5 text-xs sm:text-sm">
                    <p>
                      <i className="fa-solid fa-sun text-amber-500 mr-1.5" />
                      <strong>Sol:</strong> {herb.sun}
                    </p>
                    <p>
                      <i className="fa-solid fa-droplet text-sky-500 mr-1.5" />
                      <strong>Regas:</strong> {herb.water}
                    </p>
                    <p className="p-3 rounded-xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/70 dark:border-stone-800 mt-2">
                      <strong className="text-[#C83E5B] dark:text-rose-400">Segredo da Vovó:</strong> {herb.secret}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-ABA 3: CANTINHO DO CROCHÊ, TRICÔ & FAÇA VOCÊ MESMA */}
      {subTab === 'crafts' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {CRAFTS_TUTORIALS.map((craft, idx) => (
              <div
                key={idx}
                className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-4 overflow-hidden ${
                  highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-3 py-1 rounded-full bg-rose-50 dark:bg-rose-950/60 text-[#C83E5B] dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-extrabold">
                      {craft.category}
                    </span>
                    <h2 className="font-serif-vovo text-2xl font-bold mt-2">{craft.title}</h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (isSpeaking) stopSpeaking();
                      else
                        speakText(
                          `${craft.title}. Materiais necessários: ${craft.materials}. Passo a passo: ${craft.steps.join(' ')}`
                        );
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-sm transition shrink-0"
                  >
                    <i className="fa-solid fa-volume-high" />
                    <span>Ouvir Passo a Passo do Crochê</span>
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 text-xs sm:text-sm">
                  <strong className="text-[#C83E5B] dark:text-rose-400">Materiais necessários:</strong> {craft.materials}
                </div>

                <ul className="space-y-2 text-xs sm:text-sm font-medium leading-relaxed">
                  {craft.steps.map((st, sIdx) => (
                    <li
                      key={sIdx}
                      className="p-3 rounded-xl bg-stone-50 dark:bg-stone-950 border border-stone-200/60 dark:border-stone-800"
                    >
                      {st}
                    </li>
                  ))}
                </ul>

                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-100 text-xs font-bold flex items-center gap-2">
                  <i className="fa-solid fa-sack-dollar text-[#1E7E5A] dark:text-emerald-400 text-base shrink-0" />
                  <span>{craft.sellTip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-ABA 4: CADERNINHO DE ANIVERSÁRIOS DA FAMÍLIA (FILHOS, NETOS & BISNETOS) */}
      {subTab === 'birthdays' && (
        <div className="space-y-6">
          <CloudSyncNotice
            user={user}
            onOpenAuthModal={onOpenAuthModal}
            moduleName="o seu Caderninho de Aniversários da Família"
          />
          <div
            className={`rounded-3xl border p-6 sm:p-8 shadow-sm space-y-6 overflow-hidden ${
              highContrastDark ? 'bg-stone-900 border-stone-800' : 'bg-white border-stone-200'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 dark:border-stone-800 pb-4">
              <div>
                <h2 className="font-serif-vovo text-2xl font-bold flex items-center gap-2">
                  <i className="fa-solid fa-cake-candles text-[#C83E5B]" />
                  <span>Caderninho de Aniversários da Família</span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 dark:text-stone-400">
                  Guarde as datas de filhos, netos e bisnetos com sugestão de bolo favorito e botão direto para mandar parabéns no WhatsApp.
                </p>
              </div>

              {currentMonthBirthdays.length > 0 && (
                <div className="px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[#C83E5B] dark:text-rose-300 text-xs font-extrabold flex items-center gap-2 shrink-0">
                  <i className="fa-solid fa-bell animate-bounce" />
                  <span>{currentMonthBirthdays.length} aniversariante(s) neste mês!</span>
                </div>
              )}
            </div>

            {/* Lista de Aniversários */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {birthdays.map((item) => {
                const isThisMonth = item.month === currentMonthNum;
                const whatsappMsg = `Parabéns, meu amor! Que o seu dia seja repleto de paz, saúde e muitas alegrias. A Vovó já está pensando no seu bolo favorito (${item.favoriteCake})! Um beijo bem carinhoso!`;
                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl border flex flex-col justify-between gap-3 transition ${
                      isThisMonth
                        ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800'
                        : highContrastDark
                        ? 'bg-stone-950 border-stone-800 text-white'
                        : 'bg-[#F8F6F2] border-stone-200 text-stone-800'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-3 py-0.5 rounded-full bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-xs font-extrabold text-[#C83E5B] dark:text-rose-300">
                          {item.relation}
                        </span>
                        <span className="font-extrabold text-sm text-[#1E7E5A] dark:text-emerald-400">
                          <i className="fa-solid fa-calendar-day mr-1" />
                          Dia {item.day}/{item.month < 10 ? `0${item.month}` : item.month}
                        </span>
                      </div>

                      <h3 className="font-serif-vovo text-xl font-bold">{item.name}</h3>

                      <p className="text-xs text-stone-600 dark:text-stone-300">
                        <i className="fa-solid fa-cake-candles text-amber-500 mr-1.5" />
                        Bolo favorito da Vovó: <strong>{item.favoriteCake}</strong>
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-stone-200/60 dark:border-stone-800">
                      <button
                        type="button"
                        onClick={() =>
                          window.open(`https://wa.me/?text=${encodeURIComponent(whatsappMsg)}`, '_blank')
                        }
                        className="px-3.5 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#1EBE5B] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-2xs"
                      >
                        <i className="fa-brands fa-whatsapp text-sm" />
                        <span>Mandar Parabéns</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteBirthday(item.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600"
                        title="Remover data"
                      >
                        <i className="fa-solid fa-trash-can text-xs" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Adicionar Aniversariante */}
            <form
              onSubmit={handleAddBirthday}
              className="p-4 rounded-2xl bg-[#F8F6F2] dark:bg-stone-950 border border-stone-200/80 dark:border-stone-800 space-y-3"
            >
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                <i className="fa-solid fa-plus text-[#C83E5B]" />
                <span>Adicionar Novo Familiar no Caderno:</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                <input
                  type="text"
                  required
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  placeholder="Nome do neto, filho ou familiar"
                  className="sm:col-span-2 px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold"
                />
                <select
                  value={bRelation}
                  onChange={(e) => setBRelation(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold"
                >
                  <option value="Neto(a)">Neto(a)</option>
                  <option value="Filho(a)">Filho(a)</option>
                  <option value="Bisneto(a)">Bisneto(a)</option>
                  <option value="Irmão(ã)">Irmão(ã)</option>
                  <option value="Sobrinho(a)">Sobrinho(a)</option>
                  <option value="Amigo(a)">Amigo(a)</option>
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min={1}
                    max={31}
                    required
                    value={bDay}
                    onChange={(e) => setBDay(e.target.value)}
                    placeholder="Dia"
                    className="px-2.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold text-center"
                  />
                  <input
                    type="number"
                    min={1}
                    max={12}
                    required
                    value={bMonth}
                    onChange={(e) => setBMonth(e.target.value)}
                    placeholder="Mês"
                    className="px-2.5 py-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs font-bold text-center"
                  />
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="text"
                  value={bCake}
                  onChange={(e) => setBCake(e.target.value)}
                  placeholder="Bolo ou sobremesa favorita (ex: Bolo de Cenoura, Torta de Limão)"
                  className="flex-1 min-w-0 px-3.5 py-2 rounded-xl bg-white dark:bg-stone-900 border border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-100 text-xs"
                />
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#C83E5B] hover:bg-rose-700 text-white font-extrabold text-xs shadow-sm transition shrink-0"
                >
                  Salvar Aniversário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

