import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { User, Shield, Trophy, ExternalLink, LogIn, LogOut, Activity, Hash, Clock, ChevronRight } from "lucide-react";
import { getHeroImagePath, heroes } from "../data/heroes";
import { useLanguage } from "../i18n/LanguageContext";

interface UserProfile {
  steamId: string;
  displayName: string;
  avatar: string;
  rankTier?: number;
  leaderboard_rank?: number;
}

interface RecentMatch {
  match_id: number;
  player_slot: number;
  radiant_win: boolean;
  duration: number;
  hero_id: number;
  start_time: number;
  kills: number;
  deaths: number;
  assists: number;
}

const API_URL = "http://localhost:5000";

function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<RecentMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    const fetchUserAndMatches = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/api/user`, { withCredentials: true });
        const currentUser = res.data;
        
        if (currentUser && currentUser.steamId) {
          setUser(currentUser);
          const accountId = (
            BigInt(currentUser.steamId) - BigInt("76561197960265728")
          ).toString();
          
          try {
            const rankRes = await axios.get(`https://api.opendota.com/api/players/${accountId}`);
            if (rankRes.data) {
              setUser((prev) =>
                prev ? { 
                  ...prev, 
                  rankTier: rankRes.data.rank_tier,
                  leaderboard_rank: rankRes.data.leaderboard_rank
                } : prev
              );
            }
          } catch (err) {
            console.error("Error fetching rank:", err);
          }

          setMatchesLoading(true);
          try {
            const matchesRes = await axios.get(`${API_URL}/api/matches/${currentUser.steamId}`, {
              params: { limit: 5, page: 1 }
            });
            if (matchesRes.data && matchesRes.data.matches) {
              setMatches(matchesRes.data.matches);
            }
          } catch (err) {
            console.error("Error fetching recent matches:", err);
          } finally {
            setMatchesLoading(false);
          }
        }
      } catch (err) {
        console.error("Error fetching user:", err);
        setError("Failed to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndMatches();
  }, []);

  const getRankInfo = (rankTier: number | undefined) => {
    if (!rankTier) return { name: "Unranked", color: "text-slate-400", bg: "bg-slate-500/10" };
    
    const tier = Math.floor(rankTier / 10);
    const subTier = rankTier % 10;
    const ranks = [
      { name: "Herald", color: "text-gray-400", bg: "bg-gray-500/10" },
      { name: "Guardian", color: "text-amber-700", bg: "bg-amber-700/10" },
      { name: "Crusader", color: "text-teal-500", bg: "bg-teal-500/10" },
      { name: "Archon", color: "text-yellow-500", bg: "bg-yellow-500/10" },
      { name: "Legend", color: "text-indigo-400", bg: "bg-indigo-400/10" },
      { name: "Ancient", color: "text-purple-400", bg: "bg-purple-400/10" },
      { name: "Divine", color: "text-brand-primary", bg: "bg-brand-primary/10" },
      { name: "Immortal", color: "text-brand-accent", bg: "bg-brand-accent/10" },
    ];
    
    const rank = ranks[tier - 1] || { name: "Unknown", color: "text-slate-400", bg: "bg-slate-500/10" };
    return { 
      name: `${rank.name} ${subTier > 0 ? subTier : ""}`, 
      color: rank.color, 
      bg: rank.bg 
    };
  };

  const getHeroUrl = (id: number) => {
    return getHeroImagePath(id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gaming-black">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
        <p className="text-brand-primary font-black heading-display animate-pulse uppercase tracking-widest">{t("profile.syncing")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gaming-black p-4">
        <div className="app-card max-w-md w-full text-center border-brand-primary/20 bg-white dark:bg-gaming-dark/60">
          <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <LogIn className="w-10 h-10 text-brand-primary" />
          </div>
          <h1 className="text-3xl font-black heading-display text-slate-900 dark:text-white mb-4 uppercase italic">
            {t("profile.accessDenied")}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">
            {t("profile.signInText")}
          </p>
          <a 
            href={`${API_URL}/auth/steam`} 
            className="app-button w-full flex items-center justify-center gap-3 py-4 text-lg group"
          >
            {t("profile.loginSteam").toUpperCase()} <ExternalLink size={20} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    );
  }

  const rankInfo = getRankInfo(user.rankTier);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="app-card mb-8 relative overflow-hidden border-b-4 border-b-brand-primary bg-white dark:bg-gaming-dark/60">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <User className="w-48 h-48 text-slate-900 dark:text-white" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-brand-accent rounded-2xl blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
            <img
              src={user.avatar || "https://via.placeholder.com/128"}
              alt={user.displayName}
              className="relative w-32 h-32 rounded-2xl border-2 border-white dark:border-gaming-border/40 object-cover shadow-2xl"
            />
            {user.leaderboard_rank && (
              <div className="absolute -top-3 -right-3 bg-brand-accent text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-neon-rose border border-white/20 uppercase tracking-tighter">
                Rank #{user.leaderboard_rank}
              </div>
            )}
          </div>
          
          <div className="flex-grow text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-2">
              <h1 className="text-4xl font-black heading-display text-slate-900 dark:text-white uppercase italic tracking-tight">
                {user.displayName}
              </h1>
              <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${rankInfo.bg} ${rankInfo.color} border-current/20`}>
                <Shield size={12} />
                {rankInfo.name}
              </div>
            </div>
            
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-slate-500 dark:text-slate-400 font-mono text-xs uppercase tracking-widest">
              <div className="flex items-center gap-1.5"><Hash size={14} className="text-brand-primary" /> ID: {user.steamId}</div>
              <div className="flex items-center gap-1.5"><Activity size={14} className="text-brand-success" /> {t("profile.statusOnline")}</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <button 
              onClick={() => navigate(`/players/${user.steamId}/analytics`)}
              className="app-button-secondary flex items-center justify-center gap-2 px-8 border-brand-primary/30 text-brand-primary hover:bg-brand-primary/10"
            >
              <Activity size={18} /> {t("common.analytics").toUpperCase()}
            </button>
            <button 
              onClick={() => window.location.reload()}
              className="app-button flex items-center justify-center gap-2 px-8"
            >
              {t("common.refresh").toUpperCase()}
            </button>
            <a 
              href={`${API_URL}/api/logout`}
              className="app-button-secondary flex items-center justify-center gap-2 px-8 border-slate-200 dark:border-gaming-border/40 text-slate-600 dark:text-slate-400 hover:bg-brand-danger/10 hover:text-brand-danger hover:border-brand-danger/30"
            >
              <LogOut size={18} /> {t("common.logout").toUpperCase()}
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="app-card bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-primary">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-primary/10 rounded-lg">
              <Trophy className="text-brand-primary" size={20} />
            </div>
            <h3 className="font-black heading-display text-sm text-slate-900 dark:text-white uppercase tracking-widest">{t("common.winRate")}</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">54.2%</div>
          <div className="w-full bg-slate-100 dark:bg-gaming-muted/30 h-2 rounded-full overflow-hidden">
            <div className="bg-brand-primary h-full shadow-neon-purple" style={{ width: '54.2%' }}></div>
          </div>
        </div>

        <div className="app-card bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-success">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-success/10 rounded-lg">
              <Activity className="text-brand-success" size={20} />
            </div>
            <h3 className="font-black heading-display text-sm text-slate-900 dark:text-white uppercase tracking-widest">KDA Ratio</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">3.84</div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top 15% of players</p>
        </div>

        <div className="app-card bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-accent">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-brand-accent/10 rounded-lg">
              <Clock className="text-brand-accent" size={20} />
            </div>
            <h3 className="font-black heading-display text-sm text-slate-900 dark:text-white uppercase tracking-widest">{t("profile.playTime")}</h3>
          </div>
          <div className="text-3xl font-black text-slate-900 dark:text-white mb-1">2,450h</div>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{t("profile.since")}</p>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-3 h-8 bg-brand-primary rounded-full shadow-neon-purple"></div>
            <h2 className="text-2xl font-black heading-display text-slate-900 dark:text-white uppercase italic">{t("profile.recentMatches")}</h2>
          </div>
          <Link to={`/matches?steamId=${user.steamId}`} className="text-[10px] font-black text-brand-primary uppercase tracking-widest hover:underline flex items-center gap-1">
            {t("profile.viewAllHistory")} <ChevronRight size={14} />
          </Link>
        </div>

        {matchesLoading ? (
          <div className="app-card py-12 flex flex-col items-center justify-center bg-white dark:bg-gaming-dark/60">
            <div className="w-10 h-10 border-2 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{t("profile.retrievingHistory")}</p>
          </div>
        ) : matches.length > 0 ? (
          <div className="space-y-4">
            {matches.map((match) => {
              const isWin = (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win);
              return (
                <Link 
                  key={match.match_id} 
                  to={`/match/${match.match_id}`}
                  className="app-card group p-4 flex items-center justify-between bg-white dark:bg-gaming-dark/60 hover:scale-[1.01] transition-all border-l-4 border-l-transparent hover:border-l-brand-primary"
                >
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <img 
                        src={getHeroUrl(match.hero_id)} 
                        className="w-16 h-9 rounded border border-slate-200 dark:border-white/10 object-cover shadow-sm group-hover:scale-105 transition-transform" 
                        alt="hero" 
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className={`text-xs font-black uppercase tracking-widest ${isWin ? 'text-brand-success' : 'text-brand-danger'}`}>
                        {isWin ? t("common.victory") : t("common.defeat")}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
                        {heroes.find(h => h.id === match.hero_id)?.localized_name}
                      </span>
                    </div>
                  </div>

                  <div className="hidden sm:flex flex-col items-center px-8 border-x border-slate-100 dark:border-gaming-border/10">
                    <div className="flex items-center gap-1 font-black text-sm">
                      <span className="text-brand-success">{match.kills}</span>
                      <span className="text-slate-300 dark:text-slate-700">/</span>
                      <span className="text-brand-danger">{match.deaths}</span>
                      <span className="text-slate-300 dark:text-slate-700">/</span>
                      <span className="text-brand-info">{match.assists}</span>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">K / D / A</span>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                      {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, "0")}
                    </span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                      {new Date(match.start_time * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="app-card py-12 text-center bg-white dark:bg-gaming-dark/60 border-dashed border-2 border-slate-200 dark:border-gaming-border/20">
            <p className="text-slate-500 text-sm font-black uppercase tracking-widest">{t("profile.noRecentMatches")}</p>
          </div>
        )}
      </div>

      <div className="app-card bg-white dark:bg-gaming-dark/60 border-dashed border-2 border-slate-200 dark:border-gaming-border/20">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-slate-100 dark:bg-gaming-muted/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity className="text-slate-400" size={32} />
          </div>
          <h3 className="text-xl font-black heading-display text-slate-900 dark:text-white uppercase italic mb-2">{t("profile.advancedAnalytics")}</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto text-sm">
            {t("profile.advancedAnalyticsText")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default Profile;
