import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { heroes } from "../data/heroes";
import { Trophy, Clock, Calendar, Hash, ChevronRight, AlertCircle } from "lucide-react";

interface Player {
  account_id: number;
  personaname: string;
  name?: string; // For pro players
  hero_id: number;
  kills: number;
  deaths: number;
  assists: number;
  gold_per_min: number;
  xp_per_min: number;
  hero_damage: number;
  tower_damage: number;
  last_hits: number;
  item_0: number;
  item_1: number;
  item_2: number;
  item_3: number;
  item_4: number;
  item_5: number;
  player_slot: number;
  level: number;
  net_worth: number;
}

interface Match {
  match_id: number;
  duration: number;
  radiant_win: boolean;
  players: Player[];
  radiant_score: number;
  dire_score: number;
  start_time: number;
  radiant_team?: { name: string; tag: string; logo_url: string };
  dire_team?: { name: string; tag: string; logo_url: string };
  league?: { name: string };
}

const API_URL = "http://localhost:5000";

function MatchDetails() {
  const { matchId } = useParams<{ matchId: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatch = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(`${API_URL}/api/match/${matchId}`);
        setMatch(response.data);
      } catch (err: any) {
        setError(err.response?.data?.error || err.message || "Failed to fetch match data");
      } finally {
        setLoading(false);
      }
    };
    fetchMatch();
  }, [matchId]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-gaming-black">
      <div className="w-20 h-20 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-6"></div>
      <p className="text-brand-primary font-black heading-display animate-pulse tracking-widest">ANALYZING BATTLE DATA...</p>
      <p className="text-slate-500 text-xs mt-2 uppercase font-bold">Pro matches may take up to 60s to load</p>
    </div>
  );

  if (error || !match || !match.players) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gaming-black p-4">
      <div className="app-card max-w-md text-center border-brand-danger/30 bg-white dark:bg-gaming-dark/60">
        <div className="text-5xl mb-4"><AlertCircle className="w-16 h-16 text-brand-danger mx-auto" /></div>
        <h2 className="text-2xl font-black heading-display text-brand-danger mb-2">DATA LINK LOST</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-6">{error || "Match data is incomplete or not yet parsed by OpenDota."}</p>
        <button onClick={() => navigate(-1)} className="app-button w-full">RETURN TO BASE</button>
      </div>
    </div>
  );

  const radiantPlayers = match.players.filter((p) => p.player_slot < 128).sort((a, b) => a.player_slot - b.player_slot);
  const direPlayers = match.players.filter((p) => p.player_slot >= 128).sort((a, b) => a.player_slot - b.player_slot);

  const getHeroUrl = (id: number) => {
    const hero = heroes.find(h => h.id === id);
    const name = hero?.name.replace("npc_dota_hero_", "") || "unknown";
    return `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${name}.png`;
  };

  const PlayerRow = ({ player }: { player: Player }) => (
    <tr className="border-b border-slate-100 dark:border-gaming-border/10 hover:bg-brand-primary/5 transition-colors group">
      <td className="py-4 pl-4">
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            <img src={getHeroUrl(player.hero_id)} className="w-16 h-9 rounded border border-slate-200 dark:border-white/10 object-cover shadow-sm" alt="hero" />
            <span className="absolute -bottom-1 -right-1 bg-white dark:bg-gaming-black border border-slate-200 dark:border-gaming-border/40 text-[10px] font-bold px-1 rounded text-brand-secondary">
              {player.level}
            </span>
          </div>
          <div className="flex flex-col">
            <span 
              className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-brand-primary cursor-pointer transition-colors truncate max-w-[150px]"
              onClick={() => player.account_id && navigate(`/matches?steamId=${BigInt(76561197960265728) + BigInt(player.account_id)}`)}
              title={player.personaname}
            >
              {player.name ? player.name : (player.personaname || "Anonymous")}
            </span>
            <span className="text-[10px] text-slate-500 font-mono uppercase tracking-tighter">
              {heroes.find(h => h.id === player.hero_id)?.localized_name}
            </span>
          </div>
        </div>
      </td>
      <td className="text-center font-bold">
        <div className="flex items-center justify-center gap-1">
          <span className="text-brand-success">{player.kills}</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-brand-danger">{player.deaths}</span>
          <span className="text-slate-400 dark:text-slate-600">/</span>
          <span className="text-brand-info">{player.assists}</span>
        </div>
      </td>
      <td className="text-center">
        <span className="text-brand-primary font-black text-sm">
          {((player.kills + player.assists) / Math.max(1, player.deaths)).toFixed(1)}
        </span>
      </td>
      <td className="text-center">
        <div className="flex flex-col">
          <span className="text-brand-warning font-bold">{player.gold_per_min}</span>
          <span className="text-[9px] text-slate-400 uppercase font-black">GPM</span>
        </div>
      </td>
      <td className="text-center">
        <div className="flex flex-col">
          <span className="text-brand-info font-bold">{player.xp_per_min}</span>
          <span className="text-[9px] text-slate-400 uppercase font-black">XPM</span>
        </div>
      </td>
      <td className="pr-4">
        <div className="flex gap-1 justify-end">
          {[player.item_0, player.item_1, player.item_2, player.item_3, player.item_4, player.item_5].map((id, i) => (
            <div key={i} className="w-8 h-6 bg-slate-100 dark:bg-gaming-muted/40 rounded border border-slate-200 dark:border-white/5 overflow-hidden">
              {id > 0 && <img src={`https://api.opendota.com/apps/dota2/images/dota_react/items/${id}.png`} className="w-full h-full object-cover" alt="item" />}
            </div>
          ))}
        </div>
      </td>
    </tr>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header Card */}
      <div className="app-card mb-8 relative overflow-hidden border-b-4 border-b-brand-primary bg-white dark:bg-gaming-dark/60">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
          <Hash className="w-32 h-32 text-slate-900 dark:text-white" />
        </div>
        
        <div className="relative z-10">
          {match.league && (
            <div className="flex items-center gap-2 mb-6 text-brand-primary font-black uppercase tracking-widest text-xs">
              <Trophy size={14} />
              {match.league.name}
            </div>
          )}

          <div className="flex flex-col lg:flex-row justify-between items-center gap-10">
            {/* Radiant Team */}
            <div className="flex flex-col items-center lg:items-end text-center lg:text-right flex-1">
              {match.radiant_team?.logo_url && (
                <img src={match.radiant_team.logo_url} alt="Radiant Logo" className="w-16 h-16 mb-3 object-contain" />
              )}
              <h2 className="text-2xl font-black heading-display text-brand-success uppercase italic">
                {match.radiant_team?.name || "THE RADIANT"}
              </h2>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Radiant Side</span>
            </div>

            {/* Score & Info */}
            <div className="flex flex-col items-center px-8 border-x border-slate-100 dark:border-gaming-border/10">
              <div className="flex items-center gap-6 mb-4">
                <span className="text-6xl font-black heading-display text-slate-900 dark:text-white">{match.radiant_score}</span>
                <span className="text-3xl font-black text-slate-300 dark:text-slate-700">:</span>
                <span className="text-6xl font-black heading-display text-slate-900 dark:text-white">{match.dire_score}</span>
              </div>
              <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 ${match.radiant_win ? 'bg-brand-success/20 text-brand-success border border-brand-success/30' : 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30'}`}>
                {match.radiant_win ? 'Radiant Victory' : 'Dire Victory'}
              </div>
              <div className="flex gap-6 text-slate-500 font-bold text-[10px] uppercase tracking-widest">
                <div className="flex items-center gap-1.5"><Clock size={12} /> {Math.floor(match.duration / 60)}:{(match.duration % 60).toString().padStart(2, "0")}</div>
                <div className="flex items-center gap-1.5"><Calendar size={12} /> {new Date(match.start_time * 1000).toLocaleDateString()}</div>
              </div>
            </div>

            {/* Dire Team */}
            <div className="flex flex-col items-center lg:items-start text-center lg:text-left flex-1">
              {match.dire_team?.logo_url && (
                <img src={match.dire_team.logo_url} alt="Dire Logo" className="w-16 h-16 mb-3 object-contain" />
              )}
              <h2 className="text-2xl font-black heading-display text-brand-danger uppercase italic">
                {match.dire_team?.name || "THE DIRE"}
              </h2>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dire Side</span>
            </div>
          </div>
        </div>
      </div>

      {/* Radiant Table */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-3 h-8 bg-brand-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          <h2 className="text-2xl font-black heading-display text-brand-success uppercase italic">TEAM RADIANT</h2>
        </div>
        <div className="app-card p-0 overflow-hidden border-brand-success/20 bg-white dark:bg-gaming-dark/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-success/5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-brand-success/10">
                  <th className="py-4 pl-4">Hero / Player</th>
                  <th className="text-center">K / D / A</th>
                  <th className="text-center">KDA</th>
                  <th className="text-center">GPM</th>
                  <th className="text-center">XPM</th>
                  <th className="text-right pr-4">Items</th>
                </tr>
              </thead>
              <tbody>
                {radiantPlayers.map(p => <PlayerRow key={p.player_slot} player={p} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dire Table */}
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-3 h-8 bg-brand-danger rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
          <h2 className="text-2xl font-black heading-display text-brand-danger uppercase italic">TEAM DIRE</h2>
        </div>
        <div className="app-card p-0 overflow-hidden border-brand-danger/20 bg-white dark:bg-gaming-dark/60">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-brand-danger/5 text-[10px] font-black uppercase tracking-widest text-slate-500 border-b border-brand-danger/10">
                  <th className="py-4 pl-4">Hero / Player</th>
                  <th className="text-center">K / D / A</th>
                  <th className="text-center">KDA</th>
                  <th className="text-center">GPM</th>
                  <th className="text-center">XPM</th>
                  <th className="text-right pr-4">Items</th>
                </tr>
              </thead>
              <tbody>
                {direPlayers.map(p => <PlayerRow key={p.player_slot} player={p} />)}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
      <div className="flex justify-center">
        <button onClick={() => navigate(-1)} className="app-button-secondary px-12 py-4 flex items-center gap-2 group">
          BACK TO MATCH HISTORY <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export default MatchDetails;