"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Activity,
  ArrowDownToLine,
  Calendar,
  ClipboardCheck,
  Download,
  Filter,
  History,
  Loader2,
  RefreshCw,
  Search,
  Share2,
  Table,
  TrendingUp,
  Users,
} from "lucide-react";
import {
  DASHBOARD_DATE_RANGES,
  DASHBOARD_PLATFORM_FILTERS,
  DASHBOARD_STATUS_FILTERS,
  type ClientDashboardFilters,
  type DateRangeValue,
  type PlatformFilterValue,
  type StatusFilterValue,
} from "../lib/client-dashboard/config";

export type {
  ClientDashboardFilters,
  DateRangeValue,
  PlatformFilterValue,
  StatusFilterValue,
} from "../lib/client-dashboard/config";

const ALL_CLIENTS_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/cv/clients/";

const OUTREACH_REPORT_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/all";

const ACTION_SUCCESS_RATE_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/daily-success-metrics";

const CAMPAIGN_VELOCITY_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/get-campaign-velocity";

const CLIENT_METRICS_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/client-metrics";

const ENGAGEMENT_QUALITY_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/engagement-quality-score";

const EXECUTIVE_SUMMARY_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/executive-summary";

const BREAKDOWN_BY_PLATFORM_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/break-by-platform";

const TIME_SERIES_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach/report/time-series";

type OutreachAction = {
  item: string;
  action: "follow" | "connect" | "like" | "message";
  item_count?: number;
  message_content?: string;
};

type ClientMeta = {
  name?: string;
  profile_url?: string;
  business_name?: string;
};

type OutreachRecord = {
  id: string;
  created_at: string;
  session: string;
  architect_id?: string;
  status?: string;
  client_id?: string;
  actions?: OutreachAction[];
  platform?: string;
  purpose?: string;
  follow_status?: string | null;
  connection_status?: string | null;
  like_post_count?: string | number | null;
  message_status?: string | null;
  client?: ClientMeta;
  url?: string;
  username?: string;
  created_by?: string;
};

type AllOutreachEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    pagination?: {
      pageNumber: number;
      pageSize: number;
      totalCount: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPreviousPage: boolean;
    };
    recordsReturned?: number;
  };
  data: OutreachRecord[];
};

type ActionSuccessRateEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    calculatedAt: string;
  };
  metrics: {
    sessions: {
      total_sessions: number;
      successful_sessions: number;
      failed_sessions: number;
      inprogress_sessions: number;
      success_rate_percentage: number;
    };
    connections: {
      total_connections_attempted: number;
      successful_connections: number;
      connection_success_rate_percentage: number;
    };
    follows: {
      total_follows_attempted: number;
      successful_follows: number;
      follow_success_rate_percentage: number;
    };
  };
};

type CampaignVelocityEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    totalDaysInRange: number;
    totalWeeksInRange: number;
    activeDays: number;
    generatedAt: string;
  };
  velocity: {
    total_sessions: number;
    avg_sessions_per_day: number;
    avg_sessions_per_week: number;
    first_session: string;
    last_session: string;
  };
  heatmap: {
    most_active_day: {
      day_number: number;
      day_name: string;
      session_count: number;
    };
    most_active_hour: {
      hour: number;
      hour_label: string;
      session_count: number;
    };
    day_of_week: {
      day_number: number;
      day_name: string;
      session_count: number;
    }[];
    hour_of_day: {
      hour: number;
      hour_label: string;
      session_count: number;
    }[];
  };
  weekly_breakdown: {
    week_start: string;
    session_count: number;
  }[];
  pace_comparison: unknown | null;
};

type ClientMetricsEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
    totalClients: number;
    totalSessions: number;
    avgSessionsPerClient: number;
  };
  leaderboard: {
    rank: number;
    client_id: string;
    client_name: string | null;
    client_business_name: string | null;
    client_details: Record<string, unknown>;
    metrics: {
      total_sessions: number;
      successful_sessions: number;
      failed_sessions: number;
      inprogress_sessions: number;
      success_rate_percentage: number;
      total_connections: number;
      total_follows: number;
      avg_likes_per_session: number;
    };
  }[];
};

type EngagementQualityEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
    scoringRules: Record<string, unknown>;
  };
  summary: {
    total_sessions: number;
    average_quality_score: number;
    high_quality_sessions: number;
    medium_quality_sessions: number;
    low_quality_sessions: number;
    high_quality_percentage: number;
  };
  quality_by_platform: Record<string, unknown>;
  quality_by_client: unknown[];
  quality_distribution: { range: string; count: number }[];
  sessions: {
    session_id: string;
    platform: string;
    client_id: string;
    status: string;
    created_at: string;
    quality_score: number;
    completion_percentage: number;
    quality_category: "high" | "medium" | "low" | string;
    score_breakdown: Record<string, unknown>;
  }[];
};

type ExecutiveSummaryEnvelope = {
  success: boolean;
  summary: {
    total_sessions: number;
    success_rate: number;
    date_range: string;
    date_range_label: string;
    start_date: string;
    end_date: string;
    last_updated: string;
  };
  platforms: Record<string, unknown>;
  metrics: Record<string, unknown>;
  highlights: {
    rank: number;
    metric: string;
    value: number;
    type: string;
    category: string;
  }[];
  concerns: {
    rank: number;
    metric: string;
    value: number;
    type: string;
    category: string;
    recommendation: string;
  }[];
};

type PlatformBreakdownEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    generatedAt: string;
  };
  data: {
    [platform: string]: {
      total_sessions: number;
      success_rate: number;
      total_connections: number;
      total_follows: number;
    };
  };
};

type TimeSeriesEnvelope = {
  success: boolean;
  metadata: {
    dateRange: string;
    startDate: string;
    endDate: string;
    granularity: string;
    dataPoints: number;
    generatedAt: string;
  };
  summary: {
    total_sessions: number;
    successful_sessions: number;
    connections: number;
    follows: number;
    likes: number;
    avg_success_rate: number;
  };
  data: {
    date: string;
    total_sessions: number;
    successful_sessions: number;
    success_rate: number;
    connections: number;
    follows: number;
    likes: number;
  }[];
};

type PlatformSummary = {
  platform: string;
  totalProfiles: number;
  totalFollows: number;
  totalConnections: number;
  totalLikes: number;
  totalMessages: number;
  successRate: number;
};

type ActionSummary = {
  follows: SummaryBlock;
  connections: SummaryBlock;
  likes: SummaryBlock & { successfulLikes: number; totalLikes: number };
  messages: SummaryBlock;
};

type SummaryBlock = {
  total: number;
  success: number;
  pending: number;
  failed: number;
};

type TimelineData = {
  heatmap: { date: string; count: number }[];
  line: { label: string; count: number }[];
  recent: {
    id: string;
    title: string;
    platform: string;
    status: string;
    timestamp: string;
    actions: string;
  }[];
};

type SuccessMetrics = {
  connectionAcceptanceRate: number;
  engagementRate: number;
  avgActionsPerProfile: number;
  responseTimeHours: number | null;
};

type ProfileRow = {
  id: string;
  username: string;
  url?: string;
  actionsTaken: string[];
  status: string;
  lastAction: string;
  platform: string;
};

type SessionRow = {
  id: string;
  startedAt: string;
  status: string;
  profiles: number;
  completed: number;
  failed: number;
};

type AggregatedData = {
  overview: {
    client?: ClientMeta;
    totalProfiles: number;
    activeCampaigns: number;
    totalRecords: number;
  };
  platformCards: PlatformSummary[];
  actionSummary: ActionSummary;
  timeline: TimelineData;
  successMetrics: SuccessMetrics;
  profiles: ProfileRow[];
  sessions: SessionRow[];
};

const STATUS_SUCCESS = new Set(["success", "completed", "done"]);
const STATUS_FAILED = new Set(["failed", "error", "declined"]);

// Helper to create fetch options with ngrok bypass header
const fetchOptions = {
  cache: "no-store" as RequestCache,
  headers: {
    "ngrok-skip-browser-warning": "true",
  },
};

function classifyStatus(value?: string | null): "success" | "failed" | "pending" {
  if (!value) return "pending";
  const lowered = value.toString().toLowerCase();
  if (STATUS_SUCCESS.has(lowered)) return "success";
  if (STATUS_FAILED.has(lowered)) return "failed";
  return "pending";
}

function formatNumber(value: number): string {
  return Intl.NumberFormat("en-GB", { maximumFractionDigits: 1 }).format(value);
}

function formatDate(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    const seconds = String(d.getSeconds()).padStart(2, '0');
    return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
  } catch {
    return "N/A";
  }
}

function formatDateOnly(date: string | Date): string {
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "N/A";
  }
}

function normalizeDate(date: string): string {
  try {
    return new Date(date).toISOString().split("T")[0] ?? "";
  } catch {
    return "";
  }
}

function parseLikeCounts(record: OutreachRecord): { attempted: number; successful: number } {
  const raw = record.like_post_count;
  if (typeof raw === "string" && raw.includes("/")) {
    const [succ, total] = raw.split("/").map((n) => Number(n));
    if (Number.isFinite(succ) && Number.isFinite(total)) {
      return { attempted: total, successful: succ };
    }
  }

  if (typeof raw === "number") {
    return { attempted: raw, successful: raw };
  }

  const likeActions =
    record.actions?.filter((action) => action.action === "like") ?? [];
  const attempted = likeActions.reduce((sum, action) => sum + (action.item_count ?? 1), 0);
  return { attempted, successful: attempted };
}

function buildAggregations(
  records: OutreachRecord[],
  campaignVelocity?: CampaignVelocityEnvelope | null,
  engagementQuality?: EngagementQualityEnvelope | null,
  timeSeries?: TimeSeriesEnvelope | null
): AggregatedData {
  const profileMap = new Map<string, ProfileRow>();
  const sessionMap = new Map<string, SessionRow>();
  const platformMap = new Map<string, PlatformSummary>();
  const heatmapCounts = new Map<string, number>();
  const client = records[0]?.client;

  // Build quality lookup map from engagement quality data
  const qualityMap = new Map<string, EngagementQualityEnvelope["sessions"][0]>();
  if (engagementQuality?.sessions) {
    engagementQuality.sessions.forEach((session) => {
      qualityMap.set(session.session_id, session);
    });
  }

  const actionSummary: ActionSummary = {
    follows: { total: 0, success: 0, pending: 0, failed: 0 },
    connections: { total: 0, success: 0, pending: 0, failed: 0 },
    likes: { total: 0, success: 0, pending: 0, failed: 0, successfulLikes: 0, totalLikes: 0 },
    messages: { total: 0, success: 0, pending: 0, failed: 0 },
  };

  records.forEach((record) => {
    const profileKey = record.username || record.url || record.id;
    const actionsTaken = new Set<string>();
    const dayKey = normalizeDate(record.created_at);
    heatmapCounts.set(dayKey, (heatmapCounts.get(dayKey) ?? 0) + 1);

    const platform = (record.platform ?? "unknown").toLowerCase();
    if (!platformMap.has(platform)) {
      platformMap.set(platform, {
        platform,
        totalProfiles: 0,
        totalFollows: 0,
        totalConnections: 0,
        totalLikes: 0,
        totalMessages: 0,
        successRate: 0,
      });
    }
    const platformEntry = platformMap.get(platform)!;
    platformEntry.totalProfiles += 1;
    if (classifyStatus(record.status) === "success") {
      platformEntry.successRate += 1;
    }

    const sessionId = record.session || "unknown-session";
    if (!sessionMap.has(sessionId)) {
      let status = record.status ?? "pending";
      // Optionally refine status based on quality category if available
      const qualityEntry = qualityMap.get(sessionId);
      if (qualityEntry?.quality_category) {
        // Keep existing status logic but can subtly adjust if needed
        // For now, we'll keep the base status as-is to avoid UI changes
        status = record.status ?? "pending";
      }
      sessionMap.set(sessionId, {
        id: sessionId,
        startedAt: record.created_at,
        status,
        profiles: 0,
        completed: 0,
        failed: 0,
      });
    }
    const sessionEntry = sessionMap.get(sessionId)!;
    sessionEntry.profiles += 1;

    const followState = classifyStatus(record.follow_status);
    const connectState = classifyStatus(record.connection_status);
    const messageState = classifyStatus(record.message_status);
    const likeCounts = parseLikeCounts(record);

    record.actions?.forEach((action) => {
      actionsTaken.add(action.action);
      switch (action.action) {
        case "follow":
          actionSummary.follows.total += 1;
          platformEntry.totalFollows += 1;
          actionSummary.follows[followState] += 1;
          if (followState === "success") sessionEntry.completed += 1;
          if (followState === "failed") sessionEntry.failed += 1;
          break;
        case "connect":
          actionSummary.connections.total += 1;
          platformEntry.totalConnections += 1;
          actionSummary.connections[connectState] += 1;
          if (connectState === "success") sessionEntry.completed += 1;
          if (connectState === "failed") sessionEntry.failed += 1;
          break;
        case "like":
          actionSummary.likes.total += 1;
          platformEntry.totalLikes += action.item_count ?? 1;
          break;
        case "message":
          actionSummary.messages.total += 1;
          platformEntry.totalMessages += 1;
          actionSummary.messages[messageState] += 1;
          if (messageState === "success") sessionEntry.completed += 1;
          if (messageState === "failed") sessionEntry.failed += 1;
          break;
        default:
          break;
      }
    });

    actionSummary.likes.totalLikes += likeCounts.attempted;
    actionSummary.likes.successfulLikes += likeCounts.successful;
    if (classifyStatus(record.status) === "pending") {
      actionSummary.likes.pending += 1;
    } else if (classifyStatus(record.status) === "failed") {
      actionSummary.likes.failed += 1;
    } else {
      actionSummary.likes.success += 1;
    }

    if (!profileMap.has(profileKey)) {
      profileMap.set(profileKey, {
        id: record.id,
        username: record.username ?? "Unknown profile",
        url: record.url,
        actionsTaken: Array.from(actionsTaken),
        status: record.status ?? "pending",
        lastAction: record.created_at,
        platform: platform,
      });
    } else {
      const row = profileMap.get(profileKey)!;
      // Combine arrays first, then create Set to avoid spread operator on Set
      const combinedActions = row.actionsTaken.concat(Array.from(actionsTaken));
      row.actionsTaken = Array.from(new Set(combinedActions));
      row.status = record.status ?? row.status;
      if (new Date(record.created_at).getTime() > new Date(row.lastAction).getTime()) {
        row.lastAction = record.created_at;
      }
    }
  });

  const platformCards = Array.from(platformMap.values()).map((entry) => {
    const successRate = entry.totalProfiles
      ? Math.round((entry.successRate / entry.totalProfiles) * 100)
      : 0;
    return { ...entry, successRate };
  });

  const totalProfiles = profileMap.size;
  const allSessions = Array.from(sessionMap.values());
  const activeCampaigns = allSessions.filter((s) => classifyStatus(s.status) === "pending").length;

  const timeline = buildTimelineData(heatmapCounts, records, campaignVelocity ?? undefined, timeSeries ?? undefined);
  // Note: successMetrics will be computed separately with backend data if available
  const successMetrics = buildSuccessMetrics(actionSummary, totalProfiles, undefined, engagementQuality);

  return {
    overview: {
      client,
      totalProfiles,
      activeCampaigns,
      totalRecords: records.length,
    },
    platformCards,
    actionSummary,
    timeline,
    successMetrics,
    profiles: Array.from(profileMap.values()),
    sessions: allSessions,
  };
}

function buildTimelineData(
  counts: Map<string, number>,
  records: OutreachRecord[],
  velocity?: CampaignVelocityEnvelope | null,
  timeSeries?: TimeSeriesEnvelope | null
): TimelineData {
  const today = new Date();
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 27; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().split("T")[0];
    heatmap.push({ date: key, count: counts.get(key) ?? 0 });
  }

  // Use time series data if available, otherwise fall back to velocity or existing logic
  let line: { label: string; count: number }[];
  if (timeSeries) {
    line = timeSeries.data.map((d) => ({
      label: d.date,
      count: d.total_sessions,
    }));
  } else if (velocity) {
    line = velocity.weekly_breakdown.map((w) => ({
      label: w.week_start,
      count: w.session_count,
    }));
  } else {
    const weeklyCounts = new Map<string, number>();
    heatmap.forEach((entry) => {
      const weekLabel = entry.date.slice(0, 7); // YYYY-MM
      weeklyCounts.set(weekLabel, (weeklyCounts.get(weekLabel) ?? 0) + entry.count);
    });
    line = Array.from(weeklyCounts.entries()).map(([label, count]) => ({ label, count }));
  }

  const recent = [...records]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 12)
    .map((record) => ({
      id: record.id,
      title: record.client?.name ?? record.username ?? "Unlabelled profile",
      platform: record.platform ?? "unknown",
      status: record.status ?? "pending",
      timestamp: record.created_at,
      actions: record.actions?.map((a) => a.action).join(", ") ?? "N/A",
    }));

  return {
    heatmap,
    line,
    recent,
  };
}

function buildSuccessMetrics(
  summary: ActionSummary,
  profiles: number,
  backend?: ActionSuccessRateEnvelope["metrics"],
  engagementQuality?: EngagementQualityEnvelope | null
): SuccessMetrics {
  const connectionAcceptanceRate = backend
    ? backend.connections.connection_success_rate_percentage
    : summary.connections.total
    ? (summary.connections.success / summary.connections.total) * 100
    : 0;

  const totalActionsAttempted =
    summary.follows.total +
    summary.connections.total +
    summary.likes.totalLikes +
    summary.messages.total;

  const totalActionsSuccessful =
    summary.follows.success +
    summary.connections.success +
    summary.likes.successfulLikes +
    summary.messages.success;

  const engagementRate = engagementQuality && engagementQuality.summary
    ? engagementQuality.summary.average_quality_score
    : backend
    ? backend.sessions.success_rate_percentage
    : totalActionsAttempted
    ? (totalActionsSuccessful / totalActionsAttempted) * 100
    : 0;

  const avgActionsPerProfile = profiles
    ? totalActionsAttempted / profiles
    : totalActionsAttempted;

  return {
    connectionAcceptanceRate,
    engagementRate,
    avgActionsPerProfile,
    responseTimeHours: null,
  };
}

type ClientDashboardProps = {
  standalone?: boolean;
  initialFilters?: Partial<ClientDashboardFilters>;
};

export default function ClientDashboard({
  standalone = false,
  initialFilters,
}: ClientDashboardProps) {
  const [filters, setFilters] = useState<ClientDashboardFilters>(() => ({
    clientId: initialFilters?.clientId ?? "",
    dateRange: initialFilters?.dateRange ?? "thisWeek",
    platform: initialFilters?.platform ?? "all",
    status: initialFilters?.status ?? "all",
  }));
  const [records, setRecords] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [actionSuccessMetrics, setActionSuccessMetrics] =
    useState<ActionSuccessRateEnvelope["metrics"] | null>(null);
  const [campaignVelocity, setCampaignVelocity] =
    useState<CampaignVelocityEnvelope | null>(null);
  const [clientMetrics, setClientMetrics] =
    useState<ClientMetricsEnvelope | null>(null);
  const [engagementQuality, setEngagementQuality] =
    useState<EngagementQualityEnvelope | null>(null);
  const [executiveSummary, setExecutiveSummary] =
    useState<ExecutiveSummaryEnvelope | null>(null);
  const [platformBreakdown, setPlatformBreakdown] =
    useState<PlatformBreakdownEnvelope | null>(null);
  const [timeSeries, setTimeSeries] =
    useState<TimeSeriesEnvelope | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Sync clientId filter when initialFilters.clientId prop changes (from global client toggle)
  useEffect(() => {
    if (initialFilters?.clientId !== undefined) {
      setFilters((prev) => {
        // Only update if the value actually changed
        if (prev.clientId !== initialFilters.clientId) {
          return { ...prev, clientId: initialFilters.clientId ?? "" };
        }
        return prev;
      });
    }
  }, [initialFilters?.clientId]);

  // Force refresh function
  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
    setError(null);
  };

  useEffect(() => {
    let active = true;
    async function load() {
      if (!filters.dateRange) return;
      setLoading(true);
      setError(null);
      try {
        let allRecords: OutreachRecord[] = [];
        
        // If no specific client is selected, fetch all clients and aggregate their data
        if (!filters.clientId || filters.clientId.trim() === "") {
          console.log("No client ID specified, fetching all clients first...");
          
          // First, get the list of all clients
          const clientsRes = await fetch(ALL_CLIENTS_ENDPOINT, fetchOptions);
          if (!clientsRes.ok) {
            throw new Error(`Failed to fetch clients list: ${clientsRes.status}`);
          }
          const clients = await clientsRes.json();
          const clientIds = Array.isArray(clients) 
            ? clients.map((c: any) => c.id || c.client_id || c.clientId).filter(Boolean)
            : [];
          
          console.log(`Found ${clientIds.length} clients, fetching data for each...`);
          
          // Fetch data for each client in parallel
          const baseParams = new URLSearchParams();
          baseParams.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
          baseParams.set("pageSize", "100");
          baseParams.set("pageNumber", "1");
          if (filters.platform !== "all") {
            baseParams.set("platform", filters.platform);
          }
          if (filters.status !== "all") {
            baseParams.set("status", filters.status);
          }
          
          const fetchPromises = clientIds.map(async (clientId: string) => {
            const params = new URLSearchParams(baseParams);
            params.set("clientId", String(clientId));
            const url = `${OUTREACH_REPORT_ENDPOINT}?${params.toString()}`;
            try {
              const res = await fetch(url, fetchOptions);
              if (!res.ok) {
                console.warn(`Failed to fetch data for client ${clientId}:`, res.status);
                return [];
              }
              const raw = await res.text();
              const trimmed = raw.trim();
              if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
                console.warn(`Client ${clientId}: Unexpected response format`, trimmed.substring(0, 100));
                return [];
              }
              let payload: AllOutreachEnvelope | AllOutreachEnvelope[] | null = null;
              try {
                payload = JSON.parse(raw);
              } catch (parseError) {
                console.warn(`Client ${clientId}: JSON parse error`, parseError);
                return [];
              }
              // Handle both array and object responses
              if (Array.isArray(payload)) {
                return payload.flatMap((chunk) => chunk.data ?? []);
              } else if (payload && typeof payload === "object" && "data" in payload) {
                return Array.isArray(payload.data) ? payload.data : [];
              }
              return [];
            } catch (err) {
              console.warn(`Error fetching data for client ${clientId}:`, err);
              return [];
            }
          });
          
          const results = await Promise.all(fetchPromises);
          allRecords = results.flat();
          console.log(`Aggregated ${allRecords.length} records from ${clientIds.length} clients`);
        } else {
          // Single client selected - fetch normally
          const params = new URLSearchParams();
          params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
          params.set("clientId", filters.clientId.trim());
          params.set("pageSize", "100");
          params.set("pageNumber", "1");
          if (filters.platform !== "all") {
            params.set("platform", filters.platform);
          }
          if (filters.status !== "all") {
            params.set("status", filters.status);
          }

          const url = `${OUTREACH_REPORT_ENDPOINT}?${params.toString()}`;
          console.log("Fetching outreach data from:", url);
          const res = await fetch(url, fetchOptions);
          if (!res.ok) {
            const errorText = await res.text().catch(() => "");
            console.error("Outreach report request failed:", res.status, errorText);
            throw new Error(`Request failed (${res.status}${errorText ? `: ${errorText.slice(0, 100)}` : ""})`);
          }
          const contentType = res.headers.get("content-type") || "";
          const raw = await res.text();
          
          // Check if response looks like JSON
          const trimmed = raw.trim();
          if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
            // Likely HTML or plain text error page
            if (trimmed.includes("<html") || trimmed.includes("<!DOCTYPE")) {
              console.error("Server returned HTML instead of JSON");
              throw new Error("Server returned an HTML page. The endpoint may be unavailable.");
            }
            console.error("Unexpected response format:", contentType, trimmed.substring(0, 200));
            throw new Error(`Unexpected response format. Expected JSON but got: ${contentType || "unknown"}`);
          }
          
          let payload: AllOutreachEnvelope | AllOutreachEnvelope[] | null = null;
          try {
            payload = JSON.parse(raw);
            console.log("Outreach data received:", { 
              isArray: Array.isArray(payload), 
              isObject: payload && typeof payload === "object" && !Array.isArray(payload),
              length: Array.isArray(payload) ? payload.length : 0,
              hasData: payload && typeof payload === "object" && "data" in payload,
              firstItem: Array.isArray(payload) && payload.length > 0 ? payload[0] : (payload && typeof payload === "object" ? payload : null)
            });
          } catch (parseError) {
            console.error("JSON parse error:", parseError, "Raw response:", raw.substring(0, 500));
            throw new Error(`Invalid JSON response: ${parseError instanceof Error ? parseError.message : "Parse error"}`);
          }
          
          // Handle both array and object responses
          if (Array.isArray(payload)) {
            allRecords = payload.flatMap((chunk) => chunk.data ?? []);
          } else if (payload && typeof payload === "object" && "data" in payload) {
            allRecords = Array.isArray(payload.data) ? payload.data : [];
          } else {
            console.warn("Unexpected payload format for outreach data:", payload);
            allRecords = [];
          }
          console.log("Extracted records:", allRecords.length);
        }

        if (!active) return;
        setRecords(allRecords);
        setLastUpdated(new Date().toISOString());
        console.log("✅ Records loaded successfully:", {
          totalRecords: allRecords.length,
          clientId: filters.clientId || "all clients",
          dateRange: filters.dateRange,
          platform: filters.platform,
          status: filters.status,
        });
      } catch (err) {
        if (!active) return;
        setError((err as Error).message || "Unable to load outreach data");
        setRecords([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [filters, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadActionSuccessMetrics() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${ACTION_SUCCESS_RATE_ENDPOINT}?${params.toString()}`;
        console.log("Fetching action success metrics from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Action success metrics request failed: ${res.status}`);
          if (!active) return;
          setActionSuccessMetrics(null);
          return;
        }
        const contentType = res.headers.get("content-type") || "";
        const raw = await res.text();
        
        // Check if response looks like JSON
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Action success metrics: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setActionSuccessMetrics(null);
          return;
        }
        
        let payload: ActionSuccessRateEnvelope | ActionSuccessRateEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Action success metrics: JSON parse error", parseError);
          if (!active) return;
          setActionSuccessMetrics(null);
          return;
        }
        if (!active) return;
        
        // Handle both array and object responses
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Action success metrics received (array):", payload[0]);
          setActionSuccessMetrics(payload[0].metrics);
        } else if (payload && typeof payload === "object" && "metrics" in payload) {
          console.log("Action success metrics received (object):", payload);
          setActionSuccessMetrics((payload as ActionSuccessRateEnvelope).metrics);
        } else {
          console.warn("Action success metrics: Invalid payload format", payload);
          setActionSuccessMetrics(null);
        }
      } catch (err) {
        if (!active) return;
        setActionSuccessMetrics(null);
      }
    }
    void loadActionSuccessMetrics();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadCampaignVelocity() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${CAMPAIGN_VELOCITY_ENDPOINT}?${params.toString()}`;
        console.log("Fetching campaign velocity from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Campaign velocity request failed: ${res.status}`);
          if (!active) return;
          setCampaignVelocity(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Campaign velocity: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setCampaignVelocity(null);
          return;
        }
        let payload: CampaignVelocityEnvelope | CampaignVelocityEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Campaign velocity: JSON parse error", parseError);
          if (!active) return;
          setCampaignVelocity(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Campaign velocity received (array):", payload[0]);
          setCampaignVelocity(payload[0]);
        } else if (payload && typeof payload === "object" && "velocity" in payload) {
          console.log("Campaign velocity received (object):", payload);
          setCampaignVelocity(payload as CampaignVelocityEnvelope);
        } else {
          console.warn("Campaign velocity: Invalid payload format", payload);
          setCampaignVelocity(null);
        }
      } catch (err) {
        if (!active) return;
        setCampaignVelocity(null);
      }
    }
    void loadCampaignVelocity();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadClientMetrics() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${CLIENT_METRICS_ENDPOINT}?${params.toString()}`;
        console.log("Fetching client metrics from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Client metrics request failed: ${res.status}`);
          if (!active) return;
          setClientMetrics(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Client metrics: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setClientMetrics(null);
          return;
        }
        let payload: ClientMetricsEnvelope | ClientMetricsEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Client metrics: JSON parse error", parseError);
          if (!active) return;
          setClientMetrics(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Client metrics received (array):", payload[0]);
          setClientMetrics(payload[0]);
        } else if (payload && typeof payload === "object" && "leaderboard" in payload) {
          console.log("Client metrics received (object):", payload);
          setClientMetrics(payload as ClientMetricsEnvelope);
        } else {
          console.warn("Client metrics: Invalid payload format", payload);
          setClientMetrics(null);
        }
      } catch (err) {
        if (!active) return;
        setClientMetrics(null);
      }
    }
    void loadClientMetrics();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadEngagementQuality() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${ENGAGEMENT_QUALITY_ENDPOINT}?${params.toString()}`;
        console.log("Fetching engagement quality from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Engagement quality request failed: ${res.status}`);
          if (!active) return;
          setEngagementQuality(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Engagement quality: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setEngagementQuality(null);
          return;
        }
        let payload: EngagementQualityEnvelope | EngagementQualityEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Engagement quality: JSON parse error", parseError);
          if (!active) return;
          setEngagementQuality(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Engagement quality received (array):", payload[0]);
          setEngagementQuality(payload[0]);
        } else if (payload && typeof payload === "object" && "summary" in payload) {
          console.log("Engagement quality received (object):", payload);
          setEngagementQuality(payload as EngagementQualityEnvelope);
        } else {
          console.warn("Engagement quality: Invalid payload format", payload);
          setEngagementQuality(null);
        }
      } catch (err) {
        if (!active) return;
        setEngagementQuality(null);
      }
    }
    void loadEngagementQuality();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadExecutiveSummary() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisQuarter" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${EXECUTIVE_SUMMARY_ENDPOINT}?${params.toString()}`;
        console.log("Fetching executive summary from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Executive summary request failed: ${res.status}`);
          if (!active) return;
          setExecutiveSummary(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Executive summary: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setExecutiveSummary(null);
          return;
        }
        let payload: ExecutiveSummaryEnvelope | ExecutiveSummaryEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Executive summary: JSON parse error", parseError);
          if (!active) return;
          setExecutiveSummary(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Executive summary received (array):", payload[0]);
          setExecutiveSummary(payload[0]);
        } else if (payload && typeof payload === "object" && "summary" in payload) {
          console.log("Executive summary received (object):", payload);
          setExecutiveSummary(payload as ExecutiveSummaryEnvelope);
        } else {
          console.warn("Executive summary: Invalid payload format", payload);
          setExecutiveSummary(null);
        }
      } catch (err) {
        if (!active) return;
        setExecutiveSummary(null);
      }
    }
    void loadExecutiveSummary();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    if (executiveSummary?.summary.last_updated) {
      setLastUpdated(executiveSummary.summary.last_updated);
    }
  }, [executiveSummary]);

  useEffect(() => {
    let active = true;
    async function loadPlatformBreakdown() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        // Note: platform filter may not apply to breakdown-by-platform endpoint
        // but including it for consistency - backend can ignore if not applicable
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${BREAKDOWN_BY_PLATFORM_ENDPOINT}?${params.toString()}`;
        console.log("Fetching platform breakdown from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Platform breakdown request failed: ${res.status}`);
          if (!active) return;
          setPlatformBreakdown(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Platform breakdown: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setPlatformBreakdown(null);
          return;
        }
        let payload: PlatformBreakdownEnvelope | PlatformBreakdownEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Platform breakdown: JSON parse error", parseError);
          if (!active) return;
          setPlatformBreakdown(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Platform breakdown received (array):", payload[0]);
          setPlatformBreakdown(payload[0]);
        } else if (payload && typeof payload === "object" && "data" in payload) {
          console.log("Platform breakdown received (object):", payload);
          setPlatformBreakdown(payload as PlatformBreakdownEnvelope);
        } else {
          console.warn("Platform breakdown: Invalid payload format", payload);
          setPlatformBreakdown(null);
        }
      } catch (err) {
        if (!active) return;
        setPlatformBreakdown(null);
      }
    }
    void loadPlatformBreakdown();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  useEffect(() => {
    let active = true;
    async function loadTimeSeries() {
      if (!filters.dateRange) return;
      try {
        const params = new URLSearchParams();
        params.set("dateRange", filters.dateRange === "all" ? "lastMonth" : filters.dateRange);
        if (filters.clientId && filters.clientId.trim() !== "") {
          params.set("clientId", filters.clientId.trim());
        }
        params.set("granularity", "weekly");
        if (filters.platform !== "all") {
          params.set("platform", filters.platform);
        }
        if (filters.status !== "all") {
          params.set("status", filters.status);
        }

        const url = `${TIME_SERIES_ENDPOINT}?${params.toString()}`;
        console.log("Fetching time series from:", url);
        const res = await fetch(url, fetchOptions);
        if (!res.ok) {
          console.warn(`Time series request failed: ${res.status}`);
          if (!active) return;
          setTimeSeries(null);
          return;
        }
        const raw = await res.text();
        const trimmed = raw.trim();
        if (!trimmed || (!trimmed.startsWith("[") && !trimmed.startsWith("{"))) {
          console.warn("Time series: Unexpected response format", trimmed.substring(0, 200));
          if (!active) return;
          setTimeSeries(null);
          return;
        }
        let payload: TimeSeriesEnvelope | TimeSeriesEnvelope[] | null = null;
        try {
          payload = JSON.parse(raw);
        } catch (parseError) {
          console.error("Time series: JSON parse error", parseError);
          if (!active) return;
          setTimeSeries(null);
          return;
        }
        if (!active) return;
        if (Array.isArray(payload) && payload.length > 0) {
          console.log("Time series received (array):", payload[0]);
          setTimeSeries(payload[0]);
        } else if (payload && typeof payload === "object" && "data" in payload) {
          console.log("Time series received (object):", payload);
          setTimeSeries(payload as TimeSeriesEnvelope);
        } else {
          console.warn("Time series: Invalid payload format", payload);
          setTimeSeries(null);
        }
      } catch (err) {
        if (!active) return;
        setTimeSeries(null);
      }
    }
    void loadTimeSeries();
    return () => {
      active = false;
    };
  }, [filters.clientId, filters.dateRange, filters.platform, filters.status, refreshKey]);

  // Fetch all clients when clientId is empty to verify we can get all data
  useEffect(() => {
    let active = true;
    async function loadAllClients() {
      // Only fetch clients list when no specific client is selected
      if (filters.clientId && filters.clientId.trim() !== "") return;
      
      try {
        console.log("Fetching all clients from:", ALL_CLIENTS_ENDPOINT);
        const res = await fetch(ALL_CLIENTS_ENDPOINT, fetchOptions);
        if (!res.ok) {
          console.warn("Failed to fetch clients list:", res.status);
          return;
        }
        const clients = await res.json();
        console.log("All clients fetched:", Array.isArray(clients) ? clients.length : "not an array", clients);
      } catch (err) {
        console.warn("Error fetching clients list:", err);
      }
    }
    void loadAllClients();
    return () => {
      active = false;
    };
  }, [filters.clientId]);

  const aggregated = useMemo(() => {
    if (loading || error) {
      const base = buildAggregations([], campaignVelocity, engagementQuality, timeSeries);
      let overview = base.overview;
      
      // Blend client metrics into overview if available
      if (clientMetrics && clientMetrics.leaderboard && clientMetrics.leaderboard.length > 0 && clientMetrics.leaderboard[0]?.client_id === filters.clientId) {
        const top = clientMetrics.leaderboard[0];
        overview = {
          ...overview,
          totalProfiles: top?.metrics?.total_sessions ?? overview.totalProfiles,
          activeCampaigns: clientMetrics.metadata?.totalClients ?? overview.activeCampaigns,
          totalRecords: clientMetrics.metadata?.totalSessions ?? overview.totalRecords,
          client: {
            name: top?.client_name ?? overview.client?.name,
            business_name: top?.client_business_name ?? overview.client?.business_name,
            profile_url: overview.client?.profile_url,
          },
        };
      }
      
      // Blend backend platform breakdown into platform cards if available
      let platformCards = base.platformCards;
      if (platformBreakdown && platformBreakdown.data) {
        platformCards = platformCards.map((card) => {
          const key = card.platform.toLowerCase();
          const backend = platformBreakdown.data[key];
          if (backend && typeof backend === 'object') {
            return {
              ...card,
              totalProfiles: backend.total_sessions ?? card.totalProfiles,
              totalConnections: backend.total_connections ?? card.totalConnections,
              totalFollows: backend.total_follows ?? card.totalFollows,
              successRate: typeof backend.success_rate === 'number' ? backend.success_rate : card.successRate,
            };
          }
          return card;
        });
      }
      
      return {
        ...base,
        overview,
        platformCards,
        successMetrics: buildSuccessMetrics(
          base.actionSummary,
          base.overview.totalProfiles,
          actionSuccessMetrics ?? undefined,
          engagementQuality
        ),
      };
    }
    const base = buildAggregations(records, campaignVelocity, engagementQuality, timeSeries);
    let overview = base.overview;
    
    // Blend client metrics into overview if available
    if (clientMetrics && clientMetrics.leaderboard && clientMetrics.leaderboard.length > 0 && clientMetrics.leaderboard[0]?.client_id === filters.clientId) {
      const top = clientMetrics.leaderboard[0];
      overview = {
        ...overview,
        totalProfiles: top?.metrics?.total_sessions ?? overview.totalProfiles,
        activeCampaigns: clientMetrics.metadata?.totalClients ?? overview.activeCampaigns,
        totalRecords: clientMetrics.metadata?.totalSessions ?? overview.totalRecords,
        client: {
          name: top?.client_name ?? overview.client?.name,
          business_name: top?.client_business_name ?? overview.client?.business_name,
          profile_url: overview.client?.profile_url,
        },
      };
    }
    
    // Blend backend platform breakdown into platform cards if available
    let platformCards = base.platformCards;
    if (platformBreakdown && platformBreakdown.data) {
      platformCards = platformCards.map((card) => {
        const key = card.platform.toLowerCase();
        const backend = platformBreakdown.data[key];
        if (backend && typeof backend === 'object') {
          return {
            ...card,
            totalProfiles: backend.total_sessions ?? card.totalProfiles,
            totalConnections: backend.total_connections ?? card.totalConnections,
            totalFollows: backend.total_follows ?? card.totalFollows,
            successRate: typeof backend.success_rate === 'number' ? backend.success_rate : card.successRate,
          };
        }
        return card;
      });
    }
    
    return {
      ...base,
      overview,
      platformCards,
      successMetrics: buildSuccessMetrics(
        base.actionSummary,
        base.overview.totalProfiles,
        actionSuccessMetrics ?? undefined,
        engagementQuality
      ),
    };
  }, [records, loading, error, actionSuccessMetrics, campaignVelocity, clientMetrics, filters.clientId, engagementQuality, platformBreakdown, timeSeries]);

  function updateFilter<T extends keyof ClientDashboardFilters>(
    key: T,
    value: ClientDashboardFilters[T]
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function handleExport(format: "csv" | "excel") {
    const header = ["Profile", "Platform", "Status", "Actions", "Last Action"];
    const rows = aggregated.profiles.map((profile) => [
      profile.username || profile.id,
      profile.platform,
      profile.status,
      profile.actionsTaken.join(" | "),
      new Date(profile.lastAction).toLocaleString(),
    ]);
    const csv = [header, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], {
      type: format === "excel" ? "application/vnd.ms-excel" : "text/csv",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const clientIdLabel = filters.clientId && filters.clientId.trim() !== "" ? filters.clientId.trim() : "all-clients";
    link.download = `client-dashboard-${clientIdLabel}.${format === "excel" ? "xls" : "csv"}`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  const containerClasses = standalone
    ? "min-h-screen bg-neutral-50 p-4 sm:p-8"
    : "h-full overflow-y-auto p-4";

  return (
    <div className={containerClasses}>
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4">
        <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-neutral-400">
                Dashboard
              </div>
              <div className="text-xl font-semibold text-neutral-900">
                Outreach Insights
              </div>
              <div className="text-sm text-neutral-500">
                Last updated {lastUpdated ? formatDate(lastUpdated) : "N/A"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={handleRefresh}
              >
                <RefreshCw className="h-4 w-4" />
                Refresh
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => handleExport("csv")}
              >
                <ArrowDownToLine className="h-4 w-4" />
                Export CSV
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => handleExport("excel")}
              >
                <Download className="h-4 w-4" />
                Export Excel
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-4">
            <FilterCard
              icon={<Users className="h-5 w-5 text-neutral-500" />}
              label="Client ID"
            >
              <input
                className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-neutral-400"
                value={filters.clientId}
                onChange={(e) => updateFilter("clientId", e.target.value)}
                placeholder="All clients"
              />
            </FilterCard>
            <FilterCard
              icon={<Calendar className="h-5 w-5 text-neutral-500" />}
              label="Date Range"
            >
              <Select
                value={filters.dateRange}
                options={[...DASHBOARD_DATE_RANGES]}
                onChange={(value) => updateFilter("dateRange", value as DateRangeValue)}
              />
            </FilterCard>
            <FilterCard
              icon={<Filter className="h-5 w-5 text-neutral-500" />}
              label="Platform"
            >
              <Select
                value={filters.platform}
                options={[...DASHBOARD_PLATFORM_FILTERS]}
                onChange={(value) => updateFilter("platform", value as PlatformFilterValue)}
              />
            </FilterCard>
            <FilterCard
              icon={<ClipboardCheck className="h-5 w-5 text-neutral-500" />}
              label="Status"
            >
              <Select
                value={filters.status}
                options={[...DASHBOARD_STATUS_FILTERS]}
                onChange={(value) => updateFilter("status", value as StatusFilterValue)}
              />
            </FilterCard>
          </div>

          {error && (
            <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
              <strong>Error:</strong> {error}
            </div>
          )}
        </section>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl border border-dashed border-neutral-300 bg-white/60">
            <Loader2 className="h-6 w-6 animate-spin text-neutral-500" />
            <span className="ml-3 text-sm text-neutral-500">Loading client metrics…</span>
          </div>
        ) : (
          <>
            <OverviewStrip data={aggregated.overview} />
            <PlatformGrid cards={aggregated.platformCards} />
            <ActionSummaryGrid summary={aggregated.actionSummary} />
            <TimelineSection data={aggregated.timeline} />
            <SuccessMetricsSection metrics={aggregated.successMetrics} />
            {executiveSummary && <ExecutiveSummarySection data={executiveSummary} />}
            {clientMetrics && <ClientMetricsSection data={clientMetrics} />}
            <ProfilesTable rows={aggregated.profiles} />
            <SessionList sessions={aggregated.sessions} />
            <ExportSection />
            {!loading && !error && (
              <div className="rounded-2xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                <strong>Data Status:</strong> Loaded {records.length} records • 
                {actionSuccessMetrics && " Action metrics ✓"} • 
                {campaignVelocity && " Campaign velocity ✓"} • 
                {clientMetrics && clientMetrics.leaderboard && ` Client metrics ✓ (${clientMetrics.leaderboard.length} clients)`} • 
                {engagementQuality && " Engagement quality ✓"} • 
                {executiveSummary && " Executive summary ✓"} • 
                {platformBreakdown && " Platform breakdown ✓"} • 
                {timeSeries && " Time series ✓"}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function FilterCard({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white px-3 py-2 shadow-sm">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {icon}
        {label}
      </div>
      <div className="mt-2">{children}</div>
    </div>
  );
}

function Select({
  value,
  options,
  onChange,
}: {
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-neutral-200 px-3 py-2 text-sm text-neutral-700 outline-none focus:border-neutral-400"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function OverviewStrip({
  data,
}: {
  data: AggregatedData["overview"];
}) {
  const items = [
    { label: "Total Profiles", value: formatNumber(data.totalProfiles), icon: <Users className="h-4 w-4 text-neutral-500" /> },
    {
      label: "Active Campaigns",
      value: formatNumber(data.activeCampaigns),
      icon: <Activity className="h-4 w-4 text-neutral-500" />,
    },
    {
      label: "Records Returned",
      value: formatNumber(data.totalRecords),
      icon: <Search className="h-4 w-4 text-neutral-500" />,
    },
    {
      label: "Client",
      value: data.client?.business_name ?? data.client?.name ?? "N/A",
      icon: <Share2 className="h-4 w-4 text-neutral-500" />,
    },
  ];
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 px-4 py-3 shadow-sm">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-neutral-100 bg-neutral-50 px-3 py-3">
            <div className="rounded-2xl bg-white p-2 shadow-sm">{item.icon}</div>
            <div>
              <div className="text-[10px] uppercase tracking-wide text-neutral-400">{item.label}</div>
              <div className="text-base font-semibold text-neutral-900">{item.value}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function PlatformGrid({ cards }: { cards: PlatformSummary[] }) {
  if (!cards.length) return null;
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Platforms</div>
          <div className="text-lg font-semibold text-neutral-900">Breakdown by channel</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.platform} className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-neutral-800 capitalize">
                {card.platform}
              </div>
              <div className="rounded-full bg-green-100 px-3 py-1 text-xs text-green-700">
                {card.successRate}% success
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 text-sm text-neutral-600">
              <div>
                <dt className="text-xs text-neutral-400">Profiles</dt>
                <dd className="font-semibold text-neutral-900">{card.totalProfiles}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Follows</dt>
                <dd className="font-semibold text-neutral-900">{card.totalFollows}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Connections</dt>
                <dd className="font-semibold text-neutral-900">{card.totalConnections}</dd>
              </div>
              <div>
                <dt className="text-xs text-neutral-400">Likes</dt>
                <dd className="font-semibold text-neutral-900">{card.totalLikes}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-xs text-neutral-400">Messages</dt>
                <dd className="font-semibold text-neutral-900">{card.totalMessages}</dd>
              </div>
            </dl>
          </div>
        ))}
      </div>
    </section>
  );
}

function ActionSummaryGrid({ summary }: { summary: ActionSummary }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Action Summary</div>
          <div className="text-lg font-semibold text-neutral-900">Client-facing breakdown</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        {([
          { key: "follows", label: "Follows" },
          { key: "connections", label: "Connections" },
          { key: "likes", label: "Post Likes" },
          { key: "messages", label: "Messages" },
        ] as const).map(({ key, label }) => {
          const block = summary[key];
          const total = key === "likes" ? summary.likes.totalLikes : block.total;
          const success =
            key === "likes" ? summary.likes.successfulLikes : block.success;
          return (
            <div key={key} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
              <div className="text-sm font-semibold text-neutral-900">{label}</div>
              <div className="mt-1 text-xs uppercase tracking-wide text-neutral-400">
                {total} total
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-xs text-neutral-400">Success</div>
                  <div className="font-semibold text-green-600">{success}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Pending</div>
                  <div className="font-semibold text-amber-600">{block.pending}</div>
                </div>
                <div>
                  <div className="text-xs text-neutral-400">Failed</div>
                  <div className="font-semibold text-red-600">{block.failed}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TimelineSection({ data }: { data: TimelineData }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Activity</div>
          <div className="text-lg font-semibold text-neutral-900">Timeline & recent events</div>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-[2fr,1fr]">
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-800">Calendar Heatmap (last 4 weeks)</div>
          <div className="mt-3 grid grid-cols-7 gap-1 text-[10px] text-neutral-400">
            {data.heatmap.map(({ date, count }) => {
              const intensity = Math.min(1, count / 5);
              const bg =
                intensity === 0
                  ? "bg-neutral-200"
                  : intensity < 0.4
                  ? "bg-emerald-100"
                  : intensity < 0.7
                  ? "bg-emerald-300"
                  : "bg-emerald-500 text-white";
              return (
                <div key={date} className={`flex h-8 flex-col items-center justify-center rounded-lg ${bg}`}>
                  <span>{new Date(date).getDate()}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
          <div className="text-sm font-semibold text-neutral-800">Recent Activity</div>
          <div className="mt-3 space-y-3">
            {data.recent.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-neutral-800">{item.title}</div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      item.status === "success"
                        ? "bg-green-100 text-green-700"
                        : item.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="text-xs text-neutral-500">
                  {item.platform} • {formatDate(item.timestamp)}
                </div>
                <div className="text-xs text-neutral-600">Actions: {item.actions}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SuccessMetricsSection({ metrics }: { metrics: SuccessMetrics }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm text-xs sm:text-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-wide text-neutral-400">Success Metrics</div>
          <div className="text-base font-semibold text-neutral-900">Client-facing KPIs</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Connection acceptance rate"
          value={`${metrics.connectionAcceptanceRate.toFixed(1)}%`}
          icon={<TrendingUp className="h-5 w-5 text-neutral-500" />}
        />
        <MetricCard label="Engagement rate" value={`${metrics.engagementRate.toFixed(1)}%`} icon={<TrendingUp className="h-5 w-5 text-neutral-500" />} />
        <MetricCard
          label="Average actions per profile"
          value={metrics.avgActionsPerProfile.toFixed(1)}
          icon={<Users className="h-5 w-5 text-neutral-500" />}
        />
        <MetricCard
          label="Response time"
          value={
            metrics.responseTimeHours != null
              ? `${metrics.responseTimeHours.toFixed(1)} hrs`
              : "Data pending"
          }
          icon={<History className="h-5 w-5 text-neutral-500" />}
        />
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-white p-3 shadow-sm">{icon}</div>
        <div>
          <div className="text-[11px] uppercase tracking-wide text-neutral-400">{label}</div>
          <div className="text-lg font-semibold text-neutral-900">{value}</div>
        </div>
      </div>
    </div>
  );
}

function ProfilesTable({ rows }: { rows: ProfileRow[] }) {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Profiles</div>
          <div className="text-lg font-semibold text-neutral-900">Engaged profiles</div>
        </div>
        <div className="text-xs text-neutral-500">{rows.length} total profiles</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Profile</th>
              <th className="px-3 py-2 font-semibold">Platform</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Actions</th>
              <th className="px-3 py-2 font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t border-neutral-100 text-neutral-700">
                <td className="px-3 py-2">
                  {row.url ? (
                    <a href={row.url} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                      {row.username}
                    </a>
                  ) : (
                    row.username
                  )}
                </td>
                <td className="px-3 py-2 capitalize">{row.platform}</td>
                <td className="px-3 py-2">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                      row.status === "success"
                        ? "bg-green-100 text-green-700"
                        : row.status === "failed"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="px-3 py-2">{row.actionsTaken.join(", ")}</td>
                <td className="px-3 py-2">{formatDate(row.lastAction)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function SessionList({ sessions }: { sessions: SessionRow[] }) {
  if (!sessions.length) return null;
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Campaign Sessions</div>
          <div className="text-lg font-semibold text-neutral-900">Grouped activity by session</div>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sessions.map((session) => (
          <div key={session.id} className="rounded-2xl border border-neutral-100 bg-neutral-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-neutral-800">{session.id}</div>
                <div className="text-xs text-neutral-500">
                  {formatDate(session.startedAt)}
                </div>
              </div>
              <span
                className={`rounded-full px-2 py-0.5 text-xs capitalize ${
                  session.status === "success"
                    ? "bg-green-100 text-green-700"
                    : session.status === "failed"
                    ? "bg-red-100 text-red-700"
                    : "bg-amber-100 text-amber-700"
                }`}
              >
                {session.status}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2 text-sm text-neutral-600">
              <div>
                <div className="text-xs text-neutral-400">Profiles</div>
                <div className="font-semibold text-neutral-900">{session.profiles}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Completed</div>
                <div className="font-semibold text-green-600">{session.completed}</div>
              </div>
              <div>
                <div className="text-xs text-neutral-400">Failed</div>
                <div className="font-semibold text-red-600">{session.failed}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ExecutiveSummarySection({ data }: { data: ExecutiveSummaryEnvelope }) {
  if (!data || !data.summary) return null;
  
  const successRate = typeof data.summary.success_rate === 'number' 
    ? data.summary.success_rate.toFixed(1) 
    : 'N/A';
  
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Executive Summary</div>
          <div className="text-lg font-semibold text-neutral-900">Key Insights & Recommendations</div>
          <div className="text-sm text-neutral-500">
            {data.summary.date_range_label || data.summary.date_range || 'N/A'} • {data.summary.total_sessions || 0} sessions • {successRate}% success rate
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {data.highlights && data.highlights.length > 0 && (
          <div className="rounded-2xl border border-green-100 bg-green-50 p-4">
            <div className="mb-3 text-sm font-semibold text-green-900">Highlights</div>
            <div className="space-y-2">
              {data.highlights.slice(0, 5).map((highlight, idx) => (
                <div key={idx} className="rounded-xl border border-green-200 bg-white px-3 py-2 text-sm">
                  <div className="font-medium text-green-900">{highlight.metric}</div>
                  <div className="text-xs text-green-700">
                    {highlight.value} {highlight.type} • {highlight.category}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        {data.concerns && data.concerns.length > 0 && (
          <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
            <div className="mb-3 text-sm font-semibold text-amber-900">Areas for Improvement</div>
            <div className="space-y-2">
              {data.concerns.slice(0, 5).map((concern, idx) => (
                <div key={idx} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-sm">
                  <div className="font-medium text-amber-900">{concern.metric}</div>
                  <div className="text-xs text-amber-700">
                    {concern.value} {concern.type} • {concern.category}
                  </div>
                  {concern.recommendation && (
                    <div className="mt-1 text-xs text-amber-600 italic">{concern.recommendation}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function ClientMetricsSection({ data }: { data: ClientMetricsEnvelope }) {
  if (!data || !data.leaderboard || data.leaderboard.length === 0) return null;
  
  const avgSessions = data.metadata?.avgSessionsPerClient 
    ? (typeof data.metadata.avgSessionsPerClient === 'number' ? data.metadata.avgSessionsPerClient.toFixed(1) : 'N/A')
    : 'N/A';
  
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Client Performance</div>
          <div className="text-lg font-semibold text-neutral-900">Leaderboard</div>
          <div className="text-sm text-neutral-500">
            {data.metadata?.totalClients || 0} clients • {data.metadata?.totalSessions || 0} total sessions • {avgSessions} avg per client
          </div>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wide text-neutral-400">
            <tr>
              <th className="px-3 py-2 font-semibold">Rank</th>
              <th className="px-3 py-2 font-semibold">Client</th>
              <th className="px-3 py-2 font-semibold">Sessions</th>
              <th className="px-3 py-2 font-semibold">Success Rate</th>
              <th className="px-3 py-2 font-semibold">Connections</th>
              <th className="px-3 py-2 font-semibold">Follows</th>
              <th className="px-3 py-2 font-semibold">Avg Likes</th>
            </tr>
          </thead>
          <tbody>
            {data.leaderboard.slice(0, 10).map((entry) => {
              const successRate = entry.metrics?.success_rate_percentage 
                ? (typeof entry.metrics.success_rate_percentage === 'number' ? entry.metrics.success_rate_percentage.toFixed(1) : 'N/A')
                : 'N/A';
              const avgLikes = entry.metrics?.avg_likes_per_session 
                ? (typeof entry.metrics.avg_likes_per_session === 'number' ? entry.metrics.avg_likes_per_session.toFixed(1) : 'N/A')
                : 'N/A';
              
              return (
                <tr key={entry.client_id} className="border-t border-neutral-100 text-neutral-700">
                  <td className="px-3 py-2 font-semibold">#{entry.rank || 'N/A'}</td>
                  <td className="px-3 py-2">
                    <div className="font-medium text-neutral-900">
                      {entry.client_name || entry.client_business_name || entry.client_id || 'Unknown'}
                    </div>
                    {entry.client_business_name && entry.client_name && entry.client_business_name !== entry.client_name && (
                      <div className="text-xs text-neutral-500">{entry.client_business_name}</div>
                    )}
                  </td>
                  <td className="px-3 py-2">{entry.metrics?.total_sessions || 0}</td>
                  <td className="px-3 py-2">
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                      {successRate}%
                    </span>
                  </td>
                  <td className="px-3 py-2">{entry.metrics?.total_connections || 0}</td>
                  <td className="px-3 py-2">{entry.metrics?.total_follows || 0}</td>
                  <td className="px-3 py-2">{avgLikes}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExportSection() {
  return (
    <section className="rounded-3xl border border-neutral-200 bg-white/90 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Reporting</div>
          <div className="text-lg font-semibold text-neutral-900">Export & automation</div>
          <div className="text-sm text-neutral-500">
            Download data now or schedule automated client reports (coming soon)
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm text-neutral-700">
            <Table className="h-4 w-4" />
            Export CSV
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm text-neutral-700">
            <Download className="h-4 w-4" />
            Export PDF
          </button>
          <button className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm text-neutral-400" disabled>
            <Share2 className="h-4 w-4" />
            Schedule (beta)
          </button>
        </div>
      </div>
    </section>
  );
}

