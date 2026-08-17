import React, { useEffect, useMemo, useState } from "react";
import { T, Card, SectionTitle, Badge, StateBlock, SimpleTable } from "../Statistics/ui";
import { AdminSelect } from "../AdminRating/AdminControls";
import {
  getAiSettings,
  updateAiSettings,
  testAiConnection,
  getAiPricing,
  upsertAiPrice,
  setAiPriceActive,
} from "../../components/services/settings";
import { AiCredentialManager } from "../AccessMonetization/aiCenter";

const field: React.CSSProperties = { width: "100%", padding: "10px 12px", border: `1px solid ${T.border}`, borderRadius: 10, fontSize: 14, outline: "none", boxSizing: "border-box", background: "#fff", color: T.ink };
const label: React.CSSProperties = { fontSize: 12.5, fontWeight: 700, color: T.sub, marginBottom: 6, display: "block" };
const primary: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: "none", background: T.accent, color: "#fff", fontWeight: 700, fontSize: 13.5, cursor: "pointer" };
const ghost: React.CSSProperties = { padding: "10px 18px", borderRadius: 10, border: `1px solid ${T.border}`, background: T.soft, color: T.ink, fontWeight: 700, fontSize: 13.5, cursor: "pointer" };

const PROVIDERS: { key: string; title: string; sub: string }[] = [
  { key: "openai", title: "OpenAI", sub: "Прямой ключ OpenAI" },
  { key: "emergent", title: "Emergent LLM", sub: "Универсальный ключ Emergent" },
  { key: "mock", title: "Mock", sub: "Тестовый режим без списаний" },
];

const BULLET = "\u2022";

type Msg = { text: string; ok: boolean } | null;

const OpenAITab: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cfg, setCfg] = useState<any>({});
  const [pricing, setPricing] = useState<any[]>([]);
  const [msg, setMsg] = useState<Msg>(null);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [form, setForm] = useState({
    activeProvider: "openai",
    openAiApiKey: "",
    openAiBaseUrl: "",
    emergentLlmKey: "",
    emergentBaseUrl: "",
    defaultChatModel: "",
    allowUnpricedModels: false,
    infrastructureCostPerRequestUsd: 0,
  });

  const flash = (text: string, ok = true) => { setMsg({ text, ok }); setTimeout(() => setMsg(null), 4500); };

  const load = async () => {
    setLoading(true);
    const [s, p] = await Promise.all([getAiSettings(), getAiPricing()]);
    if (s.success && s.data) {
      const d = s.data;
      setCfg(d);
      setForm({
        activeProvider: d.activeProvider || "openai",
        openAiApiKey: d.openAiApiKeyMasked || "",
        openAiBaseUrl: d.openAiBaseUrl || "",
        emergentLlmKey: d.emergentLlmKeyMasked || "",
        emergentBaseUrl: d.emergentBaseUrl || "",
        defaultChatModel: d.defaultChatModel || "",
        allowUnpricedModels: !!d.allowUnpricedModels,
        infrastructureCostPerRequestUsd: Number(d.infrastructureCostPerRequestUsd) || 0,
      });
    }
    if (p.success && p.data) setPricing(p.data.items || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const modelOptions = useMemo(() => {
    const set = new Set<string>();
    pricing.forEach((r) => r?.model && set.add(r.model));
    return Array.from(set);
  }, [pricing]);

  const save = async () => {
    setBusy(true);
    const body: any = {
      activeProvider: form.activeProvider,
      openAiBaseUrl: form.openAiBaseUrl,
      emergentBaseUrl: form.emergentBaseUrl,
      defaultChatModel: form.defaultChatModel,
      allowUnpricedModels: form.allowUnpricedModels,
      infrastructureCostPerRequestUsd: Number(form.infrastructureCostPerRequestUsd) || 0,
    };
    if (form.openAiApiKey && !form.openAiApiKey.includes(BULLET)) body.openAiApiKey = form.openAiApiKey;
    if (form.emergentLlmKey && !form.emergentLlmKey.includes(BULLET)) body.emergentLlmKey = form.emergentLlmKey;
    const r = await updateAiSettings(body);
    setBusy(false);
    if (r.success && r.data) {
      setCfg(r.data);
      setForm((f) => ({ ...f, openAiApiKey: r.data.openAiApiKeyMasked || "", emergentLlmKey: r.data.emergentLlmKeyMasked || "" }));
      flash("Настройки AI сохранены");
    } else flash("Ошибка сохранения", false);
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    const r = await testAiConnection({ model: form.defaultChatModel || undefined });
    setTesting(false);
    if (r.success && r.data) {
      setTestResult(r.data);
      flash(r.data.ok ? "Подключение работает" : "Проверка не пройдена", !!r.data.ok);
    } else {
      setTestResult({ ok: false, message: "Не удалось выполнить проверку (сеть или сервер недоступны)." });
      flash("Ошибка проверки", false);
    }
  };

  if (loading) return <Card><StateBlock kind="loading" /></Card>;

  const activeProviderConnected =
    form.activeProvider === "openai" ? Boolean(cfg.openAiConfigured || (form.openAiApiKey && !form.openAiApiKey.includes(BULLET))) :
    form.activeProvider === "emergent" ? Boolean(cfg.emergentConfigured || (form.emergentLlmKey && !form.emergentLlmKey.includes(BULLET))) :
    true;

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 860 }} data-testid="openai-tab">
      {msg ? (
        <div
          data-testid="openai-msg"
          style={{ padding: "10px 14px", borderRadius: 10, fontWeight: 700, fontSize: 13, background: msg.ok ? "#E7F6F3" : "#FDECEC", color: msg.ok ? T.good : T.bad }}
        >
          {msg.text}
        </div>
      ) : null}

      {/* Credential lifecycle manager — единый источник ключей провайдеров */}
      <AiCredentialManager />

      {/* Model & economics */}
      <Card testId="ai-model-card">
        <SectionTitle sub="Модель по умолчанию и экономика. Модель применяется, если у операции нет явной модели.">Модель и экономика</SectionTitle>
        <div style={{ display: "grid", gap: 14, gridTemplateColumns: "1fr 1fr" }}>
          <div>
            <label style={label}>Модель чата по умолчанию</label>
            <AdminSelect
              value={form.defaultChatModel}
              options={[{ value: "", label: "— из правила операции —" }, ...modelOptions.map((m) => ({ value: m, label: m }))]}
              onChange={(v) => setForm({ ...form, defaultChatModel: v })}
              placeholder="— из правила операции —"
              testid="ai-default-model"
              ariaLabel="Модель чата по умолчанию"
            />
          </div>
          <div>
            <label style={label}>Инфраструктурная стоимость за запрос (USD)</label>
            <input data-testid="ai-infra-cost" type="number" step="0.0001" min="0" style={field} value={form.infrastructureCostPerRequestUsd} onChange={(e) => setForm({ ...form, infrastructureCostPerRequestUsd: Number(e.target.value) })} />
          </div>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, cursor: "pointer" }}>
          <input data-testid="ai-allow-unpriced" type="checkbox" checked={form.allowUnpricedModels} onChange={(e) => setForm({ ...form, allowUnpricedModels: e.target.checked })} style={{ width: 18, height: 18, accentColor: T.accent }} />
          <span style={{ fontSize: 13.5, color: T.ink, fontWeight: 600 }}>Разрешать модели без прайсинга (небезопасно для продакшена)</span>
        </label>
      </Card>

      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <button disabled={busy} onClick={save} style={primary} data-testid="ai-save">Сохранить настройки</button>
        <button disabled={busy} onClick={load} style={ghost} data-testid="ai-reload">Обновить</button>
        <button disabled={busy || testing} onClick={runTest} style={ghost} data-testid="ai-test-key">
          {testing ? "Проверка…" : "Проверить ключ"}
        </button>
      </div>

      {testResult ? (
        <Card testId="ai-test-result-card">
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: testResult.ok ? 0 : 8 }}>
            <span
              data-testid="ai-test-status-dot"
              style={{ width: 12, height: 12, borderRadius: "50%", flexShrink: 0, background: testResult.ok ? T.good : T.bad, boxShadow: `0 0 0 4px ${testResult.ok ? "rgba(16,185,129,0.15)" : "rgba(214,69,69,0.15)"}` }}
            />
            <span data-testid="ai-test-status" style={{ fontSize: 14, fontWeight: 800, color: testResult.ok ? T.good : T.bad }}>
              {testResult.ok ? "Подключение активно" : "Нет подключения"}
            </span>
            {testResult.mode ? <Badge tone={testResult.mode === "mock" ? "warn" : "default"}>{testResult.mode}</Badge> : null}
            {typeof testResult.latencyMs === "number" && testResult.ok ? <Badge tone="good">{testResult.latencyMs} мс</Badge> : null}
            {testResult.model && testResult.ok ? <Badge tone="default">{testResult.model}</Badge> : null}
          </div>
          <div data-testid="ai-test-message" style={{ fontSize: 13, color: T.sub, lineHeight: 1.5, marginTop: 8 }}>{testResult.message}</div>
          {testResult.ok && testResult.sample ? (
            <div style={{ fontSize: 12.5, color: T.faint, marginTop: 8 }}>Ответ модели: <span style={{ color: T.ink, fontWeight: 600 }}>“{testResult.sample}”</span></div>
          ) : null}
          <div style={{ fontSize: 11.5, color: T.faint, marginTop: 10 }}>Проверяется сохранённая конфигурация. Если вы изменили ключ — сначала нажмите «Сохранить настройки».</div>
        </Card>
      ) : null}

      <PricingEditor items={pricing} onChanged={load} flash={flash} />
    </div>
  );
};

/* ── Pricing registry editor ── */
const emptyPrice = { provider: "openai", model: "", inputPer1M: 0, outputPer1M: 0, active: true };

const PricingEditor: React.FC<{ items: any[]; onChanged: () => void; flash: (t: string, ok?: boolean) => void }> = ({ items, onChanged, flash }) => {
  const [draft, setDraft] = useState<any>(emptyPrice);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!draft.model.trim()) { flash("Укажите модель", false); return; }
    setBusy(true);
    const r = await upsertAiPrice({
      provider: draft.provider,
      model: draft.model.trim(),
      inputPer1M: Number(draft.inputPer1M) || 0,
      outputPer1M: Number(draft.outputPer1M) || 0,
      active: draft.active !== false,
      ...(draft._id ? { _id: draft._id } : {}),
    });
    setBusy(false);
    if (r.success) { flash(draft._id ? "Прайс обновлён" : "Модель добавлена"); setDraft(emptyPrice); onChanged(); }
    else flash("Ошибка сохранения прайса", false);
  };

  const toggle = async (row: any) => {
    setBusy(true);
    const r = await setAiPriceActive(String(row._id), !row.active);
    setBusy(false);
    if (r.success) onChanged(); else flash("Не удалось изменить статус", false);
  };

  return (
    <Card testId="ai-pricing-card">
      <SectionTitle sub="Реестр цен провайдеров (USD за 1M токенов). Историческая стоимость запросов неизменна — снапшот берётся в момент вызова.">Прайсинг моделей</SectionTitle>

      <SimpleTable
        testId="ai-pricing-table"
        empty="Нет настроенных моделей"
        columns={[
          { key: "provider", header: "Провайдер" },
          { key: "model", header: "Модель" },
          { key: "inputPer1M", header: "Input / 1M", align: "right", render: (r: any) => `$${Number(r.inputPer1M).toFixed(2)}` },
          { key: "outputPer1M", header: "Output / 1M", align: "right", render: (r: any) => `$${Number(r.outputPer1M).toFixed(2)}` },
          { key: "active", header: "Статус", render: (r: any) => <Badge tone={r.active ? "good" : "default"}>{r.active ? "активен" : "выкл"}</Badge> },
          {
            key: "actions",
            header: "",
            align: "right",
            render: (r: any) => (
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button data-testid={`ai-price-edit-${r.model}`} onClick={() => setDraft({ provider: r.provider, model: r.model, inputPer1M: r.inputPer1M, outputPer1M: r.outputPer1M, active: r.active, _id: r._id })} style={{ ...ghost, padding: "5px 12px", fontSize: 12 }}>Изменить</button>
                <button data-testid={`ai-price-toggle-${r.model}`} disabled={busy} onClick={() => toggle(r)} style={{ ...ghost, padding: "5px 12px", fontSize: 12 }}>{r.active ? "Выкл" : "Вкл"}</button>
              </div>
            ),
          },
        ]}
        rows={items}
      />

      <div style={{ marginTop: 18, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: T.ink, marginBottom: 12 }}>{draft._id ? `Редактирование: ${draft.model}` : "Добавить / обновить модель"}</div>
        <div style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1.4fr 1fr 1fr", alignItems: "end" }}>
          <div>
            <label style={label}>Провайдер</label>
            <AdminSelect
              value={draft.provider}
              options={[{ value: "openai", label: "openai" }, { value: "emergent", label: "emergent" }]}
              onChange={(v) => setDraft({ ...draft, provider: v })}
              placeholder="openai"
              testid="ai-price-provider"
              ariaLabel="Провайдер"
            />
          </div>
          <div>
            <label style={label}>Модель</label>
            <input data-testid="ai-price-model" style={field} value={draft.model} onChange={(e) => setDraft({ ...draft, model: e.target.value })} placeholder="gpt-4.1-mini" />
          </div>
          <div>
            <label style={label}>Input / 1M ($)</label>
            <input data-testid="ai-price-input" type="number" step="0.01" min="0" style={field} value={draft.inputPer1M} onChange={(e) => setDraft({ ...draft, inputPer1M: e.target.value })} />
          </div>
          <div>
            <label style={label}>Output / 1M ($)</label>
            <input data-testid="ai-price-output" type="number" step="0.01" min="0" style={field} value={draft.outputPer1M} onChange={(e) => setDraft({ ...draft, outputPer1M: e.target.value })} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
          <button disabled={busy} onClick={submit} style={primary} data-testid="ai-price-save">{draft._id ? "Сохранить" : "Добавить"}</button>
          {draft._id ? <button onClick={() => setDraft(emptyPrice)} style={ghost} data-testid="ai-price-cancel">Отмена</button> : null}
        </div>
      </div>
    </Card>
  );
};

export default OpenAITab;
