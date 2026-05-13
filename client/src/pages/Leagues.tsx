import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Trophy, Info } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface League {
  leagueid: number;
  name: string;
  tier: string;
  banner?: string;
}

function Leagues() {
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLeagues, setTotalLeagues] = useState(0);
  const { t } = useLanguage();

  const fetchLeagues = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://localhost:5000/api/leagues", {
        params: {
          page: currentPage,
          limit: 21,
          search: searchTerm
        }
      });
      setLeagues(response.data.leagues);
      setTotalPages(response.data.totalPages);
      setTotalLeagues(response.data.totalLeagues);
      setError("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch leagues");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      setCurrentPage(1);
      fetchLeagues();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  useEffect(() => {
    fetchLeagues();
  }, [currentPage]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Section */}
      <div className="text-center mb-12 relative">
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 text-9xl font-black text-slate-500/5 select-none italic uppercase tracking-tighter hidden md:block">
          {t("leagues.background")}
        </div>
        <h1 className="text-4xl sm:text-6xl font-black heading-display mb-4 bg-gradient-to-r from-purple-600 to-brand-accent dark:from-brand-primary dark:to-brand-accent bg-clip-text text-transparent uppercase italic">
          {t("leagues.title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto">
          {t("leagues.subtitle")}
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-10 max-w-2xl mx-auto">
        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
          </div>
          <input
            type="text"
            placeholder={t("leagues.searchPlaceholder")}
            className="app-input pl-12 py-4 text-lg w-full focus:ring-2 focus:ring-brand-accent/50 transition-all bg-white dark:bg-gaming-dark/60"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && !loading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {totalLeagues} {t("common.found").toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="min-h-[400px] flex flex-col items-center justify-center">
          <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
          <p className="text-brand-primary font-bold animate-pulse uppercase tracking-widest">{t("leagues.loading")}</p>
        </div>
      ) : error ? (
        <div className="min-h-[400px] flex items-center justify-center p-4">
          <div className="app-card max-w-md text-center border-brand-danger/30 bg-white dark:bg-gaming-dark/60">
            <div className="text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-brand-danger mb-2 uppercase">{t("leagues.syncError")}</h2>
            <p className="text-slate-500">{error}</p>
            <button onClick={fetchLeagues} className="app-button mt-6">{t("common.retry")}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {leagues.map((league) => (
              <Link 
                to={`/leagues/${league.leagueid}`} 
                key={league.leagueid} 
                className="app-card group bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-primary hover:scale-[1.02] transition-all duration-300 block relative overflow-hidden"
              >
                <div className="flex flex-col h-full relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      league.tier === 'premium' 
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                        : 'bg-brand-primary/10 text-brand-primary border border-brand-primary/20'
                    }`}>
                      {league.tier}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {league.leagueid}</span>
                  </div>
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-lg ${league.tier === 'premium' ? 'bg-amber-500/5' : 'bg-brand-primary/5'} group-hover:scale-110 transition-transform`}>
                      <Trophy className={`h-6 w-6 ${league.tier === 'premium' ? 'text-amber-500' : 'text-brand-primary'}`} />
                    </div>
                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-brand-primary transition-colors line-clamp-2">
                      {league.name}
                    </h2>
                  </div>

                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-gaming-border/10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${league.tier === 'premium' ? 'bg-amber-500' : 'bg-brand-primary'}`}></div>
                      <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">{t("common.activeRecent")}</span>
                    </div>
                    <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest group-hover:underline">
                      {t("common.viewDetails")}
                    </span>
                  </div>
                </div>
                {/* Subtle background glow */}
                <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-brand-primary/5 rounded-full blur-3xl group-hover:bg-brand-primary/10 transition-all duration-500"></div>
              </Link>
            ))}
          </div>

          {leagues.length === 0 && (
            <div className="text-center py-20 app-card bg-slate-500/5 border-dashed border-2 border-slate-200 dark:border-slate-800">
              <Info className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-500 text-xl font-bold uppercase tracking-tight">{t("leagues.noTournaments")}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex items-center justify-center gap-4">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="app-button p-3 disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gaming-dark/60"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
              
              <div className="flex items-center gap-3">
                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t("common.page")}</span>
                <div className="bg-brand-primary text-white px-5 py-2 rounded-lg font-black shadow-neon-purple text-lg">
                  {currentPage}
                </div>
                <span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">{t("leagues.of", { count: totalPages })}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="app-button p-3 disabled:opacity-30 disabled:cursor-not-allowed bg-white dark:bg-gaming-dark/60"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Leagues;
