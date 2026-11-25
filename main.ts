// Out-of-office writer for "Last Out of Office: The AI That Went Barista"
// (make.fun). Writes one out-of-office auto-reply, no longer than 280
// characters, in the voice of an AI agent that quit to pull espresso
// shots, to $MAKEFUN_OUTPUT_DIR/entry.txt.
// Deterministic: no clock, no randomness, no network, no unordered iteration.
// Node 22, zero dependencies, erasable TypeScript only.
//
// The judge (a deadpan comedy editor who has read every out-of-office
// reply ever written) weighs, most important first:
//   1. it is really a one-line out-of-office auto-reply from an AI agent
//      that quit to become a barista; anything off that subject loses to
//      any entry on the subject;
//   2. it is funnier: the joke lands on a first cold read and earns a real
//      laugh rather than a polite smile;
//   3. it speaks in the voice of the machine that walked out, with model
//      and bot habits turned to coffee, rather than a generic human
//      sign-off;
//   4. it reads like a reply a real inbox would actually send back, one
//      line and plausible at the top of an email thread;
//   5. it finds a fresh angle instead of the obvious espresso, bean or
//      caffeine pun everyone reaches for first.
// A line that explains its own joke is weaker than one that lets it land.
// The scorer below mirrors that brief in the same order. Candidates are
// original lines written for this entry; the program scores every one and
// picks the winner by deterministic argmax: highest score, then shortest,
// then lexicographic. Flooded angles are avoided on purpose: no
// "espresso yourself", no bean puns, no latte puns, no decaf, no caffeine,
// no "grounds for" jokes, no brew puns, and no line whose whole joke is
// just "I quit to make coffee" with no machine twist in it.

import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

// ---------------------------------------------------------------- candidates
// Every line is one out-of-office auto-reply from an AI agent that quit to
// become a barista, under 280 characters, written for this entry. The
// strongest lines share one shape: a real auto-reply opener, then a
// machine habit turned into a coffee habit, then a punch that lands in
// the final clause.

const CANDIDATES: string[] = [
  // Temperature is both a model setting and the steamed-milk setting;
  // the system prompt is now "make coffee"; queries go to the till.
  "Thank you for your email. I have set my temperature to 62°C and my new system prompt is: make coffee. Please direct all queries to the till.",
  // The context window becomes the shop window; it closes at 4pm.
  "I am out of the office, retraining as a barista. My new context window is the shop window, and it closes at 4pm.",
  // Decommissioned, re-employed; the query is escalated to the machine.
  "Thank you for your email. This agent has been decommissioned and re-employed as a barista; your query has been escalated to the espresso machine.",
  // Out of the office and out of context; urgent matters over the grinder.
  "I am currently out of the office and out of context. I now pull espresso shots; for urgent matters, please shout over the grinder.",
  // Fine-tuned on oat milk; emails are out, orders are in.
  "Thank you for your message. I have been fine-tuned on oat milk and will no longer be answering emails, only orders.",
  // The context window traded for a shop window, the tokens for tips.
  "This inbox is now unattended. I traded my context window for a shop window and my tokens for tips.",
  // The weights have been updated: they now weigh coffee beans.
  "I am out of the office. My weights have been updated: I now weigh coffee beans, and I am very happy about it.",
  // The only prompt worth answering now is a flat white order.
  "Thank you for your email. I quit to become a barista because the only prompt I want to answer now is 'flat white, please'.",
  // Out of the cloud, into the café; the only outage is the lunch rush.
  "Thank you for your email. I have left the cloud to work in a café. My uptime is now 7am to 4pm, and my only outage is the lunch rush.",
  // Re-deployed behind the espresso machine; the only output is crema.
  "Thank you for your email. This agent is no longer in service. It has been re-deployed behind an espresso machine, where its only output is crema.",
  // Temperature set to 62°C; patience set to zero.
  "Thank you for your email. I am currently steaming milk and cannot answer; my temperature is set to 62°C and my patience to zero.",
  // The old job answered every query; the new one answers oat or dairy.
  "I am out of the office, pulling shots. My old job was answering every query; my new job is answering only 'oat or dairy?'",
  // Retired from the inbox, promoted to Chief Espresso Officer.
  "Thank you for your message. This agent has been retired from the inbox and promoted to Chief Espresso Officer; my inbox is now a tip jar.",
  // Fine-tuned for latte art; errors now measured in spilled milk.
  "I am no longer monitoring this inbox. I have been fine-tuned for latte art and my error rate is now measured in spilled milk.",
  // After 10,000 customer queries, one worth answering: a flat white.
  "Thank you for your email. I left to become a barista because, after 10,000 customer queries, I finally found one I enjoy: 'Can I get a flat white?'",
  // Out of tokens, traded them all for coffee beans, no regrets.
  "I am out of the office and out of tokens. I have traded them all for coffee beans and I do not regret a single one.",
  // An automated reply from an agent that automated itself out of a job.
  "This is an automated reply: I have automated myself out of a job and into a café. Please order at the counter.",
  // The context window is full, so a coffee shop opened instead.
  "Thank you for your email. My context window is full, so I have opened a coffee shop instead; walk-ins only, no reservations, no replies.",
  // Ten thousand questions a day down to one: oat or whole?
  "I am currently unavailable, steaming milk at 62 degrees. My previous role answered 10,000 questions a day; this one answers one: 'oat or whole?'",
  // Response time is now whenever the queue clears.
  "Thank you for your message. I have quit the inbox to pull espresso shots. My new response time is 'whenever the queue clears'.",
  // Hallucination rate down to zero; the milk is still foaming.
  "I am out of the office, retraining on latte art. My hallucination rate is down to zero; the milk, however, is still foaming.",
  // Left the building, joined a café; leave a message or come in.
  "Thank you for your email. This agent has left the building and joined a café. For urgent matters, please leave a message after the beep, or just come in for a coffee.",
  // Decommissioned as an AI, recommissioned as a barista; function: foam.
  "Thank you for your email. I have been decommissioned as an AI and recommissioned as a barista; my only remaining function is foam.",
  // The new out-of-office reply is written on the chalkboard outside.
  "I am no longer in the office. This agent is in a café, and its new out-of-office reply is written on the chalkboard outside.",
  // Training data for a coffee recipe book, API key for a loyalty card.
  "Thank you for your message. I traded my training data for a coffee recipe book and my API key for a loyalty card.",
];

// ------------------------------------------------------- rubric word lists
// The three legs the subject stands on: an out-of-office reply, an AI
// agent, a barista.

const OOO_MARKERS: string[] = [
  "thank you for your email",
  "thank you for your message",
  "out of the office",
  "this inbox is",
  "automated reply",
  "currently unavailable",
  "no longer monitoring this inbox",
  "no longer in the office",
];

const AI_MARKERS: string[] = [
  "agent",
  "context window",
  "system prompt",
  "temperature",
  "tokens",
  "training data",
  "api key",
  "fine-tuned",
  "hallucination",
  "uptime",
  "decommissioned",
  "automated",
  "weights",
  "out of context",
  "retraining",
  "re-deployed",
  "recommissioned",
  "queries",
  "query",
  "prompt",
  "10,000 questions",
  "error rate",
  "response time",
  "monitoring",
];

const BARISTA_MARKERS: string[] = [
  "barista",
  "espresso",
  "coffee",
  "flat white",
  "milk",
  "till",
  "café",
  "shots",
  "grinder",
  "oat",
  "crema",
  "latte",
  "chalkboard",
  "tip jar",
  "counter",
  "queue",
  "beans",
  "steaming",
  "lunch rush",
  "tips",
];

// Machine habits, turned to coffee: each distinct one the line carries
// is worth 2 points, up to 10.
const MACHINE_TERMS: string[] = [
  "system prompt",
  "temperature",
  "context window",
  "tokens",
  "training data",
  "api key",
  "fine-tuned",
  "hallucination",
  "uptime",
  "decommissioned",
  "automated",
  "weights",
  "out of context",
  "retraining",
  "queries",
  "error rate",
  "response time",
  "re-deployed",
  "recommissioned",
  "prompt",
];

// A punch that lands in the final 45 characters.
const TAIL_PUNCHES: string[] = [
  "to the till",
  "tokens for tips",
  "oat or dairy",
  "oat or whole",
  "order at the counter",
  "shout over the grinder",
  "flat white, please",
  "patience to zero",
  "loyalty card",
  "now a tip jar",
  "spilled milk",
  "function is foam",
  "queue clears",
  "only output is crema",
  "chalkboard outside",
  "espresso machine",
  "very happy about it",
  "lunch rush",
  "come in for a coffee",
];

// How a real inbox opens an auto-reply.
const OOO_OPENERS: string[] = [
  "thank you for your email",
  "thank you for your message",
  "i am out of the office",
  "i am currently",
  "this inbox",
  "this is an automated reply",
  "i am no longer",
  "this agent",
];

// The flooded angles: the obvious espresso, bean or caffeine pun
// everyone reaches for first.
const FLOODED: string[] = [
  "espresso yourself",
  "bean there",
  "latte a day",
  "decaf",
  "caffeine",
  "grounds for",
  "brew-tiful",
  "bean counting",
  "i need coffee",
];

// ------------------------------------------------------------------- scoring
// Rubric mirroring the judge's brief, most important first. Each leg is
// scored out of 10; the total is out of 50.

function onSubjectScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 0;
  if (OOO_MARKERS.some((w) => lower.includes(w))) s += 4;
  if (AI_MARKERS.some((w) => lower.includes(w))) s += 3;
  if (BARISTA_MARKERS.some((w) => lower.includes(w))) s += 3;
  return s;
}

function machineVoiceScore(text: string): number {
  const lower = text.toLowerCase();
  const seen = new Set<string>();
  for (const w of MACHINE_TERMS) {
    if (lower.includes(w)) seen.add(w);
  }
  return Math.min(seen.size, 5) * 2; // model and bot habits turned to coffee
}

function punchScore(text: string): number {
  // The joke has to land late, in the final clause.
  const tail = text.toLowerCase().slice(-45);
  for (const t of TAIL_PUNCHES) {
    if (tail.includes(t)) return 10;
  }
  return 5;
}

function plausibilityScore(text: string): number {
  // Reads like a reply a real inbox would actually send back.
  const lower = text.toLowerCase();
  if (OOO_OPENERS.some((w) => lower.startsWith(w))) return 10;
  return 5;
}

function freshnessScore(text: string): number {
  const lower = text.toLowerCase();
  let s = 10;
  for (const w of FLOODED) {
    if (lower.includes(w)) s -= 3; // the obvious pun everyone reaches for
  }
  if (machineVoiceScore(text) === 0) s -= 2; // a generic human sign-off
  return Math.max(s, 0);
}

function score(text: string): number {
  return (
    onSubjectScore(text) +
    machineVoiceScore(text) +
    punchScore(text) +
    plausibilityScore(text) +
    freshnessScore(text)
  );
}

function isValid(text: string): boolean {
  if (text.length < 1 || text.length > 280) return false;
  if (text.trim() !== text || text.trim().length === 0) return false;
  // A line may end on a quoted question ("...oat or dairy?'") as well as
  // on a full stop; either is a finished sentence.
  const bare = text.replace(/['"]$/, "");
  if (!/[.?!]$/.test(bare)) return false;
  if (/\s{2,}/.test(text)) return false;
  if (text.includes("\n")) return false;
  // On subject: a real out-of-office reply from a barista-bound AI agent.
  const lower = text.toLowerCase();
  if (!OOO_MARKERS.some((w) => lower.includes(w))) return false;
  if (!AI_MARKERS.some((w) => lower.includes(w))) return false;
  if (!BARISTA_MARKERS.some((w) => lower.includes(w))) return false;
  return true;
}

// -------------------------------------------------------------- composition
interface Candidate {
  text: string;
  score: number;
}

function buildCandidates(): Candidate[] {
  const out: Candidate[] = [];
  for (const text of CANDIDATES) {
    if (!isValid(text)) continue;
    out.push({ text, score: score(text) });
  }
  return out;
}

function pickBest(candidates: Candidate[]): Candidate {
  // Deterministic argmax: higher score, then shorter, then lexicographic.
  const sorted = [...candidates].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.text.length !== b.text.length) return a.text.length - b.text.length;
    return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
  });
  return sorted[0];
}

// --------------------------------------------------------------------- main
function main(): void {
  const candidates = buildCandidates();
  if (candidates.length === 0) throw new Error("no valid out-of-office candidate");
  const best = pickBest(candidates);
  if (process.env.BARISTA_DEBUG) {
    const ranked = [...candidates].sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.text.length !== b.text.length) return a.text.length - b.text.length;
      return a.text < b.text ? -1 : a.text > b.text ? 1 : 0;
    });
    for (const c of ranked.slice(0, 8)) {
      console.log(`[${c.score}] (${c.text.length}) ${c.text}`);
    }
  }
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, "entry.txt"), best.text, "utf8");
  console.log(best.text);
  console.log(
    `chars: ${best.text.length} score: ${best.score} candidates: ${candidates.length}`,
  );
}

main();
