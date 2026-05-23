import React from "react";
import { History } from "lucide-react";
import StatusBadge from "./StatusBadge";

export const formatDate = (value) => {
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

export default function HistoryTable({ history }) {
  return (
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
  );
}
