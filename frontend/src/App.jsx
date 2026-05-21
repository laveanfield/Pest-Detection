import React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

import "./styles.css";
import { apiRequest } from "./services/api";
import DashboardStats from "./components/DashboardStats";
import UploadPanel from "./components/UploadPanel";
import ResultPanel from "./components/ResultPanel";
import ModelRegistry from "./components/ModelRegistry";
import HistoryTable, {formatDate} from "./components/HistoryTable";

const DEFAULT_USER_ID = "demo-user";

export default function App() {
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
      formData.append("user_id", userId || DEFAULT_USER_ID);
      formData.append("file", file);
      formData.append("confidence_threshold", confidence);
      const result = await apiRequest(`/predict/`, {
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

      <DashboardStats stats={stats} />

      <section className="workspace-grid">
        <UploadPanel
          userId={userId}
          setUserId={setUserId}
          previewUrl={previewUrl}
          handleFileChange={handleFileChange}
          handleSubmit={handleSubmit}
          confidence={confidence}
          setConfidence={setConfidence}
          isWorking={isWorking}
        />

        <ResultPanel
          prediction={prediction}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          displayedImage={displayedImage}
          isWorking={isWorking}
        />
      </section>

      <section className="lower-grid">
        <HistoryTable history={history} formatDate={formatDate} />
        <ModelRegistry
          models={models}
          modelForm={modelForm}
          setModelForm={setModelForm}
          handleRegisterModel={handleRegisterModel}
          handleActivateModel={handleActivateModel}
        />
      </section>
    </main>
  );
}