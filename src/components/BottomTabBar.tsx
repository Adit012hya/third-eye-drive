import { NavLink } from "react-router-dom";

const tabs = [
  { to: "/home", label: "Home" },
  { to: "/record", label: "Record" },
  { to: "/archive", label: "Archive" },
  { to: "/analytics", label: "Analytics" },
  { to: "/settings", label: "Settings" },
];

export default function BottomTabBar() {
  return (
    <div className="border-t border-border bg-background/90 backdrop-blur z-20 shrink-0">
      <div className="px-2 py-2 flex justify-between h-16 items-center">
        {tabs.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            className={({ isActive }) =>
              `flex-1 text-center py-2 rounded-lg font-mono text-[11px] tracking-wider uppercase transition-colors ${
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground"
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </div>
    </div>
  );
}

