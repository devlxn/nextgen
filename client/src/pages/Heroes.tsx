import { useState, useEffect } from "react";
import { getHeroImagePath, heroes } from "../data/heroes";
import { Link } from "react-router-dom";
import { Search, ChevronDown, ChevronRight, Swords, Shield, Brain, Gem } from "lucide-react";
import { useLanguage } from "../i18n/LanguageContext";

interface Hero {
  id: number;
  name: string;
  localized_name: string;
  primary_attr: string;
  attack_type: string;
  roles: string[];
  legs: number;
}

function Heroes() {
  const [search, setSearch] = useState("");
  const [attrFilter, setAttrFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
  }, []);

  const attributeMap: { [key: string]: string } = {
    str: t("heroes.strength"),
    agi: t("heroes.agility"),
    int: t("heroes.intelligence"),
    all: t("heroes.universal"),
  };

  const filteredHeroes: Hero[] = heroes.filter((hero: Hero) => {
    const matchesSearch = hero.localized_name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchesAttr = attrFilter ? hero.primary_attr === attrFilter : true;
    const matchesRole = roleFilter ? hero.roles.includes(roleFilter) : true;
    return matchesSearch && matchesAttr && matchesRole;
  });

  const attributes = ["str", "agi", "int", "all"];
  const roles = [
    "Carry",
    "Support",
    "Nuker",
    "Disabler",
    "Durable",
    "Escape",
    "Pusher",
    "Initiator",
  ];

  const getAttributeIcon = (attr: string) => {
    switch (attr) {
      case 'str': return <Shield size={14} className="inline-block mr-1" />;
      case 'agi': return <Swords size={14} className="inline-block mr-1" />;
      case 'int': return <Brain size={14} className="inline-block mr-1" />;
      case 'all': return <Gem size={14} className="inline-block mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-accent drop-shadow-sm dark:drop-shadow-neon mb-4 uppercase italic heading-display">
            {t("heroes.title")}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 font-medium max-w-2xl mx-auto">
            {t("heroes.subtitle")}
          </p>
        </div>

        <div className="app-card mb-10 p-6 border-slate-200 dark:border-brand-primary/20">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative flex-grow w-full group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-primary transition-colors" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("heroes.searchPlaceholder")}
                className="app-input w-full pl-12 py-3.5 text-lg"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="relative w-full sm:w-auto">
                <select
                  value={attrFilter}
                  onChange={(e) => setAttrFilter(e.target.value)}
                  className="app-input min-w-[180px] appearance-none pr-10"
                >
                  <option value="">{t("heroes.allAttributes")}</option>
                  {attributes.map((attr) => (
                    <option key={attr} value={attr}>
                      {attributeMap[attr]}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" size={20} />
              </div>
              <div className="relative w-full sm:w-auto">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="app-input min-w-[180px] appearance-none pr-10"
                >
                  <option value="">{t("heroes.allRoles")}</option>
                  {roles.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary pointer-events-none" size={20} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredHeroes.map((hero: Hero) => (
            <div
              key={hero.id}
              className="app-card group p-0 overflow-hidden relative transition-all duration-300 hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-neon-purple border-l-4 border-l-brand-primary"
            >
              <Link to={`/heroes/${hero.id}/matchups`} className="block relative aspect-video overflow-hidden">
                <img
                  src={getHeroImagePath(hero.id)}
                  alt={hero.localized_name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
                  <span className="text-white text-sm font-black uppercase tracking-widest flex items-center gap-2">
                    {t("heroes.viewMatchups")} <ChevronRight size={16} className="text-brand-accent" />
                  </span>
                </div>
              </Link>
              
              <div className="p-5 relative">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white group-hover:text-brand-primary transition-colors leading-tight uppercase tracking-tight">
                    {hero.localized_name}
                  </h3>
                  <span className={`text-[10px] uppercase tracking-widest font-black px-2.5 py-1 rounded-full flex items-center gap-1 border
                    ${hero.primary_attr === 'str' ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20' :
                      hero.primary_attr === 'agi' ? 'bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20' :
                      hero.primary_attr === 'int' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' :
                      'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'
                    }`}>
                    {getAttributeIcon(hero.primary_attr)}
                    {hero.primary_attr}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t("heroes.attackType")}</span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{hero.attack_type === "Melee" ? t("heroes.melee") : t("heroes.ranged")}</span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {hero.roles.slice(0, 3).map(role => (
                      <span key={role} className="text-[9px] font-black uppercase tracking-tighter bg-slate-100 dark:bg-gaming-muted/50 text-slate-500 dark:text-slate-400 px-2 py-1 rounded border border-slate-200 dark:border-gaming-border/10">
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Subtle background glow for dark mode */}
                <div className="absolute -bottom-10 -right-10 w-24 h-24 bg-brand-primary/5 rounded-full blur-2xl group-hover:bg-brand-primary/10 transition-all duration-500 pointer-events-none"></div>
              </div>
            </div>
          ))}
        </div>
        
        {filteredHeroes.length === 0 && (
          <div className="text-center py-20 app-card bg-slate-500/5 border-dashed border-2 border-slate-200 dark:border-slate-800">
            <p className="text-slate-500 text-xl font-bold uppercase tracking-tight">{t("heroes.noHeroes")}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Heroes;
