import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { NavLink, Outlet } from "react-router";
import { Button } from "@/components/ui/button";

const themeStorageKey = "inventory-theme";

export function RootLayout() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const persisted = window.localStorage.getItem(themeStorageKey);
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldUseDark = persisted ? persisted === "dark" : prefersDark;
    document.documentElement.classList.toggle("dark", shouldUseDark);
    setIsDark(shouldUseDark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    window.localStorage.setItem(themeStorageKey, next ? "dark" : "light");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    isActive
      ? "text-primary underline underline-offset-8"
      : "text-muted-foreground hover:text-foreground";

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-6 md:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b pb-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
            Coffee Roastery
          </p>
          <h1 className="text-2xl font-semibold md:text-3xl">Inventory Control</h1>
        </div>
        <div className="flex items-center gap-4">
          <nav className="flex gap-4 text-sm font-medium">
            <NavLink to="/" end className={navClass}>
              Dashboard
            </NavLink>
            <NavLink to="/categories" className={navClass}>
              Categories
            </NavLink>
            <NavLink to="/items" className={navClass}>
              Items
            </NavLink>
          </nav>
          <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
            {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
        </div>
      </header>
      <Outlet />
    </div>
  );
}
