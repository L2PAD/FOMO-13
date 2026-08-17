#!/usr/bin/env python3
"""AI ad-campaign generator.

Reads an advertising request (JSON file path as argv[1]) and uses the Emergent
Universal LLM key (Claude) to draft a ready-to-review ad campaign + creative.
Prints STRICT JSON to stdout: { "campaign": {...}, "creative": {...} }.

This script is invoked by the NestJS advertising service. It never raises to the
caller: on any failure it exits non-zero and the Node side falls back to a
deterministic template so "quick create under a request" always works.
"""
import asyncio
import json
import os
import re
import sys


async def _run(payload: dict) -> dict:
    from emergentintegrations.llm.chat import LlmChat, UserMessage

    api_key = os.environ.get("EMERGENT_LLM_KEY", "").strip()
    if not api_key:
        raise RuntimeError("EMERGENT_LLM_KEY missing")

    placements = payload.get("placements", [])
    placement_lines = "\n".join(
        f'- {p["code"]}: {p.get("adminName","")} (format={p.get("format","")}, maxHeadline={p.get("maxHeadline",60)})'
        for p in placements
    )
    req = payload.get("request", {})

    system = (
        "You are an ad-operations assistant for the FOMO crypto platform. "
        "Given an advertiser's placement request, draft ONE ready-to-review ad "
        "campaign and ONE creative. Return ONLY strict minified JSON (no prose, "
        "no markdown fences) matching exactly this shape:\n"
        '{"campaign":{"name":str,"advertiserName":str,"objective":"awareness|traffic|conversions",'
        '"placements":[placement_code],"priority":int(1-10),"pacing":"asap|even"},'
        '"creative":{"type":"text|image","brandName":str,"headline":str,"description":str,'
        '"ctaLabel":str,"destinationUrl":str,"variant":"dark|gradient|light",'
        '"displaySize":"standard|compact","template":"facts|deal|offer|profile|minimal",'
        '"sponsoredLabel":"Ad|Sponsored|Promoted"}}\n'
        "Rules: pick placements ONLY from the allowed list. Keep headline within the "
        "placement maxHeadline. Prefer the advertiser's requested placement if valid. "
        "Use their website as destinationUrl when provided. Keep copy factual and concise; "
        "never invent fake metrics or token prices."
    )

    user_text = (
        "ALLOWED PLACEMENTS:\n" + (placement_lines or "(none)") + "\n\n"
        "ADVERTISER REQUEST:\n" + json.dumps(req, ensure_ascii=False)
    )

    chat = LlmChat(api_key=api_key, session_id=f"ad-gen-{req.get('_id','x')}", system_message=system).with_model(
        "anthropic", "claude-sonnet-4-6"
    )
    raw = await chat.send_message(UserMessage(text=user_text))
    text = str(raw or "").strip()
    # strip accidental markdown fences
    text = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip(), flags=re.MULTILINE).strip()
    m = re.search(r"\{.*\}", text, flags=re.DOTALL)
    if not m:
        raise RuntimeError("no JSON in model output")
    return json.loads(m.group(0))


def main() -> int:
    if len(sys.argv) < 2:
        print(json.dumps({"error": "missing input path"}))
        return 2
    try:
        with open(sys.argv[1], "r", encoding="utf-8") as fh:
            payload = json.load(fh)
        result = asyncio.run(_run(payload))
        print(json.dumps(result, ensure_ascii=False))
        return 0
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": str(exc)}))
        return 1


if __name__ == "__main__":
    sys.exit(main())
