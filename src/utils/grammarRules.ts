/**
 * Lightweight client-side grammar & spellcheck engine
 * 100% offline, zero network requests, instant execution.
 */

export interface GrammarIssue {
  id: string;
  startIndex: number;
  endIndex: number;
  original: string;
  replacement: string;
  category: 'spelling' | 'capitalization' | 'spacing' | 'repetition' | 'punctuation' | 'grammar';
  title: string;
  explanation: string;
}

// Curated dictionary of ~250 most frequent English typos & misspellings
const TYPO_MAP: Record<string, string> = {
  teh: 'the',
  recieve: 'receive',
  recieved: 'received',
  recieving: 'receiving',
  seperate: 'separate',
  seperated: 'separated',
  definately: 'definitely',
  definitly: 'definitely',
  occured: 'occurred',
  occuring: 'occurring',
  untill: 'until',
  truely: 'truly',
  accomodate: 'accommodate',
  accomodation: 'accommodation',
  wierd: 'weird',
  acheive: 'achieve',
  acheived: 'achieved',
  goverment: 'government',
  enviroment: 'environment',
  tommorow: 'tomorrow',
  tomorow: 'tomorrow',
  calender: 'calendar',
  begining: 'beginning',
  belive: 'believe',
  neccessary: 'necessary',
  necesary: 'necessary',
  noticable: 'noticeable',
  priviledge: 'privilege',
  succesful: 'successful',
  succesfully: 'successfully',
  occurence: 'occurrence',
  refered: 'referred',
  refering: 'referring',
  existance: 'existence',
  embarass: 'embarrass',
  embarassed: 'embarrassed',
  harasment: 'harassment',
  independant: 'independent',
  maintenence: 'maintenance',
  millenium: 'millennium',
  milleniums: 'millenniums',
  posession: 'possession',
  rythm: 'rhythm',
  supercede: 'supersede',
  threshhold: 'threshold',
  weather: 'whether',
  wich: 'which',
  alot: 'a lot',
  allot: 'a lot',
  adress: 'address',
  adresses: 'addresses',
  adressed: 'addressed',
  aquaintance: 'acquaintance',
  agressive: 'aggressive',
  agression: 'aggression',
  apparant: 'apparent',
  apparrent: 'apparent',
  appearence: 'appearance',
  arguement: 'argument',
  assasin: 'assassin',
  basicly: 'basically',
  bizzare: 'bizarre',
  collegue: 'colleague',
  collegues: 'colleagues',
  commited: 'committed',
  commitee: 'committee',
  concious: 'conscious',
  counseler: 'counselor',
  curiousity: 'curiosity',
  dissapear: 'disappear',
  dissappoint: 'disappoint',
  dispair: 'despair',
  fascinating: 'fascinating',
  foreward: 'forward',
  fourty: 'forty',
  gauge: 'gage',
  guarentee: 'guarantee',
  guaranty: 'guarantee',
  hieght: 'height',
  humerous: 'humorous',
  imediate: 'immediate',
  imediately: 'immediately',
  incidently: 'incidentally',
  interupt: 'interrupt',
  knowlege: 'knowledge',
  liason: 'liaison',
  libary: 'library',
  lightening: 'lightning',
  lisence: 'license',
  lonelyness: 'loneliness',
  manouver: 'maneuver',
  mispell: 'misspell',
  mispelled: 'misspelled',
  mispelling: 'misspelling',
  mischevious: 'mischievous',
  neice: 'niece',
  nieghbor: 'neighbor',
  paralell: 'parallel',
  pastime: 'pastime',
  persue: 'pursue',
  persuing: 'pursuing',
  peice: 'piece',
  plagarism: 'plagiarism',
  possession: 'possession',
  practise: 'practice',
  prefered: 'preferred',
  preceed: 'precede',
  presance: 'presence',
  procede: 'proceed',
  pronounciation: 'pronunciation',
  publically: 'publicly',
  questionaire: 'questionnaire',
  realy: 'really',
  recomended: 'recommended',
  reccomend: 'recommend',
  reccomended: 'recommended',
  relevent: 'relevant',
  religous: 'religious',
  resistence: 'resistance',
  restaraunt: 'restaurant',
  seige: 'siege',
  similiar: 'similar',
  speach: 'speech',
  strenght: 'strength',
  suprise: 'surprise',
  suprised: 'surprised',
  temperture: 'temperature',
  tendancy: 'tendency',
  therefor: 'therefore',
  thier: 'their',
  twelth: 'twelfth',
  unforseen: 'unforeseen',
  vaccum: 'vacuum',
  vehical: 'vehicle',
  visable: 'visible',
  writting: 'writing',
  yhe: 'the',
  yu: 'you',
  thnx: 'thanks',
  plz: 'please',
  becuase: 'because',
  becasue: 'because',
  beacuse: 'because',
  definatelyy: 'definitely',
  greatful: 'grateful',
  happend: 'happened',
  interseting: 'interesting',
  opionion: 'opinion',
  oppinion: 'opinion',
  persistance: 'persistence',
  sence: 'sense',
  unfortunatly: 'unfortunately',
  compleatly: 'completely',
  appologize: 'apologize',
  appology: 'apology',
};

// Common missing apostrophe contractions
const CONTRACTIONS_MAP: Record<string, string> = {
  dont: "don't",
  cant: "can't",
  wont: "won't",
  didnt: "didn't",
  isnt: "isn't",
  arent: "aren't",
  couldnt: "couldn't",
  shouldnt: "shouldn't",
  wouldnt: "wouldn't",
  hasnt: "hasn't",
  havent: "haven't",
  wasnt: "wasn't",
  werent: "weren't",
  doesnt: "doesn't",
  thats: "that's",
  whats: "what's",
  wheres: "where's",
  hows: "how's",
  whos: "who's",
  theres: "there's",
  heres: "here's",
  lets: "let's",
  youre: "you're",
  theyre: "they're",
  weve: "we've",
  youve: "you've",
  theyve: "they've",
  im: "I'm",
};

export function checkGrammar(text: string): GrammarIssue[] {
  if (!text || text.trim().length === 0) return [];

  const issues: GrammarIssue[] = [];

  // 1. Double or multiple consecutive spaces
  const doubleSpaceRegex = /[ ]{2,}/g;
  let match: RegExpExecArray | null;
  while ((match = doubleSpaceRegex.exec(text)) !== null) {
    issues.push({
      id: `spacing-${match.index}`,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      original: match[0],
      replacement: ' ',
      category: 'spacing',
      title: 'Extra Whitespace',
      explanation: `Found ${match[0].length} consecutive spaces. A single space is standard.`
    });
  }

  // 2. Space before punctuation (e.g. "hello , world" -> "hello, world")
  const spaceBeforePunctRegex = /\s+([,.:;?!])/g;
  while ((match = spaceBeforePunctRegex.exec(text)) !== null) {
    issues.push({
      id: `punct-space-${match.index}`,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      original: match[0],
      replacement: match[1],
      category: 'punctuation',
      title: 'Misplaced Space Before Punctuation',
      explanation: `Punctuation marks should not have leading whitespace.`
    });
  }

  // 3. Repeated consecutive words (e.g. "the the", "is is")
  const repeatedWordRegex = /\b([a-zA-Z]+)\s+\1\b/gi;
  while ((match = repeatedWordRegex.exec(text)) !== null) {
    const singleWord = match[1];
    issues.push({
      id: `repeat-${match.index}`,
      startIndex: match.index,
      endIndex: match.index + match[0].length,
      original: match[0],
      replacement: singleWord,
      category: 'repetition',
      title: 'Repeated Word',
      explanation: `The word "${singleWord}" is accidentally duplicated.`
    });
  }

  // 4. Standalone lowercase "i" -> "I"
  const lowercaseIRegex = /\b(i)\b/g;
  while ((match = lowercaseIRegex.exec(text)) !== null) {
    issues.push({
      id: `pronoun-i-${match.index}`,
      startIndex: match.index,
      endIndex: match.index + 1,
      original: 'i',
      replacement: 'I',
      category: 'capitalization',
      title: 'Capitalize Pronoun',
      explanation: `The standalone pronoun "I" should always be capitalized.`
    });
  }

  // 5. Missing capitalization after sentence terminal punctuation (. ? !)
  const sentenceTerminalRegex = /([.?!]\s+)([a-z])/g;
  while ((match = sentenceTerminalRegex.exec(text)) !== null) {
    const charIndex = match.index + match[1].length;
    const lowerChar = match[2];
    issues.push({
      id: `sentence-cap-${charIndex}`,
      startIndex: charIndex,
      endIndex: charIndex + 1,
      original: lowerChar,
      replacement: lowerChar.toUpperCase(),
      category: 'capitalization',
      title: 'Sentence Capitalization',
      explanation: `New sentences following a period or exclamation should start with a capital letter.`
    });
  }

  // Also check beginning of text if it starts with lowercase
  if (/^[a-z]/.test(text)) {
    issues.push({
      id: 'start-cap-0',
      startIndex: 0,
      endIndex: 1,
      original: text[0],
      replacement: text[0].toUpperCase(),
      category: 'capitalization',
      title: 'Initial Capitalization',
      explanation: 'The beginning of your text should start with a capital letter.'
    });
  }

  // 6. Word-level checks: Typos and missing contraction apostrophes
  const wordRegex = /\b[a-zA-Z']+\b/g;
  while ((match = wordRegex.exec(text)) !== null) {
    const rawWord = match[0];
    const lowerWord = rawWord.toLowerCase();
    const isFirstCap = /^[A-Z][a-z]/.test(rawWord);
    const isAllCaps = rawWord.length > 1 && rawWord === rawWord.toUpperCase();

    // Check common typos
    if (TYPO_MAP[lowerWord]) {
      let corrected = TYPO_MAP[lowerWord];
      if (isAllCaps) corrected = corrected.toUpperCase();
      else if (isFirstCap) corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);

      // Check if we don't already have an overlapping issue
      const hasOverlap = issues.some(
        iss => (match!.index >= iss.startIndex && match!.index < iss.endIndex)
      );

      if (!hasOverlap) {
        issues.push({
          id: `typo-${match.index}`,
          startIndex: match.index,
          endIndex: match.index + rawWord.length,
          original: rawWord,
          replacement: corrected,
          category: 'spelling',
          title: 'Spelling Correction',
          explanation: `"${rawWord}" appears to be misspelled. Did you mean "${corrected}"?`
        });
      }
    }
    // Check missing contraction apostrophe
    else if (CONTRACTIONS_MAP[lowerWord]) {
      let corrected = CONTRACTIONS_MAP[lowerWord];
      if (isFirstCap && corrected.length > 0) {
        corrected = corrected.charAt(0).toUpperCase() + corrected.slice(1);
      }

      const hasOverlap = issues.some(
        iss => (match!.index >= iss.startIndex && match!.index < iss.endIndex)
      );

      if (!hasOverlap) {
        issues.push({
          id: `contraction-${match.index}`,
          startIndex: match.index,
          endIndex: match.index + rawWord.length,
          original: rawWord,
          replacement: corrected,
          category: 'punctuation',
          title: 'Missing Apostrophe',
          explanation: `Contractions require an apostrophe: "${corrected}".`
        });
      }
    }
  }

  // Sort issues by position ascending
  issues.sort((a, b) => a.startIndex - b.startIndex);

  return issues;
}

export function applyFix(text: string, issue: GrammarIssue): string {
  return (
    text.slice(0, issue.startIndex) +
    issue.replacement +
    text.slice(issue.endIndex)
  );
}

export function applyAllFixes(text: string, issues: GrammarIssue[]): string {
  // Sort reverse by start index so replacements don't shift preceding offsets
  const sorted = [...issues].sort((a, b) => b.startIndex - a.startIndex);
  let result = text;
  for (const issue of sorted) {
    result = result.slice(0, issue.startIndex) + issue.replacement + result.slice(issue.endIndex);
  }
  return result;
}
