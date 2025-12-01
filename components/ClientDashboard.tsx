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

const OUTREACH_REPORT_ENDPOINT =
  "https://impavidly-arguable-cicely.ngrok-free.dev/webhook/outreach-record-4982b6c3e";

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

type ApiEnvelope = {
  records?: OutreachRecord[];
  count?: number;
  retrieved_at?: string;
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

function buildAggregations(records: OutreachRecord[]): AggregatedData {
  const profileMap = new Map<string, ProfileRow>();
  const sessionMap = new Map<string, SessionRow>();
  const platformMap = new Map<string, PlatformSummary>();
  const heatmapCounts = new Map<string, number>();
  const client = records[0]?.client;

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
      sessionMap.set(sessionId, {
        id: sessionId,
        startedAt: record.created_at,
        status: record.status ?? "pending",
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

  const timeline = buildTimelineData(heatmapCounts, records);
  const successMetrics = buildSuccessMetrics(actionSummary, totalProfiles);

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
  records: OutreachRecord[]
): TimelineData {
  const today = new Date();
  const heatmap: { date: string; count: number }[] = [];
  for (let i = 27; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(day.getDate() - i);
    const key = day.toISOString().split("T")[0];
    heatmap.push({ date: key, count: counts.get(key) ?? 0 });
  }

  const weeklyCounts = new Map<string, number>();
  heatmap.forEach((entry) => {
    const weekLabel = entry.date.slice(0, 7); // YYYY-MM
    weeklyCounts.set(weekLabel, (weeklyCounts.get(weekLabel) ?? 0) + entry.count);
  });

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
    line: Array.from(weeklyCounts.entries()).map(([label, count]) => ({ label, count })),
    recent,
  };
}

function buildSuccessMetrics(summary: ActionSummary, profiles: number): SuccessMetrics {
  const connectionAcceptanceRate = summary.connections.total
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

  const engagementRate = totalActionsAttempted
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
    clientId: initialFilters?.clientId ?? "4",
    dateRange: initialFilters?.dateRange ?? "thisWeek",
    platform: initialFilters?.platform ?? "all",
    status: initialFilters?.status ?? "all",
  }));
  const [records, setRecords] = useState<OutreachRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!filters.clientId || !filters.dateRange) return;
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        params.set("client_id", filters.clientId);
        params.set("date", filters.dateRange === "all" ? "thisYear" : filters.dateRange);
        if (filters.platform !== "all") params.set("platform", filters.platform);
        if (filters.status !== "all") params.set("status", filters.status);

        const url = `${OUTREACH_REPORT_ENDPOINT}?${params.toString()}`;
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const raw = await res.text();
        let data: ApiEnvelope[] = [];
        try {
          data = JSON.parse(raw);
        } catch {
          throw new Error("Backend returned invalid JSON. Please try again shortly.");
        }
        const flattened = Array.isArray(data)
          ? data.flatMap((chunk) => chunk.records ?? [])
          : [];
        if (!active) return;
        setRecords(flattened);
        setLastUpdated(data[0]?.retrieved_at ?? new Date().toISOString());
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
  }, [filters]);

  const aggregated = useMemo(() => {
    if (loading || error || records.length === 0) {
      const mockRecords: OutreachRecord[] = [
        {
          id: "mock-1",
          created_at: new Date().toISOString(),
          session: "session-linkedin-outreach-demo",
          status: "success",
          client_id: filters.clientId,
          platform: "linkedin",
          actions: [
            { action: "follow", item: "account" },
            { action: "connect", item: "account" },
            { action: "like", item: "post", item_count: 3 },
            { action: "message", item: "account" },
          ],
          follow_status: "success",
          connection_status: "success",
          message_status: "success",
          like_post_count: "3/3",
          url: "https://www.linkedin.com/in/demo-profile-1/",
          username: "demo-profile-1",
          client: {
            name: "Demo Client",
            profile_url: "https://www.linkedin.com/company/demo-client/",
            business_name: "Demo Client Ltd",
          },
        },
        {
          id: "mock-2",
          created_at: new Date(Date.now() - 86400000).toISOString(),
          session: "session-instagram-outreach-demo",
          status: "pending",
          client_id: filters.clientId,
          platform: "instagram",
          actions: [
            { action: "follow", item: "account" },
            { action: "like", item: "post", item_count: 2 },
          ],
          follow_status: "success",
          connection_status: "pending",
          like_post_count: "1/2",
          url: "https://www.instagram.com/demo_profile_2/",
          username: "demo_profile_2",
          client: {
            name: "Demo Client",
            profile_url: "https://www.linkedin.com/company/demo-client/",
            business_name: "Demo Client Ltd",
          },
        },
      ];
      return buildAggregations(mockRecords);
    }
    return buildAggregations(records);
  }, [records, loading, error, filters.clientId]);

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
    link.download = `client-dashboard-${filters.clientId}.${format === "excel" ? "xls" : "csv"}`;
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
                Last updated {lastUpdated ? new Date(lastUpdated).toLocaleString() : "N/A"}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-2xl border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
                onClick={() => setFilters((prev) => ({ ...prev }))}
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
              {error}
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
            <ProfilesTable rows={aggregated.profiles} />
            <SessionList sessions={aggregated.sessions} />
            <ExportSection />
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
                  {item.platform} • {new Date(item.timestamp).toLocaleString()}
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
                <td className="px-3 py-2">{new Date(row.lastAction).toLocaleString()}</td>
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
                  {new Date(session.startedAt).toLocaleString()}
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

