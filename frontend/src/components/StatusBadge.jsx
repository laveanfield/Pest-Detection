import React from "react";

export default function StatusBadge({ status }) {
  const normalized = (status || "UNKNOWN").toUpperCase();
  return <span className={`status status-${normalized.toLowerCase()}`}>{normalized}</span>;
}
