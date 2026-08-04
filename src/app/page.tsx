"use client";

import { useStore } from "@/lib/store";
import { NewsCard } from "@/components/ui";

export default function NewsPage() {
  const { news, page, setPage, agentStatus, runFetcher, runPipeline } = useStore();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className="tab-bar" style={{ padding: "10px 20px", borderBottom: "1px solid #1a1a30",
        flexShrink: 0, justifyContent: "flex-end" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="page-btn" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1 || agentStatus !== "idle"}
            style={{ padding: "5px 10px", fontSize: 11, background: "#1a1a30", border: "none",
              color: "#888", cursor: "pointer", borderRadius: 3 }}>←</button>
          <button className="collect-btn" onClick={() => runFetcher(page)} disabled={agentStatus !== "idle"}
            style={{ padding: "6px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
              background: agentStatus !== "idle" ? "#1a1a30" : "#4ecca3",
              color: agentStatus !== "idle" ? "#444" : "#07070f",
              border: "none", cursor: agentStatus !== "idle" ? "not-allowed" : "pointer",
              borderRadius: 3, transition: "all 0.2s" }}>
            {agentStatus === "fetching" ? "수집 중..." : `▼ 뉴스 수집 (p.${page})`}
          </button>
          <button className="page-btn" onClick={() => setPage(p => p + 1)} disabled={agentStatus !== "idle"}
            style={{ padding: "5px 10px", fontSize: 11, background: "#1a1a30", border: "none",
              color: "#888", cursor: "pointer", borderRadius: 3 }}>→</button>
        </div>
      </div>

      <div className="tab-content" style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
        {news.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
            <div className="empty-msg" style={{ fontSize: 12 }}>뉴스 수집 버튼을 눌러 시작하세요</div>
          </div>
        ) : (
          <div className="news-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
            {news.map(item => (
              <NewsCard key={item.id} item={item}
                onStart={n => runPipeline(n)}
                disabled={agentStatus !== "idle"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
