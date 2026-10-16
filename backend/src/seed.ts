import { prisma } from './db';
import { encryptAES256, hashPassword } from './services/cryptoSecurity';

export const INITIAL_NEWS_POSTS = [
  {
    title: '5 Segredos da Vovó Helena para o Bolo Caseiro Nunca Solar e Crescer Fofinho',
    slug: '5-segredos-bolo-caseiro-nunca-solar-101',
    summary:
      'Descubra por que a temperatura dos ovos, o jeito de peneirar a farinha e o momento certo de abrir o forno mudam completamente a textura do seu bolo!',
    content:
      'Todo mundo ama aquele cheirinho de bolo saindo do forno no fim da tarde. Mas para que a massa fique leve como uma nuvem, a Vovó Helena guarda 5 regrinhas de ouro:\n\n1. Tire os ovos e o leite da geladeira 30 minutos antes de começar.\n2. Peneire a farinha de trigo junto com uma pitadinha mínima de sal (realça o sabor doce!).\n3. Nunca bata a farinha de trigo no liquidificador em velocidade alta — incorpore à mão com um batedor de arame.\n4. Pré-aqueça o forno por pelo menos 15 minutos a 180 graus antes de colocar a forma.\n5. Nunca abra a porta do forno antes dos primeiros 30 minutos de cozimento!',
    category: 'Dicas da Vovó',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    authorName: 'Vovó Helena',
    readMinutes: 3,
    likesCount: 142,
  },
  {
    title: 'Chás, Caldos e Ervas Frescas que Ajudam na Digestão e Aquecem o Coração',
    slug: 'chas-caldos-ervas-digestao-bem-estar-102',
    summary:
      'Como usar hortelã, erva-doce, gengibre e alecrim nas suas receitas do dia a dia para deixar as refeições mais leves, cheirosas e saudáveis.',
    content:
      'Na cozinha das nossas avós, cada tempero tinha um propósito especial além do sabor. O alecrim fresco nas batatas assadas estimula a memória e o bem-estar; já algumas folhinhas de hortelã na canja de galinha deixam o caldo super digestivo para o jantar.\n\nExperimente também finalizar o arroz doce com casquinha de laranja e canela em pau — além de reduzir a necessidade de açúcar, perfuma a casa inteira!',
    category: 'Saúde & Bem-Estar',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
    authorName: 'Dra. Clara & Vovó Helena',
    readMinutes: 4,
    likesCount: 98,
  },
  {
    title: 'Como Funciona o Novo Modo Cozinha Falado e o Relógio Automático do Portal',
    slug: 'como-funciona-modo-cozinha-falado-relogio-103',
    summary:
      'Agora você pode cozinhar sem precisar tocar na tela com as mãos cheias de farinha! Veja como ativar a leitura em voz alta e a calculadora de porções.',
    content:
      'Criamos o Modo Cozinha Guiado pensando na praticidade real na bancada: ao abrir qualquer receita do Caderno da Vovó, você pode multiplicar os ingredientes (Metade, Normal, Dobro ou Triplo) com 1 clique.\n\nAlém disso, clicando em "Iniciar Modo Cozinha Guiado", o site lê cada etapa em voz alta e já deixa o relógio regressivo pronto com alarme sonoro para o seu bolo nunca passar do ponto!',
    category: 'Novidades',
    imageUrl: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80',
    authorName: 'Equipe Caderno da Vovó',
    readMinutes: 2,
    likesCount: 215,
  },
];

export const INITIAL_RECIPES = [
  {
    title: 'Bolo de Cenoura Fofinho da Vovó com Casquinha Crocante de Chocolate',
    slug: 'bolo-de-cenoura-fofinho-da-vovo-1001',
    description:
      'A receita clássica de caderno de família: massa levinha que nunca sola e aquela cobertura de chocolate que faz casquinha brilhante!',
    chefTip:
      'Segredinho da Vovó: Peneire a farinha de trigo duas vezes e nunca bata o trigo no liquidificador — misture à mão com carinho para o bolo ficar parecido com uma nuvem!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/23-bolo-de-cenoura.html',
    imageUrl: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=900&q=80',
    category: 'Bolos e Tortas',
    prepTimeMinutes: 45,
    servings: '10 fatias',
    difficulty: 'Fácil',
    caloriesPerServ: 265,
    isFavorite: true,
    isVipOnly: false,
    viewsCount: 1420,
    likesCount: 389,
    rating: 5.0,
    ingredients: [
      { section: 'Massa do Bolo', rawText: '3 cenouras médias descascadas e picadas em rodelas', orderIndex: 1 },
      { section: 'Massa do Bolo', rawText: '4 ovos inteiros em temperatura ambiente', orderIndex: 2 },
      { section: 'Massa do Bolo', rawText: '0.5 xícara de chá de óleo de girassol ou milho', orderIndex: 3 },
      { section: 'Massa do Bolo', rawText: '2 xícaras de chá de açúcar refinado', orderIndex: 4 },
      { section: 'Massa do Bolo', rawText: '2.5 xícaras de chá de farinha de trigo peneirada', orderIndex: 5 },
      { section: 'Massa do Bolo', rawText: '1 colher de sopa de fermento químico em pó', orderIndex: 6 },
      { section: 'Calda Crocante', rawText: '2 colheres de sopa de manteiga sem sal', orderIndex: 7 },
      { section: 'Calda Crocante', rawText: '4 colheres de sopa de chocolate em pó 50%', orderIndex: 8 },
      { section: 'Calda Crocante', rawText: '1 xícara de chá de açúcar', orderIndex: 9 },
      { section: 'Calda Crocante', rawText: '6 colheres de sopa de leite integral', orderIndex: 10 },
    ],
    steps: [
      {
        section: 'Preparo da Massa',
        stepNumber: 1,
        instruction:
          'No liquidificador, coloque as 3 cenouras picadas, os 4 ovos e a meia xícara de óleo. Bata por 3 minutos até obter um creme bem liso.',
        timerSeconds: 180,
      },
      {
        section: 'Preparo da Massa',
        stepNumber: 2,
        instruction:
          'Acrescente o açúcar no liquidificador e bata por mais 1 minuto para incorporar bem.',
        timerSeconds: 60,
      },
      {
        section: 'Preparo da Massa',
        stepNumber: 3,
        instruction:
          'Transfira o creme para uma tigela grande e adicione a farinha de trigo peneirada aos poucos, mexendo delicadamente com um fouet ou colher de pau.',
      },
      {
        section: 'Preparo da Massa',
        stepNumber: 4,
        instruction:
          'Adicione o fermento em pó e misture suavemente. Despeje em uma forma untada e enfarinhada e asse em forno a 180 graus por 40 minutos.',
        timerSeconds: 2400,
      },
      {
        section: 'Calda de Chocolate',
        stepNumber: 5,
        instruction:
          'Misture todos os ingredientes da calda em uma panelinha e ferva em fogo médio por 8 minutos até começar a desgrudar. Despeje sobre o bolo quente!',
        timerSeconds: 480,
      },
    ],
    comments: [
      {
        authorName: 'Dona Aparecida (Minas Gerais)',
        authorIsVip: true,
        rating: 5,
        content: 'Fiz para os meus netos hoje à tarde! A dica de não bater o trigo no liquidificador deixou o bolo mais fofinho que já fiz na vida!',
        madeIt: true,
      },
      {
        authorName: 'Seu Carlos Alberto',
        authorIsVip: false,
        rating: 5,
        content: 'Usei o modo cozinha falado e o relógio de 40 minutos me avisou certinho. A calda ficou crocante igual a da minha mãe!',
        madeIt: true,
      },
    ],
  },
  {
    title: 'Canja Dourada da Vovó com Frango Desfiado e Hortelã',
    slug: 'canja-dourada-da-vovo-1002',
    description:
      'Caldo reconfortante que abraça a alma nos dias frios, preparada com legumes fresquinhos, arroz macio e um toque perfumado de ervas.',
    chefTip:
      'Segredinho da Vovó: Coloque um raminho de hortelã nos últimos 2 minutos de cozimento e retire antes de servir — deixa um aroma inesquecível!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/1405-canja-de-galinha.html',
    imageUrl: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=900&q=80',
    category: 'Sopas e Caldos',
    prepTimeMinutes: 35,
    servings: '6 tigelas',
    difficulty: 'Fácil',
    caloriesPerServ: 185,
    isFavorite: true,
    isVipOnly: false,
    viewsCount: 980,
    likesCount: 245,
    rating: 4.9,
    ingredients: [
      { section: 'Principal', rawText: '500 gramas de peito de frango cozido e desfiado', orderIndex: 1 },
      { section: 'Principal', rawText: '1 xícara de chá de arroz branco lavado', orderIndex: 2 },
      { section: 'Principal', rawText: '2 batatas médias em cubos pequenos', orderIndex: 3 },
      { section: 'Principal', rawText: '1 cenoura média cortada em cubinhos delicados', orderIndex: 4 },
      { section: 'Principal', rawText: '1 cebola picadinha e 2 dentes de alho dourados', orderIndex: 5 },
      { section: 'Principal', rawText: '1.5 litro de caldo caseiro do cozimento do frango', orderIndex: 6 },
      { section: 'Principal', rawText: 'Salsinha, cebolinha e sal a gosto', orderIndex: 7 },
    ],
    steps: [
      {
        section: 'Refogado',
        stepNumber: 1,
        instruction:
          'Em uma panela funda, doure a cebola e o alho num fio de azeite por 2 minutos até perfumar toda a cozinha.',
        timerSeconds: 120,
      },
      {
        section: 'Cozimento',
        stepNumber: 2,
        instruction:
          'Junte o frango desfiado, a cenoura, a batata, o arroz e o caldo quente. Deixe cozinhar em fogo brando por 20 minutos.',
        timerSeconds: 1200,
      },
      {
        section: 'Finalização',
        stepNumber: 3,
        instruction:
          'Finalize com cheiro-verde fresco picadinho e sirva bem quentinha com torradas amanteigadas.',
      },
    ],
    comments: [
      {
        authorName: 'Vovó Lúcia',
        authorIsVip: true,
        rating: 5,
        content: 'Essa canja levanta qualquer ânimo! O toque de hortelã no final faz toda a diferença.',
        madeIt: true,
      },
    ],
  },
  {
    title: 'Pudim Imperial de Leite Condensado Lisinho (Sem Furinhos)',
    slug: 'pudim-imperial-leite-condensado-1003',
    description:
      'O rei das sobremesas de domingo! Textura aveludada que derrete na boca com calda de caramelo âmbar brilhante.',
    chefTip:
      'Segredinho VIP da Vovó: Passe a mistura batida por uma peneira fina e deixe descansar 10 minutos antes de pôr na forma — toda a espuma sobe e o pudim fica 100% lisinho!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/31593-pudim-de-leite-condensado.html',
    imageUrl: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=900&q=80',
    category: 'Doces Caseiros',
    prepTimeMinutes: 60,
    servings: '10 fatias',
    difficulty: 'Fácil',
    caloriesPerServ: 290,
    isFavorite: true,
    isVipOnly: true,
    viewsCount: 2150,
    likesCount: 612,
    rating: 5.0,
    ingredients: [
      { section: 'Calda Âmbar', rawText: '1.5 xícara de chá de açúcar cristal ou refinado', orderIndex: 1 },
      { section: 'Calda Âmbar', rawText: '0.5 xícara de chá de água quente', orderIndex: 2 },
      { section: 'Creme do Pudim', rawText: '2 latas de leite condensado integral', orderIndex: 3 },
      { section: 'Creme do Pudim', rawText: '2 medidas da lata de leite integral morno', orderIndex: 4 },
      { section: 'Creme do Pudim', rawText: '4 ovos inteiros peneirados', orderIndex: 5 },
      { section: 'Creme do Pudim', rawText: '1 colher de chá de essência de baunilha', orderIndex: 6 },
    ],
    steps: [
      {
        section: 'Calda',
        stepNumber: 1,
        instruction:
          'Derreta o açúcar em fogo baixo até atingir cor de guaraná. Adicione a água quente com cuidado e deixe apurar por 3 minutos. Espalhe na forma de furo central.',
        timerSeconds: 180,
      },
      {
        section: 'Creme',
        stepNumber: 2,
        instruction:
          'Misture o leite condensado, o leite, os ovos peneirados e a baunilha com um batedor manual por 2 minutos sem criar muita espuma.',
        timerSeconds: 120,
      },
      {
        section: 'Banho-Maria',
        stepNumber: 3,
        instruction:
          'Cubra com papel-alumínio e asse em banho-maria a 180 graus por 50 minutos. Leve à geladeira por 4 horas antes de desenformar.',
        timerSeconds: 3000,
      },
    ],
    comments: [],
  },
  {
    title: 'Pão de Queijo Mineiro da Fazenda Recheado',
    slug: 'pao-de-queijo-mineiro-fazenda-1004',
    description:
      'Casquinha dourada e crocante por fora, interior puxa-puxa com queijo meia-cura legítimo para o café da tarde.',
    chefTip:
      'Segredinho da Vovó: Escalde o polvilho com o leite e óleo fervendo e espere amornar antes de colocar os ovos para não cozinhá-los!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/1443-pao-de-queijo-de-liquidificador.html',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=900&q=80',
    category: 'Lanches e Pães',
    prepTimeMinutes: 30,
    servings: '18 pãezinhos',
    difficulty: 'Fácil',
    caloriesPerServ: 145,
    isFavorite: false,
    isVipOnly: false,
    viewsCount: 890,
    likesCount: 198,
    rating: 4.8,
    ingredients: [
      { section: 'Principal', rawText: '500 gramas de polvilho azedo ou meio a meio com doce', orderIndex: 1 },
      { section: 'Principal', rawText: '1 xícara de chá de leite integral', orderIndex: 2 },
      { section: 'Principal', rawText: '0.5 xícara de chá de óleo', orderIndex: 3 },
      { section: 'Principal', rawText: '2 ovos grandes', orderIndex: 4 },
      { section: 'Principal', rawText: '250 gramas de queijo meia-cura ou parmesão ralado grosso', orderIndex: 5 },
      { section: 'Principal', rawText: '1 colher de chá de sal', orderIndex: 6 },
    ],
    steps: [
      {
        section: 'Escaldar',
        stepNumber: 1,
        instruction:
          'Ferva o leite com o óleo e o sal. Despeje sobre o polvilho em uma bacia grande e misture com uma colher até amornar por 5 minutos.',
        timerSeconds: 300,
      },
      {
        section: 'Amassar',
        stepNumber: 2,
        instruction:
          'Adicione os ovos e o queijo ralado e amasse com as mãos até formar uma massa macia que solte das mãos.',
      },
      {
        section: 'Assar',
        stepNumber: 3,
        instruction:
          'Modele bolinhas, disponha em assadeira e asse a 200 graus por 25 minutos até dourarem.',
        timerSeconds: 1500,
      },
    ],
    comments: [],
  },
  {
    title: 'Escondidinho Cremoso de Carne Seca com Mandioquinha Gratinada',
    slug: 'escondidinho-carne-seca-mandioquinha-1005',
    description:
      'Prato especial de almoço de domingo! Purê aveludado de mandioquinha cobrindo carne seca desfiada na manteiga de garrafa.',
    chefTip:
      'Segredinho VIP da Vovó: Finalize o purê com duas colheres de requeijão de corte antes de levar para gratinar — cria uma crosta dourada irresistível!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/4963-arroz-de-forno-super-facil.html',
    imageUrl: 'https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=900&q=80',
    category: 'Almoço de Família',
    prepTimeMinutes: 45,
    servings: '8 porções',
    difficulty: 'Médio',
    caloriesPerServ: 340,
    isFavorite: true,
    isVipOnly: true,
    viewsCount: 1640,
    likesCount: 470,
    rating: 5.0,
    ingredients: [
      { section: 'Purê Cremoso', rawText: '1 quilo de mandioquinha ou mandioca cozida e espremida', orderIndex: 1 },
      { section: 'Purê Cremoso', rawText: '2 colheres de sopa de manteiga e 1 copo de requeijão', orderIndex: 2 },
      { section: 'Recheio', rawText: '600 gramas de carne seca dessalgada, cozida e desfiada', orderIndex: 3 },
      { section: 'Recheio', rawText: '2 cebolas roxas fatiadas douradas na manteiga', orderIndex: 4 },
      { section: 'Cobertura', rawText: '200 gramas de queijo coalho ou mussarela ralada', orderIndex: 5 },
    ],
    steps: [
      {
        section: 'Recheio',
        stepNumber: 1,
        instruction:
          'Refogue a cebola na manteiga por 4 minutos, junte a carne seca desfiada e o cheiro-verde.',
        timerSeconds: 240,
      },
      {
        section: 'Montagem e Forno',
        stepNumber: 2,
        instruction:
          'Em um refratário, faça uma camada de purê, coloque a carne seca, cubra com o restante do purê e o queijo. Gratine no forno por 20 minutos.',
        timerSeconds: 1200,
      },
    ],
    comments: [],
  },
  {
    title: 'Bolinho de Chuva Assado ou Frito com Açúcar e Canela da Vovó',
    slug: 'bolinho-de-chuva-acucar-canela-1006',
    description:
      'Gostinho de infância na casa da avó! Bolinhos dourados, sequinhos por fora e super macios por dentro.',
    chefTip:
      'Segredinho da Vovó: Coloque 1 colherzinha de vinagre de maçã na massa — isso impede que o bolinho absorva óleo ao fritar!',
    sourceUrl: 'https://www.tudogostoso.com.br/receita/76049-bolinho-de-chuva.html',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=900&q=80',
    category: 'Doces Caseiros',
    prepTimeMinutes: 20,
    servings: '20 bolinhos',
    difficulty: 'Fácil',
    caloriesPerServ: 110,
    isFavorite: false,
    isVipOnly: false,
    viewsCount: 1120,
    likesCount: 310,
    rating: 4.9,
    ingredients: [
      { section: 'Massa', rawText: '2 ovos inteiros', orderIndex: 1 },
      { section: 'Massa', rawText: '1 xícara de chá de açúcar', orderIndex: 2 },
      { section: 'Massa', rawText: '1 xícara de chá de leite morno', orderIndex: 3 },
      { section: 'Massa', rawText: '2.5 xícaras de chá de farinha de trigo', orderIndex: 4 },
      { section: 'Massa', rawText: '1 colher de sopa de fermento em pó', orderIndex: 5 },
      { section: 'Finalização', rawText: 'Açúcar e canela em pó para polvilhar', orderIndex: 6 },
    ],
    steps: [
      {
        section: 'Massa',
        stepNumber: 1,
        instruction:
          'Misture os ovos, o açúcar e o leite. Vá adicionando a farinha de trigo e por último o fermento até obter uma massa cremosa.',
      },
      {
        section: 'Fritar e Polvilhar',
        stepNumber: 2,
        instruction:
          'Pingue colheradas em óleo médio (não muito quente) e doure por 4 minutos virando os bolinhos. Passe no açúcar com canela ainda mornos.',
        timerSeconds: 240,
      },
    ],
    comments: [],
  },
];

export async function ensureSeededDatabase() {
  const adminExists = await prisma.user.findUnique({
    where: { email: 'admin@cadernodavovo.com.br' },
  });

  if (!adminExists) {
    await prisma.user.create({
      data: {
        name: 'Vovó Helena (Administradora)',
        email: 'admin@cadernodavovo.com.br',
        passwordHash: hashPassword('vovo123'),
        bio: 'Cozinheira de mão cheia há 45 anos, guardiã dos cadernos de receita da família.',
        specialty: 'Bolos Caseiros, Pudins & Assados de Domingo',
        role: 'ADMIN',
        isVip: true,
        vipPlan: 'ANUAL',
      },
    });

    await prisma.user.create({
      data: {
        name: 'Dona Maria (Membro Clube VIP)',
        email: 'vip@cadernodavovo.com.br',
        passwordHash: hashPassword('vip123'),
        bio: 'Adoro testar receitas doces para os meus 6 netinhos no fim de semana!',
        specialty: 'Doces Caseiros & Pães de Queijo',
        role: 'VIP',
        isVip: true,
        vipPlan: 'ANUAL',
        vipExpiresAt: new Date(Date.now() + 365 * 86400000),
      },
    });

    await prisma.securityAuditLog.create({
      data: {
        action: 'SYSTEM_CRYPTO_BOOTSTRAP',
        actor: 'system',
        ipAddress: '127.0.0.1',
        details: 'Contas iniciais protegidas com Scrypt + AES-256-GCM + Captcha HMAC inicializadas.',
      },
    });
  }

  const configExists = await prisma.siteConfig.findUnique({ where: { id: 'default' } });
  if (!configExists) {
    await prisma.siteConfig.create({
      data: {
        id: 'default',
        siteName: 'Caderno da Vovó',
        adsenseEnabled: true,
        adsenseClientId: 'ca-pub-7788990011223344',
        adsenseHeaderSlot: '1010101010',
        adsenseInFeedSlot: '2020202020',
        adsenseRecipeSlot: '3030303030',
        vipMonthlyPrice: 14.9,
        vipAnnualPrice: 119.9,
        encryptedPixKey: encryptAES256('clubevip@cadernodavovo.com.br'),
      },
    });
  }

  const newsCount = await prisma.newsPost.count();
  if (newsCount === 0) {
    for (const post of INITIAL_NEWS_POSTS) {
      await prisma.newsPost.create({ data: post });
    }
  }

  const count = await prisma.recipe.count();
  if (count === 0) {
    for (const r of INITIAL_RECIPES) {
      await prisma.recipe.create({
        data: {
          title: r.title,
          slug: r.slug,
          description: r.description,
          chefTip: r.chefTip,
          sourceUrl: r.sourceUrl,
          imageUrl: r.imageUrl,
          category: r.category,
          prepTimeMinutes: r.prepTimeMinutes,
          servings: r.servings,
          difficulty: r.difficulty,
          caloriesPerServ: r.caloriesPerServ,
          isFavorite: r.isFavorite,
          isVipOnly: r.isVipOnly,
          viewsCount: r.viewsCount,
          likesCount: r.likesCount,
          rating: r.rating,
          ingredients: { create: r.ingredients },
          steps: { create: r.steps },
          comments: r.comments && r.comments.length > 0 ? { create: r.comments } : undefined,
        },
      });
    }
  }
}
