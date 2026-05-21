import React from "react";
import { ImageUp, UploadCloud, SlidersHorizontal, Send, Loader2 } from "lucide-react";

export default function UploadPanel({
  userId,
  setUserId,
  previewUrl,
  handleFileChange,
  handleSubmit,
  confidence,
  setConfidence,
  isWorking,
}) {
  return (
    <form className="panel upload-panel" onSubmit={handleSubmit}>
      <div className="panel-heading">
        <div>
          <span className="section-kicker">Analyze</span>
          <h2>New Image</h2>
        </div>
        <ImageUp size={22} />
      </div>

      <label className="field">
        <span>User ID</span>
        <input value={userId} onChange={(event) => setUserId(event.target.value)} placeholder="demo-user" />
      </label>

      <label className={`drop-zone ${previewUrl ? "has-preview" : ""}`}>
        <input type="file" accept="image/*" onChange={handleFileChange} />
        {previewUrl ? (
          <img src={previewUrl} alt="Selected upload preview" />
        ) : (
          <span className="drop-copy">
            <UploadCloud size={34} />
            <strong>Choose pest image</strong>
            <small>JPG, PNG, or WEBP</small>
          </span>
        )}
      </label>

      <label className="field slider-field">
        <span>
          <SlidersHorizontal size={16} />
          Confidence threshold
          <strong>{confidence.toFixed(2)}</strong>
        </span>
        <input
          type="range"
          min="0.01"
          max="1"
          step="0.01"
          value={confidence}
          onChange={(event) => setConfidence(Number(event.target.value))}
        />
      </label>

      <button className="primary-button" type="submit" disabled={isWorking}>
        {isWorking ? <Loader2 size={18} className="spin" /> : <Send size={18} />}
        {isWorking ? "Analyzing" : "Start Detection"}
      </button>
    </form>
  );
}
