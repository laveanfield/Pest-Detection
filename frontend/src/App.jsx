import React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

import "./styles.css";
import { apiRequest } from "./services/api";
import AppNavigation from "./components/AppNavigation";
import BatchPredictionPanel from "./components/BatchPredictionPanel";
import DashboardStats from "./components/DashboardStats";
import UploadPanel from "./components/UploadPanel";
import ResultPanel from "./components/ResultPanel";
import ModelRegistry from "./components/ModelRegistry";
import HistoryTable from "./components/HistoryTable";

const DEFAULT_USER_ID = "demo-user";

export default function App() {
  const [activePage, setActivePage] = React.useState("prediction");
  const [userId, setUserId] = React.useState(() => localStorage.getItem("pest-user-id") || DEFAULT_USER_ID);
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [confidence, setConfidence] = React.useState(0.25);
  const [batchFiles, setBatchFiles] = React.useState([]);
  const [batchConfidence, setBatchConfidence] = React.useState(0.25);
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [batchJob, setBatchJob] = React.useState(null);
  const [batchStatus, setBatchStatus] = React.useState(null);
  const [batchSummary, setBatchSummary] = React.useState(null);
  const [isBatchSubmitting, setIsBatchSubmitting] = React.useState(false);
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

  React.useEffect(() => {
    if (!batchJob?.batch_id) return undefined;

    let cancelled = false;
    const pollBatch = async () => {
      try {
        const status = await apiRequest(`/predict/batch/${batchJob.batch_id}`);
        if (cancelled) return;

        setBatchStatus(status);
        const isComplete = status.finished + status.failed >= status.total;

        if (isComplete) {
          try {
            const summary = await apiRequest(`/predict/batch/${batchJob.batch_id}/summary`);
            if (!cancelled) setBatchSummary(summary);
          } catch (err) {
            if (!cancelled && !err.message.includes("404")) setError(err.message);
          }

          if (!cancelled) {
            setBatchJob(null);
            refreshDashboard();
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setBatchJob(null);
        }
      }
    };

    pollBatch();
    const timer = window.setInterval(pollBatch, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [batchJob, refreshDashboard]);

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

  const handleBatchFileChange = (event) => {
    setError("");
    setBatchSummary(null);
    setBatchStatus(null);
    setBatchFiles(Array.from(event.target.files || []).slice(0, 10));
  };

  const handleBatchSubmit = async (event) => {
    event.preventDefault();
    if (!batchFiles.length) {
      setError("Choose at least one image before starting a batch.");
      return;
    }

    setIsBatchSubmitting(true);
    setError("");
    setBatchStatus(null);
    setBatchSummary(null);
    try {
      const formData = new FormData();
      formData.append("user_id", userId || DEFAULT_USER_ID);
      formData.append("confidence_threshold", batchConfidence);
      if (webhookUrl.trim()) formData.append("webhook_url", webhookUrl.trim());
      batchFiles.forEach((batchFile) => formData.append("files", batchFile));

      const result = await apiRequest("/predict/batch", {
        method: "POST",
        body: formData,
      });
      setBatchJob(result);
      setBatchStatus({
        batch_id: result.batch_id,
        total: result.total,
        finished: 0,
        failed: 0,
        progress: `0/${result.total}`,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsBatchSubmitting(false);
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
  const pageTitle =
    activePage === "prediction" ? "Prediction" : activePage === "register" ? "Register Model" : "Available Models";
  const pageEyebrow =
    activePage === "prediction" ? "Single and batch detection" : activePage === "register" ? "Model registry" : "Activation";

  return (
    <div className="app-layout">
      <AppNavigation activePage={activePage} setActivePage={setActivePage} />
      <main className="app-shell">
        <section className="topbar">
          <div>
            <p className="eyebrow">{pageEyebrow}</p>
            <h1>{pageTitle}</h1>
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

        {/* {activePage === "models" && (
          <section className="focused-grid">
            <ModelRegistry models={models} handleActivateModel={handleActivateModel} />
          </section>
        )} */}

        {activePage === "prediction" && (
          <>
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

            <section className="prediction-lower-grid">
              <BatchPredictionPanel
                userId={userId}
                batchFiles={batchFiles}
                webhookUrl={webhookUrl}
                setWebhookUrl={setWebhookUrl}
                handleBatchFileChange={handleBatchFileChange}
                handleBatchSubmit={handleBatchSubmit}
                batchConfidence={batchConfidence}
                setBatchConfidence={setBatchConfidence}
                batchJob={batchJob}
                batchStatus={batchStatus}
                batchSummary={batchSummary}
                isBatchSubmitting={isBatchSubmitting}
              />
              <HistoryTable history={history} />
            </section>
          </>
        )}

        {activePage === "register" && (
          <section className="focused-grid">
            <ModelRegistry
              models={models}
              modelForm={modelForm}
              setModelForm={setModelForm}
              handleRegisterModel={handleRegisterModel}
              handleActivateModel={handleActivateModel}
              showRegistration
            />
          </section>
        )}
      </main>
    </div>
  );
}
