import React from "react";
import ReactDOM from "react-dom/client";
import {
  Activity,
  BarChart3,
  Brain,
  Check,
  Clock3,
  Eye,
  History,
  ImageUp,
  Loader2,
  RefreshCw,
  RotateCw,
  Send,
  ShieldAlert,
  SlidersHorizontal,
  UploadCloud,
} from "lucide-react";
import "./styles.css";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const DEFAULT_USER_ID = "demo-user";

const formatDate = (value) => {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getErrorMessage = async (response) => {
  try {
    const payload = await response.json();
    if (typeof payload.detail === "string") return payload.detail;
    if (Array.isArray(payload.detail)) return payload.detail.map((item) => item.msg).join(", ");
  } catch {
    // Keep the generic HTTP message below.
  }
  return `Request failed with status ${response.status}`;
};

async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
  return response.json();
}

function StatusBadge({ status }) {
  const normalized = (status || "UNKNOWN").toUpperCase();
  return <span className={`status status-${normalized.toLowerCase()}`}>{normalized}</span>;
}

function StatTile({ label, value, accent }) {
  return (
    <div className="stat-tile" style={{ "--accent": accent }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={30} strokeWidth={1.7} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}

function App() {
  const [userId, setUserId] = React.useState(() => localStorage.getItem("pest-user-id") || DEFAULT_USER_ID);
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [confidence, setConfidence] = React.useState(0.25);
  const [currentJob, setCurrentJob] = React.useState(null);
  const [prediction, setPrediction] = React.useState(null);
  const [stats, setStats] = React.useState(null);
  const [history, setHistory] = React.useState([]);
  const [models, setModels] = React.useState([]);
  const [activeTab, setActiveTab] = React.useState("annotated");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState("");
  const [modelForm, setModelForm] = React.useState({
    name: "",
    file_path: "",
    description: "",
    mAP50: "",
    mAP50_95: "",
  });

  React.useEffect(() => {
    localStorage.setItem("pest-user-id", userId || DEFAULT_USER_ID);
  }, [userId]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const refreshDashboard = React.useCallback(async () => {
    setIsRefreshing(true);
    setError("");
    try {
      const [nextStats, nextHistory, nextModels] = await Promise.all([
        apiRequest("/stats/"),
        apiRequest(`/history/?user_id=${encodeURIComponent(userId || DEFAULT_USER_ID)}&limit=12`),
        apiRequest("/models/"),
      ]);
      setStats(nextStats);
      setHistory(nextHistory);
      setModels(nextModels);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, [userId]);

  React.useEffect(() => {
    refreshDashboard();
  }, [refreshDashboard]);

  React.useEffect(() => {
    if (!currentJob?.id) return undefined;

    let cancelled = false;
    const poll = async () => {
      try {
        const result = await apiRequest(`/predict/${currentJob.id}`);
        if (cancelled) return;
        setPrediction(result);
        if (["FINISHED", "FAILED"].includes(result.status)) {
          setCurrentJob(null);
          refreshDashboard();
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setCurrentJob(null);
        }
      }
    };

    poll();
    const timer = window.setInterval(poll, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [currentJob, refreshDashboard]);

  const handleFileChange = (event) => {
    const nextFile = event.target.files?.[0];
    setFile(nextFile || null);
    setPrediction(null);
    setError("");
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : "");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!file) {
      setError("Choose an image before starting analysis.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setPrediction(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence_threshold", confidence);
      const result = await apiRequest(`/predict/?user_id=${encodeURIComponent(userId || DEFAULT_USER_ID)}`, {
        method: "POST",
        body: formData,
      });
      setCurrentJob(result);
      setPrediction(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterModel = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const payload = {
        name: modelForm.name.trim(),
        file_path: modelForm.file_path.trim(),
        description: modelForm.description.trim() || null,
        mAP50: modelForm.mAP50 === "" ? null : Number(modelForm.mAP50),
        mAP50_95: modelForm.mAP50_95 === "" ? null : Number(modelForm.mAP50_95),
      };
      await apiRequest("/models/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      setModelForm({ name: "", file_path: "", description: "", mAP50: "", mAP50_95: "" });
      refreshDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateModel = async (modelId) => {
    setError("");
    try {
      await apiRequest(`/models/${modelId}/activate`, { method: "PATCH" });
      refreshDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const result = prediction?.result;
  const displayedImage = activeTab === "cam" ? result?.cam_url : result?.image_url;
  const isWorking = isSubmitting || Boolean(currentJob);

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">Pest Detection</p>
          <h1>Inspection Console</h1>
        </div>
        <button className="icon-button" type="button" onClick={refreshDashboard} aria-label="Refresh dashboard">
          <RefreshCw size={18} className={isRefreshing ? "spin" : ""} />
        </button>
      </section>

      {error && (
        <div className="alert" role="alert">
          <ShieldAlert size={18} />
          <span>{error}</span>
        </div>
      )}

      <section className="summary-grid">
        <StatTile label="Images" value={stats?.total_images ?? "-"} accent="#2477a6" />
        <StatTile label="Detected pests" value={stats?.total_pests ?? "-"} accent="#c66530" />
        <StatTile label="Thin" value={stats?.breakdown?.thin_pest ?? "-"} accent="#4f8b55" />
        <StatTile label="Round" value={stats?.breakdown?.round_pest ?? "-"} accent="#8d5fb8" />
        <StatTile label="Big" value={stats?.breakdown?.big_pest ?? "-"} accent="#bd3f59" />
      </section>

      <section className="workspace-grid">
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
      </section>

      <section className="lower-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Recent</span>
              <h2>History</h2>
            </div>
            <History size={22} />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id}>
                    <td>#{item.id}</td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td>{item.total_count ?? 0}</td>
                    <td>{formatDate(item.created_at)}</td>
                  </tr>
                ))}
                {!history.length && (
                  <tr>
                    <td colSpan="4" className="muted-cell">
                      No history for this user yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel model-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Registry</span>
              <h2>Models</h2>
            </div>
            <Brain size={22} />
          </div>

          <div className="model-list">
            {models.map((model) => (
              <article className="model-card" key={model.id}>
                <div>
                  <strong>{model.name}</strong>
                  <span>
                    mAP50 {model.mAP50 ?? "-"} · mAP50-95 {model.mAP50_95 ?? "-"}
                  </span>
                </div>
                {model.is_active ? (
                  <span className="active-model">
                    <Check size={15} />
                    Active
                  </span>
                ) : (
                  <button type="button" className="small-button" onClick={() => handleActivateModel(model.id)}>
                    <RotateCw size={15} />
                    Activate
                  </button>
                )}
              </article>
            ))}
            {!models.length && <EmptyState icon={Brain} title="No models registered" text="Add a version below when a model file is ready." />}
          </div>

          <form className="model-form" onSubmit={handleRegisterModel}>
            <input
              required
              value={modelForm.name}
              onChange={(event) => setModelForm({ ...modelForm, name: event.target.value })}
              placeholder="Version name"
            />
            <input
              required
              value={modelForm.file_path}
              onChange={(event) => setModelForm({ ...modelForm, file_path: event.target.value })}
              placeholder="Model file path"
            />
            <div className="compact-inputs">
              <input
                type="number"
                min="0"
                max="1"
                step="0.001"
                value={modelForm.mAP50}
                onChange={(event) => setModelForm({ ...modelForm, mAP50: event.target.value })}
                placeholder="mAP50"
              />
              <input
                type="number"
                min="0"
                max="1"
                step="0.001"
                value={modelForm.mAP50_95}
                onChange={(event) => setModelForm({ ...modelForm, mAP50_95: event.target.value })}
                placeholder="mAP50-95"
              />
            </div>
            <textarea
              value={modelForm.description}
              onChange={(event) => setModelForm({ ...modelForm, description: event.target.value })}
              placeholder="Description"
              rows="2"
            />
            <button type="submit" className="secondary-button">
              <Brain size={17} />
              Register Model
            </button>
          </form>
        </section>
      </section>
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
