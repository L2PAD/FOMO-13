import React, { useState } from "react";
import Layout from "../../components/layouts/main_layout/layout";
import { T } from "../Statistics/ui";
import ModeratorsTab from "./ModeratorsTab";
import SecurityTab from "./SecurityTab";
import EmailTab from "./EmailTab";
import OpenAITab from "./OpenAITab";
import MoneyRolesTab from "./MoneyRolesTab";

type TabKey = "admins" | "roles" | "security" | "email" | "ai";
const TABS: { key: TabKey; label: string }[] = [
  { key: "admins", label: "Администраторы и модераторы" },
  { key: "roles", label: "Роли и права" },
  { key: "security", label: "Пароль и безопасность" },
  { key: "email", label: "Email (Resend)" },
  { key: "ai", label: "AI (OpenAI)" },
];

const SettingsPage = () => {
  const [tab, setTab] = useState<TabKey>("admins");
  return (
    <Layout>
      <div style={{ background: T.pageBg, minHeight: "100%", padding: "28px 28px 48px" }} data-testid="settings-page">
        <style>{`::selection{background:${T.accent};color:#fff}`}</style>

        {/* Header — унифицирован со стилем «Рейтинг» */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 26, fontWeight: 800, color: T.ink, letterSpacing: -0.3 }}>Настройки</div>
          <div style={{ fontSize: 13.5, color: T.sub, marginTop: 6, maxWidth: 720 }}>
            Управление командой (администраторы и модераторы), безопасность аккаунта, двухфакторная
            аутентификация и почтовый провайдер.
          </div>
        </div>

        {/* Tabs */}
        <div
          style={{ display: "flex", gap: 4, flexWrap: "wrap", borderBottom: `1px solid ${T.border}`, marginBottom: 24 }}
          role="tablist"
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              data-testid={`settings-tab-${t.key}`}
              role="tab"
              aria-selected={tab === t.key}
              style={{
                padding: "11px 18px",
                cursor: "pointer",
                fontSize: 14,
                fontWeight: 700,
                border: "none",
                background: "transparent",
                color: tab === t.key ? T.accent : T.sub,
                borderBottom: `2px solid ${tab === t.key ? T.accent : "transparent"}`,
                marginBottom: -1,
                whiteSpace: "nowrap",
                transition: "color 150ms ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div>
          {tab === "admins" && <ModeratorsTab />}
          {tab === "roles" && <MoneyRolesTab />}
          {tab === "security" && <SecurityTab />}
          {tab === "email" && <EmailTab />}
          {tab === "ai" && <OpenAITab />}
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;
