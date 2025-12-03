import ClientDashboard from "../../components/ClientDashboard";
import {
  DASHBOARD_DATE_RANGES,
  DASHBOARD_PLATFORM_FILTERS,
  DASHBOARD_STATUS_FILTERS,
  type ClientDashboardFilters,
  type DateRangeValue,
  type PlatformFilterValue,
  type StatusFilterValue,
} from "../../lib/client-dashboard/config";

type PageProps = {
  searchParams?: {
    client_id?: string;
    date?: string;
    platform?: string;
    status?: string;
  };
};

const validDate = new Set(DASHBOARD_DATE_RANGES.map((option) => option.value));
const validPlatform = new Set(DASHBOARD_PLATFORM_FILTERS.map((option) => option.value));
const validStatus = new Set(DASHBOARD_STATUS_FILTERS.map((option) => option.value));

export default function ClientDashboardPage({ searchParams }: PageProps) {
  const params = searchParams ?? {};

  const initialFilters: Partial<ClientDashboardFilters> = {
    clientId: params.client_id ?? "",
    dateRange: validDate.has(params.date as DateRangeValue) ? (params.date as DateRangeValue) : "thisWeek",
    platform: validPlatform.has(params.platform as PlatformFilterValue)
      ? (params.platform as PlatformFilterValue)
      : "all",
    status: validStatus.has(params.status as StatusFilterValue)
      ? (params.status as StatusFilterValue)
      : "all",
  };

  return (
    <ClientDashboard standalone initialFilters={initialFilters} />
  );
}

