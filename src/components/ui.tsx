"use client";

import { useState, useEffect } from "react";
import { type AnimeNews, proxiedImage } from "@/lib/news";
import { AGENTS, useStore, type ArticleStatus, type AgentStatusType, type PipelineItem } from "@/lib/store";
import { copyText } from "@/lib/clipboard";

// ── 상단 에이전트 상태 표시줄 (압축형) ──────────────────────
export function AgentStatusStrip() {
  const { agentStatus } = useStore();
  const items: { key: keyof typeof AGENTS; status: AgentStatusType }[] = [
    { key: "fetcher", status: "fetching" },
    { key: "writer",  status: "writing" },
    { key: "confirm", status: "confirming" },
  ];
  return (
    <div style={{ display: "flex", gap: 16, alignItems: "center", padding: "8px 20px",
      borderBottom: "1px solid #1a1a30", background: "#0a0a18", flexShrink: 0, overflowX: "auto" }}>
      {items.map(({ key, status }) => {
        const active = agentStatus === status;
        const a = AGENTS[key];
        return (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: active ? a.color : "#1a1a30",
              boxShadow: active ? `0 0 8px ${a.color}` : "none",
              animation: active ? "pulse-dot 1.2s ease-in-out infinite" : "none",
            }} />
            <span className="status-strip-label" style={{ fontSize: 10, color: active ? a.color : "#444", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
              {a.name}{active ? " · 작업 중" : ""}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ── 뉴스 카드 ─────────────────────────────────────────
export function NewsCard({ item, onStart, disabled }: {
  item: AnimeNews;
  onStart: (item: AnimeNews) => void;
  disabled: boolean;
}) {
  return (
    <div style={{
      background: "#0d0d1f", border: "1px solid #1a1a30", borderRadius: 6,
      overflow: "hidden", display: "flex", flexDirection: "column",
      transition: "border-color 0.2s",
    }}
    onMouseEnter={e => (e.currentTarget.style.borderColor = "#2a2a50")}
    onMouseLeave={e => (e.currentTarget.style.borderColor = "#1a1a30")}>
      {item.image && (
        <img className="card-image" src={proxiedImage(item.image)} alt=""
          style={{ width: "100%", height: 100, objectFit: "cover", opacity: 0.75 }} />
      )}
      <div className="card-body" style={{ padding: "10px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div className="card-meta" style={{ fontSize: 9, color: "#4ecca3", letterSpacing: "0.08em" }}>
          {new Date(item.date).toLocaleDateString("ko-KR")} · {item.categories.join(", ") || "General"}
        </div>
        <div className="card-title" style={{ fontSize: 12, fontWeight: 700, color: "#ddd", lineHeight: 1.4, flex: 1 }}>
          {item.title}
        </div>
        {item.excerpt && (
          <div className="card-excerpt" style={{ fontSize: 10, color: "#555", lineHeight: 1.6,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {item.excerpt}
          </div>
        )}
        <button className="card-btn" onClick={() => onStart(item)} disabled={disabled}
          style={{
            padding: "7px 0", borderRadius: 4, border: "none",
            background: disabled ? "#1a1a30" : "#e94560",
            color: disabled ? "#444" : "#fff",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.12em",
            cursor: disabled ? "not-allowed" : "pointer",
            transition: "all 0.15s", marginTop: 4,
          }}>
          {disabled ? "처리 중..." : "▶ 기사 작성 시작"}
        </button>
      </div>
    </div>
  );
}

// ── 상태 배지 ─────────────────────────────────────────
export function StatusBadge({ status, score }: { status: ArticleStatus; score?: number }) {
  const cfg = {
    waiting:    { label: "대기",    color: "#444",    bg: "#44444418" },
    writing:    { label: "작성 중", color: "#e94560", bg: "#e9456018" },
    confirming: { label: "검토 중", color: "#f5a623", bg: "#f5a62318" },
    approved:   { label: "승인",    color: "#4ecca3", bg: "#4ecca318" },
    rejected:   { label: "반려",    color: "#888",    bg: "#88888818" },
  }[status];
  return (
    <span className="status-badge" style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
      padding: "3px 8px", borderRadius: 3,
      border: `1px solid ${cfg.color}66`,
      color: cfg.color, background: cfg.bg,
    }}>
      {cfg.label}{status === "approved" && score !== undefined ? ` ${score}점` : ""}
    </span>
  );
}

// ── 파이프라인 카드 ────────────────────────────────────
export function PipelineCard({ item }: { item: PipelineItem }) {
  const { handleRewrite, setReaderId } = useStore();
  const [open, setOpen]     = useState(item.status === "approved" || item.status === "rejected");
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(item.draft ?? "");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyText(item.editedDraft ?? item.draft ?? "");
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  useEffect(() => {
    if (item.status === "approved" || item.status === "rejected") setOpen(true);
    setEditText(item.editedDraft ?? item.draft ?? "");
  }, [item.status, item.draft, item.editedDraft]);

  const isRunning = item.status === "writing" || item.status === "confirming";

  return (
    <div style={{
      background: "#0d0d1f",
      border: `1.5px solid ${item.status === "approved" ? "#4ecca344" : item.status === "rejected" ? "#88888844" : "#1a1a30"}`,
      borderRadius: 6, overflow: "hidden", animation: "slide-in 0.3s ease",
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", cursor: "pointer", background: "#0a0a18" }}
        onClick={() => setOpen(v => !v)}>
        {isRunning && (
          <div style={{ width: 14, height: 14, border: "2px solid #e94560", borderTopColor: "transparent",
            borderRadius: "50%", animation: "spin 0.8s linear infinite", flexShrink: 0 }} />
        )}
        {item.news.image && (
          <img src={proxiedImage(item.news.image)} alt="" style={{ width: 32, height: 32, borderRadius: 4,
            objectFit: "cover", flexShrink: 0, opacity: 0.85 }} />
        )}
        <StatusBadge status={item.status} score={item.score} />
        <div className="pipeline-title" style={{ flex: 1, fontSize: 11, color: "#aaa", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.news.title}
        </div>
        <div className="pipeline-timestamp" style={{ fontSize: 9, color: "#333", flexShrink: 0 }}>{item.startedAt}</div>
        {(item.draft || item.editedDraft) && (
          <button className="pipeline-meta-btn" onClick={e => { e.stopPropagation(); setReaderId(item.id); }}
            style={{ fontSize: 9, color: "#4ecca3", background: "none", border: "1px solid #4ecca388",
              padding: "4px 10px", cursor: "pointer", borderRadius: 3, flexShrink: 0, letterSpacing: "0.06em" }}>
            크게 보기
          </button>
        )}
        <div style={{ fontSize: 12, color: "#333", transform: open ? "rotate(180deg)" : "none", transition: "0.2s" }}>▾</div>
      </div>

      {/* 상세 */}
      {open && (
        <div style={{ padding: "0 14px 14px", borderTop: "1px solid #1a1a30" }}>

          {item.news.image && (
            <img src={proxiedImage(item.news.image)} alt="" style={{ width: "100%", maxHeight: 200,
              objectFit: "cover", borderRadius: 4, marginTop: 12, opacity: 0.9 }} />
          )}
          <div style={{ fontSize: 9, color: "#4ecca3", letterSpacing: "0.06em", marginTop: 10 }}>
            {new Date(item.news.date).toLocaleDateString("ko-KR")} · {item.news.categories.join(", ") || "General"}
          </div>

          {/* 작성된 기사 */}
          {(item.draft || item.editedDraft) && (
            <div style={{ marginTop: 12 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#e94560", letterSpacing: "0.12em" }}>
                  ✍ 작성 에이전트 결과
                </div>
                <div style={{ display: "flex", gap: 6 }}>
                  {!editing ? (
                    <>
                      <button className="pipeline-meta-btn" onClick={handleCopy}
                        style={{ fontSize: 9, color: copied ? "#07070f" : "#4ecca3",
                          background: copied ? "#4ecca3" : "none", border: "1px solid #4ecca3",
                          padding: "2px 8px", cursor: "pointer", borderRadius: 3, letterSpacing: "0.08em", transition: "all 0.15s" }}>
                        {copied ? "복사됨 ✓" : "복사"}
                      </button>
                      <button className="pipeline-meta-btn" onClick={() => setEditing(true)}
                        style={{ fontSize: 9, color: "#888", background: "none", border: "1px solid #1a1a30",
                          padding: "2px 8px", cursor: "pointer", borderRadius: 3, letterSpacing: "0.08em" }}>
                        수정
                      </button>
                    </>
                  ) : (
                    <>
                      <button className="pipeline-meta-btn" onClick={() => { handleRewrite(item, editText); setEditing(false); }}
                        style={{ fontSize: 9, color: "#4ecca3", background: "none", border: "1px solid #4ecca3",
                          padding: "2px 8px", cursor: "pointer", borderRadius: 3 }}>
                        재검토 요청
                      </button>
                      <button className="pipeline-meta-btn" onClick={() => { setEditing(false); setEditText(item.editedDraft ?? item.draft ?? ""); }}
                        style={{ fontSize: 9, color: "#888", background: "none", border: "1px solid #1a1a30",
                          padding: "2px 8px", cursor: "pointer", borderRadius: 3 }}>
                        취소
                      </button>
                    </>
                  )}
                </div>
              </div>
              {editing ? (
                <textarea value={editText} onChange={e => setEditText(e.target.value)}
                  style={{ width: "100%", minHeight: 200, background: "#060612", border: "1px solid #4ecca388",
                    borderRadius: 4, padding: 10, fontSize: 12, color: "#ccc", lineHeight: 1.8,
                    fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }} />
              ) : (
                <div style={{ background: "#060612", border: "1px solid #1a1a30", borderRadius: 4, padding: 10,
                  fontSize: 12, color: "#ccc", lineHeight: 1.8, whiteSpace: "pre-wrap",
                  maxHeight: 280, overflowY: "auto" }}>
                  {item.editedDraft ?? item.draft}
                </div>
              )}
            </div>
          )}

          {/* 컨펌 결과 */}
          {item.summary && (
            <div style={{ marginTop: 10, padding: "10px 12px", background: "#060612",
              border: `1px solid ${item.approved ? "#4ecca344" : "#88888844"}`, borderRadius: 4 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "#f5a623", marginBottom: 6, letterSpacing: "0.12em" }}>
                ✅ 컨펌 에이전트 총평
              </div>
              <div className="summary-text" style={{ fontSize: 11, color: "#aaa", lineHeight: 1.6 }}>{item.summary}</div>
            </div>
          )}

          {/* 원문 링크 */}
          <div style={{ marginTop: 10 }}>
            <a href={item.news.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 9, color: "#4ecca388", textDecoration: "none", letterSpacing: "0.06em" }}>
              원문 보기 ↗
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 전체 화면 읽기 모드 ─────────────────────────────────
export function ReaderModal() {
  const { pipeline, readerId, setReaderId } = useStore();
  const item = pipeline.find(p => p.id === readerId) ?? null;

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setReaderId(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [item, setReaderId]);

  if (!item) return null;
  return <ReaderModalContent item={item} onClose={() => setReaderId(null)} />;
}

function ReaderModalContent({ item, onClose }: { item: PipelineItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const text = item.editedDraft ?? item.draft ?? "";

  const handleCopy = async () => {
    const ok = await copyText(text);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#07070f", zIndex: 100,
      display: "flex", flexDirection: "column", animation: "slide-in 0.2s ease",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px",
        borderBottom: "1px solid #1a1a30", background: "#0a0a18", flexShrink: 0 }}>
        <button onClick={onClose}
          style={{ fontSize: 14, color: "#aaa", background: "#1a1a30", border: "none",
            width: 36, height: 36, borderRadius: 6, cursor: "pointer", flexShrink: 0 }}>
          ✕
        </button>
        <StatusBadge status={item.status} score={item.score} />
        <div style={{ flex: 1, minWidth: 0, fontSize: 13, color: "#888", overflow: "hidden",
          textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {item.news.title}
        </div>
        <button onClick={handleCopy}
          style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", flexShrink: 0,
            color: copied ? "#07070f" : "#4ecca3",
            background: copied ? "#4ecca3" : "none",
            border: "1px solid #4ecca3",
            padding: "8px 14px", cursor: "pointer", borderRadius: 6, transition: "all 0.15s" }}>
          {copied ? "복사됨 ✓" : "복사"}
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "24px 20px" }}>
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          {item.news.image && (
            <img src={proxiedImage(item.news.image)} alt="" style={{ width: "100%", maxHeight: 340,
              objectFit: "cover", borderRadius: 8, marginBottom: 16 }} />
          )}
          <div style={{ fontSize: 12, color: "#4ecca3", letterSpacing: "0.06em", marginBottom: 16 }}>
            {new Date(item.news.date).toLocaleDateString("ko-KR")} · {item.news.categories.join(", ") || "General"}
          </div>
          <div style={{ fontSize: 17, lineHeight: 2, color: "#eee", whiteSpace: "pre-wrap",
            wordBreak: "break-word" }}>
            {text}
          </div>

          {item.summary && (
            <div style={{ marginTop: 28, padding: "14px 16px", background: "#0d0d1f",
              border: `1px solid ${item.approved ? "#4ecca344" : "#88888844"}`, borderRadius: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#f5a623", marginBottom: 8, letterSpacing: "0.1em" }}>
                ✅ 컨펌 에이전트 총평
              </div>
              <div style={{ fontSize: 14, color: "#aaa", lineHeight: 1.8 }}>{item.summary}</div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <a href={item.news.url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: "#4ecca3", textDecoration: "none" }}>
              원문 보기 ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

