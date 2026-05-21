import React from "react";

export default function EmptyState({ icon: Icon, title, text }) {
  return (
    <div className="empty-state">
      <Icon size={30} strokeWidth={1.7} />
      <strong>{title}</strong>
      <span>{text}</span>
    </div>
  );
}
