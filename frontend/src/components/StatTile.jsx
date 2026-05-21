import React from "react";

export default function StatTile({ label, value, accent }) {
  return (
    <div className="stat-tile" style={{ "--accent": accent }}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
