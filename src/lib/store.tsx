"use client";

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react";
import type { AnimeNews } from "@/lib/news";

export type AgentStatusType = "idle" | "fetching" | "writing" | "confirming";
export type ArticleStatus = "waiting" | "writing" | "confirming" | "approved" | "rejected";

export interface PipelineItem {
  id: string;
  news: AnimeNews;
  status: ArticleStatus;
  draft?: string;
  editedDraft?: string;
  approved?: boolean;
  score?: number;
  summary?: string;
  confirmRaw?: string;
  startedAt: string;
  finishedAt?: string;
}

export interface LogEntry {
  id: string;
  agent: "fetcher" | "writer" | "confirm" | "system";
  msg: string;
  level: "info" | "success" | "error" | "warn";
  time: string;
}

export const AGENTS = {
  fetcher: { name: "수집 에이전트", color: "#4ecca3" },
  writer:  { name: "작성 에이전트", color: "#e94560" },
  confirm: { name: "컨펌 에이전트", color: "#f5a623" },
  system:  { name: "시스템",        color: "#888"    },
} as const;

function now() { return new Date().toLocaleTimeString("ko-KR", { hour12: false }); }
function uid() { return Math.random().toString(36).slice(2); }

// DB에 조용히 반영 — 실패해도 화면 표시된 상태는 그대로 유지하고 콘솔에만 남김
async function persistCreate(item: PipelineItem) {
  try {
    await fetch("/api/pipeline", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: item.id, news: item.news, status: item.status, startedAt: item.startedAt }),
    });
  } catch (e) {
    console.error("파이프라인 저장 실패:", e);
  }
}

async function persistUpdate(id: string, patch: Partial<PipelineItem>) {
  try {
    await fetch(`/api/pipeline/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  } catch (e) {
    console.error("파이프라인 갱신 실패:", e);
  }
}

interface StoreValue {
  news: AnimeNews[];
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  agentStatus: AgentStatusType;
  pipeline: PipelineItem[];
  pipelineLoaded: boolean;
  logs: LogEntry[];
  clearLogs: () => void;
  readerId: string | null;
  setReaderId: (id: string | null) => void;
  runFetcher: (p: number) => Promise<void>;
  runPipeline: (newsItem: AnimeNews, existingId?: string, editedDraft?: string) => Promise<void>;
  handleRewrite: (item: PipelineItem, editedDraft: string) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [news, setNews]               = useState<AnimeNews[]>([]);
  const [page, setPage]               = useState(1);
  const [agentStatus, setAgentStatus] = useState<AgentStatusType>("idle");
  const [pipeline, setPipeline]       = useState<PipelineItem[]>([]);
  const [pipelineLoaded, setPipelineLoaded] = useState(false);
  const [logs, setLogs]               = useState<LogEntry[]>([]);
  const [readerId, setReaderId]       = useState<string | null>(null);

  const addLog = useCallback((agent: LogEntry["agent"], msg: string, level: LogEntry["level"] = "info") => {
    setLogs(l => [...l, { id: uid(), agent, msg, level, time: now() }]);
  }, []);

  // 저장된 처리 결과 불러오기 (새로고침해도 유지, 다른 사람이 만든 것도 같이 보임)
  const refetchPipeline = useCallback(async () => {
    try {
      const res = await fetch("/api/pipeline");
      const json = await res.json();
      if (Array.isArray(json.data)) setPipeline(json.data);
    } catch (e) {
      console.error("파이프라인 불러오기 실패:", e);
    }
  }, []);

  useEffect(() => {
    refetchPipeline().finally(() => setPipelineLoaded(true));
  }, [refetchPipeline]);

  // 같은 링크로 접속한 다른 사람이 처리한 기사도 자동으로 반영되도록 주기적으로 동기화.
  // 단, 지금 이 브라우저에서 직접 파이프라인을 돌리고 있을 때는 낙관적 업데이트를
  // 서버의 약간 지연된 값으로 덮어쓰지 않도록 건너뛴다.
  useEffect(() => {
    if (agentStatus !== "idle") return;
    const interval = setInterval(refetchPipeline, 5000);
    return () => clearInterval(interval);
  }, [agentStatus, refetchPipeline]);

  const clearLogs = useCallback(() => setLogs([]), []);

  const runFetcher = useCallback(async (p: number) => {
    setAgentStatus("fetching");
    addLog("fetcher", `페이지 ${p} 뉴스 수집 시작...`);
    try {
      const res  = await fetch(`/api/news?page=${p}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? `뉴스 API 오류 (${res.status})`);
      const items: AnimeNews[] = json.data ?? [];
      setNews(items);
      addLog("fetcher", `${items.length}개 뉴스 수집 완료`, "success");
    } catch (e: any) {
      addLog("fetcher", `수집 실패: ${e.message}`, "error");
    } finally {
      setAgentStatus("idle");
    }
  }, [addLog]);

  const runPipeline = useCallback(async (newsItem: AnimeNews, existingId?: string, editedDraft?: string) => {
    if (agentStatus !== "idle") return;

    const id = existingId ?? uid();

    if (!existingId) {
      const newItem: PipelineItem = { id, news: newsItem, status: "writing", startedAt: now() };
      setPipeline(p => [newItem, ...p]);
      persistCreate(newItem);
    } else {
      setPipeline(p => p.map(i => i.id === id ? { ...i, status: "writing", editedDraft } : i));
      persistUpdate(id, { status: "writing", editedDraft });
    }

    setAgentStatus("writing");
    addLog("writer", `"${newsItem.title.slice(0, 30)}..." 기사 작성 중...`);

    let draft = editedDraft ?? "";
    if (!editedDraft) {
      try {
        const res  = await fetch("/api/agent/writer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title:      newsItem.title,
            excerpt:    newsItem.excerpt,
            categories: newsItem.categories.join(", "),
            date:       newsItem.date,
            url:        newsItem.url,
          }),
        });
        const json = await res.json();
        if (json.error) throw new Error(json.error);
        draft = json.draft;
        setPipeline(p => p.map(i => i.id === id ? { ...i, draft, status: "confirming" } : i));
        persistUpdate(id, { draft, status: "confirming" });
        addLog("writer", `초안 완성 (${draft.length}자)`, "success");
      } catch (e: any) {
        addLog("writer", `작성 실패: ${e.message}`, "error");
        setPipeline(p => p.map(i => i.id === id ? { ...i, status: "rejected" } : i));
        persistUpdate(id, { status: "rejected" });
        setAgentStatus("idle");
        return;
      }
    } else {
      setPipeline(p => p.map(i => i.id === id ? { ...i, editedDraft, status: "confirming" } : i));
      persistUpdate(id, { editedDraft, status: "confirming" });
      addLog("writer", "수정본 전달 완료", "success");
    }

    await new Promise(r => setTimeout(r, 500));

    setAgentStatus("confirming");
    addLog("confirm", "기사 품질 검토 중...");
    try {
      const res  = await fetch("/api/agent/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          originalTitle:   newsItem.title,
          originalExcerpt: newsItem.excerpt,
          draft,
        }),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      const finishedAt = now();
      const finalStatus: ArticleStatus = json.approved ? "approved" : "rejected";
      setPipeline(p => p.map(i => i.id === id ? {
        ...i,
        approved:    json.approved,
        score:       json.score,
        summary:     json.summary,
        confirmRaw:  json.raw,
        status:      finalStatus,
        finishedAt,
      } : i));
      persistUpdate(id, {
        approved:   json.approved,
        score:      json.score,
        summary:    json.summary,
        confirmRaw: json.raw,
        status:     finalStatus,
        finishedAt,
      });
      addLog("confirm", `검토 완료: ${json.approved ? "✅ 승인" : "❌ 반려"} (${json.score}점)`, json.approved ? "success" : "warn");
    } catch (e: any) {
      addLog("confirm", `검토 실패: ${e.message}`, "error");
      setPipeline(p => p.map(i => i.id === id ? { ...i, status: "rejected" } : i));
      persistUpdate(id, { status: "rejected" });
    } finally {
      setAgentStatus("idle");
    }
  }, [agentStatus, addLog]);

  const handleRewrite = useCallback((item: PipelineItem, editedDraft: string) => {
    addLog("system", `"${item.news.title.slice(0, 30)}..." 수정 후 재검토 요청`, "info");
    runPipeline(item.news, item.id, editedDraft);
  }, [runPipeline, addLog]);

  return (
    <StoreContext.Provider value={{
      news, page, setPage, agentStatus, pipeline, pipelineLoaded, logs, clearLogs,
      readerId, setReaderId, runFetcher, runPipeline, handleRewrite,
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
