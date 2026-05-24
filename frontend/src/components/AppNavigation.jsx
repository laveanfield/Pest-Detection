import React from "react";
import { ImageUp, ListPlus, LogOut } from "lucide-react";

export default function AppNavigation({ activePage, onNavigate, onLogout, currentUser }) {
  const navItems = [];

  if (!currentUser) {
    // Wait for /auth/me before exposing role-specific navigation.
  } else if (currentUser.role === "admin") {
    navItems.push({ id: "register", label: "Register Model", icon: ListPlus });
  } else {
    navItems.push({ id: "prediction", label: "Prediction", icon: ImageUp });
  }

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
              onClick={() => onNavigate(item.id)}
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
