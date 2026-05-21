import React from "react";
import { Files, Loader2, Send, SlidersHorizontal, Webhook } from "lucide-react";
import StatTile from "./StatTile";
import EmptyState from "./EmptyState";
import StatusBadge from "./StatusBadge";

export default function BatchPredictionPanel({
  userId,
  batchFiles,
  webhookUrl,
  setWebhookUrl,
  handleBatchFileChange,
  handleBatchSubmit,
  batchConfidence,
  setBatchConfidence,
  batchJob,
  batchStatus,
  batchSummary,
  isBatchSubmitting,
}) {
  const isWorking = isBatchSubmitting || Boolean(batchJob);
  const completed = batchStatus ? batchStatus.finished + batchStatus.failed : 0;
  const progressValue = batchStatus?.total ? Math.round((completed / batchStatus.total) * 100) : 0;

  return (
    <section className="panel batch-panel">
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Batch</span>
          <h2>Multi Image Prediction</h2>
        </div>
        {batchStatus?.batch_id && <StatusBadge status={isWorking ? "PROCESSING" : "FINISHED"} />}
      </div>

      <form className="batch-form" onSubmit={handleBatchSubmit}>
        <label className="batch-drop-zone">
          <input type="file" accept="image/*" multiple onChange={handleBatchFileChange} />
          <span className="drop-copy">
            <Files size={34} />
            <strong>{batchFiles.length ? `${batchFiles.length} image${batchFiles.length > 1 ? "s" : ""} selected` : "Choose up to 10 images"}</strong>
            <small>{userId || "demo-user"}</small>
          </span>
        </label>

        {batchFiles.length > 0 && (
          <div className="file-list">
            {batchFiles.map((file) => (
              <span key={`${file.name}-${file.size}`}>{file.name}</span>
            ))}
          </div>
        )}

        <div className="batch-controls">
          <label className="field slider-field">
            <span>
              <SlidersHorizontal size={16} />
              Confidence threshold
              <strong>{batchConfidence.toFixed(2)}</strong>
            </span>
            <input
              type="range"
              min="0.01"
              max="1"
              step="0.01"
              value={batchConfidence}
              onChange={(event) => setBatchConfidence(Number(event.target.value))}
            />
          </label>

          <label className="field">
            <span>
              <Webhook size={16} />
              Webhook URL
            </span>
            <input value={webhookUrl} onChange={(event) => setWebhookUrl(event.target.value)} placeholder="Optional" />
          </label>
        </div>

        <button className="primary-button" type="submit" disabled={isWorking}>
          {isWorking ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
          {isWorking ? "Processing Batch" : "Start Batch Prediction"}
        </button>
      </form>

      {batchStatus ? (
        <div className="batch-status">
          <div className="progress-row">
            <span>{batchStatus.progress}</span>
            <strong>{progressValue}%</strong>
          </div>
          <div className="progress-track">
            <span style={{ width: `${progressValue}%` }} />
          </div>
          <div className="count-grid">
            <StatTile label="Total" value={batchStatus.total} accent="#2477a6" />
            <StatTile label="Finished" value={batchStatus.finished} accent="#4f8b55" />
            <StatTile label="Failed" value={batchStatus.failed} accent="#bd3f59" />
            <StatTile label="Pests" value={batchSummary?.total_pest ?? "-"} accent="#c66530" />
          </div>
          {batchSummary && (
            <div className="count-grid">
              <StatTile label="Thin" value={batchSummary.thin_pest_total} accent="#4f8b55" />
              <StatTile label="Round" value={batchSummary.round_pest_total} accent="#8d5fb8" />
              <StatTile label="Big" value={batchSummary.big_pest_total} accent="#bd3f59" />
              <StatTile label="Images Done" value={batchSummary.finished_images} accent="#1d7d73" />
            </div>
          )}
        </div>
      ) : (
        <EmptyState icon={Files} title="No batch running" text="Select several images to create a batch prediction job." />
      )}
    </section>
  );
}
