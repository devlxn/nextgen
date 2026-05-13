import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import {
  ArrowUpRight,
  BarChart3,
  Clock,
  Package,
  ShieldAlert,
  Sparkles,
  Swords,
  Target,
  Trophy,
} from "lucide-react";
import { getHeroImagePath, heroes } from "../data/heroes";
import { useLanguage } from "../i18n/LanguageContext";

interface Matchup {
  hero_id: number;
  games_played: number;
  wins: number;
  win_rate: number;
}

interface DurationStat {
  duration_bin: string;
  games_played: number;
  wins: number;
}

interface BenchmarkPoint {
  percentile: number;
  value: number;
}

interface BenchmarksResponse {
  hero_id: number;
  result: Record<string, BenchmarkPoint[]>;
}

interface RankingsResponse {
  hero_id: number;
  rankings?: RankingPlayer[];
}

interface RankingPlayer {
  account_id?: number;
  personaname?: string;
  name?: string;
  score?: number;
}

interface ItemConstant {
  id: number;
  key?: string;
  dname: string;
  img?: string;
  cost?: number;
  qual?: string;
}

type ItemPopularity = Record<string, Record<string, number>>;
type ItemsById = Record<string, ItemConstant>;
type ActiveTab = "overview" | "matchups" | "items" | "durations" | "benchmarks";

const API_URL = "http://localhost:5000";
const OPENDOTA_API = "https://api.opendota.com/api";

const itemGroups = [
  { key: "start_game_items", label: "Start", note: "Before horn" },
  { key: "early_game_items", label: "Early", note: "First 10 min" },
  { key: "mid_game_items", label: "Mid", note: "10-25 min" },
  { key: "late_game_items", label: "Late", note: "25+ min" },
];

const benchmarkLabels: Record<string, string> = {
  gold_per_min: "GPM",
  xp_per_min: "XPM",
  kills_per_min: "Kills / min",
  last_hits_per_min: "LH / min",
  hero_damage_per_min: "Hero damage / min",
  hero_healing_per_min: "Healing / min",
  tower_damage: "Tower damage",
};

const formatNumber = (value: number) => {
  if (value >= 1000) return Math.round(value).toLocaleString();
  if (value < 10 && value % 1 !== 0) return value.toFixed(2);
  if (value < 100 && value % 1 !== 0) return value.toFixed(1);
  return Math.round(value).toString();
};

const getWinRate = (wins: number, games: number) => {
  return games > 0 ? (wins / games) * 100 : 0;
};

const getItemIcon = (itemId: string, itemInfo?: ItemConstant) => {
  if (itemInfo?.img) return `https://api.opendota.com${itemInfo.img}`;
  return `https://api.opendota.com/apps/dota2/images/dota_react/items/${itemId}.png`;
};

function HeroMatchups() {
  const { heroId } = useParams<{ heroId: string }>();
  const navigate = useNavigate();
  const selectedHero = heroes.find((hero) => hero.id === Number(heroId));

  const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [durations, setDurations] = useState<DurationStat[]>([]);
  const [itemPopularity, setItemPopularity] = useState<ItemPopularity>({});
  const [itemsById, setItemsById] = useState<ItemsById>({});
  const [benchmarks, setBenchmarks] = useState<BenchmarksResponse | null>(null);
  const [rankings, setRankings] = useState<RankingPlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchHeroAnalytics = async () => {
      if (!heroId) return;

      setLoading(true);
      setError("");

      try {
        const [matchupsRes, durationsRes, itemsRes, benchmarksRes, rankingsRes] = await Promise.all([
          axios.get<Matchup[]>(`${OPENDOTA_API}/heroes/${heroId}/matchups`),
          axios.get<DurationStat[]>(`${OPENDOTA_API}/heroes/${heroId}/durations`),
          axios.get<ItemPopularity>(`${OPENDOTA_API}/heroes/${heroId}/itemPopularity`),
          axios.get<BenchmarksResponse>(`${OPENDOTA_API}/benchmarks`, { params: { hero_id: heroId } }),
          axios.get<RankingsResponse>(`${OPENDOTA_API}/rankings`, { params: { hero_id: heroId } }),
        ]);

        const constantsRes = await axios
          .get<ItemsById>(`${API_URL}/api/constants/items`)
          .catch(() => ({ data: {} as ItemsById }));

        setMatchups(
          matchupsRes.data
            .map((matchup) => ({
              ...matchup,
              win_rate: getWinRate(matchup.wins, matchup.games_played),
            }))
            .sort((a, b) => b.win_rate - a.win_rate)
        );
        setDurations(durationsRes.data);
        setItemPopularity(itemsRes.data);
        setItemsById(constantsRes.data);
        setBenchmarks(benchmarksRes.data);
        setRankings(rankingsRes.data.rankings?.slice(0, 8) || []);
      } catch (fetchError) {
        const message = fetchError instanceof Error ? fetchError.message : t("heroAnalytics.loading");
        setError(message);
      } finally {
        setLoading(false);
      }
    };

    fetchHeroAnalytics();
  }, [heroId, t]);

  const goodAgainst = matchups.slice(0, 8);
  const badAgainst = [...matchups].reverse().slice(0, 8);

  const durationSummary = useMemo(() => {
    const sorted = durations
      .map((duration) => ({
        ...duration,
        winRate: getWinRate(duration.wins, duration.games_played),
      }))
      .sort((a, b) => Number(a.duration_bin) - Number(b.duration_bin));

    const best = [...sorted].sort((a, b) => b.winRate - a.winRate)[0];
    return { sorted, best };
  }, [durations]);

  const benchmarkSummary = useMemo(() => {
    if (!benchmarks) return [];

    return Object.entries(benchmarks.result)
      .map(([key, points]) => {
        const median = points.find((point) => point.percentile === 0.5) || points[Math.floor(points.length / 2)];
        const elite = points.find((point) => point.percentile === 0.9) || points[points.length - 1];
        return {
          key,
          label: benchmarkLabels[key] || key,
          median: median?.value || 0,
          elite: elite?.value || 0,
        };
      })
      .filter((item) => item.elite > 0)
      .slice(0, 6);
  }, [benchmarks]);

  const topItemGroups = itemGroups.map((group) => {
    const entries = Object.entries(itemPopularity[group.key] || {})
      .map(([itemId, games]) => ({ itemId, games }))
      .sort((a, b) => b.games - a.games)
      .slice(0, 5);
    const total = entries.reduce((sum, item) => sum + item.games, 0);
    return { ...group, entries, total };
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F0F23]">
        <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
        <p className="text-brand-primary font-bold animate-pulse uppercase tracking-widest">{t("heroAnalytics.loading")}</p>
      </div>
    );
  }

  if (error || !selectedHero) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F0F23] p-4">
        <div className="app-card max-w-md text-center border-brand-danger/30 bg-white dark:bg-gaming-dark/60">
          <div className="w-16 h-16 rounded-2xl bg-brand-danger/10 flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="text-brand-danger" size={34} />
          </div>
          <h2 className="text-xl font-bold text-brand-danger mb-2 uppercase">{t("heroAnalytics.dataError")}</h2>
          <p className="text-slate-500">{error || t("heroAnalytics.heroNotFound")}</p>
          <button onClick={() => navigate(-1)} className="app-button mt-6">
            {t("common.backToSearch")}
          </button>
        </div>
      </div>
    );
  }

  const MatchupCard = ({ matchup, type }: { matchup: Matchup; type: "good" | "bad" }) => {
    const opponent = heroes.find((hero) => hero.id === matchup.hero_id);
    const isGood = type === "good";

    return (
      <div className={`app-card group flex items-center gap-4 p-3 bg-white dark:bg-gaming-dark/40 border-l-4 transition-all hover:scale-[1.02] ${isGood ? "border-l-brand-success" : "border-l-brand-danger"}`}>
        <img
          src={getHeroImagePath(matchup.hero_id)}
          className="w-16 h-9 rounded border border-slate-200 dark:border-white/10 object-cover shrink-0"
          alt={opponent?.localized_name || "Hero"}
        />
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-primary transition-colors">
            {opponent?.localized_name || "Unknown Hero"}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-grow h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${isGood ? "bg-brand-success" : "bg-brand-danger"}`}
                style={{ width: `${Math.min(100, matchup.win_rate)}%` }}
              />
            </div>
            <span className={`text-xs font-black ${isGood ? "text-brand-success" : "text-brand-danger"}`}>
              {matchup.win_rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  const tabItems: Array<{ id: ActiveTab; label: string; icon: typeof BarChart3 }> = [
    { id: "overview", label: t("heroAnalytics.overview"), icon: BarChart3 },
    { id: "matchups", label: t("heroAnalytics.matchups"), icon: Swords },
    { id: "items", label: t("heroAnalytics.items"), icon: Package },
    { id: "durations", label: t("heroAnalytics.durations"), icon: Clock },
    { id: "benchmarks", label: t("heroAnalytics.benchmarks"), icon: Target },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="app-card mb-8 bg-white dark:bg-gaming-dark/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden md:block">
          <span className="text-9xl font-black heading-display italic text-slate-900 dark:text-white uppercase">{t("heroAnalytics.title")}</span>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="absolute -inset-2 bg-brand-primary rounded-2xl blur opacity-20"></div>
            <img
              src={getHeroImagePath(selectedHero.id)}
              className="relative w-52 h-32 rounded-2xl border-2 border-brand-primary/30 object-cover shadow-2xl"
              alt={selectedHero.localized_name}
            />
          </div>
          <div className="text-center md:text-left flex-grow">
            <p className="text-brand-primary font-black tracking-widest uppercase text-xs mb-2">{t("heroAnalytics.subtitle")}</p>
            <h1 className="text-4xl sm:text-6xl font-black heading-display text-slate-900 dark:text-white mb-3 uppercase tracking-tighter">
              {selectedHero.localized_name}
            </h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest border border-brand-primary/20">
                {selectedHero.attack_type}
              </span>
              <span className="px-3 py-1 rounded-full bg-brand-accent/10 text-brand-accent text-[10px] font-black uppercase tracking-widest border border-brand-accent/20">
                {selectedHero.primary_attr}
              </span>
              {selectedHero.roles.slice(0, 3).map((role) => (
                <span key={role} className="px-3 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest border border-slate-200 dark:border-white/10">
                  {role}
                </span>
              ))}
            </div>
          </div>
          <button onClick={() => navigate(-1)} className="app-button-secondary px-8 py-3 md:ml-auto">
            {t("common.backToSearch")}
          </button>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {tabItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border text-xs font-black uppercase tracking-widest transition-all ${
                  isActive
                    ? "bg-brand-primary text-white border-brand-primary shadow-neon-purple"
                    : "bg-white dark:bg-gaming-dark/60 border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:text-brand-primary hover:border-brand-primary/40"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="app-card bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-success">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("heroAnalytics.bestDuration")}</p>
              <Clock className="text-brand-success" size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {durationSummary.best ? `${Math.floor(Number(durationSummary.best.duration_bin) / 60)}+ min` : t("common.noData")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {durationSummary.best ? `${durationSummary.best.winRate.toFixed(1)}% winrate over ${durationSummary.best.games_played} games.` : "OpenDota has no duration sample for this hero yet."}
            </p>
          </div>

          <div className="app-card bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-primary">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("heroAnalytics.strongestMatchup")}</p>
              <Swords className="text-brand-primary" size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {goodAgainst[0] ? heroes.find((hero) => hero.id === goodAgainst[0].hero_id)?.localized_name : t("common.noData")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {goodAgainst[0] ? `${goodAgainst[0].win_rate.toFixed(1)}% winrate in ${goodAgainst[0].games_played} games.` : "No matchup sample available."}
            </p>
          </div>

          <div className="app-card bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-accent">
            <div className="flex items-center justify-between mb-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">{t("heroAnalytics.benchmarkMedian")}</p>
              <Trophy className="text-brand-accent" size={24} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">
              {benchmarkSummary[0] ? formatNumber(benchmarkSummary[0].median) : t("common.noData")}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {benchmarkSummary[0] ? `${benchmarkSummary[0].label} median; elite sample reaches ${formatNumber(benchmarkSummary[0].elite)}.` : "Benchmarks are unavailable for this hero."}
            </p>
          </div>

          <div className="lg:col-span-2 app-card bg-white dark:bg-gaming-dark/60">
            <div className="flex items-center gap-3 mb-6">
              <Sparkles className="text-brand-primary" size={24} />
              <h2 className="text-2xl font-black heading-display uppercase italic text-slate-900 dark:text-white">{t("heroAnalytics.snapshot")}</h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {benchmarkSummary.slice(0, 4).map((item) => (
                <div key={item.key} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{item.label}</span>
                    <span className="text-[10px] font-black text-brand-primary uppercase">90th</span>
                  </div>
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">{formatNumber(item.median)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("heroAnalytics.median")}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-brand-primary">{formatNumber(item.elite)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("heroAnalytics.elite")}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="app-card bg-white dark:bg-gaming-dark/60">
            <div className="flex items-center gap-3 mb-6">
              <Trophy className="text-brand-accent" size={24} />
              <h2 className="text-xl font-black heading-display uppercase italic text-slate-900 dark:text-white">{t("heroAnalytics.topPlayers")}</h2>
            </div>
            <div className="space-y-3">
              {rankings.length > 0 ? (
                rankings.slice(0, 5).map((player, index) => (
                  <div key={`${player.account_id || index}-${index}`} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 dark:bg-gaming-muted/20 border border-slate-200 dark:border-white/10 p-3">
                    <div className="min-w-0">
                      <p className="font-black text-slate-900 dark:text-white truncate">
                        {player.personaname || player.name || `Player ${index + 1}`}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400">ID: {player.account_id || t("heroAnalytics.hidden")}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-brand-primary">{formatNumber(player.score || 0)}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("heroAnalytics.score")}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400">{t("heroAnalytics.noRankingSample")}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === "matchups" && (
        <div className="grid lg:grid-cols-2 gap-12">
          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-8 bg-brand-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
              <h2 className="text-2xl font-black heading-display text-brand-success uppercase">{t("heroAnalytics.strongAgainst")}</h2>
            </div>
            <div className="grid gap-4">
              {goodAgainst.map((matchup) => (
                <MatchupCard key={matchup.hero_id} matchup={matchup} type="good" />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-3 h-8 bg-brand-danger rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
              <h2 className="text-2xl font-black heading-display text-brand-danger uppercase">{t("heroAnalytics.weakAgainst")}</h2>
            </div>
            <div className="grid gap-4">
              {badAgainst.map((matchup) => (
                <MatchupCard key={matchup.hero_id} matchup={matchup} type="bad" />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "items" && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {topItemGroups.map((group) => (
            <div key={group.key} className="app-card bg-white dark:bg-gaming-dark/60">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary">{group.note}</p>
                  <h2 className="text-2xl font-black heading-display uppercase italic text-slate-900 dark:text-white">{group.label}</h2>
                </div>
                <Package className="text-brand-primary" size={24} />
              </div>
              <div className="space-y-3">
                {group.entries.map((item) => {
                  const itemInfo = itemsById[item.itemId];
                  const width = group.total ? Math.max(8, (item.games / group.total) * 100) : 8;
                  return (
                    <div key={item.itemId} className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-3">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={getItemIcon(item.itemId, itemInfo)} alt={itemInfo?.dname || `Item ${item.itemId}`} className="w-10 h-8 rounded object-cover border border-slate-200 dark:border-white/10 bg-slate-200 dark:bg-gaming-muted/40" />
                        <div className="min-w-0">
                          <p className="font-black text-slate-900 dark:text-white truncate">
                            {itemInfo?.dname || `Item #${item.itemId}`}
                          </p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {item.games} pro games{itemInfo?.cost ? ` / ${itemInfo.cost} gold` : ""}
                          </p>
                        </div>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div className="h-full bg-brand-primary rounded-full" style={{ width: `${width}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "durations" && (
        <div className="app-card bg-white dark:bg-gaming-dark/60">
          <div className="flex items-center justify-between gap-4 mb-8">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("heroAnalytics.timeWindows")}</p>
              <h2 className="text-2xl font-black heading-display uppercase italic text-slate-900 dark:text-white">{t("heroAnalytics.durationWinrate")}</h2>
            </div>
            <Clock className="text-brand-primary" size={28} />
          </div>
          <div className="grid gap-4">
            {durationSummary.sorted.map((duration) => {
              const minutes = Math.floor(Number(duration.duration_bin) / 60);
              return (
                <div key={duration.duration_bin} className="grid gap-3 md:grid-cols-[120px_minmax(0,1fr)_120px] md:items-center rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-gaming-muted/20 p-4">
                  <div>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{minutes}+ min</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{duration.games_played} games</p>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-primary to-brand-success" style={{ width: `${Math.min(100, duration.winRate)}%` }} />
                  </div>
                  <p className="text-right text-2xl font-black text-brand-primary">{duration.winRate.toFixed(1)}%</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "benchmarks" && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {benchmarkSummary.map((item) => (
            <div key={item.key} className="app-card bg-white dark:bg-gaming-dark/60">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">{t("heroAnalytics.percentiles")}</p>
                  <h2 className="text-xl font-black heading-display uppercase italic text-slate-900 dark:text-white">{item.label}</h2>
                </div>
                <ArrowUpRight className="text-brand-accent" size={24} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl bg-slate-50 dark:bg-gaming-muted/20 border border-slate-200 dark:border-white/10 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">50th</p>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">{formatNumber(item.median)}</p>
                </div>
                <div className="rounded-xl bg-brand-primary/10 border border-brand-primary/20 p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-primary mb-2">90th</p>
                  <p className="text-3xl font-black text-brand-primary">{formatNumber(item.elite)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroMatchups;
