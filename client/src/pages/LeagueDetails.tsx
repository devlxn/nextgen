import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import axios from "axios";
import { useLanguage } from "../i18n/LanguageContext";

interface League {
  leagueid: number;
  name: string;
  tier: string;
}

interface LeagueMatch {
  match_id: number;
  duration: number;
  start_time: number;
  radiant_name: string;
  dire_name: string;
  radiant_score: number;
  dire_score: number;
  radiant_win: boolean;
}

interface LeagueTeam {
  team_id: number;
  name: string;
  tag: string;
  rating: number;
  wins: number;
  losses: number;
}

function LeagueDetails() {
  const { leagueId } = useParams();
  const [league, setLeague] = useState<League | null>(null);
  const [matches, setMatches] = useState<LeagueMatch[]>([]);
  const [teams, setTeams] = useState<LeagueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"matches" | "teams">("matches");
  const { t } = useLanguage();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leagueRes, matchesRes, teamsRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/leagues/${leagueId}`),
          axios.get(`http://localhost:5000/api/leagues/${leagueId}/matches`),
          axios.get(`http://localhost:5000/api/leagues/${leagueId}/teams`)
        ]);
        setLeague(leagueRes.data);
        setMatches(matchesRes.data);
        setTeams(teamsRes.data);
      } catch (err) {
        console.error("Failed to fetch league details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [leagueId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F0F23]">
      <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
      <p className="text-brand-primary font-bold animate-pulse uppercase tracking-widest">{t("leagueDetails.loading")}</p>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="app-card mb-8 bg-white dark:bg-gaming-dark/60 border-t-4 border-t-brand-primary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-brand-primary/10 text-brand-primary border border-brand-primary/20">
                {league?.tier || t("leagues.background")}
              </span>
              <span className="text-xs font-mono text-slate-400">ID: {leagueId}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
              {league?.name || t("leagueDetails.fallbackTitle")}
            </h1>
          </div>
          <div className="flex gap-4">
            <div className="text-center px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t("common.matches")}</p>
              <p className="text-2xl font-black text-brand-primary">{matches.length}</p>
            </div>
            <div className="text-center px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">{t("common.teams")}</p>
              <p className="text-2xl font-black text-brand-accent">{teams.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8 p-1 bg-slate-200 dark:bg-white/5 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab("matches")}
          className={`px-8 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
            activeTab === "matches"
              ? "bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-lg"
              : "text-slate-500 hover:text-brand-primary"
          }`}
        >
          {t("common.matches").toUpperCase()}
        </button>
        <button
          onClick={() => setActiveTab("teams")}
          className={`px-8 py-3 rounded-xl font-black text-xs tracking-widest transition-all ${
            activeTab === "teams"
              ? "bg-white dark:bg-brand-primary text-brand-primary dark:text-white shadow-lg"
              : "text-slate-500 hover:text-brand-primary"
          }`}
        >
          {t("common.teams").toUpperCase()}
        </button>
      </div>

      {/* Content */}
      {activeTab === "matches" ? (
        <div className="grid gap-4">
          {matches.length > 0 ? (
            matches.map((match) => (
              <Link
                to={`/match/${match.match_id}`}
                key={match.match_id}
                className="app-card group bg-white dark:bg-gaming-dark/60 hover:border-brand-primary/50 transition-all"
              >
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-8 flex-1 justify-center md:justify-start">
                    <div className="text-right min-w-[120px]">
                      <p className={`text-lg font-black uppercase truncate ${match.radiant_win ? 'text-brand-success' : 'text-slate-400'}`}>
                        {match.radiant_name || "Radiant"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 px-6 py-2 rounded-xl border border-slate-200 dark:border-white/10">
                      <span className={`text-2xl font-black ${match.radiant_win ? 'text-brand-success' : 'text-slate-500'}`}>{match.radiant_score}</span>
                      <span className="text-slate-300 dark:text-white/20 font-black">:</span>
                      <span className={`text-2xl font-black ${!match.radiant_win ? 'text-brand-danger' : 'text-slate-500'}`}>{match.dire_score}</span>
                    </div>
                    <div className="text-left min-w-[120px]">
                      <p className={`text-lg font-black uppercase truncate ${!match.radiant_win ? 'text-brand-danger' : 'text-slate-400'}`}>
                        {match.dire_name || "Dire"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 text-xs font-bold text-slate-400 uppercase tracking-widest">
                    <span>{Math.floor(match.duration / 60)}m {match.duration % 60}s</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                    <span>{new Date(match.start_time * 1000).toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div className="app-card text-center py-20 bg-white dark:bg-gaming-dark/60">
              <p className="text-slate-500 font-bold uppercase tracking-widest">{t("leagueDetails.noMatches")}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {teams.length > 0 ? (
            teams.map((team) => (
              <div key={team.team_id} className="app-card bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-accent">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate pr-4">
                    {team.name}
                  </h3>
                  <span className="px-2 py-1 bg-brand-accent/10 text-brand-accent rounded text-[10px] font-black">
                    {team.tag}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{t("leagueDetails.rating")}</p>
                    <p className="text-lg font-black text-brand-primary">{Math.floor(team.rating)}</p>
                  </div>
                  <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-xl">
                    <p className="text-[10px] font-black text-slate-500 uppercase mb-1">{t("leagueDetails.wl")}</p>
                    <p className="text-lg font-black">
                      <span className="text-brand-success">{team.wins}</span>
                      <span className="text-slate-300 mx-1">/</span>
                      <span className="text-brand-danger">{team.losses}</span>
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full app-card text-center py-20 bg-white dark:bg-gaming-dark/60">
              <p className="text-slate-500 font-bold uppercase tracking-widest">{t("leagueDetails.noTeams")}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LeagueDetails;
