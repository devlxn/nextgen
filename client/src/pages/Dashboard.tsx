import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Clock,
  Crosshair,
  Flame,
  Search,
  Shield,
  Sparkles,
  Swords,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import { getHeroImagePath, heroes } from "../data/heroes";
import { useLanguage } from "../i18n/LanguageContext";

interface UserProfile {
  steamId: string;
  displayName: string;
  avatar: string;
}

interface MatchSummary {
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

const API_URL = "http://localhost:5000";

const getHeroName = (heroId: number) => {
  return heroes.find((hero) => hero.id === heroId)?.localized_name || "Unknown Hero";
};

const getHeroImage = (heroId: number) => {
  return getHeroImagePath(heroId);
};

const didPlayerWin = (match: MatchSummary) => {
  return (match.player_slot < 128 && match.radiant_win) || (match.player_slot >= 128 && !match.radiant_win);
};

function Dashboard() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const userResponse = await axios.get(`${API_URL}/api/user`, { withCredentials: true });
        const currentUser = userResponse.data || null;
        setUser(currentUser);

        if (currentUser?.steamId) {
          setMatchesLoading(true);
          try {
            const matchesResponse = await axios.get(`${API_URL}/api/matches/${currentUser.steamId}`, {
              params: { page: 1, limit: 8 },
              withCredentials: true,
            });
            setMatches(matchesResponse.data?.matches || []);
          } catch (matchError) {
            console.error("Dashboard matches fetch failed:", matchError);
            setMatches([]);
          } finally {
            setMatchesLoading(false);
          }
        }
      } catch (dashboardError) {
        console.error("Dashboard user fetch failed:", dashboardError);
        setError("Live profile data is unavailable. Explore public tools or start by searching a player.");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const stats = useMemo(() => {
    const totals = matches.reduce(
      (acc, match) => {
        const isWin = didPlayerWin(match);
        return {
          games: acc.games + 1,
          wins: acc.wins + (isWin ? 1 : 0),
          kills: acc.kills + match.kills,
          deaths: acc.deaths + match.deaths,
          assists: acc.assists + match.assists,
          minutes: acc.minutes + Math.floor(match.duration / 60),
        };
      },
      { games: 0, wins: 0, kills: 0, deaths: 0, assists: 0, minutes: 0 }
    );

    return {
      winRate: totals.games ? Math.round((totals.wins / totals.games) * 100) : 0,
      kda: totals.games ? ((totals.kills + totals.assists) / Math.max(1, totals.deaths)).toFixed(2) : "0.00",
      games: totals.games,
      wins: totals.wins,
      minutes: totals.minutes,
    };
  }, [matches]);

  const featuredHero = matches[0]?.hero_id;
  const recentMatches = matches.slice(0, 4);

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.8fr)] items-stretch">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-white dark:bg-gaming-dark/60 p-6 sm:p-8 shadow-minimal dark:shadow-glass">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-brand-primary via-brand-accent to-brand-success" />
            <div className="relative z-10 flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-brand-primary mb-3">
                    {t("dashboard.commandCenter")}
                  </p>
                  <h1 className="text-4xl sm:text-6xl font-black heading-display text-slate-950 dark:text-white uppercase italic leading-tight">
                    {t("dashboard.title")}
                  </h1>
                  <p className="mt-4 max-w-2xl text-slate-600 dark:text-slate-400 text-base sm:text-lg">
                    {t("dashboard.subtitle")}
                  </p>
                </div>

                {user ? (
                  <Link to="/profile" className="flex items-center gap-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 hover:border-brand-primary/40 transition-colors">
                    <img src={user.avatar} alt={user.displayName} className="w-14 h-14 rounded-xl object-cover border border-brand-primary/30" />
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("dashboard.signedIn")}</p>
                      <p className="font-black text-slate-900 dark:text-white max-w-[180px] truncate">{user.displayName}</p>
                    </div>
                  </Link>
                ) : (
                  <a href={`${API_URL}/auth/steam`} className="app-button inline-flex items-center justify-center gap-2 self-start">
                    <UserRound size={18} />
                    {t("common.login").toUpperCase()}
                  </a>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("dashboard.recentWinrate")}</span>
                    <Trophy size={18} className="text-brand-success" />
                  </div>
                  <div className="text-3xl font-black text-slate-950 dark:text-white">{stats.winRate}%</div>
                  <div className="mt-3 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-success" style={{ width: `${stats.winRate}%` }} />
                  </div>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("dashboard.kdaTrend")}</span>
                    <Crosshair size={18} className="text-brand-primary" />
                  </div>
                  <div className="text-3xl font-black text-slate-950 dark:text-white">{stats.kda}</div>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("dashboard.acrossGames", { count: stats.games || 0 })}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/30 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("dashboard.timeReviewed")}</span>
                    <Clock size={18} className="text-brand-accent" />
                  </div>
                  <div className="text-3xl font-black text-slate-950 dark:text-white">{stats.minutes}m</div>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    {t("dashboard.latestSample")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 dark:border-purple-500/20 bg-slate-950 text-white min-h-[360px]">
            {featuredHero ? (
              <img src={getHeroImage(featuredHero)} alt={getHeroName(featuredHero)} className="absolute inset-0 w-full h-full object-cover opacity-55" />
            ) : (
              <img src="/images/nevermore_full.png" alt="Shadow Fiend" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            <div className="relative z-10 h-full flex flex-col justify-end p-6">
              <div className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-secondary mb-3">
                <Sparkles size={14} />
                {t("dashboard.focusPick")}
              </div>
              <h2 className="text-3xl font-black heading-display uppercase italic mb-3">
                {featuredHero ? getHeroName(featuredHero) : t("dashboard.buildYourRead")}
              </h2>
              <p className="text-sm text-slate-300 max-w-sm mb-5">
                {t("dashboard.focusText")}
              </p>
              <Link to={featuredHero ? `/heroes/${featuredHero}/matchups` : "/heroes"} className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white hover:text-brand-secondary transition-colors">
                {t("dashboard.openHeroLab")} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-xl border border-brand-warning/30 bg-brand-warning/10 px-4 py-3 text-sm font-semibold text-amber-700 dark:text-amber-300">
            {error}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <div className="app-card bg-white dark:bg-gaming-dark/60">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("dashboard.nextActions")}</p>
                <h2 className="text-2xl font-black heading-display uppercase italic text-slate-950 dark:text-white">{t("dashboard.launchpad")}</h2>
              </div>
              <Target className="text-brand-accent" size={26} />
            </div>

            <div className="grid gap-3">
              {[
                { title: t("dashboard.findPlayer"), desc: t("dashboard.findPlayerDesc"), to: "/search", icon: Search },
                { title: t("dashboard.playerAnalytics"), desc: t("dashboard.playerAnalyticsDesc"), to: user ? `/players/${user.steamId}/analytics` : "/search", icon: Activity },
                { title: t("dashboard.reviewMatches"), desc: t("dashboard.reviewMatchesDesc"), to: user ? `/matches?steamId=${user.steamId}` : "/matches", icon: BarChart3 },
                { title: t("dashboard.studyHeroes"), desc: t("dashboard.studyHeroesDesc"), to: "/heroes", icon: Swords },
                { title: t("dashboard.trackTournaments"), desc: t("dashboard.trackTournamentsDesc"), to: "/leagues", icon: Shield },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.title} to={item.to} className="group flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-4 hover:border-brand-primary/50 hover:bg-brand-primary/5 transition-colors">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-brand-primary border border-slate-200 dark:border-white/10">
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{item.desc}</p>
                      </div>
                    </div>
                    <ArrowRight size={18} className="text-slate-400 group-hover:text-brand-primary group-hover:translate-x-1 transition-all shrink-0" />
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="app-card bg-white dark:bg-gaming-dark/60">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("dashboard.latestSample")}</p>
                <h2 className="text-2xl font-black heading-display uppercase italic text-slate-950 dark:text-white">{t("dashboard.recentMatches")}</h2>
              </div>
              <Link to={user ? `/matches?steamId=${user.steamId}` : "/search"} className="text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline">
                {t("dashboard.viewAll")}
              </Link>
            </div>

            {loading || matchesLoading ? (
              <div className="py-16 flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("dashboard.loadingData")}</p>
              </div>
            ) : recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => {
                  const isWin = didPlayerWin(match);
                  return (
                    <Link key={match.match_id} to={`/match/${match.match_id}${user ? `?steamId=${user.steamId}` : ""}`} className="group grid grid-cols-[88px_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-3 hover:border-brand-primary/50 transition-colors">
                      <img src={getHeroImage(match.hero_id)} alt={getHeroName(match.hero_id)} className="w-24 h-12 rounded-lg object-cover border border-slate-200 dark:border-white/10" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isWin ? "text-brand-success" : "text-brand-danger"}`}>
                            {isWin ? t("common.victory") : t("common.defeat")}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">#{match.match_id}</span>
                        </div>
                        <h3 className="font-black text-slate-900 dark:text-white truncate group-hover:text-brand-primary transition-colors">
                          {getHeroName(match.hero_id)}
                        </h3>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-sm text-slate-900 dark:text-white">
                          <span className="text-brand-success">{match.kills}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-brand-danger">{match.deaths}</span>
                          <span className="text-slate-400 mx-1">/</span>
                          <span className="text-brand-info">{match.assists}</span>
                        </p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {Math.floor(match.duration / 60)}m
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-12 px-4 text-center">
                <Activity className="mx-auto mb-4 text-slate-400" size={34} />
                <h3 className="font-black uppercase tracking-tight text-slate-900 dark:text-white mb-2">{t("dashboard.noMatchSample")}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                  {t("dashboard.noMatchText")}
                </p>
                <Link to="/search" className="app-button inline-flex items-center gap-2">
                  {t("dashboard.searchPlayers")} <ArrowRight size={16} />
                </Link>
              </div>
            )}
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {[
            { label: t("dashboard.metaPulse"), value: t("dashboard.heroMatchups"), text: t("dashboard.metaText"), icon: Flame },
            { label: t("dashboard.proCircuit"), value: t("dashboard.premiumLeagues"), text: t("dashboard.proText"), icon: Trophy },
            { label: t("dashboard.reviewLoop"), value: `${stats.wins}/${stats.games} wins`, text: t("dashboard.reviewText"), icon: Activity },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="app-card bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-primary">
                <div className="flex items-center justify-between mb-5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</p>
                  <Icon size={22} className="text-brand-primary" />
                </div>
                <h3 className="text-xl font-black heading-display uppercase italic text-slate-950 dark:text-white mb-3">{item.value}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
