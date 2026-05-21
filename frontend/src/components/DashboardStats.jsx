import React from "react";
import StatTile from "./StatTile";

export default function DashboardStats({ stats }) {
  return (
    <section className="summary-grid">
      <StatTile label="Images" value={stats?.total_images ?? "-"} accent="#2477a6" />
      <StatTile label="Detected pests" value={stats?.total_pests ?? "-"} accent="#c66530" />
      <StatTile label="Thin" value={stats?.breakdown?.thin_pest ?? "-"} accent="#4f8b55" />
      <StatTile label="Round" value={stats?.breakdown?.round_pest ?? "-"} accent="#8d5fb8" />
      <StatTile label="Big" value={stats?.breakdown?.big_pest ?? "-"} accent="#bd3f59" />
    </section>
  );
}
