"use client";

import { useState, useRef, useEffect } from "react";
import { S } from "@/lib/styles";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Spent 1200 on cables today",
  "Received 5000 cash from a walk-in",
  "How much did I spend this month?",
  "What's my net this month?",
];

export function ChatTab() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || sending) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setSending(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json();
      const reply = res.ok
        ? data.reply || "Done."
        : "⚠ " + (data.error || "Something went wrong.");
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setMessages([
        ...next,
        { role: "assistant", content: "⚠ Could not reach the assistant." },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div
      style={{
        ...S.page,
        display: "flex",
        flexDirection: "column",
        height: "calc(100vh - 0px)",
        maxWidth: 760,
        margin: "0 auto",
      }}
    >
      <h2 style={{ margin: "0 0 12px", fontSize: 17, fontWeight: 700 }}>
        💬 Finance Assistant
      </h2>

      <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
        {messages.length === 0 && (
          <div style={{ color: "#9CA3AF", fontSize: 14, lineHeight: 1.6 }}>
            <p style={{ marginTop: 0 }}>
              Record money spent or received, or ask about your totals. Each
              entry is saved to the database and your Google Sheet.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 12 }}>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  style={{
                    background: "#1A1A24",
                    border: "1px solid #2A2A3D",
                    color: "#D1D5DB",
                    borderRadius: 999,
                    padding: "7px 14px",
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: m.role === "user" ? "flex-end" : "flex-start",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                maxWidth: "80%",
                padding: "10px 14px",
                borderRadius: 14,
                fontSize: 14,
                lineHeight: 1.5,
                whiteSpace: "pre-wrap",
                background:
                  m.role === "user"
                    ? "linear-gradient(135deg,#6C3CE1,#8B5CF6)"
                    : "#1A1A24",
                color: m.role === "user" ? "white" : "#F5F5F7",
                border:
                  m.role === "user" ? "none" : "1px solid #2A2A3D",
              }}
            >
              {m.content}
            </div>
          </div>
        ))}

        {sending && (
          <div style={{ color: "#9CA3AF", fontSize: 13, padding: "4px 6px" }}>
            Assistant is thinking…
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") send(input);
          }}
          placeholder="e.g. spent 500 on strings"
          disabled={sending}
          style={{ ...S.input, flex: 1 }}
        />
        <button
          onClick={() => send(input)}
          disabled={sending || !input.trim()}
          style={{
            ...S.btnPrimary,
            width: "auto",
            padding: "0 22px",
            opacity: sending || !input.trim() ? 0.6 : 1,
            cursor: sending || !input.trim() ? "not-allowed" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
