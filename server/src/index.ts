import express, { RequestHandler } from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import session from "express-session";
import passport from "passport";
import { Strategy as SteamStrategy } from "passport-steam";
import cors from "cors";
import axios from "axios";
import axiosRetry from "axios-retry";
import User from "./models/User";
import Match from "./models/Match";
import { createClient } from "redis";
import RedisStore from "connect-redis";

// Расширение типа Session для поддержки passport
declare module "express-session" {
  interface Session {
    passport?: {
      user: string;
    };
  }
}

dotenv.config();

// Настройка Redis
const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://127.0.0.1:6379"
});

redisClient.connect().catch(console.error);

const redisStore = new RedisStore({
  client: redisClient,
  prefix: "dotaw:",
});

// Настройка axios с агрессивными повторными попытками
axiosRetry(axios, {
  retries: 5,
  retryDelay: (retryCount) => retryCount * 5000,
  retryCondition: (error) => {
    return (
      axiosRetry.isNetworkOrIdempotentRequestError(error) ||
      error.response?.status === 429 ||
      error.response?.status === 504 ||
      error.code === 'ECONNABORTED' ||
      error.message.includes('timeout')
    );
  },
});

interface SteamProfile {
  id: string;
  displayName: string;
  photos: { value: string }[];
  [key: string]: any;
}

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["https://dotaw-tracker.vercel.app", "http://localhost:5173"],
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
app.use(
  session({
    store: redisStore,
    secret: process.env.SESSION_SECRET || "hBlGYtAWhM",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use(passport.initialize());
app.use(passport.session());

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/dotaw")
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Passport
passport.serializeUser((user: any, done) => {
  done(null, user.steamId);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await User.findOne({ steamId: id });
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(
  new SteamStrategy(
    {
      returnURL: process.env.RETURN_URL || "http://localhost:5000/auth/steam/return",
      realm: process.env.REALM || "http://localhost:5000/",
      apiKey: process.env.STEAM_API_KEY || "",
    },
    async (identifier: string, profile: SteamProfile, done: any) => {
      try {
        const user = await User.findOneAndUpdate(
          { steamId: profile.id },
          {
            steamId: profile.id,
            displayName: profile.displayName,
            avatar: profile.photos?.[2]?.value || "",
          },
          { upsert: true, new: true }
        );
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

// Routes
app.get("/auth/steam", passport.authenticate("steam"));

app.get(
  "/auth/steam/return",
  passport.authenticate("steam", { failureRedirect: "http://localhost:5173/profile" }),
  (req, res) => {
    res.redirect("http://localhost:5173/profile");
  }
);

app.get("/api/user", (req, res) => {
  res.json(req.user || null);
});

app.get("/api/logout", (req, res) => {
  req.logout(() => {
    res.redirect("http://localhost:5173/profile");
  });
});

app.get("/api/matches/:steamId", async (req, res) => {
  const { steamId } = req.params;
  const page = parseInt(req.query.page as string || "1");
  const limit = parseInt(req.query.limit as string || "20");
  const skip = (page - 1) * limit;

  try {
    const STEAM_ID_BASE = BigInt("76561197960265728");
    const accountId = String(BigInt(steamId) - STEAM_ID_BASE);

    const cacheKey = `matches:${steamId}:${page}`;
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) return res.json(JSON.parse(cachedData));

    const response = await axios.get(
      `https://api.opendota.com/api/players/${accountId}/matches`,
      { params: { limit: 100 }, timeout: 45000 }
    );

    const allMatches = response.data;
    const result = {
      matches: allMatches.slice(skip, skip + limit),
      totalPages: Math.ceil(allMatches.length / limit),
      currentPage: page,
      totalMatches: allMatches.length,
    };

    await redisClient.setEx(cacheKey, 600, JSON.stringify(result));
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch matches" });
  }
});

app.get("/api/match/:matchId", async (req, res) => {
  const { matchId } = req.params;
  const cacheKey = `match:${matchId}`;

  try {
    console.log(`[DEBUG] Fetching match details for ID: ${matchId}`);
    const cachedMatch = await redisClient.get(cacheKey);
    if (cachedMatch) {
      const data = JSON.parse(cachedMatch);
      if (data.players && data.players.length > 0) {
        console.log(`[DEBUG] Match ${matchId} found in cache with ${data.players.length} players.`);
        return res.json(data);
      }
      console.log(`[DEBUG] Match ${matchId} in cache is incomplete, re-fetching...`);
      await redisClient.del(cacheKey);
    }

    console.log(`[DEBUG] Requesting full match data from OpenDota API for ${matchId}...`);
    // Для про-матчей иногда лучше НЕ использовать сжатие, если сервер OpenDota обрывает соединение при попытке сжать огромный файл
    const response = await axios.get(
      `https://api.opendota.com/api/matches/${matchId}`,
      { 
        timeout: 180000, // Увеличиваем до 3 минут
        headers: { 
          'Accept-Encoding': 'identity', // Просим данные без сжатия, чтобы серверу было проще их отдавать по частям
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity
      }
    );

    if (!response.data || !response.data.players) {
      console.error(`[ERROR] OpenDota returned match data for ${matchId} but players array is missing!`);
      return res.status(404).json({ error: "Match data is incomplete. OpenDota might still be parsing this pro match." });
    }

    console.log(`[DEBUG] Successfully received ${response.data.players.length} players for match ${matchId}. Caching...`);
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(response.data));
    res.json(response.data);
  } catch (err: any) {
    console.error(`[CRITICAL ERROR] Match ${matchId} fetch failed:`, {
      message: err.message,
      status: err.response?.status,
      code: err.code,
      url: err.config?.url
    });
    
    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return res.status(504).json({ error: "OpenDota API timed out. Pro matches are very large and sometimes the API is too slow to respond." });
    }
    
    res.status(500).json({ error: `Failed to fetch match details: ${err.message}` });
  }
});

// Leagues Routes - Using specific IDs to avoid heavy /leagues request
app.get("/api/leagues", async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const leaguesPath = path.join(__dirname, '../data/leagues.json');
    
    if (!fs.existsSync(leaguesPath)) {
      return res.status(404).json({ error: "Leagues data file not found" });
    }

    const page = parseInt(req.query.page as string || "1");
    const limit = parseInt(req.query.limit as string || "21");
    const search = (req.query.search as string || "").toLowerCase();
    const skip = (page - 1) * limit;

    const rawData = fs.readFileSync(leaguesPath, 'utf8');
    const allLeagues = JSON.parse(rawData);

    // Фильтруем по тирам (Premium + Professional) и поисковому запросу
    let filteredLeagues = allLeagues.filter((l: any) => 
      l && 
      (l.tier === "premium" || l.tier === "professional") &&
      (l.name || "").toLowerCase().includes(search)
    );

    // Сортируем по ID (новые сверху)
    filteredLeagues.sort((a: any, b: any) => (b.leagueid || 0) - (a.leagueid || 0));

    const totalPages = Math.ceil(filteredLeagues.length / limit);
    const paginatedLeagues = filteredLeagues.slice(skip, skip + limit);

    res.json({
      leagues: paginatedLeagues,
      totalPages,
      currentPage: page,
      totalLeagues: filteredLeagues.length
    });
  } catch (err: any) {
    console.error("Leagues local error:", err.message);
    res.status(500).json({ error: "Failed to process local leagues data" });
  }
});

app.get("/api/leagues/:leagueId", async (req, res) => {
  const { leagueId } = req.params;
  const cacheKey = `league:${leagueId}`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const response = await axios.get(`https://api.opendota.com/api/leagues/${leagueId}`, {
      timeout: 30000
    });
    
    const league = Array.isArray(response.data) ? response.data[0] : response.data;
    if (!league) return res.status(404).json({ error: "League not found" });

    await redisClient.setEx(cacheKey, 86400, JSON.stringify(league));
    res.json(league);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch league details" });
  }
});

app.get("/api/leagues/:leagueId/matches", async (req, res) => {
  const { leagueId } = req.params;
  const cacheKey = `league:${leagueId}:matches`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const response = await axios.get(`https://api.opendota.com/api/leagues/${leagueId}/matches`, {
      timeout: 45000
    });
    
    const matches = Array.isArray(response.data) ? response.data : [];
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(matches));
    res.json(matches);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch league matches" });
  }
});

app.get("/api/leagues/:leagueId/teams", async (req, res) => {
  const { leagueId } = req.params;
  const cacheKey = `league:${leagueId}:teams`;
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return res.json(JSON.parse(cached));

    const response = await axios.get(`https://api.opendota.com/api/leagues/${leagueId}/teams`, {
      timeout: 45000
    });
    
    const teams = Array.isArray(response.data) ? response.data : [];
    await redisClient.setEx(cacheKey, 86400, JSON.stringify(teams));
    res.json(teams);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch league teams" });
  }
});

app.get("/api/search", async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: "Query required" });

  try {
    const accountId = String(query).trim();
    const cacheKey = `search:${accountId}`;
    const cachedSearch = await redisClient.get(cacheKey);
    if (cachedSearch) return res.json(JSON.parse(cachedSearch));

    const response = await axios.get(
      `https://api.opendota.com/api/players/${accountId}`,
      { timeout: 20000 }
    );

    if (response.data && response.data.profile) {
      const result = [{
        steamId: String(BigInt(accountId) + BigInt("76561197960265728")),
        displayName: response.data.profile.personaname,
        avatar: response.data.profile.avatarfull,
      }];
      await redisClient.setEx(cacheKey, 3600, JSON.stringify(result));
      return res.json(result);
    }
    res.status(404).json({ error: "Player not found" });
  } catch (err: any) {
    res.status(500).json({ error: "Search failed" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});