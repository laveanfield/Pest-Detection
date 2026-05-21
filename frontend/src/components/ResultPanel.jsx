import React from "react";
import { Activity, BarChart3, Clock3, Eye, ShieldAlert } from "lucide-react";
import StatusBadge from "./StatusBadge";
import StatTile from "./StatTile";
import EmptyState from "./EmptyState";

export default function ResultPanel({ prediction, activeTab, setActiveTab, displayedImage, isWorking }) {
  const result = prediction?.result;

  return (
    <section className="panel result-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Result</span>
          <h2>Detection Output</h2>
        </div>
        {prediction?.status && <StatusBadge status={prediction.status} />}
      </div>

      {result ? (
        <>
          <div className="tabs" role="tablist" aria-label="Result image view">
            <button
              type="button"
              className={activeTab === "annotated" ? "active" : ""}
              onClick={() => setActiveTab("annotated")}
            >
              <Eye size={16} />
              Annotated
            </button>
            <button
              type="button"
              className={activeTab === "cam" ? "active" : ""}
              onClick={() => setActiveTab("cam")}
              disabled={!result.cam_url}
            >
              <Activity size={16} />
              CAM
            </button>
          </div>

          <div className="result-image">
            <img src={displayedImage} alt="Detection result" />
          </div>

          <div className="count-grid">
            <StatTile label="Total" value={result.total_count} accent="#1d7d73" />
            <StatTile label="Thin" value={result.details.thin_pest} accent="#4f8b55" />
            <StatTile label="Round" value={result.details.round_pest} accent="#8d5fb8" />
            <StatTile label="Big" value={result.details.big_pest} accent="#bd3f59" />
          </div>
        </>
      ) : prediction?.status === "FAILED" ? (
        <EmptyState icon={ShieldAlert} title="Processing failed" text={prediction.message || "Try a clearer image."} />
      ) : prediction?.status ? (
        <EmptyState icon={Clock3} title="Waiting for worker" text="The backend accepted the image and is processing it." />
      ) : (
        <EmptyState icon={BarChart3} title="No active result" text="Upload an image to inspect detections here." />
      )}
    </section>
  );
}
