import {useState} from "react";
import {Link, Outlet, useLocation, useNavigate} from "react-router-dom";
import {useAuth} from "../hooks/use-auth";
import {Button} from "../components/ui/button";
import {
  LayoutDashboard,
  Database,
  Settings,
  Users,
  BookOpen,
  LogOut,
  Menu,
  X,
  Moon,
  Sun,
} from "lucide-react";

const navItems = [
  {to: "/dashboard", label: "Dashboard", icon: LayoutDashboard},
  {to: "/sessions", label: "Sessions", icon: Database},
  {to: "/settings", label: "Settings", icon: Settings},
];

export default function RootLayout() {
  const {user, logout} = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem("theme") === "dark");

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  // Apply theme on mount
  useState(() => {
    if (dark) document.documentElement.classList.add("dark");
  });

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r transform transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 border-b flex items-center justify-between">
            <Link to="/dashboard" className="text-xl font-bold">
              OBD2Free
            </Link>
            <button className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive(item.to)
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                to="/admin"
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                  isActive("/admin")
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Users className="h-4 w-4" />
                Admin
              </Link>
            )}
            <Link
              to="/docs"
              className="flex items-center gap-3 px-3 py-2 rounded-md text-sm hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Docs
            </Link>
          </nav>

          <div className="p-4 border-t space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <p className="font-medium">{user?.display_name || user?.email}</p>
                <p className="text-muted-foreground text-xs capitalize">{user?.premium_level}</p>
              </div>
              <button
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-accent transition-colors"
                title={dark ? "Light Mode" : "Dark Mode"}
              >
                {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>
            </div>
            <Button variant="ghost" size="sm" className="w-full justify-start gap-3" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 bg-background border-b px-4 h-14 flex items-center lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <span className="ml-3 font-semibold">OBD2Free</span>
        </header>
        <div className="p-4 md:p-6 lg:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
