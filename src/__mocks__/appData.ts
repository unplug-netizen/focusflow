import { AppUsage } from "../types";

export const MOCK_APPS: AppUsage[] = [
  {
    packageName: "com.instagram.android",
    appName: "Instagram",
    usageTime: 45,
    dailyLimit: 60,
    isBlocked: false,
    category: "social",
  },
  {
    packageName: "com.whatsapp",
    appName: "WhatsApp",
    usageTime: 120,
    dailyLimit: 180,
    isBlocked: false,
    category: "communication",
  },
  {
    packageName: "com.youtube.android",
    appName: "YouTube",
    usageTime: 90,
    dailyLimit: 120,
    isBlocked: true,
    category: "entertainment",
  },
  {
    packageName: "com.tiktok.android",
    appName: "TikTok",
    usageTime: 30,
    dailyLimit: 30,
    isBlocked: true,
    category: "social",
  },
  {
    packageName: "com.spotify.music",
    appName: "Spotify",
    usageTime: 180,
    isBlocked: false,
    category: "entertainment",
  },
  {
    packageName: "com.android.chrome",
    appName: "Chrome",
    usageTime: 60,
    dailyLimit: 120,
    isBlocked: false,
    category: "productivity",
  },
];
