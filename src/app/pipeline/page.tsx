"use client";

import { useStore } from "@/lib/store";
import { PipelineCard } from "@/components/ui";

export default function PipelinePage() {
  const { pipeline } = useStore();

  return (
    <div className="tab-content" style={{ height: "100%", overflowY: "auto", padding: "16px 20px" }}>
      {pipeline.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#333" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>⬡</div>
          <div className="empty-msg" style={{ fontSize: 12 }}>아직 처리된 기사가 없습니다</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {pipeline.map(item => (
            <PipelineCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
