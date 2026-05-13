import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
  Navigate,
  useLocation,
} from "react-router-dom";
import axios from "axios";
import Profile from "./pages/Profile";
import Matches from "./pages/Matches";
import Search from "./pages/Search";
import Heroes from "./pages/Heroes";
import MatchDetails from "./pages/MatchDetails";
import ProTeams from "./pages/ProTeams";
import HeroMatchups from "./pages/HeroMatchups";
import Leagues from "./pages/Leagues";
import LeagueDetails from "./pages/LeagueDetails";
import Dashboard from "./pages/Dashboard";
import PlayerAnalytics from "./pages/PlayerAnalytics";
import { LanguageProvider, useLanguage } from "./i18n/LanguageContext";

interface User {
  steamId: string;
  displayName: string;
  avatar: string;
}

const API_URL = "http://localhost:5000";

function ProtectedRoute({ children }: { children: JSX.Element }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios
      .get(`${API_URL}/api/user`, { withCredentials: true })
      .then((res) => {
        setUser(res.data || null);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="min-h-screen bg-white dark:bg-[#0F0F23] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500"></div></div>;
  return user ? children : <Navigate to="/" replace />;
}

function MainApp() {
  const [user, setUser] = useState<User | null>(null);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");
  const navigate = useNavigate();
  const location = useLocation();
  const { language, toggleLanguage, t } = useLanguage();

  useEffect(() => {
    axios.get(`${API_URL}/api/user`, { withCredentials: true })
      .then((res) => setUser(res.data || null))
      .catch(() => setUser(null));
    
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
      document.body.style.backgroundColor = "#0F0F23";
    } else {
      document.documentElement.classList.remove("dark");
      document.body.style.backgroundColor = "#f8fafc";
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === "dark" ? "light" : "dark");
  };

  const navItems = [
    { label: t("nav.dashboard"), path: "/dashboard" },
    { label: t("nav.search"), path: "/search" },
    { label: t("nav.heroes"), path: "/heroes" },
    { label: t("nav.proTeams"), path: "/pro-teams" },
    { label: t("nav.tournaments"), path: "/leagues" },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0F0F23] text-slate-900 dark:text-white font-sans selection:bg-purple-500/30 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-[#0F0F23]/80 backdrop-blur-2xl border-b border-slate-200 dark:border-purple-500/20">
        <nav className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link to="/" className="text-3xl font-black tracking-tighter bg-gradient-to-r from-purple-600 to-pink-500 dark:from-purple-400 dark:to-pink-500 bg-clip-text text-transparent hover:scale-105 transition-transform">
              DOTAW
            </Link>
            <div className="hidden md:flex gap-6">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-bold tracking-widest hover:text-purple-500 transition-colors ${location.pathname.startsWith(item.path) ? "text-purple-600 dark:text-purple-500" : "text-slate-500 dark:text-gray-400"}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors text-xl"
              title="Toggle Theme"
            >
              {theme === "dark" ? "🌙" : "☀️"}
            </button>
            <button
              onClick={toggleLanguage}
              className="h-10 px-3 rounded-xl bg-slate-200 dark:bg-white/5 hover:bg-slate-300 dark:hover:bg-white/10 transition-colors text-xs font-black tracking-widest text-slate-700 dark:text-slate-200"
              title="Toggle Language"
            >
              {language === "en" ? "RU" : "EN"}
            </button>

	            {user ? (
	              <Link to="/profile" className="flex items-center gap-4 hover:opacity-80 transition-all group">
	                <img src={user.avatar} className="w-10 h-10 rounded-full border-2 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)] group-hover:shadow-purple-500/60 transition-all" alt="avatar" />
	                <span className="font-bold text-sm hidden sm:block group-hover:text-purple-500 transition-colors">{user.displayName}</span>
	              </Link>
	            ) : (
              <a href={`${API_URL}/auth/steam`} className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2.5 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(168,85,247,0.3)] transition-all active:scale-95">
                {t("common.login").toUpperCase()}
              </a>
            )}
          </div>
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={
            <div className="relative min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden px-6">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-[120px] animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px] animate-pulse delay-700"></div>
              
              <div className="relative z-10 text-center max-w-4xl">
                <h1 className="text-6xl sm:text-8xl font-black mb-8 leading-none tracking-tight text-slate-900 dark:text-white">
                  {t("home.titleTop").toUpperCase()} <br />
                  <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-red-500 dark:from-purple-400 dark:via-pink-500 dark:to-red-500 bg-clip-text text-transparent">{t("home.titleAccent").toUpperCase()}</span>
                </h1>
                <p className="text-xl text-slate-600 dark:text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                  {t("home.subtitle")}
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <button onClick={() => navigate("/search")} className="bg-slate-900 dark:bg-white text-white dark:text-black px-12 py-4 rounded-2xl font-black text-lg hover:bg-purple-600 dark:hover:bg-purple-500 hover:text-white transition-all shadow-2xl hover:shadow-purple-500/40 active:scale-95">
                    {t("home.startTracking").toUpperCase()}
                  </button>
                  <button onClick={() => navigate("/leagues")} className="bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-md px-12 py-4 rounded-2xl font-black text-lg hover:bg-slate-300 dark:hover:bg-white/10 transition-all active:scale-95 text-slate-900 dark:text-white">
                    {t("home.viewTournaments").toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          } />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/players/:steamId/analytics" element={<PlayerAnalytics />} />
          <Route path="/search" element={<Search />} />
          <Route path="/heroes" element={<Heroes />} />
          <Route path="/match/:matchId" element={<MatchDetails />} />
          <Route path="/pro-teams" element={<ProTeams />} />
          <Route path="/leagues" element={<Leagues />} />
          <Route path="/leagues/:leagueId" element={<LeagueDetails />} />
          <Route path="/heroes/:heroId/matchups" element={<HeroMatchups />} />
        </Routes>
      </main>

      <footer className="py-20 border-t border-slate-200 dark:border-white/5 text-center">
        <p className="text-slate-400 dark:text-gray-600 text-sm font-bold tracking-widest uppercase">© 2026 DOTAW TRACKER • POWERED BY OPENDOTA API</p>
      </footer>
    </div>
  );
}

function App() {
  return (
    <LanguageProvider>
      <BrowserRouter>
        <MainApp />
      </BrowserRouter>
    </LanguageProvider>
  );
}

export default App;
