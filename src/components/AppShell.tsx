"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { StoreProvider, useStore } from "@/lib/store";
import { AgentStatusStrip, ReaderModal } from "@/components/ui";

function Header() {
  const { pipeline, logs } = useStore();
  const pathname = usePathname();

  const stats = {
    total:    pipeline.length,
    approved: pipeline.filter(p => p.status === "approved").length,
    rejected: pipeline.filter(p => p.status === "rejected").length,
    pending:  pipeline.filter(p => p.status === "writing" || p.status === "confirming").length,
  };

  const navItems = [
    { href: "/",         label: "뉴스 목록", count: 0 },
    { href: "/pipeline", label: "처리 결과", count: pipeline.length },
    { href: "/logs",     label: "로그",     count: logs.length },
  ];

  return (
    <>
      <div className="header-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 20px", borderBottom: "1px solid #1a1a30", background: "#0a0a18", flexShrink: 0, flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: "#4ecca3", letterSpacing: "0.2em" }}>OTAZIN</span>
          <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.15em" }}>AI NEWS AGENT v1.0</span>
        </div>
        <div className="header-stats">
          {[
            { label: "총",   value: stats.total,    color: "#555"    },
            { label: "승인", value: stats.approved,  color: "#4ecca3" },
            { label: "반려", value: stats.rejected,  color: "#e94560" },
            { label: "진행", value: stats.pending,   color: "#f5a623" },
          ].map(s => (
            <div key={s.label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 9, color: "#444", marginTop: 3, letterSpacing: "0.08em" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <AgentStatusStrip />

      <nav className="tab-bar" style={{ padding: "10px 20px", borderBottom: "1px solid #1a1a30", background: "#050510", flexShrink: 0 }}>
        {navItems.map(n => {
          const active = pathname === n.href;
          return (
            <Link key={n.href} href={n.href} className="tab-btn"
              style={{ padding: "6px 16px", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                textDecoration: "none",
                color: active ? "#4ecca3" : "#444",
                borderBottom: `2px solid ${active ? "#4ecca3" : "transparent"}`,
                paddingBottom: 8, transition: "all 0.15s" }}>
              {n.label}{n.count > 0 ? ` (${n.count})` : ""}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <StoreProvider>
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: "#07070f" }}>
        <Header />
        <div style={{ flex: 1, minHeight: 0 }}>
          {children}
        </div>
      </div>
      <ReaderModal />
    </StoreProvider>
  );
}
