import { useState, useEffect } from "react";
import axios from "axios";
import { getHeroImagePath, heroes } from "../data/heroes";
import { Link, useSearchParams } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

interface Match {
  match_id: number;
  hero_id: number;
  duration: number;
  kills: number;
  deaths: number;
  assists: number;
  radiant_win: boolean;
  player_slot: number;
  start_time: number;
}

interface User {
  steamId: string;
  displayName: string;
  avatar: string;
}

const API_URL = "http://localhost:5000";

function Matches() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [user, setUser] = useState<User | null>(null);
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  
  const targetSteamId = searchParams.get("steamId");

  useEffect(() => {
    const fetchInitialData = async () => {
      setLoading(true);
      try {
        const userResponse = await axios.get(`${API_URL}/api/user`, { withCredentials: true }).catch(() => ({ data: null }));
        setUser(userResponse.data);

        const steamIdToShow = targetSteamId || userResponse.data?.steamId;

        if (steamIdToShow) {
          await fetchMatches(steamIdToShow, 1);
        } else {
          setError("Please search for a player or log in to view your matches");
          setLoading(false);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(`Error: ${message}`);
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [targetSteamId]);

  const fetchMatches = async (steamId: string, pageNum: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/matches/${steamId}`, {
        params: { page: pageNum, limit: 20 },
        withCredentials: true,
      });
      setMatches(response.data.matches);
      setTotalPages(response.data.totalPages);
      setPage(pageNum);
      setError(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to fetch matches: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    const steamId = targetSteamId || user?.steamId;
    if (steamId) fetchMatches(steamId, newPage);
  };

  const stats = matches.reduce(
    (acc, match) => {
      const isWin = (match.radiant_win && match.player_slot < 128) || (!match.radiant_win && match.player_slot >= 128);
      return {
        total: acc.total + 1,
        wins: acc.wins + (isWin ? 1 : 0),
        kills: acc.kills + match.kills,
        deaths: acc.deaths + match.deaths,
        assists: acc.assists + match.assists,
      };
    },
    { total: 0, wins: 0, kills: 0, deaths: 0, assists: 0 }
  );

  const winRate = stats.total ? ((stats.wins / stats.total) * 100).toFixed(1) : "0.0";
  const kda = stats.total ? ((stats.kills + stats.assists) / Math.max(1, stats.deaths)).toFixed(2) : "0.00";

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
        <div>
          <h1 className="text-4xl sm:text-5xl font-black heading-display bg-gradient-to-r from-purple-600 to-brand-accent dark:from-brand-primary dark:to-brand-accent bg-clip-text text-transparent mb-2">
            {targetSteamId ? t("matches.playerHistory") : t("common.yourMatches")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            {targetSteamId ? t("matches.viewingSteam", { steamId: targetSteamId }) : t("matches.trackRecent")}
          </p>
          {(targetSteamId || user?.steamId) && (
            <Link to={`/players/${targetSteamId || user?.steamId}/analytics`} className="inline-flex items-center mt-4 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline">
              {t("matches.openAnalytics")}
            </Link>
          )}
        </div>
        
        {matches.length > 0 && (
          <div className="flex gap-4">
            <div className="app-card py-3 px-6 flex flex-col items-center min-w-[120px] bg-white dark:bg-gaming-dark/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("common.winRate")}</span>
              <span className={`text-2xl font-black ${Number(winRate) >= 50 ? 'text-brand-success' : 'text-brand-danger'}`}>{winRate}%</span>
            </div>
            <div className="app-card py-3 px-6 flex flex-col items-center min-w-[120px] bg-white dark:bg-gaming-dark/60">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t("matches.avgKda")}</span>
              <span className="text-2xl font-black text-brand-primary">{kda}</span>
            </div>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
          <p className="text-brand-primary font-bold animate-pulse">{t("matches.syncing")}</p>
        </div>
      )}

      {error && (
        <div className="app-card border-brand-danger/30 bg-brand-danger/5 text-brand-danger text-center py-8">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 uppercase">{t("matches.information")}</h2>
          <p>{error}</p>
          <Link to="/search" className="app-button mt-6 inline-block">{t("matches.goToSearch")}</Link>
        </div>
      )}

      {!loading && !error && matches.length > 0 && (
        <div className="space-y-4">
          <div className="grid gap-4">
            {matches.map((match) => {
              const hero = heroes.find((h) => h.id === match.hero_id);
              const isWin = (match.radiant_win && match.player_slot < 128) || (!match.radiant_win && match.player_slot >= 128);
              
              return (
                <Link
                  key={match.match_id}
                  to={`/match/${match.match_id}?steamId=${targetSteamId || user?.steamId}`}
                  className={`app-card group flex flex-col sm:flex-row items-center gap-6 hover:scale-[1.01] transition-all border-l-4 bg-white dark:bg-gaming-dark/60 ${isWin ? 'border-l-brand-success shadow-green-500/5' : 'border-l-brand-danger shadow-red-500/5'}`}
                >
                  <div className="flex items-center gap-6 flex-grow w-full">
                    <div className="relative shrink-0">
                      <div className={`absolute -inset-1 rounded-xl blur opacity-20 group-hover:opacity-40 transition-opacity ${isWin ? 'bg-brand-success' : 'bg-brand-danger'}`}></div>
                      <img
                        src={getHeroImagePath(match.hero_id)}
                        alt={hero?.localized_name}
                        className="relative w-24 h-14 rounded-lg object-cover border border-slate-200 dark:border-white/10"
                      />
                    </div>
                    
                    <div className="flex-grow">
                      <div className="flex items-center gap-3 mb-1">
                        <span className={`text-xs font-black uppercase tracking-tighter px-2 py-0.5 rounded ${isWin ? 'bg-brand-success/10 text-brand-success' : 'bg-brand-danger/10 text-brand-danger'}`}>
                          {isWin ? t("common.victory") : t("common.defeat")}
                        </span>
                        <span className="text-slate-500 text-xs font-mono">ID: {match.match_id}</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">
                        {hero?.localized_name || "Unknown Hero"}
                      </h3>
                    </div>

                    <div className="hidden lg:grid grid-cols-3 gap-8 px-8 border-x border-slate-200 dark:border-gaming-border/20">
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">K / D / A</div>
                        <div className="font-black text-lg">
                          <span className="text-brand-success">{match.kills}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-brand-danger">{match.deaths}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-brand-info">{match.assists}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">{t("matches.duration")}</div>
                        <div className="font-bold text-lg text-slate-700 dark:text-slate-300">
                          {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, "0")}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-bold text-slate-500 uppercase mb-1">{t("matches.kdaRatio")}</div>
                        <div className="font-black text-lg text-brand-primary">
                          {((match.kills + match.assists) / Math.max(1, match.deaths)).toFixed(2)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center justify-center gap-2 shrink-0 w-full sm:w-auto">
                    <div className="app-button py-2 px-6 text-xs w-full sm:w-auto">{t("common.details").toUpperCase()}</div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* Pagination */}
          <div className="flex justify-center items-center gap-4 pt-12">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className="app-button-secondary py-2 px-6 disabled:opacity-30"
            >
              {t("common.prev").toUpperCase()}
            </button>
            <div className="flex gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1;
                return (
                  <button
                    key={p}
                    onClick={() => handlePageChange(p)}
                    className={`w-10 h-10 rounded-xl font-bold transition-all ${p === page ? 'bg-brand-primary text-white shadow-neon-purple' : 'bg-slate-200 dark:bg-gaming-muted/30 text-slate-500 dark:text-slate-400 hover:bg-brand-primary/20'}`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className="app-button-secondary py-2 px-6 disabled:opacity-30"
            >
              {t("common.next").toUpperCase()}
            </button>
          </div>
        </div>
      )}

      {!loading && !error && matches.length === 0 && (
        <div className="app-card text-center py-20 border-dashed border-slate-200 dark:border-gaming-border/20 bg-white dark:bg-gaming-dark/60">
          <div className="text-6xl mb-6 opacity-20">⚔️</div>
          <h2 className="text-2xl font-bold text-slate-700 dark:text-slate-300 mb-2">{t("matches.noBattles")}</h2>
          <p className="text-slate-500">{t("matches.noBattlesText")}</p>
          <Link to="/search" className="app-button mt-8 inline-block">{t("dashboard.searchPlayers").toUpperCase()}</Link>
        </div>
      )}
    </div>
  );
}

export default Matches;
