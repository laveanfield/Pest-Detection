import React from "react";
import { ImageUp, ListPlus, LogOut } from "lucide-react";

const navItems = [
  // { id: "models", label: "Models", icon: Brain },
  { id: "prediction", label: "Prediction", icon: ImageUp },
  { id: "register", label: "Register Model", icon: ListPlus },
];

export default function AppNavigation({ activePage, setActivePage, onLogout, currentUser }) {
  return (
    <nav className="app-nav" aria-label="Primary navigation">
      <div className="nav-brand">
        <span>Pest Detection</span>
        <strong>Console</strong>
        {currentUser?.email && <small>{currentUser.email}</small>}
      </div>
      <div className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              className={activePage === item.id ? "active" : ""}
              onClick={() => setActivePage(item.id)}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </div>
      <button className="logout-button" type="button" onClick={onLogout}>
        <LogOut size={18} />
        Logout
      </button>
    </nav>
  );
}
