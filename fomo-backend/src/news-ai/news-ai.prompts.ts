/**
 * News AI synthesis prompts.
 * MIGRATED verbatim from FOMO-DATA story-synthesizer (HEADLINE/SUMMARY/STORY/AI_VIEW).
 * ADAPT: STORY/SUMMARY accept an optional {context} block so generation is
 * grounded in the actual parsed source articles of the cluster (product
 * requirement: synthesize our own article from the 3-5 clustered sources).
 */
export const NEWS_AI_OPERATION = "news_synthesize";
export const NEWS_AI_POLICY_VERSION = "p1";

export const HEADLINE_PROMPT = `Generate a compelling, professional headline for this crypto news event.

Event Type: {event_type}
Topic: {topic}
Assets: {assets}

Requirements:
- Maximum 90 characters
- Professional, factual tone
- No sensationalism
- Write in {language}

Return ONLY the headline text.`;

export const SUMMARY_PROMPT = `Write a concise 2-3 sentence summary for this crypto news.

Headline: {headline}
Topic: {topic}
Source context:
{context}

Requirements:
- Be factual and precise, grounded in the source context
- Maximum 320 characters
- Write in {language}

Return ONLY the summary text.`;

export const STORY_PROMPT = `Write a comprehensive, original crypto news article synthesized from multiple sources.

Headline: {headline}
Summary: {summary}
Assets: {assets}
Topic: {topic}
Source context (multiple articles about the same event):
{context}

Requirements:
1. Write in {language}
2. Professional, analytical tone
3. Write 900-1400 characters (richer than a single feed item)
4. Synthesize and de-duplicate facts across the sources; do not copy verbatim
5. Be objective and specific

Return ONLY the article text.`;

export const AI_VIEW_PROMPT = `As FOMO AI analyst, provide brief market insight.

Headline: {headline}
Summary: {summary}
Assets: {assets}

Requirements:
- 2-3 sentences of analysis
- {language}
- Start with "FOMO AI:"
- Maximum 240 characters

Return ONLY the insight.`;

export const KEY_TAKEAWAYS_PROMPT = `Extract the 3-5 most important key takeaways from this crypto news.

Headline: {headline}
Summary: {summary}
Source context:
{context}

Requirements:
- Return 3 to 5 short bullet points, one per line
- Each bullet under 120 characters, factual and specific
- No numbering, no leading dashes or symbols — plain text lines only
- Write in {language}

Return ONLY the bullet lines separated by newlines.`;

export const WHY_MATTERS_PROMPT = `Explain concisely why this crypto news matters for the market and investors.

Headline: {headline}
Summary: {summary}
Assets: {assets}

Requirements:
- 2-3 sentences focused on impact, risks and what to watch
- Do NOT restate the headline; add analytical value
- Maximum 320 characters
- Write in {language}

Return ONLY the explanation text.`;

