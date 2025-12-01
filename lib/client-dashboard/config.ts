export const DASHBOARD_DATE_RANGES = [
  { value: "thisWeek", label: "This Week" },
  { value: "lastWeek", label: "Last Week" },
  { value: "thisMonth", label: "This Month" },
  { value: "lastMonth", label: "Last Month" },
  { value: "thisQuarter", label: "This Quarter" },
  { value: "lastQuarter", label: "Last Quarter" },
  { value: "thisYear", label: "This Year" },
  { value: "lastYear", label: "Last Year" },
  { value: "all", label: "All Time" },
] as const;

export const DASHBOARD_PLATFORM_FILTERS = [
  { value: "all", label: "All Platforms" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "instagram", label: "Instagram" },
] as const;

export const DASHBOARD_STATUS_FILTERS = [
  { value: "all", label: "All Statuses" },
  { value: "success", label: "Successful only" },
  { value: "failed", label: "Failed only" },
] as const;

export type DateRangeValue = (typeof DASHBOARD_DATE_RANGES)[number]["value"];
export type PlatformFilterValue = (typeof DASHBOARD_PLATFORM_FILTERS)[number]["value"];
export type StatusFilterValue = (typeof DASHBOARD_STATUS_FILTERS)[number]["value"];

export type ClientDashboardFilters = {
  clientId: string;
  dateRange: DateRangeValue;
  platform: PlatformFilterValue;
  status: StatusFilterValue;
};

