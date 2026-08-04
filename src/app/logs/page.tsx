"use client";

import { useRef, useEffect } from "react";
import { AGENTS, useStore } from "@/lib/store";

export default function LogsPage() {
  const { logs, clearLogs } = useStore();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [logs]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="tab-bar" style={{ padding: "10px 20px", borderBottom: "1px solid #1a1a30",
        flexShrink: 0, justifyContent: "flex-end" }}>
        <button onClick={clearLogs}
          style={{ fontSize: 11, color: "#333", background: "none", border: "1px solid #1a1a30",
            padding: "6px 14px", cursor: "pointer", borderRadius: 3, letterSpacing: "0.06em" }}>
          지우기
        </button>
      </div>

      <div className="tab-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 8 }}>
        {logs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
            <div className="empty-msg" style={{ fontSize: 12 }}>에이전트 활동을 기다리는 중...</div>
          </div>
        ) : logs.map(log => {
          const a = AGENTS[log.agent];
          const levelColor = { info: "#4ecca3", success: "#4ecca3", error: "#e94560", warn: "#f5a623" }[log.level];
          return (
            <div key={log.id} style={{ borderLeft: `2px solid ${levelColor}44`, paddingLeft: 12, animation: "slide-in 0.2s ease" }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: "#333" }}>{log.time}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: a.color, letterSpacing: "0.06em" }}>{a.name}</span>
              </div>
              <div className="log-msg" style={{ fontSize: 12, color: levelColor, lineHeight: 1.5 }}>{log.msg}</div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
    </div>
  );
}
