"use client";

import React, { useMemo, useState } from "react";
import { Check, ChevronDown, Mail, MapPin, Phone, Search, User, Globe, Building2, DollarSign, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";

// â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”
// ArchiFi â€“ Fresh Build (fixed)
// Premium Tailwind + shadcn-like primitives (implemented inline for portability)
// No horizontal overflow. Side library fixed. Three tabs: Discover • Review • Outreach
// Mock data is loaded only when the user hits the Search button.
// "Scrape Details" moves the selected cards from Discover â†’ Review.
// Outreach supports per-card platform selection.
// â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”â€”

const Btn: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "solid" | "ghost" | "outline" }>
 = ({ className = "", variant = "solid", children, ...props }) => {
  const base = "inline-flex items-center gap-2 whitespace-nowrap rounded-2xl px-4 py-2 text-sm font-medium transition active:scale-[.98]";
  const variants: Record<string, string> = {
    solid: "bg-neutral-900 text-white hover:bg-neutral-800 shadow-sm",
    ghost: "bg-transparent hover:bg-neutral-100 text-neutral-700",
    outline: "border border-neutral-300 hover:bg-neutral-50 text-neutral-800",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = "", ...props }) => (
  <input
    className={`h-10 w-full rounded-2xl border border-neutral-300 bg-white px-3 outline-none ring-0 focus:border-neutral-400 focus-visible:outline-none ${className}`}
    {...props}
  />
);

const Select: React.FC<{ value: string; onChange: (v: string) => void; options: string[]; className?: string }>
 = ({ value, onChange, options, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      className="appearance-none h-10 w-full rounded-2xl border border-neutral-300 bg-white px-3 pr-8 text-sm text-neutral-800 focus:border-neutral-400"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
  </div>
);

const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className = "", children, ...props }) => (
  <div className={`min-w-0 rounded-2xl border border-neutral-200 bg-white/90 shadow-sm ${className}`} {...props}>
    {children}
  </div>
);

const Divider: React.FC = () => <div className="h-px w-full bg-neutral-200" />;

type Architect = {
  id: string;
  name: string;
  city: string;
  postcode: string;
  company: string;
  email: string;
  phone: string;
  website?: string;
  socials?: { linkedin?: string; instagram?: string; facebook?: string };
  specialty: string;
  projectType: string;
  valueMillions: number; // 0â€“5
  grade?: string;
};

function makeMock(n = 24): Architect[] {
  const towns = ["London","Manchester","Birmingham","Leeds","Glasgow","Bristol","Edinburgh"];
  const specialties = ["Residential", "Commercial", "Healthcare", "Educational", "Hospitality", "Industrial"];
  const ptypes = ["New Build", "Renovation", "Extension", "Interior Fit-Out"];
  const companies = ["Forma Studio UK", "Axis Design Ltd", "Northline Atelier", "CrestWorks Group", "Blueprint & Co.", "CivicForm Partners"];
  const ukPostcodes = ["SW1A 1AA","M1 1AE","B1 1AA","LS1 1UR","G1 1XX","BS1 4ST","EH1 1YZ"];

  return Array.from({ length: n }).map((_, i) => {
    const t = towns[i % towns.length];
    const s = specialties[i % specialties.length];
    const p = ptypes[i % ptypes.length];
    const c = companies[i % companies.length];
    const val = (i % 6) + Math.random() * 0.2; // 0â€“5.2
    const id = `A-${(1000 + i).toString()}`;
    const domain = c.replace(/\s+/g, "").toLowerCase();
    return {
      id,
      name: `Architect ${i + 1}`,
      city: t,
      postcode: ukPostcodes[i % ukPostcodes.length],
      company: c,
      email: `architect${i + 1}@${domain}.co.uk`,
      phone: "+44 7" + String(500000000 + i).slice(0,9),
      website: `https://www.${domain}.co.uk`,
      socials: {
        linkedin: `https://linkedin.com/in/architect-${i + 1}`,
        instagram: `https://instagram.com/${c.split(" ")[0].toLowerCase()}_${i + 1}`,
        facebook: `https://facebook.com/${domain}`,
      },
      specialty: s,
      projectType: p,
      valueMillions: Math.min(5, Math.max(0, Math.round(val))),
      grade: ["A", "B", "C"][i % 3],
    } as Architect;
  });
}

// Lightweight self-tests (console only)
function runSelfTests() {
  try {
    const sample = makeMock(50);
    console.assert(sample.length === 50, "mock length should match");
    console.assert(sample.every(a => a.valueMillions >= 0 && a.valueMillions <= 5), "valueMillions in [0,5]");
    const ids = new Set(sample.map(a => a.id));
    console.assert(ids.size === sample.length, "ids unique");
  } catch (e) { console.error("self-tests failed", e); }
}
runSelfTests();

// === API integration (Discover) ===
const SEARCH_ENDPOINT = "/api/search";

type ApiItem = any; // defensive: map fields below
type ApiResponse = { items?: ApiItem[]; nextId?: number | null; hasMore?: boolean };

async function postJSON(url: string, body: any, timeoutMs = 20000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

function mapApiItemToArchitect(x: ApiItem, i: number): Architect {
  // Your upstream sample shows fields like:
  // id, full_name, company_name, post_code, address, country, created_at, socials *_url etc.
  const name =
    x.full_name ??
    x.name ??
    x.architectName ??
    `Architect ${i + 1}`;

  const company =
    x.company_name ??
    x.company ??
    x.companyName ??
    "";

  const postcode =
    x.post_code ??
    x.postcode ??
    x.post_code ??
    "";

  // Try to infer city from address if present; otherwise blank
  let city = x.city ?? x.town ?? "";
  if (!city && typeof x.address === "string") {
    // naive: first token before comma
    city = String(x.address).split(",")[0]?.trim() || "";
  }

  const email =
    x.email ??
    (name ? `${String(name).toLowerCase().replace(/\s+/g, ".")}@example.co.uk` : "architect@example.co.uk");

  const phone = x.phone ?? x.alternate_phone ?? "+44 7500000000";

  const socials = {
    linkedin: x.linkedin_profile_url ?? x.company_linkedin_profile_url ?? "",
    instagram: x.instagram_profile_url ?? x.company_instagram_profile_url ?? "",
    facebook: x.facebook_profile_url ?? x.company_facebook_profile_url ?? "",
  };

  return {
    id: String(x.id ?? x.architect_id ?? x._id ?? `api-${Date.now()}-${i}`),
    name,
    city,
    postcode,
    company,
    email,
    phone,
    website: x.website ?? x.url ?? "",
    socials,
    specialty: x.specialty ?? x.speciality ?? "Residential",
    projectType: x.projectType ?? x.type ?? "New Build",
    valueMillions: Number.isFinite(x.valueMillions) ? Number(x.valueMillions) : 0,
    grade: x.grade ?? ["A", "B", "C"][i % 3],
  };
}

export default function ArchiFiUIFresh() {
  const [query, setQuery] = useState(""); // town/postcode
  const [jobType, setJobType] = useState("All Job Types");
  const [valueMin, setValueMin] = useState(0);
  const [valueMax, setValueMax] = useState(5);

  const [library] = useState<Architect[]>(() => makeMock(50));
  const [discover, setDiscover] = useState<Architect[]>([]);
  const [discoverSelected, setDiscoverSelected] = useState<Record<string, boolean>>({});
  const [review, setReview] = useState<Architect[]>([]);

  const [activeTab, setActiveTab] = useState<"discover" | "review" | "outreach">("discover");
  const [detailsId, setDetailsId] = useState<string | null>(null);

  const [reviewSelected, setReviewSelected] = useState<Record<string, boolean>>({});
  const [outreachSelected, setOutreachSelected] = useState<Record<string, boolean>>({});
  const [outreach, setOutreach] = useState<Architect[]>([]);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  // API-backed pagination (100/page)
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Cache pages so Previous works without re-fetching.
  const [apiPages, setApiPages] = useState<Architect[][]>([]);
  const [apiNextIds, setApiNextIds] = useState<(number | null)[]>([]); // nextId for each page index
  const [apiPageIndex, setApiPageIndex] = useState(0);

  const filtered = useMemo(() => {
    return discover.filter((a) => {
      const matchesQuery = !query
        ? true
        : [a.city, a.postcode, a.company, a.name].some((v) => v.toLowerCase().includes(query.toLowerCase()));
      const matchesJob = jobType === "All Job Types" ? true : a.projectType === jobType;
      const matchesValue = a.valueMillions >= valueMin && a.valueMillions <= valueMax;
      return matchesQuery && matchesJob && matchesValue;
    });
  }, [discover, query, jobType, valueMin, valueMax]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);

  async function runSearch() {
    try {
      setApiError(null);
      setApiLoading(true);
      setApiPages([]);
      setApiNextIds([]);
      setApiPageIndex(0);
      setDiscover([]);
      setDiscoverSelected({});
      setPage(1);

      const payload =
        query && query.trim().length > 0
          ? { postcode_town: query.trim(), limit: 100 }
          : { limit: 100 };

      const res = await postJSON(SEARCH_ENDPOINT, payload);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Accept either an array or { items, nextId }
      const rawItems: ApiItem[] = Array.isArray(data) ? data : (data.items ?? []);
      const nextId = Array.isArray(data) ? null : (data.nextId ?? null);

      const items = rawItems.map(mapApiItemToArchitect);
      setApiPages([items]);
      setApiNextIds([nextId]);
      setApiPageIndex(0);
      setDiscover(items);
      console.log("DISCOVER items:", items.length, items.slice(0,2));
      setActiveTab("discover");
    } catch (e: any) {
      console.error("SEARCH failed; falling back to mock:", e?.message || e);
      setApiError("Online search failed. Showing mock results.");
      const mock = makeMock(50);
      setApiPages([mock]);
      setApiNextIds([null]);
      setApiPageIndex(0);
      setDiscover(mock);
      setActiveTab("discover");
    } finally {
      setApiLoading(false);
    }
  }

  async function goToNextPage() {
    if (apiLoading) return;
    const idx = apiPageIndex;

    // If we already fetched the next page, just show it.
    const cachedNext = apiPages[idx + 1];
    if (cachedNext) {
      setApiPageIndex(idx + 1);
      setDiscover(cachedNext);
      return;
    }

    const nextId = apiNextIds[idx];
    if (nextId == null) return; // no more pages

    try {
      setApiLoading(true);
      const res = await postJSON(SEARCH_ENDPOINT, { limit: 100, nextId });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rawItems: ApiItem[] = Array.isArray(data) ? data : (data.items ?? []);
      const newNextId = Array.isArray(data) ? null : (data.nextId ?? null);

      const items = rawItems.map(mapApiItemToArchitect);

      setApiPages((p) => [...p, items]);
      setApiNextIds((p) => [...p, newNextId]);
      setApiPageIndex(idx + 1);
      setDiscover(items);
    } catch (e) {
      console.error("Next page fetch failed:", e);
      setApiError("Could not load next page.");
    } finally {
      setApiLoading(false);
    }
  }

  function goToPrevPage() {
    if (apiLoading) return;
    const idx = apiPageIndex;
    if (idx === 0) return;
    setApiPageIndex(idx - 1);
    setDiscover(apiPages[idx - 1] ?? []);
  }

  function clearDiscover() {
    setDiscover([]);
    setDiscoverSelected({});
    setPage(1);
  }

  function toggleSelect(id: string) {
    setDiscoverSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function selectAllOnPage() {
    const upd: Record<string, boolean> = { ...discoverSelected };
    pageItems.forEach((a) => (upd[a.id] = true));
    setDiscoverSelected(upd);
  }

  function scrapeDetails() {
    const picked = discover.filter((a) => discoverSelected[a.id]);
    const existing = new Set(review.map((r) => r.id));
    const merged = [...review, ...picked.filter((p) => !existing.has(p.id))];
    setReview(merged);
    setActiveTab("review");
    if (merged.length) setDetailsId(merged[0].id);
  }

  const [outreachPlatform, setOutreachPlatform] = useState<Record<string, string>>({});
  const platforms = ["LinkedIn", "Email", "Instagram", "Facebook", "WhatsApp", "Call"];

  function clearReview() {
    setReview([]);
    setReviewSelected({});
    setDetailsId(null);
  }
  function clearOutreach() {
    setOutreach([]);
    setOutreachSelected({});
    setOutreachPlatform({});
  }

  return (
    <div className="min-h-[90vh] w-full min-w-0 overflow-hidden bg-neutral-50 p-4 sm:p-6">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 shadow-inner">A</div>
          <div className="text-sm font-semibold tracking-wide text-neutral-400">ARCHIFI</div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Town or Postcode" className="min-w-0 max-w-[420px]" />
          <Select value={jobType} onChange={setJobType} options={["All Job Types", "New Build", "Renovation", "Extension", "Interior Fit-Out"]} className="w-56" />
          <div className="flex items-center gap-2 rounded-2xl border border-neutral-300 px-3 py-2">
            <span className="text-xs text-neutral-500">Value(m)</span>
            <Input type="number" min={0} max={5} step="0.1" value={valueMin} onChange={(e) => setValueMin(Number(e.target.value))} className="h-8 w-20" />
            <span className="text-neutral-400">â€“</span>
            <Input type="number" min={0} max={5} step="0.1" value={valueMax} onChange={(e) => setValueMax(Number(e.target.value))} className="h-8 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn variant="outline" onClick={clearDiscover}>Clear</Btn>
          <Btn onClick={runSearch} className="shrink-0">
            <Search className="h-4 w-4" />
            Search
          </Btn>
        </div>
      </div>

      {/* Content area */}
      <div className="mx-auto mt-4 grid max-w-[1400px] grid-cols-12 gap-4">
        {/* Left: Architect Library */}
        <Card className="col-span-12 h-[72vh] overflow-hidden p-0 sm:col-span-3">
          <div className="sticky top-0 z-10 border-b border-neutral-200 bg-white/90 px-4 py-3 font-medium text-neutral-700">Architect Library</div>
          <div className="min-w-0 h-[calc(72vh-48px)] space-y-2 overflow-y-auto p-3 overscroll-contain">
            {library.map((a) => (
              <div key={a.id} className="min-w-0 rounded-xl border border-neutral-200 p-3 hover:border-neutral-300">
                <div className="flex items-center justify-between gap-2">
                  <div className="truncate font-medium text-neutral-800">{a.name}</div>
                  <span className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">Grade {a.grade}</span>
                </div>
                <div className="mt-1 text-xs text-neutral-500 truncate">{a.city} • {a.postcode}</div>
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-xs text-neutral-500">{a.company}</span>
                  <Btn variant="ghost" className="h-8 px-3 text-xs">Add to Review</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Main panel with Tabs */}
        <div className="col-span-12 min-w-0 sm:col-span-9">
          <div className="mb-3 flex gap-2">
            <Btn variant={activeTab === "discover" ? "solid" : "outline"} onClick={() => setActiveTab("discover")}>Discover</Btn>
            <Btn variant={activeTab === "review" ? "solid" : "outline"} onClick={() => setActiveTab("review")}>Review</Btn>
            <Btn variant={activeTab === "outreach" ? "solid" : "outline"} onClick={() => setActiveTab("outreach")}>Outreach</Btn>
          </div>

          {/* DISCOVER */}
          {activeTab === "discover" && (
            <Card className="h-[72vh] overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-neutral-200 px-4 py-3">
                <div>
                  <div className="text-sm font-medium text-neutral-700">Search Results</div>
                  {apiError && <div className="text-xs text-neutral-500">{apiError}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {/* New: Pagination controls on the LEFT */}
                  <Btn variant="outline" onClick={goToPrevPage} className="whitespace-nowrap">Previous Page</Btn>
                  <Btn variant="outline" onClick={goToNextPage} className="whitespace-nowrap">Next Page</Btn>

                  {/* Existing controls (unchanged order after pagination) */}
                  <Btn variant="outline" onClick={selectAllOnPage}>Select All</Btn>
                  <Btn onClick={scrapeDetails} disabled={apiLoading}>
                    {apiLoading ? "Loading..." : "Scrape Details"}
                  </Btn>
                </div>
              </div>
              <div className="grid h-[calc(72vh-56px)] auto-rows-min grid-cols-1 gap-2 overflow-y-auto p-3 md:grid-cols-2 overscroll-contain">
                {pageItems.map((a) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-800">{a.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.city} • {a.postcode}</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{a.company}</span>
                          </div>
                          <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600 sm:grid-cols-3">
                            <div className="flex items-center gap-1"><DollarSign className="h-3.5 w-3.5" />Value: {a.valueMillions}m</div>
                            <div className="truncate">Specialty: {a.specialty}</div>
                            <div className="truncate">Type: {a.projectType}</div>
                          </div>
                        </div>
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-neutral-700">
                          <input
                            type="checkbox"
                            checked={!!discoverSelected[a.id]}
                            onChange={() => toggleSelect(a.id)}
                            className="h-4 w-4 rounded border-neutral-300 accent-neutral-900"
                          />
                          <span className="hidden sm:inline">Select</span>
                        </label>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {pageItems.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    Hit <span className="mx-1 rounded-md bg-neutral-900 px-2 py-0.5 text-white">Search</span> to load mock results.
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-neutral-200 px-4 py-3 text-sm text-neutral-600">
                <div>Page {Math.min(page, totalPages)} of {totalPages}</div>
                <div className="flex gap-2">
                  <Btn variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))}>Previous Page</Btn>
                  <Btn variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next Page</Btn>
                </div>
              </div>
            </Card>
          )}

          {/* REVIEW */}
          {activeTab === "review" && (
            <div className="grid h-[72vh] grid-cols-12 gap-4">
              <Card className="col-span-12 h-full overflow-hidden p-0 lg:col-span-6">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium text-neutral-700">Selected Architects</div>
                    <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => setReviewSelected(Object.fromEntries(review.map(r=>[r.id,true])))}>Select All</Btn>
                    <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => setReviewSelected({})}>Clear Select</Btn>
                  </div>
                  <div className="flex items-center gap-2">
                    <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={clearReview}>Clear Review</Btn>
                    <Btn className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => {
                      const hasAny = Object.values(reviewSelected).some(Boolean);
                      const chosen = hasAny ? review.filter(r=>reviewSelected[r.id]) : review;
                      setOutreach(prev => {
                        const ids = new Set(prev.map(x=>x.id));
                        const add = chosen.filter(c=>!ids.has(c.id));
                        return [...prev, ...add];
                      });
                      setOutreachSelected(prev=>({ ...prev, ...Object.fromEntries(chosen.map(c=>[c.id,true])) }));
                      setActiveTab("outreach");
                    }}>Approve to Outreach</Btn>
                  </div>
                </div>
                <div className="min-w-0 h-[calc(72vh-56px)] space-y-2 overflow-y-auto p-3 overscroll-contain">
                  {review.map((a) => (
                    <Card key={a.id} onClick={() => setDetailsId(a.id)} className={`cursor-pointer p-4 ${detailsId === a.id ? "ring-1 ring-neutral-800" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-800">{a.name}</div>
                          <div className="mt-1 text-xs text-neutral-500">{a.city} • {a.postcode}</div>
                          <div className="mt-1 text-xs text-neutral-500">Grade {a.grade} • {a.company}</div>
                        </div>
                        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-neutral-700">
                          <input onClick={(e)=>e.stopPropagation()} type="checkbox" checked={!!reviewSelected[a.id]} onChange={() => setReviewSelected(p=>({ ...p, [a.id]: !p[a.id] }))} className="h-4 w-4 rounded border-neutral-300 accent-neutral-900" />
                          <span className="hidden sm:inline">Select</span>
                        </label>
                      </div>
                    </Card>
                  ))}
                  {review.length === 0 && (
                    <div className="flex h-[40vh] items-center justify-center text-sm text-neutral-500">No items yet. Use "Scrape Details" from Discover.</div>
                  )}
                </div>
              </Card>

              <Card className="col-span-12 h-full overflow-hidden p-0 lg:col-span-6">
                <div className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700">Architect Details</div>
                <div className="min-w-0 overflow-y-auto overflow-x-hidden p-4">
                  {detailsId ? (
                    <ArchiDetails a={review.find((x) => x.id === detailsId)!} />
                  ) : (
                    <div className="flex h-[40vh] items-center justify-center text-sm text-neutral-500">Select an architect on the left to view details.</div>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* OUTREACH */}
          {activeTab === "outreach" && (
            <Card className="h-[72vh] overflow-hidden p-0">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="text-sm font-medium text-neutral-700">Outreach</div>
                  <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => setOutreachSelected(Object.fromEntries(outreach.map(r=>[r.id,true])))}>Select All</Btn>
                  <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => setOutreachSelected({})}>Clear Select</Btn>
                </div>
                <div className="flex items-center gap-2">
                  <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={clearOutreach}>Clear Outreach</Btn>
                  <Btn variant="outline" className="h-8 px-3 py-1 text-xs rounded-xl" onClick={() => {
                    const chosen = outreach.filter(r => outreachSelected[r.id]);
                    alert(`${chosen.length || 0} architect(s) queued for outreach`);
                  }}>Reach out to selected Architects</Btn>
                </div>
              </div>
              <div className="grid h-[calc(72vh-56px)] grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-2">
                {outreach.map((a) => (
                  <Card key={a.id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-neutral-800">{a.name}</div>
                        <div className="mt-1 text-xs text-neutral-500">{a.city} • {a.postcode}</div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-neutral-600">
                          <div className="truncate">Company: {a.company}</div>
                          <div className="truncate">Specialty: {a.specialty}</div>
                          <div className="truncate">Type: {a.projectType}</div>
                          <div className="truncate">Value: {a.valueMillions}m</div>
                        </div>
                      </div>
                      <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-neutral-700">
                        <input onClick={(e)=>e.stopPropagation()} type="checkbox" checked={!!outreachSelected[a.id]} onChange={() => setOutreachSelected(p=>({ ...p, [a.id]: !p[a.id] }))} className="h-4 w-4 rounded border-neutral-300 accent-neutral-900" />
                        <span className="hidden sm:inline">Select</span>
                      </label>
                    </div>
                    <Divider />
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <Select value={outreachPlatform[a.id] || "LinkedIn"} onChange={(v) => setOutreachPlatform((p) => ({ ...p, [a.id]: v }))} options={["LinkedIn", "Email", "Instagram", "Facebook", "WhatsApp", "Call"]} />
                      <Btn onClick={() => alert(`${a.name}: Reach out via ${outreachPlatform[a.id] || "LinkedIn"}`)}>Reach Out</Btn>
                    </div>
                    <Card className="mt-3 p-3 text-xs text-neutral-600">
                      <div className="font-medium text-neutral-700">Outreach Status</div>
                      <div className="mt-1">Platform: {outreachPlatform[a.id] || "LinkedIn"}</div>
                      <div>Status: {outreachSelected[a.id] ? "Queued" : "Not started"}</div>
                    </Card>
                  </Card>
                ))}
                {outreach.length === 0 && (
                  <div className="col-span-full flex h-[40vh] items-center justify-center text-sm text-neutral-500">No approved architects. Approve from Review.</div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Details panel
const LabelRow: React.FC<{ icon?: React.ReactNode; label: string; value?: React.ReactNode }>
 = ({ icon, label, value }) => (
  <div className="grid grid-cols-12 gap-2 py-1.5">
    <div className="col-span-4 flex items-center gap-2 text-xs text-neutral-500">{icon}{label}</div>
    <div className="col-span-8 min-w-0 break-words text-sm text-neutral-800">{value}</div>
  </div>
);

function ArchiDetails({ a }: { a: Architect }) {
  return (
    <div className="min-w-0 space-y-3">
      <div className="text-base font-semibold text-neutral-900">{a.name}</div>
      <div className="text-sm text-neutral-600">{a.company}</div>
      <Divider />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="p-3">
          <div className="text-sm font-medium text-neutral-700">Essentials</div>
          <div className="mt-2">
            <LabelRow icon={<MapPin className="h-3.5 w-3.5" />} label="Location" value={`${a.city} • ${a.postcode}`} />
            <LabelRow icon={<DollarSign className="h-3.5 w-3.5" />} label="Project Value" value={`${a.valueMillions}m`} />
            <LabelRow icon={<User className="h-3.5 w-3.5" />} label="Specialty" value={a.specialty} />
            <LabelRow icon={<Building2 className="h-3.5 w-3.5" />} label="Project Type" value={a.projectType} />
          </div>
        </Card>
        <Card className="p-3">
          <div className="text-sm font-medium text-neutral-700">Contact</div>
          <div className="mt-2">
            <LabelRow icon={<Mail className="h-3.5 w-3.5" />} label="Email" value={<a className="underline" href={`mailto:${a.email}`}>{a.email}</a>} />
            <LabelRow icon={<Phone className="h-3.5 w-3.5" />} label="Phone" value={a.phone} />
            <LabelRow icon={<Globe className="h-3.5 w-3.5" />} label="Website" value={<a className="break-all underline" href={a.website} target="_blank" rel="noreferrer">{a.website}</a>} />
          </div>
        </Card>
        <Card className="p-3 md:col-span-2">
          <div className="text-sm font-medium text-neutral-700">Socials</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {a.socials?.linkedin && (
              <a href={a.socials.linkedin} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-50">
                <LinkIcon className="h-3.5 w-3.5" /> LinkedIn
              </a>
            )}
            {a.socials?.instagram && (
              <a href={a.socials.instagram} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-50">
                <LinkIcon className="h-3.5 w-3.5" /> Instagram
              </a>
            )}
            {a.socials?.facebook && (
              <a href={a.socials.facebook} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-neutral-300 px-3 py-1 text-xs text-neutral-800 hover:bg-neutral-50">
                <LinkIcon className="h-3.5 w-3.5" /> Facebook
              </a>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}