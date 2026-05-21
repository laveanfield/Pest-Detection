import React from "react";
import { Brain, Check, RotateCw } from "lucide-react";
import EmptyState from "./EmptyState";

export default function ModelRegistry({
  models,
  modelForm,
  setModelForm,
  handleRegisterModel,
  handleActivateModel,
  showRegistration = false,
}) {
  return (
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
        {!models.length && (
          <EmptyState
            icon={Brain}
            title="No models registered"
            text={showRegistration ? "Add a version below when a model file is ready." : "Register a model before running predictions."}
          />
        )}
      </div>

      {showRegistration && (
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
      )}
    </section>
  );
}
