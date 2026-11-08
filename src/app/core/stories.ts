/**
 * Spread Stories — short lessons from the Gita, Ramayanam, Mahabharatam, Hanuman and the rishis.
 * Rules: every card names its real source (Gita chapter.verse, Kanda / Parva, Upanishad); folk
 * versions say so; no invented quotes; kind, hopeful lessons that are safe for children.
 */
import type { CoachLang } from './langs';
import type { StoryCol } from './story-index';

export type StoryLang = 'te' | 'en';
export interface StoryText {
  src: string;
  t: string;
  s: string;
  l: string;
}
export interface Story {
  c: StoryCol;
  slug: string;
  /** picture (see story-art.ts) and its colour variant */
  art: string;
  v: number;
  te: StoryText;
  en: StoryText;
}

export const STORY_COL_INFO: { id: StoryCol; icon: string; n: Record<CoachLang, string> }[] = [
  { id: 'krishna', icon: '🦚', n: { te: 'కృష్ణ గీత', en: 'Krishna', hi: 'कृष्ण', ta: 'கிருஷ்ணர்', kn: 'ಕೃಷ್ಣ', mr: 'कृष्ण', or: 'କୃଷ୍ଣ' } },
  { id: 'rama', icon: '🏹', n: { te: 'రామాయణం', en: 'Ramayanam', hi: 'रामायण', ta: 'ராமாயணம்', kn: 'ರಾಮಾಯಣ', mr: 'रामायण', or: 'ରାମାୟଣ' } },
  { id: 'hanuman', icon: '🐒', n: { te: 'హనుమాన్', en: 'Hanuman', hi: 'हनुमान', ta: 'ஹனுமான்', kn: 'ಹನುಮಾನ್', mr: 'हनुमान', or: 'ହନୁମାନ' } },
  { id: 'bharata', icon: '⚔️', n: { te: 'మహాభారతం', en: 'Mahabharatam', hi: 'महाभारत', ta: 'மகாபாரதம்', kn: 'ಮಹಾಭಾರತ', mr: 'महाभारत', or: 'ମହାଭାରତ' } },
  { id: 'rishi', icon: '🪷', n: { te: 'రుషులు', en: 'Rishis', hi: 'ऋषि', ta: 'ரிஷிகள்', kn: 'ಋಷಿಗಳು', mr: 'ऋषी', or: 'ଋଷି' } },
];

export const LESSON_WORD: Record<StoryLang, string> = { te: 'నేర్చుకోవాల్సింది', en: 'Lesson' };

export const STORIES: Story[] = [
  // ---- Krishna (Bhagavad Gita) ----
  { c: 'krishna', slug: 'karma', art: 'feather', v: 0,
    te: { src: 'భగవద్గీత 2.47', t: 'పని మీద దృష్టి, ఫలితం మీద కాదు', s: 'యుద్ధభూమిలో అర్జునుడు భయంతో ఆగిపోయాడు. కృష్ణుడు చెప్పాడు: “నీ పని చేయడం మీదే నీకు అధికారం, దాని ఫలితం మీద కాదు.”', l: 'ఫలితం గురించి భయపడకు. నీ పని నిజాయితీగా, పూర్తిగా చేయి.' },
    en: { src: 'Bhagavad Gita 2.47', t: 'Focus on the work, not the reward', s: 'On the battlefield, Arjuna froze with fear. Krishna told him: “Your right is to the work alone, never to its fruits.”', l: 'Don’t freeze over the result. Do your part honestly and fully.' } },
  { c: 'krishna', slug: 'mind', art: 'krishna', v: 0,
    te: { src: 'భగవద్గీత 6.5', t: 'నిన్ను నువ్వే పైకి లేపుకో', s: 'కృష్ణుడు అన్నాడు: “మనిషి తనను తానే పైకి లేపుకోవాలి, కిందకు దిగజార్చుకోకూడదు. మనసే మనకు మిత్రుడు, మనసే శత్రువు.”', l: 'రోజూ చేసే చిన్న మంచి అలవాటే నిన్ను నిలబెడుతుంది.' },
    en: { src: 'Bhagavad Gita 6.5', t: 'Lift yourself up', s: 'Krishna said: “Raise yourself by your own mind; do not let yourself sink. The mind is your best friend, and it can be your enemy.”', l: 'One small good habit, every day, is how you rise.' } },
  { c: 'krishna', slug: 'seasons', art: 'feather', v: 1,
    te: { src: 'భగవద్గీత 2.14', t: 'చలి, ఎండ లాగే కష్టసుఖాలు', s: 'కృష్ణుడు అర్జునుడితో అన్నాడు: “చలి-వేడి, సుఖం-దుఃఖం వస్తాయి, పోతాయి. అవి శాశ్వతం కాదు. వాటిని ఓర్పుతో భరించు.”', l: 'ఈ కష్టం కూడా శాశ్వతం కాదు. ఓర్పుతో నిలబడు.' },
    en: { src: 'Bhagavad Gita 2.14', t: 'Like winter and summer', s: 'Krishna told Arjuna: “Cold and heat, joy and sorrow come and go. They do not last. Bear them with patience.”', l: 'This hard time will pass too. Stay steady.' } },
  { c: 'krishna', slug: 'example', art: 'krishna', v: 1,
    te: { src: 'భగవద్గీత 3.21', t: 'పెద్దలు చేసేదే అందరూ నేర్చుకుంటారు', s: 'కృష్ణుడు చెప్పాడు: “గొప్పవారు ఏది చేస్తారో, మిగిలినవారూ అదే చేస్తారు. వారు చూపిన దారినే లోకం అనుసరిస్తుంది.”', l: 'మాటల కంటే నీ నడవడికే ఎక్కువ నేర్పుతుంది.' },
    en: { src: 'Bhagavad Gita 3.21', t: 'People follow what you do', s: 'Krishna said: “Whatever a great person does, others do the same. The world follows the example they set.”', l: 'Your actions teach more than your words.' } },
  { c: 'krishna', slug: 'balance', art: 'feather', v: 2,
    te: { src: 'భగవద్గీత 6.17', t: 'అన్నింటిలో మితం', s: 'కృష్ణుడు చెప్పాడు: “తిండి, ఆట, పని, నిద్ర — అన్నింటిలో మితంగా ఉండేవాడికి యోగం దుఃఖాన్ని తొలగిస్తుంది.”', l: 'సమయానికి తిను, సమయానికి నిద్రపో. సమతుల్యతే బలం.' },
    en: { src: 'Bhagavad Gita 6.17', t: 'Balance in everything', s: 'Krishna said: “Yoga removes sorrow for one who is moderate in eating, play, work and sleep.”', l: 'Eat on time, sleep on time. Balance is strength.' } },

  // ---- Ramayanam ----
  { c: 'rama', slug: 'promise', art: 'rama', v: 0,
    te: { src: 'రామాయణం · అయోధ్య కాండ', t: 'తండ్రి మాట కోసం', s: 'పట్టాభిషేకం జరగాల్సిన రోజే, తండ్రి ఇచ్చిన మాట నిలబెట్టడానికి రాముడు కోపం లేకుండా పద్నాలుగు ఏళ్ల అరణ్యవాసానికి బయలుదేరాడు.', l: 'కష్టం వచ్చినా మాట తప్పకు, ప్రశాంతతను వదలకు.' },
    en: { src: 'Ramayanam · Ayodhya Kanda', t: 'For his father’s word', s: 'On the very day he was to be crowned, Rama left calmly for fourteen years in the forest so that his father’s promise would be kept.', l: 'Keep your word even when it costs you, and keep your calm.' } },
  { c: 'rama', slug: 'shabari', art: 'rama', v: 1,
    te: { src: 'రామాయణం · అరణ్య కాండ', t: 'శబరి ఎదురుచూపు', s: 'శబరి ఎన్నో ఏళ్లు రాముడి కోసం ఎదురుచూసింది. రాముడు రాగానే తాను ప్రేమతో సేకరించిన పళ్లు ఇచ్చింది. రాముడు ఆనందంగా స్వీకరించాడు.', l: 'ప్రేమతో ఇచ్చింది చిన్నదైనా, అది చాలా గొప్పది.' },
    en: { src: 'Ramayanam · Aranya Kanda', t: 'Shabari’s long wait', s: 'Shabari waited for Rama for many years. When he came, she offered fruits she had gathered with love, and Rama accepted them with joy.', l: 'A small gift given with love is a great gift.' } },
  { c: 'rama', slug: 'bharata', art: 'padukas', v: 0,
    te: { src: 'రామాయణం · అయోధ్య కాండ', t: 'భరతుడి పాదుకలు', s: 'రాజ్యం తనదే అయినా భరతుడు తీసుకోలేదు. రాముడి పాదుకలను సింహాసనంపై పెట్టి, పద్నాలుగు ఏళ్లు అన్న పేరు మీదే పాలించాడు.', l: 'అధికారం కంటే న్యాయం, ప్రేమ గొప్పవి.' },
    en: { src: 'Ramayanam · Ayodhya Kanda', t: 'Bharata’s sandals', s: 'The throne was offered to Bharata, but he refused it. He placed Rama’s sandals on the throne and ruled for fourteen years in his brother’s name.', l: 'Fairness and love are greater than power.' } },
  { c: 'rama', slug: 'jatayu', art: 'birds', v: 1,
    te: { src: 'రామాయణం · అరణ్య కాండ', t: 'జటాయువు ధైర్యం', s: 'రావణుడు సీతను తీసుకెళ్తుంటే, వృద్ధుడైన జటాయువు తన శక్తి చాలదని తెలిసినా అడ్డుకున్నాడు. చివరి క్షణంలో రాముడికి సీత జాడ చెప్పాడు.', l: 'తప్పు జరుగుతుంటే మౌనంగా ఉండకు. చేతనైనంత సాయం చేయి.' },
    en: { src: 'Ramayanam · Aranya Kanda', t: 'Jatayu’s courage', s: 'As Ravana carried Sita away, the old bird Jatayu tried to stop him, knowing he was not strong enough. With his last breath he told Rama where she had been taken.', l: 'Don’t stay silent when wrong is done. Help as much as you can.' } },
  { c: 'rama', slug: 'squirrel', art: 'bridge', v: 0,
    te: { src: 'జానపద కథ · రామసేతు', t: 'ఉడుత సాయం', s: 'వానరులు సముద్రంపై వారధి కడుతుంటే, ఒక చిన్న ఉడుత ఇసుకలో పొర్లి, ఆ ఇసుకను రాళ్ల మధ్య దులిపేది. రాముడు ప్రేమగా దాని వీపు నిమిరాడని కథ.', l: 'నీ సాయం చిన్నదైనా, మనసుపెట్టి చేస్తే అది గొప్పదే.' },
    en: { src: 'Folk tale · Rama Setu', t: 'The squirrel’s help', s: 'While the vanaras built the bridge across the sea, a little squirrel rolled in the sand and shook it between the stones. The story says Rama stroked its back with love.', l: 'Even a small help, given with your whole heart, is great.' } },

  // ---- Hanuman ----
  { c: 'hanuman', slug: 'leap', art: 'hanuman', v: 0,
    te: { src: 'రామాయణం · కిష్కింధ కాండ', t: 'నీ బలం నీకు తెలియదు', s: 'సముద్రం దాటాలి. అందరూ వెనకాడారు. జాంబవంతుడు హనుమకు తన బలాన్ని గుర్తు చేశాడు. ఆ మాటతో హనుమ సముద్రం దూకాడు.', l: 'నిన్ను నమ్మే ఒక్క మాట చాలు. నువ్వు అనుకున్న దానికంటే బలవంతుడివి.' },
    en: { src: 'Ramayanam · Kishkindha Kanda', t: 'You don’t know your own strength', s: 'The ocean had to be crossed and everyone held back. Jambavan reminded Hanuman of his strength, and Hanuman leapt across.', l: 'One word of belief is enough. You are stronger than you think.' } },
  { c: 'hanuman', slug: 'good-news-first', art: 'sita', v: 0,
    te: { src: 'రామాయణం · సుందర కాండ', t: '“సీత కనిపించింది”', s: 'లంక నుంచి తిరిగి వచ్చిన హనుమ రాముడికి మొదటి మాటగానే “సీతను చూశాను” అని చెప్పాడు. రాముడి ఆందోళన వెంటనే తగ్గింది.', l: 'మంచి వార్తను ముందే చెప్పు. ఎదుటివారి భయాన్ని త్వరగా తగ్గించు.' },
    en: { src: 'Ramayanam · Sundara Kanda', t: '“I have seen Sita”', s: 'Back from Lanka, Hanuman’s very first words to Rama were “I have seen Sita.” Rama’s worry eased at once.', l: 'Say the good news first. Ease the other person’s fear quickly.' } },
  { c: 'hanuman', slug: 'sanjeevani', art: 'hanuman', v: 1,
    te: { src: 'రామాయణం · యుద్ధ కాండ', t: 'కొండనే తెచ్చాడు', s: 'లక్ష్మణుడు మూర్ఛపోయినప్పుడు, హనుమ సంజీవని మూలిక కోసం హిమాలయాలకు వెళ్లాడు. ఏ మూలికో గుర్తుపట్టలేక, ఆ కొండ శిఖరాన్నే ఎత్తుకొచ్చాడు.', l: 'దారి తెలియకపోయినా ఆగకు. పని పూర్తయ్యే దారి వెతుకు.' },
    en: { src: 'Ramayanam · Yuddha Kanda', t: 'He brought the whole mountain', s: 'When Lakshmana fell, Hanuman flew to the Himalayas for the healing herb. Unable to tell which plant it was, he carried back the whole mountain peak.', l: 'Don’t stop when you’re unsure. Find a way to finish the job.' } },
  { c: 'hanuman', slug: 'humble', art: 'gada', v: 0,
    te: { src: 'రామాయణం · సుందర కాండ', t: '“నేను రాముడి దాసుడిని”', s: 'లంకలో తనను తాను పరిచయం చేసుకున్నప్పుడు, అంత బలవంతుడైన హనుమ “నేను కోసల రాజు శ్రీరాముడి దాసుడిని” అని మాత్రమే చెప్పుకున్నాడు.', l: 'ఎంత బలం ఉన్నా, వినయం వదలకు.' },
    en: { src: 'Ramayanam · Sundara Kanda', t: '“I am Rama’s servant”', s: 'In Lanka, mighty Hanuman introduced himself simply as “a servant of Rama, the king of Kosala.”', l: 'However strong you are, stay humble.' } },
  { c: 'hanuman', slug: 'words', art: 'gada', v: 1,
    te: { src: 'రామాయణం · కిష్కింధ కాండ', t: 'మాటలోనే మర్యాద', s: 'హనుమ మొదటిసారి రామలక్ష్మణులతో మాట్లాడినప్పుడు, ఆయన మాటల్లో తప్పు లేదు, తొందర లేదు, మర్యాద ఉంది. రాముడు ఆ మాటతీరును ఎంతో మెచ్చుకున్నాడు.', l: 'స్పష్టంగా, మర్యాదగా మాట్లాడితే మనసులు గెలుస్తావు.' },
    en: { src: 'Ramayanam · Kishkindha Kanda', t: 'Respect in every word', s: 'When Hanuman first spoke to Rama and Lakshmana, his words were clear, calm and respectful, without a single mistake. Rama praised the way he spoke.', l: 'Speak clearly and kindly, and you win hearts.' } },

  // ---- Mahabharatam ----
  { c: 'bharata', slug: 'yaksha', art: 'lotus', v: 1,
    te: { src: 'మహాభారతం · వన పర్వం', t: 'అతి పెద్ద ఆశ్చర్యం', s: 'యక్షుడు అడిగాడు: “ప్రపంచంలో అతి పెద్ద ఆశ్చర్యం ఏమిటి?” యుధిష్ఠిరుడు: “రోజూ ఎంతోమంది వెళ్లిపోతున్నా, మిగిలినవారు తాము ఎప్పటికీ ఉంటామనుకోవడం.”', l: 'సమయం తక్కువ. ఈ రోజే మంచి పని చేయి.' },
    en: { src: 'Mahabharatam · Vana Parva', t: 'The greatest wonder', s: 'The Yaksha asked, “What is the greatest wonder?” Yudhishthira replied, “Every day people leave this world, yet the rest live as if they will stay forever.”', l: 'Time is short. Do the good thing today.' } },
  { c: 'bharata', slug: 'karna', art: 'armour', v: 0,
    te: { src: 'మహాభారతం · వన పర్వం', t: 'కర్ణుడి దానం', s: 'తనను కాపాడే కవచ కుండలాలు అడిగినప్పుడు, అవి లేకపోతే ప్రమాదమని తెలిసినా కర్ణుడు సంతోషంగా ఇచ్చేశాడు.', l: 'ఇచ్చే మనసు, ఇచ్చిన మాట మనిషిని గొప్పవాడిని చేస్తాయి.' },
    en: { src: 'Mahabharatam · Vana Parva', t: 'Karna’s gift', s: 'Asked for the armour and earrings that protected him, Karna gave them away gladly, even though he knew the danger.', l: 'A giving heart and a kept promise make a person great.' } },
  { c: 'bharata', slug: 'bird-eye', art: 'eye', v: 0,
    te: { src: 'మహాభారతం · ఆది పర్వం', t: 'పక్షి కన్ను మాత్రమే', s: 'ద్రోణుడు చెట్టు మీద ఒక పక్షి బొమ్మను గురి పెట్టమన్నాడు. “ఏం కనిపిస్తోంది?” అని అడిగితే, అందరూ చెట్టు, ఆకులు అన్నారు. అర్జునుడు మాత్రం “పక్షి కన్ను మాత్రమే” అన్నాడు.', l: 'లక్ష్యం మీదే దృష్టి పెడితే, విజయం దగ్గరవుతుంది.' },
    en: { src: 'Mahabharatam · Adi Parva', t: 'Only the bird’s eye', s: 'Drona asked his students to aim at a toy bird on a tree. “What do you see?” Others named the tree and the leaves. Arjuna said, “Only the bird’s eye.”', l: 'Keep your eyes on the goal, and success comes closer.' } },
  { c: 'bharata', slug: 'peace', art: 'conch', v: 0,
    te: { src: 'మహాభారతం · ఉద్యోగ పర్వం', t: 'చివరి వరకు శాంతి', s: 'యుద్ధం రాకుండా ఉండటానికి కృష్ణుడు స్వయంగా హస్తినాపురానికి శాంతి దూతగా వెళ్లాడు. పాండవులకు కేవలం ఐదు ఊళ్లు ఇచ్చినా చాలని అడిగాడు.', l: 'గొడవకు ముందు, శాంతికి ప్రతి అవకాశం ఇవ్వు.' },
    en: { src: 'Mahabharatam · Udyoga Parva', t: 'Peace till the very end', s: 'To stop the war, Krishna himself went to Hastinapura as a messenger of peace. He asked for just five villages for the Pandavas.', l: 'Before any fight, give peace every chance.' } },
  { c: 'bharata', slug: 'bhishma', art: 'wheel', v: 0,
    te: { src: 'మహాభారతం · ఆది పర్వం', t: 'భీష్మ ప్రతిజ్ఞ', s: 'తండ్రి సంతోషం కోసం దేవవ్రతుడు రాజ్యాన్ని వదులుకుంటానని, జీవితాంతం పెళ్లి చేసుకోనని ప్రతిజ్ఞ చేశాడు. ఆ కఠిన ప్రతిజ్ఞ వల్లే ఆయనకు “భీష్ముడు” అనే పేరు వచ్చింది.', l: 'ఒకసారి ఇచ్చిన మాటను జీవితాంతం నిలబెట్టు.' },
    en: { src: 'Mahabharatam · Adi Parva', t: 'Bhishma’s vow', s: 'For his father’s happiness, Devavrata gave up the throne and vowed never to marry. That hard vow gave him the name “Bhishma.”', l: 'Once you give your word, keep it for life.' } },

  // ---- Rishis ----
  { c: 'rishi', slug: 'valmiki', art: 'birds', v: 0,
    te: { src: 'రామాయణం · బాల కాండ', t: 'బాధ నుంచి పుట్టిన శ్లోకం', s: 'వేటగాడు ఒక క్రౌంచ పక్షిని కొట్టాడు. దాని జంట పక్షి ఏడుపు చూసి వాల్మీకి మనసు కరిగింది. ఆ బాధలో నుంచే మొదటి శ్లోకం పుట్టింది.', l: 'కరుణ ఉన్న మనసు నుంచే గొప్ప సృష్టి వస్తుంది.' },
    en: { src: 'Ramayanam · Bala Kanda', t: 'A verse born from sorrow', s: 'A hunter struck one of a pair of krauncha birds. Seeing its mate cry, Valmiki’s heart melted, and from that sorrow came the very first shloka.', l: 'Great creation comes from a kind heart.' } },
  { c: 'rishi', slug: 'vishwamitra', art: 'om', v: 0,
    te: { src: 'రామాయణం · బాల కాండ', t: 'విశ్వామిత్రుడి పట్టుదల', s: 'రాజుగా ఉన్న విశ్వామిత్రుడు బ్రహ్మర్షి కావాలనుకున్నాడు. ఎన్నోసార్లు తపస్సు భంగమైనా ఆగలేదు. చివరికి అనుకున్నది సాధించాడు.', l: 'ఎన్నిసార్లు పడినా మళ్లీ లేచి ప్రయత్నించు.' },
    en: { src: 'Ramayanam · Bala Kanda', t: 'Vishwamitra never gave up', s: 'King Vishwamitra wanted to become a Brahmarshi. His penance broke many times, yet he kept going, and in the end he reached his goal.', l: 'However often you fall, rise and try again.' } },
  { c: 'rishi', slug: 'vasishtha', art: 'lotus', v: 0,
    te: { src: 'రామాయణం · బాల కాండ', t: 'వశిష్ఠుడి క్షమ', s: 'విశ్వామిత్రుడు ఎన్నోసార్లు వశిష్ఠుడితో పోటీపడ్డాడు. అయినా వశిష్ఠుడు ద్వేషం పెంచుకోలేదు. విశ్వామిత్రుడి తపస్సు ఫలించినప్పుడు, ఆయనను “బ్రహ్మర్షి” అని పిలిచింది వశిష్ఠుడే.', l: 'ద్వేషం కాదు, క్షమే మనిషిని గొప్పవాడిని చేస్తుంది.' },
    en: { src: 'Ramayanam · Bala Kanda', t: 'Vasishtha’s forgiveness', s: 'Vishwamitra challenged Vasishtha again and again, yet Vasishtha held no hatred. When Vishwamitra’s penance bore fruit, it was Vasishtha who called him “Brahmarshi.”', l: 'Forgiveness, not hatred, makes a person great.' } },
  { c: 'rishi', slug: 'nachiketa', art: 'lamp', v: 0,
    te: { src: 'కఠోపనిషత్తు', t: 'నచికేతుడి ప్రశ్న', s: 'యముడు చిన్నారి నచికేతుడికి సంపద, రాజ్యం, దీర్ఘాయుష్షు ఇస్తానన్నాడు. అవేవీ వద్దని, “ఆత్మ గురించిన జ్ఞానం” కావాలని నచికేతుడు పట్టుబట్టాడు.', l: 'తాత్కాలిక ఆనందం కంటే నిజమైన జ్ఞానం విలువైనది.' },
    en: { src: 'Katha Upanishad', t: 'Nachiketa’s question', s: 'Yama offered young Nachiketa wealth, kingdoms and a long life. The boy refused them all and asked only for the knowledge of the Self.', l: 'True knowledge is worth more than passing pleasures.' } },
  { c: 'rishi', slug: 'parashurama', art: 'axe', v: 0,
    te: { src: 'రామాయణం · బాల కాండ', t: 'పరశురాముడి శాంతి', s: 'శివధనుస్సు విరిగిందని కోపంతో వచ్చిన పరశురాముడు, రాముడు విష్ణుధనుస్సును ఎక్కుపెట్టగానే ఆయన గొప్పతనాన్ని గుర్తించాడు. కోపం వదిలి, తపస్సుకు మహేంద్ర పర్వతానికి వెళ్లిపోయాడు.', l: 'నిజం తెలిసిన క్షణం కోపాన్ని వదిలేయడమే నిజమైన బలం.' },
    en: { src: 'Ramayanam · Bala Kanda', t: 'Parashurama lets go', s: 'Parashurama came in anger after Shiva’s bow was broken. When Rama strung Vishnu’s bow, he saw Rama’s greatness, let go of his anger and left for Mount Mahendra to meditate.', l: 'Letting go of anger the moment you see the truth is real strength.' } },
];
