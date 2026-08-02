/**
 * Comprehensive Profanity, Swearing, Hinglish, Gujarati & Political Abuse Filter
 */

const BAD_WORDS_LIST = [
  // English Swear & Profane Words
  "fuck", "fucking", "fucked", "fuckin", "fucker", "fuk", "fck",
  "shit", "shitting", "shitty", "bullshit",
  "ass", "asshole", "bitch", "bitches", "bitchy", "bastard", "dick",
  "pussy", "cunt", "cock", "motherfucker", "mf", "slut", "whore",
  "piss", "damn", "crap", "douche", "douchebag",

  // English Hate Speech & Abusive Words
  "retard", "nigger", "nigga", "faggot", "fag", "chink", "spic",
  "idiot", "dumbass", "stupid", "jackass",

  // Political Harassment & Toxic Political Terms (Indian & Global)
  "terrorist", "nazi", "commie", "libtard", "fascist", "sanghi", "bhakt", "khalistani",
  "hitler", "adolf", "hail hitler", "sieg heil", "seige hail", "fuhrer", "fuehrer",
  "modi", "rahul", "pappu", "fenku", "bjp", "congress", "aap", "kejriwal",
  "trump", "biden", "putin", "jinping", "propaganda", "extremist", "jihadist", "urban naxal", "naxalite",

  // Hindi / Hinglish Gaalis (Transliterated)
  "madarchod", "madarchaud", "madarchoat", "maderchod", "mc",
  "bhenchod", "behenchod", "bahenchod", "benchod", "bc", "bkl", "mkc", "tmkc", "bsdk",
  "bhosdike", "bhosdika", "bhosdina", "bhosdi", "bhosada", "bhosadi", "bhosadiwale", "bhosadiwala",
  "loda", "lawda", "lauda", "lode", "lawde", "laude", "lond",
  "chutiya", "chutiye", "chutiyapa", "chutiyagiri", "chutmaarike", "chutmarike", "chutad", "chut", "choot",
  "chudai", "chuday", "choduga", "chudegi", "chodina", "chod", "chode", "chodna", "chodne",
  "gand", "gaand", "gandu", "gaandu", "gandmarike", "gandmasti", "gandfat", "gandfati",
  "bhadva", "bhadwe", "bhadwa", "harami", "harambhor", "kamina", "kamine", "saala", "sala", "saali", "saale",
  "randi", "ranti", "randwa", "randwe", "tattu", "tatte", "gotiye", "jhatu", "nalayak", "kutte", "kutti",
];

// Helper to normalize text (e.g. f.u.c.k, f*ck, or ch.u.t.i.y.a)
const normalizeText = (str) => {
  return str
    .toLowerCase()
    .replace(/[\$\@\*\!\#\-\_\.\,\+\;\:\~\`\^\&]/g, "") // Strip special characters used to obfuscate
    .replace(/1/g, "i")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/0/g, "o")
    .replace(/\$/g, "s")
    .replace(/5/g, "s");
};

/**
 * Checks if a string contains abusive, profane, or toxic political words in English, Hindi, or Gujarati.
 */
export const containsProfanity = (text) => {
  if (!text || typeof text !== "string") return false;

  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  for (const badWord of BAD_WORDS_LIST) {
    // Exact word match
    if (words.includes(badWord)) {
      return true;
    }
    // Substring match for longer compound bad words
    if (badWord.length >= 4 && normalized.includes(badWord)) {
      return true;
    }
    // Regex word boundary match
    const regex = new RegExp(`\\b${badWord}\\b`, "i");
    if (regex.test(normalized)) {
      return true;
    }
  }

  return false;
};

/**
 * Replaces profane words with asterisks (e.g., "bhenchod" -> "********")
 */
export const filterProfanity = (text) => {
  if (!text || typeof text !== "string") return text;

  let filtered = text;
  for (const badWord of BAD_WORDS_LIST) {
    const regex = new RegExp(`\\b${badWord}\\b`, "gi");
    filtered = filtered.replace(regex, (match) => "*".repeat(match.length));
  }

  return filtered;
};
