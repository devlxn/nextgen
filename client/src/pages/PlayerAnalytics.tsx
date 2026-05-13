import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Clock,
  Crosshair,
  Medal,
  Swords,
  Trophy,
  UserRound,
} from "lucide-react";
import { getHeroImagePath, heroes as heroConstants } from "../data/heroes";
import { useLanguage } from "../i18n/LanguageContext";

interface PlayerProfile {
  personaname?: string;
  avatarfull?: string;
  profileurl?: string;
}

interface WinLoss {
  win?: number;
  lose?: number;
}

interface PlayerHero {
  hero_id: number;
  games: number;
  win: number;
  last_played?: number;
}

interface PlayerTotal {
  field: string;
  n: number;
  sum: number;
}

interface PlayerRating {
  solo_competitive_rank?: number;
  competitive_rank?: number;
  time?: string;
}

interface HeroRanking {
  hero_id: number;
  score?: number;
  percent_rank?: number;
}

interface PlayerAnalyticsResponse {
  steamId: string;
  accountId: string;
  profile: PlayerProfile | null;
  rankTier: number | null;
  leaderboardRank: number | null;
  wl: WinLoss;
  heroes: PlayerHero[];
  totals: PlayerTotal[];
  counts: Record<string, Record<string, { games?: number; win?: number }>>;
  ratings: PlayerRating[];
  rankings: HeroRanking[];
  updatedAt: string;
}

const API_URL = "http://localhost:5000";

const rankNames = ["Herald", "Guardian", "Crusader", "Archon", "Legend", "Ancient", "Divine", "Immortal"];

const getRankLabel = (rankTier: number | null) => {
  if (!rankTier) return "Unranked";
  const tier = Math.floor(rankTier / 10);
  const stars = rankTier % 10;
  const name = rankNames[tier - 1] || "Unknown";
  return stars ? `${name} ${stars}` : name;
};

const formatNumber = (value: number) => {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value || 0);
};

const getHeroName = (heroId: number) => {
  return heroConstants.find((hero) => hero.id === heroId)?.localized_name || "Unknown Hero";
};

const getAverage = (totalsByField: Record<string, PlayerTotal>, field: string) => {
  const total = totalsByField[field];
  if (!total || !total.n) return 0;
  return total.sum / total.n;
};

function PlayerAnalytics() {
  const { steamId } = useParams();
  const [data, setData] = useState<PlayerAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!steamId) return;

      setLoading(true);
      setError("");

      try {
        const response = await axios.get<PlayerAnalyticsResponse>(`${API_URL}/api/players/${steamId}/analytics`);
        setData(response.data);
      } catch (requestError) {
        console.error("Player analytics fetch failed:", requestError);
        setError(t("playerAnalytics.unavailableText"));
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [steamId, t]);

  const computed = useMemo(() => {
    if (!data) return null;

    const wins = data.wl?.win || 0;
    const losses = data.wl?.lose || 0;
    const games = wins + losses;
    const winRate = games ? (wins / games) * 100 : 0;
    const totalsByField = data.totals.reduce<Record<string, PlayerTotal>>((acc, item) => {
      acc[item.field] = item;
      return acc;
    }, {});

    const kills = getAverage(totalsByField, "kills");
    const deaths = getAverage(totalsByField, "deaths");
    const assists = getAverage(totalsByField, "assists");
    const kda = (kills + assists) / Math.max(1, deaths);

    const topHeroes = [...(data.heroes || [])]
      .filter((hero) => hero.games > 0)
      .sort((a, b) => b.games - a.games)
      .slice(0, 8);

    const heroRankings = [...(Array.isArray(data.rankings) ? data.rankings : [])]
      .filter((ranking) => ranking.hero_id)
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 6);

    return {
      games,
      wins,
      losses,
      winRate,
      totalsByField,
      kda,
      topHeroes,
      heroRankings,
      avgGpm: getAverage(totalsByField, "gold_per_min"),
      avgXpm: getAverage(totalsByField, "xp_per_min"),
      avgHeroDamage: getAverage(totalsByField, "hero_damage"),
      avgTowerDamage: getAverage(totalsByField, "tower_damage"),
    };
  }, [data]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4" />
        <p className="text-brand-primary font-black uppercase tracking-widest">{t("playerAnalytics.loading")}</p>
      </div>
    );
  }

  if (error || !data || !computed) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20">
        <div className="app-card bg-white dark:bg-gaming-dark/60 text-center py-14">
          <UserRound className="mx-auto mb-4 text-brand-danger" size={42} />
          <h1 className="text-3xl font-black heading-display uppercase italic mb-3">{t("playerAnalytics.unavailable")}</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">{error || t("playerAnalytics.noReturned")}</p>
          <Link to="/search" className="app-button inline-flex items-center gap-2">
            <ArrowLeft size={16} />
            {t("common.backToSearch")}
          </Link>
        </div>
      </div>
    );
  }

  const latestRating = data.ratings?.[data.ratings.length - 1];

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 sm:py-12">
      <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-8">
        <div className="flex items-center gap-5">
          <img
            src={data.profile?.avatarfull || "https://via.placeholder.com/128"}
            alt={data.profile?.personaname || data.steamId}
            className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-brand-primary/40 object-cover shadow-neon-purple"
          />
          <div>
            <Link to={`/matches?steamId=${data.steamId}`} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:underline mb-2">
              <ArrowLeft size={14} />
              {t("playerAnalytics.matchHistory")}
            </Link>
            <h1 className="text-4xl sm:text-5xl font-black heading-display uppercase italic text-slate-950 dark:text-white leading-none">
              {data.profile?.personaname || t("playerAnalytics.title")}
            </h1>
            <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 font-mono">SteamID: {data.steamId}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="app-card py-3 px-5 bg-white dark:bg-gaming-dark/60">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("playerAnalytics.rank")}</p>
            <p className="text-lg font-black text-brand-primary">{getRankLabel(data.rankTier)}</p>
          </div>
          <div className="app-card py-3 px-5 bg-white dark:bg-gaming-dark/60">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("playerAnalytics.leaderboard")}</p>
            <p className="text-lg font-black text-brand-accent">
              {data.leaderboardRank ? `#${data.leaderboardRank}` : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 mb-8">
        {[
          { label: t("common.winRate"), value: `${computed.winRate.toFixed(1)}%`, icon: Trophy, color: "text-brand-success", note: `${computed.wins}W / ${computed.losses}L` },
          { label: "KDA", value: computed.kda.toFixed(2), icon: Crosshair, color: "text-brand-primary", note: t("playerAnalytics.allTimeTotals") },
          { label: t("playerAnalytics.avgGpm"), value: formatNumber(computed.avgGpm), icon: BarChart3, color: "text-brand-accent", note: `Avg XPM ${formatNumber(computed.avgXpm)}` },
          { label: t("playerAnalytics.gamesParsed"), value: formatNumber(computed.games), icon: Activity, color: "text-brand-info", note: t("playerAnalytics.fromTotals") },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="app-card bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-primary">
              <div className="flex items-center justify-between mb-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{card.label}</p>
                <Icon size={22} className={card.color} />
              </div>
              <div className="text-3xl font-black text-slate-950 dark:text-white">{card.value}</div>
              <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">{card.note}</p>
            </div>
          );
        })}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] mb-8">
        <div className="app-card bg-white dark:bg-gaming-dark/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("playerAnalytics.heroPool")}</p>
              <h2 className="text-2xl font-black heading-display uppercase italic text-slate-950 dark:text-white">{t("playerAnalytics.mostPlayedHeroes")}</h2>
            </div>
            <Swords className="text-brand-primary" size={28} />
          </div>

          <div className="grid gap-3">
            {computed.topHeroes.map((hero) => {
              const heroWinRate = hero.games ? (hero.win / hero.games) * 100 : 0;
              return (
                <Link
                  key={hero.hero_id}
                  to={`/heroes/${hero.hero_id}/matchups`}
                  className="group grid grid-cols-[84px_minmax(0,1fr)_auto] items-center gap-4 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-3 hover:border-brand-primary/50 transition-colors"
                >
                  <img src={getHeroImagePath(hero.hero_id)} alt={getHeroName(hero.hero_id)} className="w-20 h-12 rounded-lg object-cover border border-slate-200 dark:border-white/10" />
                  <div className="min-w-0">
                    <h3 className="font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors truncate">
                      {getHeroName(hero.hero_id)}
                    </h3>
                    <div className="mt-2 h-2 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-brand-primary" style={{ width: `${Math.min(100, heroWinRate)}%` }} />
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-slate-950 dark:text-white">{hero.games}</p>
                    <p className={`text-[10px] font-black uppercase tracking-widest ${heroWinRate >= 50 ? "text-brand-success" : "text-brand-danger"}`}>
                      {heroWinRate.toFixed(1)}%
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="app-card bg-white dark:bg-gaming-dark/60">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("playerAnalytics.performance")}</p>
              <h2 className="text-2xl font-black heading-display uppercase italic text-slate-950 dark:text-white">{t("playerAnalytics.damageProfile")}</h2>
            </div>
            <Medal className="text-brand-accent" size={28} />
          </div>

          <div className="space-y-5">
            {[
              { label: t("playerAnalytics.heroDamage"), value: computed.avgHeroDamage, color: "bg-brand-danger" },
              { label: t("playerAnalytics.towerDamage"), value: computed.avgTowerDamage, color: "bg-brand-accent" },
              { label: t("playerAnalytics.goldPerMinute"), value: computed.avgGpm, color: "bg-brand-primary" },
              { label: t("playerAnalytics.xpPerMinute"), value: computed.avgXpm, color: "bg-brand-info" },
            ].map((metric) => {
              const maxValue = Math.max(computed.avgHeroDamage, computed.avgTowerDamage * 4, computed.avgGpm * 12, computed.avgXpm * 12, 1);
              const width = Math.max(8, Math.min(100, (metric.value / maxValue) * 100));
              return (
                <div key={metric.label}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-500">{metric.label}</span>
                    <span className="text-xs font-mono text-slate-900 dark:text-white">{formatNumber(metric.value)}</span>
                  </div>
                  <div className="h-3 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden">
                    <div className={`h-full ${metric.color}`} style={{ width: `${width}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("playerAnalytics.latestRating")}</p>
              <Clock size={16} className="text-slate-400" />
            </div>
            <p className="text-2xl font-black text-slate-950 dark:text-white">
              {latestRating?.solo_competitive_rank || latestRating?.competitive_rank || "N/A"}
            </p>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
              {latestRating?.time ? new Date(latestRating.time).toLocaleDateString() : t("playerAnalytics.noRating")}
            </p>
          </div>
        </div>
      </section>

      <section className="app-card bg-white dark:bg-gaming-dark/60">
        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("playerAnalytics.heroRankings")}</p>
            <h2 className="text-2xl font-black heading-display uppercase italic text-slate-950 dark:text-white">{t("playerAnalytics.bestScoredHeroes")}</h2>
          </div>
          <Trophy className="text-brand-success" size={28} />
        </div>

        {computed.heroRankings.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {computed.heroRankings.map((ranking) => (
              <Link key={ranking.hero_id} to={`/heroes/${ranking.hero_id}/matchups`} className="group rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 overflow-hidden hover:border-brand-primary/50 transition-colors">
                <img src={getHeroImagePath(ranking.hero_id)} alt={getHeroName(ranking.hero_id)} className="w-full h-32 object-cover opacity-85 group-hover:opacity-100 transition-opacity" />
                <div className="p-4">
                  <h3 className="font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors">{getHeroName(ranking.hero_id)}</h3>
                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    Score {formatNumber(ranking.score || 0)}
                    {ranking.percent_rank ? ` / Top ${(ranking.percent_rank * 100).toFixed(1)}%` : ""}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-200 dark:border-white/10 py-12 text-center">
            <p className="text-sm font-black uppercase tracking-widest text-slate-500">{t("playerAnalytics.noRankings")}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default PlayerAnalytics;
