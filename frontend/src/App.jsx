import React from "react";
import { RefreshCw, ShieldAlert } from "lucide-react";

import "./styles.css";
import { apiRequest, clearToken, getCurrentUser, getToken } from "./services/api";
import AppNavigation from "./components/AppNavigation";
import BatchPredictionPanel from "./components/BatchPredictionPanel";
import DashboardStats from "./components/DashboardStats";
import UploadPanel from "./components/UploadPanel";
import ResultPanel from "./components/ResultPanel";
import ModelRegistry from "./components/ModelRegistry";
import HistoryTable, {formatDate} from "./components/HistoryTable";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";

const DEFAULT_USER_ID = "demo-user";
const ROUTES = {
  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  console: "/console",
  models: "/models",
};

function routeFromPath(pathname) {
  const token = getToken();
  const storedRole = localStorage.getItem("pest-user-role");
  
  if (pathname === ROUTES.register) {
    if (token) {
      return storedRole === "admin" ? "models" : "console";
    }
    return "register";
  }
  if (pathname === ROUTES.forgotPassword) {
    if (token) {
      return storedRole === "admin" ? "models" : "console";
    }
    return "forgotPassword";
  }
  if (pathname === ROUTES.models) return token ? "models" : "login";
  if (pathname === ROUTES.console) return token ? "console" : "login";
  return token ? (storedRole === "admin" ? "models" : "console") : "login";
}

// ── Auth gate ─────────────────────────────────────────────────────────────────
// "login" | "register" | "forgotPassword" | "app"
function useAuthRoute() {
  const [route, setRouteState] = React.useState(() => routeFromPath(window.location.pathname));

  const setRoute = React.useCallback((nextRoute, options = {}) => {
    const unsafeRoutes = ["console", "models"];
    const safeRoute = unsafeRoutes.includes(nextRoute) && !getToken() ? "login" : nextRoute;
    const nextPath = ROUTES[safeRoute] || ROUTES.login;

    setRouteState(safeRoute);
    if (window.location.pathname !== nextPath) {
      const method = options.replace ? "replaceState" : "pushState";
      window.history[method]({}, "", nextPath);
    }
  }, []);

  React.useEffect(() => {
    const normalizedRoute = routeFromPath(window.location.pathname);
    setRoute(normalizedRoute, { replace: true });
  }, [setRoute]);

  React.useEffect(() => {
    const handlePopState = () => {
      setRouteState(routeFromPath(window.location.pathname));
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  return { route, setRoute };
}

export function MainApp({ onLogout, route, setRoute }) {
  const activePage = route === "models" ? "register" : "prediction";
  const [userId, setUserId] = React.useState(() => localStorage.getItem("pest-user-id") || DEFAULT_USER_ID);
  const [currentUser, setCurrentUser] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const [previewUrl, setPreviewUrl] = React.useState("");
  const [confidence, setConfidence] = React.useState(0.25);
  const [batchFiles, setBatchFiles] = React.useState([]);
  const [batchConfidence, setBatchConfidence] = React.useState(0.25);
  const [webhookUrl, setWebhookUrl] = React.useState("");
  const [batchJob, setBatchJob] = React.useState(null);
  const [batchStatus, setBatchStatus] = React.useState(null);
  const [batchSummary, setBatchSummary] = React.useState(null);
  const [batchDetections, setBatchDetections] = React.useState([]);
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
    let cancelled = false;

    const loadCurrentUser = async () => {
      try {
        const user = await getCurrentUser(getToken());
        if (cancelled) return;
        setCurrentUser(user);
        setUserId(user.id || DEFAULT_USER_ID);
        localStorage.setItem("pest-user-role", user.role || "user");
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          onLogout();
        }
      }
    };

    loadCurrentUser();
    return () => {
      cancelled = true;
    };
  }, [onLogout]);

  React.useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role === "admin" && route !== "models") {
      setRoute("models", { replace: true });
    }
    if (currentUser.role !== "admin" && route !== "console") {
      setRoute("console", { replace: true });
    }
  }, [currentUser, route, setRoute]);

  React.useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // ── Console Route: Fetch prediction dashboard data ────────────────────────
  const refreshConsoleDashboard = React.useCallback(async () => {
    setIsRefreshing(true);
    setError("");
    try {
      const results = await Promise.allSettled([
        apiRequest("/stats/"),
        apiRequest("/history/?limit=12"),
      ]);

      if (results[0].status === "fulfilled") setStats(results[0].value);
      if (results[1].status === "fulfilled") setHistory(results[1].value);

      const firstRejected = results.find((r) => r.status === "rejected");
      if (firstRejected) setError(firstRejected.reason?.message || String(firstRejected.reason));
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Models Route: Fetch model registry data ─────────────────────────────
  const refreshModelsDashboard = React.useCallback(async () => {
    setIsRefreshing(true);
    setError("");
    try {
      const result = await apiRequest("/models/");
      setModels(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  // ── Route handler: Navigate and fetch data for console ───────────────────
  const navigateToConsole = React.useCallback(() => {
    setRoute("console");
    refreshConsoleDashboard();
  }, [setRoute, refreshConsoleDashboard]);

  // ── Route handler: Navigate and fetch data for models ────────────────────
  const navigateToModels = React.useCallback(() => {
    setRoute("models");
    refreshModelsDashboard();
  }, [setRoute, refreshModelsDashboard]);

  // ── Unified refresh for current page (used by polling and UI) ────────────
  const refreshCurrentPage = React.useCallback(() => {
    if (route === "console") {
      refreshConsoleDashboard();
    } else if (route === "models") {
      refreshModelsDashboard();
    }
  }, [route, refreshConsoleDashboard, refreshModelsDashboard]);

  React.useEffect(() => {
    if (route === "console") {
      refreshConsoleDashboard();
    } else if (route === "models") {
      refreshModelsDashboard();
    }
  }, [route, refreshConsoleDashboard, refreshModelsDashboard]);

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
          refreshCurrentPage();
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
  }, [currentJob, refreshCurrentPage]);

  React.useEffect(() => {
    if (!batchJob?.batch_id) return undefined;

    let cancelled = false;
    const pollBatch = async () => {
      try {
        const results = await Promise.allSettled([
          apiRequest(`/predict/batch/${batchJob.batch_id}`),
          apiRequest("/history/?limit=100"),
        ]);
        if (cancelled) return;

        if (results[0].status === "rejected") {
          // can't proceed without status; cancel this batch polling cycle
          if (!cancelled) setError(results[0].reason?.message || String(results[0].reason));
          return;
        }

        const status = results[0].value;
        const nextHistory = results[1].status === "fulfilled" ? results[1].value : [];

        setBatchStatus(status);
        setBatchDetections(nextHistory.filter((item) => item.batch_id === batchJob.batch_id));
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
            refreshCurrentPage();
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
  }, [batchJob, refreshCurrentPage]);

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
    setBatchDetections([]);
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
    setBatchDetections([]);
    try {
      const formData = new FormData();
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
      refreshModelsDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleActivateModel = async (modelId) => {
    setError("");
    try {
      await apiRequest(`/models/${modelId}/activate`, { method: "PATCH" });
      refreshModelsDashboard();
    } catch (err) {
      setError(err.message);
    }
  };

  const downloadImage = async (url, filename) => {
    if (!url) return;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const downloadBatchImages = () => {
    batchDetections
      .filter((item) => item.image_url)
      .forEach((item, index) => {
        window.setTimeout(() => {
          downloadImage(item.image_url, `batch-${item.batch_id || "prediction"}-${item.id}.jpg`);
        }, index * 250);
      });
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
      <AppNavigation
        activePage={activePage}
        onNavigate={(page) => setRoute(page === "register" ? "models" : "console")}
        onLogout={onLogout}
        currentUser={currentUser}
      />
      <main className="app-shell">
        <section className="topbar">
          <div>
            <p className="eyebrow">{pageEyebrow}</p>
            <h1>{pageTitle}</h1>
          </div>
          <button className="icon-button" type="button" onClick={refreshCurrentPage} aria-label="Refresh dashboard">
            <RefreshCw size={18} className={isRefreshing ? "spin" : ""} />
          </button>
        </section>

        {error && (
          <div className="alert" role="alert">
            <ShieldAlert size={18} />
            <span>{error}</span>
          </div>
        )}
        {activePage === "prediction" && (
          <>
            {/* <DashboardStats stats={stats} /> */}

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
                downloadImage={downloadImage}
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
                batchDetections={batchDetections}
                isBatchSubmitting={isBatchSubmitting}
                downloadImage={downloadImage}
                downloadBatchImages={downloadBatchImages}
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

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  const { route, setRoute } = useAuthRoute();

  const handleLoginSuccess = () => setRoute("console", { replace: true });

  // After OTP verified → go to login so the user signs in properly
  const handleVerified = () => {
    setRoute("login", { replace: true });
  };

  const handleLogout = () => {
    clearToken();
    localStorage.removeItem("pest-user-role");
    setRoute("login", { replace: true });
  };

  React.useEffect(() => {
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  if (route === "login") {
    return (
      <LoginPage
        onLoginSuccess={handleLoginSuccess}
        onGoToRegister={() => setRoute("register")}
        onGoToForgotPassword={() => setRoute("forgotPassword")}
      />
    );
  }

  if (route === "forgotPassword") {
    return (
      <ForgotPasswordPage
        onGoToLogin={() => setRoute("login")}
        onResetSuccess={() => setRoute("login", { replace: true })}
      />
    );
  }

  if (route === "register") {
    return (
      <RegisterPage
        onGoToLogin={() => setRoute("login")}
        onVerified={handleVerified}
      />
    );
  }

  if (route === "console" || route === "models") {
    return <MainApp onLogout={handleLogout} route={route} setRoute={setRoute} />;
  }

  return null;
}
