# FOMO AI — Runtime / Credits / Economics — план от текущей точки

## Аудит (что уже есть и работает)
- FomoAiGateway (единая точка): access → estimate → reserve → knowledge → provider → cost → capture/release → usage event. ✅
- OpenAiProvider + MockProvider; провайдер выбирается из настроек. Emergent — через OpenAI SDK base URL (НЕ подтверждён в этом окружении).
- AiProviderPricingService: версионный реестр цен, computeProviderCost с pricingSnapshot, UNPRICED-статус. ✅ (соответствует §13–15, §21)
- CreditPricingService.computeCredits: HYBRID/FIXED/COST_BASED, но математика = revenuePerCredit/markup (упрощённая), БЕЗ fee/infra reserves и targetGrossMargin. ⚠️
- Ledger: ai_credit_transactions (RESERVE/CAPTURE/RELEASE/GRANT/EXPIRY), reservations. ✅
- Admin endpoints: ai/pricing, ai/settings(+test), ai/gateway/execute+estimate, ai/knowledge/health+test, ai/ask, ai/usage(+summary), ai/user-analytics. ✅
- Admin AI Chat: работает (INTERNAL), тред/сообщения/ответ. Нарратив MOCK при отсутствии ключа. ✅
- Public FOMO AI /utility/ai: reserve/capture/release подтверждены. ✅
- Frontend AccessMonetization/aiCenter.tsx: подвкладки Правила/Использование/Экономика/Знания/Пользователи/Модели — частично.
- Knowledge bootstrap: ico=5249, roi=12481. ✅

## Разрывы vs ТЗ
1. Экономика: нет AiProductEconomics (price/period/credits/targetMargin/fee/infra), нет NetRevenue→AllowedAiCost→MaxCostPerCredit, нет симулятора.
2. computeCredits не использует spec-математику.
3. Economics dashboard: нет KPI (granted/spent/remaining/reserved, expiring 7/30д, breakage, COGS, margin).
4. Provider switching UI (AI Control Center) + provider/model в ответе — частично.
5. Реальный Emergent adapter — NOT_CONNECTED (ключ под emergentintegrations).
6. Expiry worker/breakage, economicsSnapshot на периоде подписки.
7. Knowledge Diagnostics экран (частично есть health/test).

## Фазы
- **Фаза 1 (этот проход): Экономический движок + Симулятор.** Product economics settings; deriveBudget (NetRevenue/AllowedAiCost/MaxCostPerCredit); computeCredits использует MaxCostPerCredit; endpoints GET ai/economics, POST ai/economics/simulate; фронт Economics subtab (карточка бюджета + живой симулятор + capacity). Проверка curl + testing_agent.
- Фаза 2: Economics dashboard KPI (granted/spent/remaining/reserved, expiring, breakage, COGS, margin, provider/model split) на реальных агрегатах usage/ledger.
- Фаза 3: Аналитика по операциям (p50/p95 credits/cost, margin warning) + аналитика по пользователям + Customer360 AI-блок.
- Фаза 4: economicsSnapshot на периоде + expiry worker + breakage ledger events.
- Фаза 5: реальный Emergent provider adapter (или честный NOT_CONNECTED), provider/model/dataMode/requestId в ответе, no silent fallback.
- Фаза 6: Knowledge Diagnostics экран (freshness/lastError/counts + «Проверить поиск»); все select → AdminSelect.
- Фаза 7: полный acceptance matrix + скриншоты + реальные тестовые запросы.
