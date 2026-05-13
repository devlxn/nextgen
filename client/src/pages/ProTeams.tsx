import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n/LanguageContext";

interface Player {
  name: string;
  steamId: string;
  teamName: string;
  teamTag?: string;
  avatar?: string;
}

interface OpenDotaProPlayer {
  name?: string;
  personaname?: string;
  steamid?: string;
  avatarfull?: string;
}

function ProTeams() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { t } = useLanguage();

  const teamsData = [
    { name: "AVULUS", tag: "AVL", players: ["dEsire", "Fly", "Smiling Knight", "Worick", "Xibbe"] },
    { name: "Gaimin Gladiators", tag: "GG", players: ["Ace", "Malady", "Quinn", "tOfu", "watson"] },
    { name: "MOUZ", tag: "MOUZ", players: ["Abed", "Ekki", "Kami", "Seleri", "zeal"] },
    { name: "OG", tag: "OG", players: ["daze", "Kidaro", "MikSa`", "Shad", "Stormstormer"] },
    { name: "Team Liquid", tag: "TL", players: ["Boxi", "Insania", "miCKe", "Nisha", "SabeRLighT"] },
    { name: "Team Secret", tag: "TS", players: ["Puppey"] },
    { name: "Tundra Esports", tag: "TND", players: ["33", "bzm", "Pure", "Saksa", "Whitemon"] },
    { name: "1w Team", tag: "1W", players: ["kasane", "Munkushi~", "squad1x", "SSS", "swedenstrong"] },
    { name: "Aurora Gaming", tag: "AUR", players: ["kiyotaka", "Mira", "Nightfall", "panto", "TORONTOTOKYO"] },
    { name: "BetBoom Team", tag: "BB", players: ["gpk", "Kataomi", "MieRo", "Kiritych~", "Save-"] },
    { name: "L1GA TEAM", tag: "L1GA", players: ["erase", "Malik", "mrls", "RESPECT", "v1olent`"] },
    { name: "Natus Vincere", tag: "NaVi", players: ["gotthejuice", "Niku", "pma", "Riddys", "Zayac"] },
    { name: "PARIVISION", tag: "PV", players: ["9Class", "DM", "Dukalis", "None-", "Satanic"] },
    { name: "Team Spirit", tag: "SPT", players: ["Collapse", "Larl", "Miposhka", "rue", "Yatoro"] },
    { name: "Virtus.pro", tag: "VP", players: ["Antares", "Daxak", "lorenof", "Rein", "V-Tune"] },
    { name: "Team Falcons", tag: "FAL", players: ["ATF", "Cr1t-", "Malr1ne", "skiter", "Sneyking"] },
    { name: "Xtreme Gaming", tag: "XG", players: ["Ame", "poloson", "XinQ", "Xm", "Xx"] },
    { name: "Shopify Rebellion", tag: "SR", players: ["Davai Lama", "Hellscream", "skem", "Timado", "Yopaj"] },
    { name: "HEROIC", tag: "HERO", players: ["4nalog", "KJ", "Scofield", "Wisper", "Yuma"] },
  ];

  useEffect(() => {
    const fetchProPlayers = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await axios.get("https://api.opendota.com/api/proPlayers");
        const apiPlayers = response.data as OpenDotaProPlayer[];

        const allPlayers: Player[] = teamsData.flatMap((team) =>
          team.players.map((playerName) => {
            const matchedPlayer = apiPlayers.find(
              (p) => p.name === playerName || p.personaname === playerName
            );
            return {
              name: playerName,
              steamId: matchedPlayer?.steamid ?? "",
              teamName: team.name,
              teamTag: team.tag,
              avatar: matchedPlayer?.avatarfull,
            };
          })
        );
        setPlayers(allPlayers);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Failed to fetch pro players");
      } finally {
        setLoading(false);
      }
    };

    fetchProPlayers();
  }, []);

  const handlePlayerClick = (steamId: string) => {
    if (!steamId) return;
    navigate(`/matches?steamId=${steamId}`);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#0F0F23]">
      <div className="w-16 h-16 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin shadow-neon-purple mb-4"></div>
        <p className="text-brand-primary font-bold animate-pulse">{t("proTeams.loading").toUpperCase()}</p>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0F0F23] p-4">
      <div className="app-card max-w-md text-center border-brand-danger/30 bg-white dark:bg-gaming-dark/60">
        <div className="text-5xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold text-brand-danger mb-2 uppercase">{t("leagues.syncError")}</h2>
        <p className="text-slate-500">{error}</p>
        <button onClick={() => window.location.reload()} className="app-button mt-6">{t("common.retry")}</button>
      </div>
    </div>
  );

  const teams = players.reduce((acc, player) => {
    if (!acc[player.teamName]) {
      acc[player.teamName] = {
        name: player.teamName,
        tag: player.teamTag,
        players: [],
      };
    }
    acc[player.teamName].players.push(player);
    return acc;
  }, {} as { [key: string]: { name: string; tag?: string; players: Player[] } });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl sm:text-6xl font-black heading-display mb-4 bg-gradient-to-r from-purple-600 to-brand-accent dark:from-brand-primary dark:to-brand-accent bg-clip-text text-transparent">
          {t("proTeams.title")}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          {t("proTeams.subtitle")}
        </p>
      </div>

      <div className="grid gap-8">
        {Object.values(teams).map((team) => (
          <div key={team.name} className="app-card bg-white dark:bg-gaming-dark/60 border-l-4 border-l-brand-primary overflow-hidden">
            <div className="flex items-center justify-between mb-6 border-b border-slate-100 dark:border-gaming-border/10 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-primary/10 rounded-xl flex items-center justify-center text-brand-primary font-black">
                  {team.tag || team.name[0]}
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  {team.name}
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                {t("proTeams.activePlayers", { count: team.players.length })}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {team.players.map((player) => (
                <div
                  key={player.name}
                  onClick={() => handlePlayerClick(player.steamId)}
                  className={`group relative p-4 rounded-2xl border border-slate-100 dark:border-gaming-border/20 bg-slate-50 dark:bg-gaming-muted/20 hover:border-brand-primary/50 transition-all duration-300 ${player.steamId ? 'cursor-pointer hover:scale-[1.05] hover:shadow-lg' : 'opacity-60'}`}
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="relative mb-3">
                      <div className="absolute -inset-1 bg-brand-primary rounded-full blur opacity-0 group-hover:opacity-30 transition-opacity"></div>
                      <img
                        src={player.avatar || `https://ui-avatars.com/api/?name=${player.name}&background=6366f1&color=fff`}
                        alt={player.name}
                        className="relative w-16 h-16 rounded-full border-2 border-white dark:border-gaming-border/40 object-cover"
                      />
                    </div>
                    <h3 className="font-black text-slate-800 dark:text-slate-200 group-hover:text-brand-primary transition-colors truncate w-full">
                      {player.name}
                    </h3>
                    {player.steamId ? (
                      <span className="text-[10px] font-bold text-brand-primary uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {t("common.viewStats")}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                        {t("common.private")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProTeams;
