/* eslint-disable */
import React, { FC, useContext, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import MainModal from "../../common/MainModal";
import CustomTextarea from "../../common/CustomTextarea";
import InputWithLabel from "../../common/components_for_modals/input_with_label";
import { Button } from "../../common/Button";
import { Action } from "../../LeftNav/styles";
import { Actions } from "../../UniversalFilter/styles";
import { ModalRow } from "../creating_project/styles";
import { InputError } from "../../../layouts/projects/modals/CreatePortfolio/styles";
import { LoadingContext } from "../../Layout";
import {
  getPublicCategories,
  createTicket,
  getMyTickets,
  replyToTicket,
  TrustCategory,
  Ticket,
} from "../../../../http/trust";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  /** Optional product context automatically attached to the ticket */
  context?: Record<string, any>;
}

type Mode = "new" | "mine";

const statusLabel: Record<string, string> = {
  new: "New",
  open: "Open",
  waiting_user: "Awaiting your reply",
  waiting_team: "With our team",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

const statusColor: Record<string, string> = {
  new: "#04A584",
  open: "#04A584",
  waiting_user: "#E1A100",
  waiting_team: "#0E7C63",
  resolved: "#04A584",
  closed: "#738094",
  reopened: "#E17055",
};

const SupportModal: FC<Props> = ({ isVisible, onClose, context = {} }) => {
  const { loadingStateHandler } = useContext(LoadingContext);
  const [mode, setMode] = useState<Mode>("new");

  // taxonomy
  const [categories, setCategories] = useState<TrustCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(false);
  const [search, setSearch] = useState("");

  // selection / form
  const [category, setCategory] = useState<TrustCategory | null>(null);
  const [subcategory, setSubcategory] = useState<TrustCategory | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  // my requests
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);
  const [openTicket, setOpenTicket] = useState<Ticket | null>(null);
  const [reply, setReply] = useState("");

  useEffect(() => {
    if (!isVisible) return;
    setMode("new");
    resetFlow();
    setLoadingCats(true);
    getPublicCategories()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setCategories(res.data);
        else setCategories([]);
      })
      .finally(() => setLoadingCats(false));
  }, [isVisible]);

  const resetFlow = () => {
    setCategory(null);
    setSubcategory(null);
    setSubject("");
    setDescription("");
    setErrors([]);
    setSearch("");
  };

  const loadMine = () => {
    setLoadingTickets(true);
    getMyTickets()
      .then((res) => {
        if (res.success && Array.isArray(res.data)) setTickets(res.data);
        else setTickets([]);
      })
      .finally(() => setLoadingTickets(false));
  };

  const goMine = () => {
    setMode("mine");
    setOpenTicket(null);
    loadMine();
  };

  // Flatten helper for search across the tree
  const flatSearchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    const out: TrustCategory[] = [];
    const walk = (nodes: TrustCategory[]) => {
      nodes.forEach((n) => {
        if (n.name.toLowerCase().includes(q)) out.push(n);
        if (n.children?.length) walk(n.children);
      });
    };
    walk(categories);
    return out.slice(0, 8);
  }, [search, categories]);

  const submit = async () => {
    const errs: string[] = [];
    if (!category) errs.push("category");
    if (!subject.trim()) errs.push("subject");
    if (!description.trim()) errs.push("description");
    setErrors(errs);
    if (errs.length) return;

    loadingStateHandler(true);
    const { success, status } = await createTicket({
      categoryCode: (subcategory || category)!.code,
      subcategoryCode: subcategory ? subcategory.code : "",
      subject: subject.trim(),
      message: description.trim(),
      context,
    });
    loadingStateHandler(false);

    if (success) {
      toast.success(
        <div>
          <h3>Request submitted</h3>
          <p>Our team will get back to you shortly.</p>
        </div>
      );
      resetFlow();
      goMine();
    } else if (status === 401) {
      toast.error(
        <div>
          <h3>Sign in required</h3>
          <p>Please log in to open a support request.</p>
        </div>
      );
    } else {
      toast.error("Could not submit your request. Please try again.");
    }
  };

  const sendReply = async () => {
    if (!openTicket || !reply.trim()) return;
    loadingStateHandler(true);
    const { success } = await replyToTicket(openTicket._id, reply.trim());
    loadingStateHandler(false);
    if (success) {
      setReply("");
      // refresh the opened ticket
      const res = await getMyTickets();
      if (res.success && Array.isArray(res.data)) {
        setTickets(res.data);
        const updated = res.data.find((t: Ticket) => t._id === openTicket._id);
        if (updated) setOpenTicket(updated);
      }
      toast.success("Reply sent");
    } else {
      toast.error("Could not send your reply.");
    }
  };

  /* ── Renders ── */
  const renderTabs = () => (
    <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
      {(["new", "mine"] as Mode[]).map((m) => (
        <button
          key={m}
          onClick={() => (m === "mine" ? goMine() : (setMode("new"), resetFlow()))}
          style={{
            padding: "8px 16px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "1px solid",
            borderColor: mode === m ? "#04A584" : "#ECECF2",
            color: mode === m ? "#04A584" : "#738094",
            background: mode === m ? "rgba(4,165,132,0.08)" : "transparent",
          }}
        >
          {m === "new" ? "New request" : "My requests"}
        </button>
      ))}
    </div>
  );

  const renderCategoryPicker = () => (
    <>
      <div style={{ fontSize: 20, fontWeight: 700, color: "#070B35", marginBottom: 6 }}>
        How can we help?
      </div>
      <div style={{ fontSize: 14, color: "#738094", marginBottom: 16 }}>
        Choose a topic so we can route your request to the right team.
      </div>

      <InputWithLabel
        placeholder="Search topics (e.g. wallet, OTC, XP)"
        label=""
        value={search}
        onChange={(v: string) => setSearch(v)}
      />

      {search.trim() ? (
        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          {flatSearchResults.length ? (
            flatSearchResults.map((c) => (
              <button
                key={c.code}
                onClick={() => {
                  const parent = c.parentCode
                    ? categories.find((p) => p.code === c.parentCode) || null
                    : c;
                  if (c.parentCode) {
                    setCategory(parent);
                    setSubcategory(c);
                  } else {
                    setCategory(c);
                    setSubcategory(null);
                  }
                  setSearch("");
                }}
                style={pickBtn}
              >
                {c.name}
                {c.parentCode ? (
                  <span style={{ color: "#738094", fontWeight: 400 }}>
                    {"  ·  in " + (categories.find((p) => p.code === c.parentCode)?.name || "")}
                  </span>
                ) : null}
              </button>
            ))
          ) : (
            <div style={{ color: "#738094", fontSize: 14 }}>No topics found.</div>
          )}
        </div>
      ) : (
        <div style={cardGrid}>
          {loadingCats ? (
            <div style={{ color: "#738094" }}>Loading topics…</div>
          ) : (
            categories.map((c) => (
              <button key={c.code} onClick={() => { setCategory(c); setSubcategory(null); }} style={topicCard}>
                <span style={{ fontWeight: 700, color: "#070B35" }}>{c.name}</span>
                {c.children?.length ? (
                  <span style={{ fontSize: 12, color: "#738094" }}>
                    {c.children.length} sub-topics
                  </span>
                ) : null}
              </button>
            ))
          )}
        </div>
      )}
    </>
  );

  const renderForm = () => (
    <>
      <button onClick={() => (subcategory ? setSubcategory(null) : setCategory(null))} style={backLink}>
        ← Back
      </button>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
        <span style={crumb}>{category?.name}</span>
        {subcategory ? <span style={crumb}>{subcategory.name}</span> : null}
      </div>

      {/* subcategory picker */}
      {!subcategory && category?.children?.length ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 13, color: "#738094", marginBottom: 8 }}>Pick a sub-topic (optional)</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {category.children.map((s) => (
              <button key={s.code} onClick={() => setSubcategory(s)} style={chip}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <ModalRow>
        <InputWithLabel
          placeholder="Enter a short summary of your issue"
          isError={errors.includes("subject")}
          errorText="This field is required."
          label="Subject"
          value={subject}
          onChange={(v: string) => setSubject(v)}
        />
      </ModalRow>

      <ModalRow>
        <CustomTextarea
          value={description}
          label="Describe your issue"
          placeholder="Tell us what happened, what you expected, and any details that help"
          isMaxCharacters={true}
          maxCharacters={1000}
          onChange={(v: string) => setDescription(v)}
          isError={errors.includes("description")}
          errorText="This field is required."
        />
      </ModalRow>

      {Object.keys(context || {}).length ? (
        <div style={{ fontSize: 12, color: "#738094", marginBottom: 8 }}>
          Context attached: {Object.keys(context).join(", ")}
        </div>
      ) : null}

      <Actions>
        <Action onClick={() => { resetFlow(); }} actionType="red">
          Reset
        </Action>
        <Button onClick={submit} variant="primary">
          Submit request
        </Button>
      </Actions>
    </>
  );

  const renderMine = () => {
    if (openTicket) {
      return (
        <>
          <button onClick={() => setOpenTicket(null)} style={backLink}>← All requests</button>
          <div style={{ margin: "12px 0 6px", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 700, color: "#070B35" }}>{openTicket.subject}</span>
            <span style={badge(statusColor[openTicket.status])}>{statusLabel[openTicket.status] || openTicket.status}</span>
          </div>
          <div style={{ fontSize: 12, color: "#738094", marginBottom: 12 }}>#{openTicket.ticketNumber}</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 320, overflowY: "auto", paddingRight: 4 }}>
            {(openTicket.messages || [])
              .filter((m) => m.authorType !== "internal")
              .map((m, i) => (
                <div
                  key={i}
                  style={{
                    alignSelf: m.authorType === "user" ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    background: m.authorType === "user" ? "rgba(4,165,132,0.10)" : "#F5F6FA",
                    borderRadius: 10,
                    padding: "10px 12px",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#738094", marginBottom: 4 }}>
                    {m.authorType === "user" ? "You" : "Support"}
                  </div>
                  <div style={{ fontSize: 14, color: "#070B35", whiteSpace: "pre-wrap" }}>{m.body}</div>
                </div>
              ))}
          </div>

          {["resolved", "closed"].includes(openTicket.status) ? (
            <div style={{ marginTop: 14, fontSize: 13, color: "#738094" }}>
              This request is {statusLabel[openTicket.status].toLowerCase()}. Reply to reopen it.
            </div>
          ) : null}

          <div style={{ marginTop: 12 }}>
            <CustomTextarea
              value={reply}
              label=""
              placeholder="Write a reply…"
              onChange={(v: string) => setReply(v)}
            />
            <Actions>
              <Button onClick={sendReply} variant="primary">Send reply</Button>
            </Actions>
          </div>
        </>
      );
    }

    return (
      <>
        {loadingTickets ? (
          <div style={{ color: "#738094" }}>Loading your requests…</div>
        ) : tickets.length ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {tickets.map((t) => (
              <button key={t._id} onClick={() => setOpenTicket(t)} style={ticketRow}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 3 }}>
                  <span style={{ fontWeight: 700, color: "#070B35" }}>{t.subject}</span>
                  <span style={{ fontSize: 12, color: "#738094" }}>#{t.ticketNumber}</span>
                </div>
                <span style={badge(statusColor[t.status])}>{statusLabel[t.status] || t.status}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "40px 0", color: "#738094" }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: "#070B35", marginBottom: 6 }}>No requests yet</div>
            <div style={{ fontSize: 14, marginBottom: 16 }}>When you contact support, your requests appear here.</div>
            <Button onClick={() => { setMode("new"); resetFlow(); }} variant="primary">New request</Button>
          </div>
        )}
      </>
    );
  };

  return (
    <MainModal variant={"820"} isVisible={isVisible} onClose={onClose} title="Support">
      {renderTabs()}
      {mode === "new" ? (category ? renderForm() : renderCategoryPicker()) : renderMine()}
    </MainModal>
  );
};

/* ── inline styles ── */
const cardGrid: React.CSSProperties = {
  marginTop: 16,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
  gap: 10,
};
const topicCard: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 6,
  padding: "14px 14px",
  borderRadius: 12,
  border: "1px solid #ECECF2",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
};
const pickBtn: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #ECECF2",
  background: "#fff",
  cursor: "pointer",
  textAlign: "left",
  fontWeight: 600,
  color: "#070B35",
};
const chip: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: 20,
  border: "1px solid #ECECF2",
  background: "#fff",
  cursor: "pointer",
  fontSize: 13,
  color: "#070B35",
};
const crumb: React.CSSProperties = {
  padding: "4px 10px",
  borderRadius: 6,
  background: "rgba(4,165,132,0.08)",
  color: "#04A584",
  fontSize: 12,
  fontWeight: 600,
};
const backLink: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: "#04A584",
  fontWeight: 600,
  cursor: "pointer",
  fontSize: 14,
  padding: 0,
};
const ticketRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "14px 16px",
  borderRadius: 12,
  border: "1px solid #ECECF2",
  background: "#fff",
  cursor: "pointer",
};
const badge = (color: string): React.CSSProperties => ({
  padding: "4px 10px",
  borderRadius: 20,
  background: color + "1A",
  color,
  fontSize: 12,
  fontWeight: 700,
  whiteSpace: "nowrap",
});

export default SupportModal;
