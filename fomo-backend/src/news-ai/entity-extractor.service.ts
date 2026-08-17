/**
 * Entity Extractor (MIGRATED verbatim from FOMO-DATA news-intelligence/extractors).
 * Pure logic: extracts projects/funds/tokens/persons from article text.
 */
import { Injectable } from "@nestjs/common";

export interface ExtractedEntities {
  projects: string[];
  funds: string[];
  tokens: string[];
  persons: string[];
}

const FUND_PATTERNS = [
  /Capital/i, /Ventures/i, /Partners/i, /Labs/i, /DAO/i,
  /a16z/i, /Paradigm/i, /Polychain/i, /Multicoin/i, /Pantera/i,
  /Sequoia/i, /Andreessen/i, /Binance/i, /Coinbase/i, /Jump/i,
  /Crypto$/i, /Digital$/i, /Fund$/i, /VC$/i, /Holdings$/i,
  /Investments$/i, /Group$/i,
];
const FUND_CONTEXT = ["invest", "led", "raise", "fund", "back", "participated", "announce", "portfolio", "vc", "venture", "capital"];
const PROJECT_CONTEXT = ["launch", "protocol", "mainnet", "testnet", "network", "token", "chain", "dapp", "platform", "ecosystem"];
const TOKEN_PATTERN = /\$[A-Z]{2,10}/g;

@Injectable()
export class NewsAiEntityExtractor {
  extract(text: string): ExtractedEntities {
    const projects = new Set<string>();
    const funds = new Set<string>();
    const tokens = new Set<string>();
    const persons = new Set<string>();
    if (!text) return { projects: [], funds: [], tokens: [], persons: [] };

    const tokenMatches = text.match(TOKEN_PATTERN) || [];
    for (const t of tokenMatches) tokens.add(t.replace("$", "").toUpperCase());

    const words = text.split(/\s+/);
    for (let i = 0; i < words.length; i++) {
      const word = words[i].replace(/[^a-zA-Z0-9]/g, "");
      if (word.length < 3) continue;
      if (/^[A-Z][a-zA-Z0-9]+$/.test(word)) {
        const isFund = FUND_PATTERNS.some((p) => p.test(word));
        let fullName = word;
        if (i + 1 < words.length) {
          const nextWord = words[i + 1].replace(/[^a-zA-Z0-9]/g, "");
          if (/^[A-Z][a-zA-Z0-9]+$/.test(nextWord)) {
            const combined = `${word} ${nextWord}`;
            if (FUND_PATTERNS.some((p) => p.test(combined))) { fullName = combined; i++; }
          }
        }
        if (isFund || FUND_PATTERNS.some((p) => p.test(fullName))) funds.add(this.normalize(fullName));
        else projects.add(this.normalize(fullName));
      }
    }

    const personPatterns = [
      /CEO\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
      /founder\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /co-founder\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/gi,
      /([A-Z][a-z]+\s+[A-Z][a-z]+),?\s+(CEO|CTO|founder|partner)/gi,
    ];
    for (const pattern of personPatterns) {
      let match: RegExpExecArray | null;
      while ((match = pattern.exec(text)) !== null) {
        const name = match[1]?.trim();
        if (name && name.length > 3) persons.add(name);
      }
    }

    const stop = new Set([
      "The", "This", "That", "These", "Those", "Their", "They", "What", "When", "Where", "Which", "While", "With", "Would",
      "About", "After", "Before", "Between", "Could", "Should", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday",
      "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December",
    ]);
    return {
      projects: [...projects].filter((p) => !stop.has(p)),
      funds: [...funds].filter((f) => !stop.has(f)),
      tokens: [...tokens],
      persons: [...persons],
    };
  }

  private normalize(name: string): string {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  }
}
