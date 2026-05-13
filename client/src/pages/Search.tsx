import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

interface Player {
  steamId: string;
  displayName: string;
  avatar: string;
  rankTier?: number;
}

const API_URL = "http://localhost:5000";

const Search = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Player[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();

  const convertSteamIdToAccountId = (steamId: string): string => {
    const STEAM_ID_BASE = BigInt("76561197960265728");
    try {
      return (BigInt(steamId) - STEAM_ID_BASE).toString();
    } catch {
      return "";
    }
  };

  const isValidSteamId = (id: string): boolean => /^(7656119[0-9]{10})$/.test(id);
  const isValidAccountId = (id: string): boolean => /^\d+$/.test(id) && Number(id) > 0;

  const handleSearch = async (e?: React.FormEvent, searchId?: string) => {
    if (e) e.preventDefault();
    const idToSearch = searchId || query.trim();
    if (!idToSearch) return;

    setLoading(true);
    setError(null);
    try {
      let accountId = idToSearch;
      if (isValidSteamId(idToSearch)) {
        accountId = convertSteamIdToAccountId(idToSearch);
      } else if (!isValidAccountId(idToSearch)) {
        throw new Error(t("search.invalidId"));
      }

      const response = await axios.get(`${API_URL}/api/search`, {
        params: { query: accountId },
      });
      
      const data = response.data;
      if (Array.isArray(data)) {
        setResults(data);
      } else {
        setResults([]);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.error || err.message || t("search.notFound"));
      } else {
        setError(err instanceof Error ? err.message : t("search.notFound"));
      }
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const steamId = searchParams.get("steamId");
    if (steamId) {
      handleSearch(undefined, steamId);
    }
  }, [searchParams]);

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 sm:py-20">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-6xl font-black heading-display mb-6 bg-gradient-to-r from-purple-600 via-pink-500 to-brand-accent dark:from-brand-primary dark:via-brand-secondary dark:to-brand-accent bg-clip-text text-transparent">
          {t("search.title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          {t("search.subtitle")}
        </p>
      </div>

      <div className="relative group mb-12 max-w-3xl mx-auto">
        <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-2xl blur opacity-20 group-focus-within:opacity-40 transition duration-1000"></div>
        <form onSubmit={handleSearch} className="relative flex flex-col sm:flex-row gap-3">
          <div className="relative flex-grow">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("search.placeholder")}
              className="app-input w-full text-lg py-4 px-6 bg-white/80 dark:bg-gaming-dark/80 backdrop-blur-xl border-2 border-slate-200 dark:border-transparent focus:border-brand-primary/50 text-slate-900 dark:text-white"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-brand-primary transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={loading}
            className="app-button px-10 text-lg flex items-center justify-center min-w-[160px] h-[60px] sm:h-auto"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              t("common.search").toUpperCase()
            )}
          </button>
        </form>
      </div>

      {error && (
        <div className="app-card max-w-3xl mx-auto border-brand-danger/30 bg-brand-danger/5 text-brand-danger text-center py-4 mb-8 animate-in fade-in slide-in-from-top-2">
          <span className="font-bold uppercase tracking-widest mr-2">{t("common.error")}:</span> {error}
        </div>
      )}

      <div className="grid gap-6 max-w-3xl mx-auto">
        {results.map((player, index) => (
          <div
            key={player.steamId}
            onClick={() => navigate(`/players/${player.steamId}/analytics`)}
            className="app-card group cursor-pointer flex items-center justify-between hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 bg-white dark:bg-gaming-dark/60"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-1 bg-brand-primary rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity"></div>
                <img
                  src={player.avatar || "https://via.placeholder.com/80"}
                  alt={player.displayName}
                  className="relative w-20 h-20 rounded-2xl border-2 border-slate-200 dark:border-gaming-border/30 group-hover:border-brand-primary transition-colors object-cover shadow-lg"
                />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                  {player.displayName}
                </h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs font-mono bg-slate-100 dark:bg-gaming-muted/50 px-2 py-1 rounded text-slate-500 dark:text-slate-400">
                    ID: {player.steamId}
                  </span>
                </div>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3 text-brand-primary font-bold tracking-widest text-sm opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
              {t("search.analyze").toUpperCase()}
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && !loading && !error && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mt-20 max-w-4xl mx-auto">
          {[
            { label: t("search.globalSearch"), icon: "GS", desc: t("search.globalSearchDesc") },
            { label: t("search.matchHistory"), icon: "MH", desc: t("search.matchHistoryDesc") },
            { label: t("search.mmrTracking"), icon: "MMR", desc: t("search.mmrTrackingDesc") },
          ].map((feat) => (
            <div key={feat.label} className="app-card text-center py-10 bg-white dark:bg-gaming-muted/10 border-dashed border-slate-200 dark:border-gaming-border/20 hover:border-brand-primary/40 transition-colors">
              <div className="text-5xl mb-4 grayscale group-hover:grayscale-0 transition-all">{feat.icon}</div>
              <div className="font-bold text-lg text-slate-800 dark:text-slate-200 mb-2">{feat.label}</div>
              <div className="text-sm text-slate-500">{feat.desc}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
