import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { heroes } from "../data/heroes";

interface Matchup {
  hero_id: number;
  games_played: number;
  wins: number;
  win_rate: number;
}

function HeroMatchups() {
  const { heroId } = useParams<{ heroId: string }>();
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatchups = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get(
          `https://api.opendota.com/api/heroes/${heroId}/matchups`
        );
        const data = response.data as any[];
        const matchupsWithWinRate = data.map((matchup) => ({
          hero_id: matchup.hero_id,
          games_played: matchup.games_played,
          wins: matchup.wins,
          win_rate: (matchup.wins / matchup.games_played) * 100,
        }));

        // Сортируем по винрейту
        const sorted = [...matchupsWithWinRate].sort((a, b) => b.win_rate - a.win_rate);
        setMatchups(sorted);
      } catch (err: any) {
        setError(err.message || "Failed to fetch matchups");
      } finally {
        setLoading(false);
      }
    };

    if (heroId) {
      fetchMatchups();
    }
  }, [heroId]);

  const selectedHero = heroes.find((h) => h.id === Number(heroId));
  const heroName = selectedHero?.name.replace("npc_dota_hero_", "") || "unknown";

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F0F23]">
      <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
      <p className="text-brand-primary font-bold animate-pulse uppercase tracking-widest">Calculating Matchups...</p>
    </div>
  );

  if (error || !selectedHero) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F0F23] p-4">
      <div className="app-card max-w-md text-center border-brand-danger/30 bg-white dark:bg-gaming-dark/60">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-brand-danger mb-2 uppercase">Data Error</h2>
        <p className="text-slate-500">{error || "Hero not found"}</p>
        <button onClick={() => navigate(-1)} className="app-button mt-6">Go Back</button>
      </div>
    </div>
  );

  const goodAgainst = matchups.slice(0, 10);
  const badAgainst = [...matchups].reverse().slice(0, 10);

  const MatchupCard = ({ matchup, type }: { matchup: Matchup, type: 'good' | 'bad' }) => {
    const opponent = heroes.find(h => h.id === matchup.hero_id);
    const opponentName = opponent?.name.replace("npc_dota_hero_", "") || "unknown";
    const isWin = matchup.win_rate > 50;

    return (
      <div className={`app-card group flex items-center gap-4 p-3 bg-white dark:bg-gaming-dark/40 border-l-4 transition-all hover:scale-[1.02] ${type === 'good' ? 'border-l-brand-success' : 'border-l-brand-danger'}`}>
        <div className="relative shrink-0">
          <img 
            src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${opponentName}.png`}
            className="w-16 h-9 rounded border border-slate-200 dark:border-white/10 object-cover"
            alt={opponent?.localized_name}
          />
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-brand-primary transition-colors">
            {opponent?.localized_name}
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex-grow h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full ${isWin ? 'bg-brand-success' : 'bg-brand-danger'}`}
                style={{ width: `${matchup.win_rate}%` }}
              ></div>
            </div>
            <span className={`text-xs font-black ${isWin ? 'text-brand-success' : 'text-brand-danger'}`}>
              {matchup.win_rate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Hero Header */}
      <div className="app-card mb-12 bg-white dark:bg-gaming-dark/60 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none hidden md:block">
          <span className="text-9xl font-black heading-display italic text-slate-900 dark:text-white uppercase">MATCHUPS</span>
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="relative">
            <div className="absolute -inset-2 bg-brand-primary rounded-2xl blur opacity-20"></div>
            <img 
              src={`https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/${heroName}.png`}
              className="relative w-48 h-28 rounded-2xl border-2 border-brand-primary/30 object-cover shadow-2xl"
              alt={selectedHero.localized_name}
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-4xl sm:text-6xl font-black heading-display text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">
              {selectedHero.localized_name}
            </h1>
            <p className="text-brand-primary font-bold tracking-widest uppercase text-sm">Strategic Analysis & Counter-Picks</p>
          </div>
          <div className="md:ml-auto">
            <button onClick={() => navigate(-1)} className="app-button-secondary px-8 py-3">BACK TO HEROES</button>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Good Against */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-8 bg-brand-success rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
            <h2 className="text-2xl font-black heading-display text-brand-success uppercase">Strong Against</h2>
          </div>
          <div className="grid gap-4">
            {goodAgainst.map(m => <MatchupCard key={m.hero_id} matchup={m} type="good" />)}
          </div>
        </div>

        {/* Bad Against */}
        <div>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-3 h-8 bg-brand-danger rounded-full shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>
            <h2 className="text-2xl font-black heading-display text-brand-danger uppercase">Weak Against</h2>
          </div>
          <div className="grid gap-4">
            {badAgainst.map(m => <MatchupCard key={m.hero_id} matchup={m} type="bad" />)}
          </div>
        </div>
      </div>
    </div>
  );
}

export default HeroMatchups;