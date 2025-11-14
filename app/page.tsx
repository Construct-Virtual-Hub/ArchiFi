"use client";

import React, { useMemo, useState, useEffect, useRef } from "react";
import { Check, ChevronDown, Mail, MapPin, Phone, Search, User, Globe, Building2, DollarSign, Link as LinkIcon } from "lucide-react";
import { motion } from "framer-motion";
import AuthGate from "../components/AuthGate";

// --- DEMO FLAG ---
// Toggle to true for demo-only UI changes (hide job filter, placeholder library).
const DEMO_MODE = true;

// â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"â€"
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

const Select: React.FC<{ id?: string; name?: string; value: string; onChange: (v: string) => void; options: string[]; className?: string }>
 = ({ id, name, value, onChange, options, className = "" }) => (
  <div className={`relative ${className}`}>
    <select
      id={id}
      name={name}
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

function patchFromScrape(d: any): Partial<Architect> | null {
  if (!d || typeof d !== "object") return null;

  const socials = {
    linkedin: d.linkedin_profile_url ?? d.company_linkedin_profile_url ?? "",
    instagram: d.instagram_profile_url ?? d.company_instagram_profile_url ?? "",
    facebook: d.facebook_profile_url ?? d.company_facebook_profile_url ?? "",
  };

  return {
    // core identity
    name: d.full_name ?? d.name,
    company: d.company_name ?? d.company,
    // contacts
    email: d.email ?? undefined,
    phone: d.phone ?? (d.alternate_phone || undefined),
    website: d.website ?? undefined,
    // location / address
    address: d.address ?? d.alternate_address ?? undefined,
    postcode: d.post_code ?? d.postcode ?? d.post_code_area ?? undefined,
    // socials block
    socials,
    // extras we might show later
    raw: d, // keep the full record
  } as Partial<Architect>;
}

function mapScrapeToPatch(d: any): Partial<Architect> | null {
  if (!d || typeof d !== "object") return null;

  const clean = (v: unknown): any => (typeof v === "string" ? v.trim() || undefined : v ?? undefined);

  const patch: Partial<Architect> = {
    // identity (optional)
    full_name: clean(d.full_name),
    company_name: clean(d.company_name),

    // contacts (only set when present)
    email: clean(d.email),
    phone: clean(d.phone),
    website: clean(d.website),
    alternate_phone: clean(d.alternate_phone),
    alternate_email: clean(d.alternate_email),

    // address/geo
    address: clean(d.address) ?? undefined,
    alternate_address: clean(d.alternate_address),
    country: clean(d.country),
    post_code: clean(d.post_code),
    post_code_area: clean(d.post_code_area),
    address_line_1: clean(d.address_line_1),
    address_line2: clean(d.address_line2),
    address_line3: clean(d.address_line3 ?? d.address_line_3),
    address_line_4: clean(d.address_line_4),

    // socials (store raw links; UI already renders buttons)
    linkedin_profile_url: clean(d.linkedin_profile_url),
    instagram_profile_url: clean(d.instagram_profile_url),
    facebook_profile_url: clean(d.facebook_profile_url),
    company_linkedin_profile_url: clean(d.company_linkedin_profile_url),
    company_instagram_profile_url: clean(d.company_instagram_profile_url),
    company_facebook_profile_url: clean(d.company_facebook_profile_url),

    // narrative / registry
    company_bio: clean(d.company_bio),
    notes: clean(d.notes),
    bio: clean(d.bio),
    registration_number: clean(d.registration_number),
    registration_link: clean(d.registration_link),

    // extras
    past_projects: Array.isArray(d.past_projects) ? d.past_projects : undefined,
    created_at: clean(d.created_at),
    last_scraped: clean(d.last_scraped),

    // keep the full record
    raw: d,
  };

  // strip undefined so we don't clobber existing non-empty fields
  Object.keys(patch).forEach(k => (patch as any)[k] === undefined && delete (patch as any)[k]);
  return Object.keys(patch).length ? patch : null;
}

// --- Outreach endpoints ---
const OUTREACH_POST =
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook/97ee6a11-ebe3-4f87-a8d1-3487101ee1bd";
const OUTREACH_STATUS_BASE =
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook/3c3c9a81-6786-4243-9c91-a803fba4da37?session_id=";
const GET_ARCHITECT_DETAILS =
  "https://tumultuously-starchlike-leta.ngrok-free.dev/webhook/a4cfdee8-25f9-4c3f-bda6-c2571f1975c5";

// New LinkedIn client (apply only to linkedin payloads)
const LINKEDIN_CLIENT = {
  name: "Jarib Lad-Wetshi",
  profile_url: "https://www.linkedin.com/in/jarib-lad-wetshi-8030a11b5/",
  business_name: "Jarib Lad-Wetshi",
} as const;

// Instagram client override (apply only to instagram payloads)
const INSTAGRAM_CLIENT = {
  name: "magnus_wetshi",
  profile_url: "https://www.linkedin.com/in/jarib-lad-wetshi-8030a11b5/",
  business_name: "Jarib Lad-Wetshi",
} as const;

type OutreachPlatform = "linkedin" | "instagram";
type OutreachTerminal = "success" | "failed";
type OutreachProgress = "queued" | "inprogress" | OutreachTerminal;

type OutreachActionSpec = {
  action: "follow" | "connect" | "like" | "message";
  item: "account" | "post";
  item_count?: number;
  message_content?: string;
};

type OutreachRequest = {
  url: string;
  architect_name: string;
  account_type: "personal" | "company";
  actions: OutreachActionSpec[];
  client: { name: string; profile_url: string; business_name: string };
  purpose: "outreach";
  platform: OutreachPlatform;
};

type OutreachStatusItem = {
  id: number;
  created_at: string;
  session: string;
  architect_id: number;
  status: OutreachProgress;
  platform: OutreachPlatform;
  purpose: "outreach";
  // optional fields returned by backend; keep them if present
  actions?: OutreachActionSpec[];
  follow_status?: OutreachProgress | null;
  connection_status?: OutreachProgress | null;
  like_post_count?: number | null;
  message_status?: OutreachProgress | null;
  client?: { name: string; profile_url: string; business_name: string };
  url?: string;
  username?: string;
};

// map of sessionId -> setInterval id
const OUTREACH_POLL_INTERVAL_MS = 10_000;
const OUTREACH_TERMINALS: OutreachTerminal[] = ["success", "failed"];

// --- Enriched mock records keyed by id (fields mirror your scrape POST output) ---
const MOCK_ENRICHED_BY_ID: Record<string, any> = {
  "124923": {
    id: 124923,
    full_name: "Evgenia Gibson",
    company_name: "Hunters",
    email: null,
    phone: null,
    website: "https://hunters.co.uk/",
    linkedin_profile_url: "",
    instagram_profile_url: "",
    facebook_profile_url: "",
    company_bio:
      "Hunters is a multi-disciplinary architectural and building consultancy practice based in Hammersmith, London. For 70 years the practice has procured, designed and modernised a diverse range of buildings across sectors including housing, healthcare, commercial, later living and education. The firm's contact details on the website list their office at Space One, Beadon Road, London W6 0EA and telephone +44 20 8237 8200.",
    notes: null,
    post_code: null,
    alternate_phone: "",
    alternate_email: null,
    bio: "",
    past_projects: [],
    address: "1 Beadon Road, London, W6 0EA",
    alternate_address: "Space One, Beadon Road, London, W6 0EA",
    company_linkedin_profile_url: "https://www.linkedin.com/company/143547/",
    company_instagram_profile_url: "",
    company_facebook_profile_url: "",
    registration_number: "073200A",
    registration_link: "https://architects-register.org.uk/Architect/073200A?filterId=Architect",
    country: "United Kingdom",
    address_line_1: null,
    address_line2: null,
    address_line3: null,
    address_line_4: null,
    post_code_area: null,
    created_at: "2025-10-29T08:22:12.809977+00:00",
    last_scraped: "2025-11-05T12:04:10.571+00:00",
    session: "session-scrape-1762344189346"
  },
  "125001": {
    id: 125001,
    full_name: "Studio Anselm",
    company_name: "Anselm Architects",
    email: "contact@anselm-arch.co.uk",
    phone: "+44 20 7000 0000",
    website: "https://anselm-arch.co.uk",
    linkedin_profile_url: "https://linkedin.com/company/anselm-arch",
    instagram_profile_url: "https://instagram.com/anselm.arch",
    facebook_profile_url: "",
    company_bio: "Boutique studio focusing on sustainable office refurbishments across the City of London.",
    notes: "LEED AP on staff",
    post_code: "EC1A 1BB",
    alternate_phone: null,
    alternate_email: null,
    bio: "Founded 2014",
    past_projects: ["Smithfield Exchange", "Moorgate Works"],
    address: "29 Smithfield St, London EC1A 1BB",
    alternate_address: null,
    company_linkedin_profile_url: "https://linkedin.com/company/anselm-arch",
    company_instagram_profile_url: "https://instagram.com/anselm.arch",
    company_facebook_profile_url: "",
    registration_number: "082345Z",
    registration_link: "https://architects-register.org.uk/Architect/082345Z?filterId=Architect",
    country: "United Kingdom",
    created_at: "2025-05-10T10:22:00.000Z",
    last_scraped: "2025-11-05T12:04:10.571+00:00",
    session: "session-scrape-1762344189346"
  },
  "125019": {
    id: 125019,
    full_name: "Avery + Co",
    company_name: "Avery",
    email: "hello@avery.co.uk",
    phone: "+44 117 123 4567",
    website: "https://avery.co.uk",
    linkedin_profile_url: "https://linkedin.com/company/avery-uk",
    instagram_profile_url: "https://instagram.com/avery.uk",
    facebook_profile_url: "",
    company_bio: "Award-winning residential practice delivering mid-rise apartment schemes across the South West.",
    notes: "Shortlisted RIBA SW 2024",
    post_code: "BS1 4ST",
    alternate_phone: "+44 117 765 4321",
    alternate_email: "studio@avery.co.uk",
    bio: "Founded by Sarah Avery",
    past_projects: ["Harbourside Lofts", "Temple Quarter Green Homes"],
    address: "1 Victoria St, Bristol BS1 4ST",
    alternate_address: null,
    company_linkedin_profile_url: "https://linkedin.com/company/avery-uk",
    company_instagram_profile_url: "https://instagram.com/avery.uk",
    company_facebook_profile_url: "",
    registration_number: "091234B",
    registration_link: "https://architects-register.org.uk/Architect/091234B?filterId=Architect",
    country: "United Kingdom",
    created_at: "2025-03-14T09:00:00.000Z",
    last_scraped: "2025-11-05T12:04:10.571+00:00",
    session: "session-scrape-1762344189346"
  }
};

type Architect = {
  // base fields already used by the UI
  id: string;
  name: string;
  city: string;
  postcode: string;               // UI primary postcode
  company: string;
  email?: string;
  phone?: string;
  website?: string;
  socials?: { linkedin?: string; instagram?: string; facebook?: string };
  specialty?: string;
  projectType?: string;
  valueMillions?: number;
  grade?: string;
  address?: string;               // keep ONLY ONE 'address' key

  // system fields
  raw?: any;
  scrape?: { sessionId?: string; status?: string; startedAt?: number; statusUpdatedAt?: number };

  // outreach runtime fields
  outreachSession?: string;
  outreachPlatform?: OutreachPlatform;
  outreachStatus?: OutreachProgress;

  // SCRAPE-ONLY (optional) — names do NOT collide with base keys
  // identity
  full_name?: string;
  company_name?: string;

  // personal socials (do not replace 'socials' object)
  linkedin_profile_url?: string | null;
  instagram_profile_url?: string | null;
  facebook_profile_url?: string | null;

  // company socials
  company_linkedin_profile_url?: string | null;
  company_instagram_profile_url?: string | null;
  company_facebook_profile_url?: string | null;

  // narrative
  company_bio?: string;
  notes?: string;
  bio?: string;

  // addresses / geo hints
  alternate_address?: string;
  country?: string;
  post_code?: string;             // raw scraped field (kept separate from UI 'postcode')
  post_code_area?: string;
  address_line_1?: string;
  address_line2?: string;
  address_line3?: string;
  address_line_4?: string;

  // alternates
  alternate_phone?: string;
  alternate_email?: string;

  // registry
  registration_number?: string;
  registration_link?: string;

  // arrays / timestamps
  past_projects?: any[];
  created_at?: string;
  last_scraped?: string;
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
      linkedin_profile_url: `https://linkedin.com/in/architect-${i + 1}`,
      instagram_profile_url: `https://instagram.com/architect_${i + 1}`,
      facebook_profile_url: `https://facebook.com/${domain}`,
      company_linkedin_profile_url: `https://www.linkedin.com/company/${domain}`,
      company_instagram_profile_url: `https://www.instagram.com/${domain}`,
      company_facebook_profile_url: `https://www.facebook.com/${domain}`,
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
const SCRAPE_ENDPOINT = "/api/scrape";
const SCRAPE_STATUS_ENDPOINT = "/api/scrape-status";
const DETAILS_ENDPOINT = "/api/architect-details"; // optional; will no-op if 501


// Fetch latest scraped details for specific architect ids.
// We re-use the scrape POST endpoint by sending only {id} entries.
// Backend responds with enriched records for completed ones.
async function fetchScrapedDetailsByIds(ids: string[]): Promise<any[]> {
  if (!ids?.length) return [];
  const res = await fetch(SCRAPE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids.map(id => ({ id: Number(id) }))),
  });
  if (!res.ok) return [];
  const data = await res.json().catch(() => null);
  if (!data) return [];
  return Array.isArray(data) ? data : [data];
}

async function fetchArchitectDetailsById(architectId: number) {
  const res = await fetch(GET_ARCHITECT_DETAILS, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ architect_id: architectId }),
  });
  if (!res.ok) throw new Error(`Details fetch failed (${res.status})`);
  return (await res.json()) as any;
}

function deepMergeArchitect<T extends Record<string, any>>(base: T, patch: Partial<T>): T {
  // Only assign keys that are not undefined/null/empty string in the patch.
  // Shallow-merge nested objects like `scrape`/`contact` if present.
  const out: any = { ...base };

  for (const [k, v] of Object.entries(patch)) {
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object" && !Array.isArray(v)) {
      out[k] = deepMergeArchitect(out[k] ?? {}, v as any);
    } else {
      out[k] = v;
    }
  }
  return out as T;
}

function pickSocialUrl(arch: Architect, platform: OutreachPlatform): string | undefined {
  // Prefer person profile, fall back to company profile
  if (platform === "linkedin") {
    return (
      arch.linkedin_profile_url ||
      arch.company_linkedin_profile_url ||
      arch.socials?.linkedin ||
      undefined
    )?.trim() || undefined;
  }
  // instagram
  return (
    arch.instagram_profile_url ||
    arch.company_instagram_profile_url ||
    arch.socials?.instagram ||
    undefined
  )?.trim() || undefined;
}

function defaultActions(platform: OutreachPlatform): OutreachActionSpec[] {
  // keep it minimal; matches your example structures
  const base: OutreachActionSpec[] = [
    { action: "follow", item: "account" },
    { action: "connect", item: "account" },
    { action: "like", item: "post", item_count: 3 },
  ];
  return base;
}

function normOutreachStatus(s: string | null | undefined): OutreachProgress {
  const v = (s || "").toLowerCase();
  if (v === "success" || v === "failed" || v === "queued" || v === "inprogress") return v;
  return "inprogress";
}

function getLoggedInEmail(): string | undefined {
  try {
    const raw = typeof window !== "undefined" ? localStorage.getItem("archifi:user") : null;
    if (!raw) return undefined;
    const obj = JSON.parse(raw);
    const email = (obj?.email || "").toString().trim();
    return email || undefined;
  } catch {
    return undefined;
  }
}

// --- Scrape status helpers (place near other helpers) ---
// Terminal statuses we accept from the status endpoint
const TERMINAL_STATUSES = new Set(["success", "failed"]);

function normStatus(s?: string) {
  return (s || "").trim().toLowerCase();
}

function latestStatusPerArchitect(rows: any[]): Map<string, any> {
  const latest = new Map<string, any>();
  for (const row of rows || []) {
    const key = String(row?.architect_id ?? row?.id ?? "");
    if (!key) continue;
    const current = latest.get(key);
    if (!current) {
      latest.set(key, row);
      continue;
    }
    const currDate = new Date(current.created_at ?? 0).getTime();
    const nextDate = new Date(row.created_at ?? 0).getTime();
    if (Number.isFinite(nextDate) && nextDate > currDate) {
      latest.set(key, row);
    }
  }
  return latest;
}

// Safe JSON parsing helper (handles incomplete ngrok responses)
async function safeJson<T = any>(res: Response): Promise<T | null> {
  try {
    // Some ngrok responses can be incomplete during tunneling; guard it.
    const txt = await res.text();
    if (!txt) return null;
    return JSON.parse(txt) as T;
  } catch {
    return null;
  }
}

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
  const name =
    x.full_name ?? x.name ?? x.architectName ?? `Architect ${i + 1}`;

  const company =
    x.company_name ?? x.company ?? x.companyName ?? "";

  const postcode =
    x.post_code ?? x.postcode ?? "";

  const address: string =
    (typeof x.address === "string" && x.address) ? x.address : "";

  // Prefer explicit city/town; otherwise try to infer from address
  let city = x.city ?? x.town ?? "";
  if (!city && address) {
    // naive: use first comma-separated token if it looks like a city word
    const token = address.split(",")[0]?.trim() || "";
    if (token && /^[A-Za-z\s'-]{2,}$/.test(token)) city = token;
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
    linkedin_profile_url: x.linkedin_profile_url ?? undefined,
    instagram_profile_url: x.instagram_profile_url ?? undefined,
    facebook_profile_url: x.facebook_profile_url ?? undefined,
    company_linkedin_profile_url: x.company_linkedin_profile_url ?? undefined,
    company_instagram_profile_url: x.company_instagram_profile_url ?? undefined,
    company_facebook_profile_url: x.company_facebook_profile_url ?? undefined,
    specialty: x.specialty ?? x.speciality ?? "Residential",
    projectType: x.projectType ?? x.type ?? "New Build",
    valueMillions: Number.isFinite(x.valueMillions) ? Number(x.valueMillions) : 0,
    grade: x.grade ?? ["A", "B", "C"][i % 3],
    address, // NEW
    raw: x,
    scrape: { status: "idle" },
  };
}

// Apply local filters (job type + value range) and optional query guard
function applyClientFilters(
  items: Architect[],
  query: string,
  jobType: string,
  vMin: number,
  vMax: number
): Architect[] {
  const q = (query || "").trim().toLowerCase();
  return items.filter(a => {
    const byJob = jobType === "All Job Types" ? true : a.projectType === jobType;
    const byVal = a.valueMillions >= vMin && a.valueMillions <= vMax;

    // match against city, postcode, address, or company
    const haystacks = [
      a.city || "",
      a.postcode || "",
      a.address || "",
      a.company || "",
    ].map(s => s.toLowerCase());

    const byQuery = !q ? true : haystacks.some(s => s.includes(q));

    return byJob && byVal && byQuery;
  });
}

// Extract nextId from API response or infer it from the last raw item when API doesn't send it.
function extractNextId(data: any, rawItems: any[]): number | null {
  // If API provided nextId, prefer it
  let nextId = Array.isArray(data) ? null : (data?.nextId ?? null);
  if (nextId != null) return nextId;

  // Infer: try to parse numeric id from the last raw item
  if (rawItems && rawItems.length) {
    const tail = rawItems[rawItems.length - 1];
    const candidate = tail?.id ?? tail?.architect_id ?? tail?._id ?? null;
    if (candidate != null) {
      const n = Number(String(candidate).toString().replace(/[^\d]/g, ""));
      if (Number.isFinite(n)) return n;
    }
  }
  return null;
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
  const [detailsLoading, setDetailsLoading] = useState(false);

  const [reviewSelected, setReviewSelected] = useState<Record<string, boolean>>({});
  const [outreachSelected, setOutreachSelected] = useState<Record<string, boolean>>({});
  const [outreach, setOutreach] = useState<Architect[]>([]);

  const outreachTimersRef = useRef<Record<string, number>>({}); // session -> intervalId

  useEffect(() => {
    return () => {
      Object.keys(outreachTimersRef.current).forEach(stopOutreachPolling);
    };
  }, []);

  function stopOutreachPolling(sessionId: string) {
    const timers = outreachTimersRef.current;
    if (timers[sessionId]) {
      clearInterval(timers[sessionId]);
      delete timers[sessionId];
    }
  }

  function startOutreachPolling(sessionId: string) {
    stopOutreachPolling(sessionId);

    const tick = async () => {
      try {
        const res = await fetch(OUTREACH_STATUS_BASE + encodeURIComponent(sessionId));
        if (!res.ok) return;
        const list: OutreachStatusItem[] = await res.json();
        if (!Array.isArray(list)) return;

        const statusByArchitect = new Map<string, OutreachStatusItem>();
        for (const item of list) {
          const key = String(item.architect_id ?? item.id ?? "");
          if (!key) continue;
          statusByArchitect.set(key, item);
        }

        let allTerminal = false;

        setOutreach(prev => {
          const next = prev.map(card => {
            const cardKey = String(card.raw?.id ?? card.id ?? "");
            const statusEntry = statusByArchitect.get(cardKey);
            if (!statusEntry) return card;

            if (card.outreachStatus && OUTREACH_TERMINALS.includes(card.outreachStatus as OutreachTerminal)) {
              return card;
            }

            if (card.outreachSession && card.outreachSession !== sessionId) {
              return card;
            }

            const status = normOutreachStatus(statusEntry.status);

            return {
              ...card,
              outreachStatus: status,
              outreachPlatform: statusEntry.platform ?? card.outreachPlatform,
              outreachSession: statusEntry.session ?? card.outreachSession ?? sessionId,
            };
          });

          const sessionCards = next.filter(card => card.outreachSession === sessionId);
          allTerminal = sessionCards.length > 0 && sessionCards.every(card => card.outreachStatus && OUTREACH_TERMINALS.includes(card.outreachStatus as OutreachTerminal));
          return next;
        });

        if (allTerminal) {
          stopOutreachPolling(sessionId);
        }
      } catch {
        // swallow errors; try again next interval
      }
    };

    void tick();
    outreachTimersRef.current[sessionId] = window.setInterval(tick, OUTREACH_POLL_INTERVAL_MS);
  }

  async function postOutreachForCards(cards: Architect[], platform: OutreachPlatform) {
    if (!cards.length) return;

    const payload: OutreachRequest[] = [];
    const eligibleIds = new Set<string>();

    for (const a of cards) {
      const url = pickSocialUrl(a, platform);
      if (!url) continue;

      eligibleIds.add(String(a.id));
      payload.push({
        url,
        architect_name: a.full_name || a.name || "Unknown",
        account_type: "personal",
        actions: defaultActions(platform),
        client:
          platform === "instagram"
            ? INSTAGRAM_CLIENT
            : LINKEDIN_CLIENT,
        purpose: "outreach",
        platform,
      });
    }

    if (!payload.length) return;

    setOutreach(prev =>
      prev.map(card => {
        if (!eligibleIds.has(String(card.id))) return card;
        return {
          ...card,
          outreachStatus: "inprogress",
          outreachPlatform: platform,
        };
      })
    );

    try {
      const loggedEmail = getLoggedInEmail();
      if (!loggedEmail) {
        console.warn("No signed-in email found for outreach; using fallback identity.");
      }

      const requestBody = {
        outreach: payload,
        currently_logged_in_email: loggedEmail ?? "unknown@archifi.local",
      };

      const res = await fetch(OUTREACH_POST, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      let sessionId: string | undefined;
      try {
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const first: any = Array.isArray(data) ? data[0] : data;
        sessionId = first?.session || first?.session_id || undefined;
      } catch {
        sessionId = undefined;
      }

      if (sessionId) {
        setOutreach(prev =>
          prev.map(card => {
            if (!eligibleIds.has(String(card.id))) return card;
            return {
              ...card,
              outreachSession: sessionId,
            };
          })
        );
        startOutreachPolling(sessionId);
      }
    } catch {
      setOutreach(prev =>
        prev.map(card => {
          if (!eligibleIds.has(String(card.id))) return card;
          return {
            ...card,
            outreachStatus: "failed",
            outreachPlatform: platform,
          };
        })
      );
    }
  }

  const outreachPlatformOptions: OutreachPlatform[] = ["linkedin", "instagram"];
  const outreachPlatformLabel = (p: OutreachPlatform) => (p === "instagram" ? "Instagram" : "LinkedIn");
  const labelToOutreachPlatform = (label: string): OutreachPlatform =>
    label.toLowerCase() === "instagram" ? "instagram" : "linkedin";

  const [scrapeSessionId, setScrapeSessionId] = useState<string | null>(null);
  const [scrapeTicker, setScrapeTicker] = useState<number>(0); // used to re-trigger polling (legacy, may be removed)

  // Ref for reading latest review state inside polling intervals
  const reviewRef = React.useRef(review);
  useEffect(() => { reviewRef.current = review; }, [review]);
  const detailsIdRef = React.useRef<string | null>(detailsId);
  useEffect(() => { detailsIdRef.current = detailsId; }, [detailsId]);

  // Ref for selected IDs in scrape POST handler
  const selectedIdsRef = React.useRef<Set<string>>(new Set());

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

  // When apiPages has content, we are in server-paginated mode (100/page from upstream).
  // In that case render the full server page (discover) without local paging.
  // Otherwise (mock/local), keep existing client paging via pageItems.
  const serverPaging = apiPages.length > 0;
  const visibleItems = serverPaging ? discover : pageItems;
  const selectedReview = detailsId ? review.find((x) => x.id === detailsId) : null;

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

      const rawItems: ApiItem[] = Array.isArray(data) ? data : (data.items ?? []);
      const mapped = rawItems.map(mapApiItemToArchitect);

      // Apply local UI filters (job type + value range + query guard)
      const filtered = applyClientFilters(mapped, query, jobType, valueMin, valueMax);

      const nextId = extractNextId(data, rawItems);

      setApiPages([filtered]);       // cache filtered page
      setApiNextIds([nextId]);
      setApiPageIndex(0);
      setDiscover(filtered);         // drive the Discover grid
      setActiveTab("discover");

      console.log("Search loaded:", { count: filtered.length, nextId });
    } catch (e: any) {
      console.error("SEARCH failed; falling back to mock:", e?.message || e);
      setApiError("Online search failed. Showing mock results.");
      const mock = applyClientFilters(makeMock(50), query, jobType, valueMin, valueMax);
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

    // If already cached, show it
    const cachedNext = apiPages[idx + 1];
    if (cachedNext) {
      setApiPageIndex(idx + 1);
      setDiscover(cachedNext);
      return;
    }

    const prevNextId = apiNextIds[idx];
    if (prevNextId == null) return; // no more pages

    try {
      setApiLoading(true);

      const base: any = { limit: 100, nextId: prevNextId };
      if (query && query.trim().length > 0) base.postcode_town = query.trim();

      const res = await postJSON(SEARCH_ENDPOINT, base);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const rawItems: ApiItem[] = Array.isArray(data) ? data : (data.items ?? []);
      const mapped = rawItems.map(mapApiItemToArchitect);
      const filtered = applyClientFilters(mapped, query, jobType, valueMin, valueMax);

      const newNextId = extractNextId(data, rawItems);

      setApiPages((p) => [...p, filtered]);
      setApiNextIds((p) => [...p, newNextId]);
      setApiPageIndex(idx + 1);
      setDiscover(filtered);

      console.log("Next page:", { count: filtered.length, nextId: newNextId });
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
    const target = visibleItems; // use full server page (100) or client page (20) as appropriate
    target.forEach((a) => (upd[a.id] = true));
    setDiscoverSelected(upd);
  }

  async function scrapeDetails() {
    const picked = discover.filter(a => discoverSelected[a.id]);
    if (!picked.length) return;

    const clientSession = `session-scrape-${Date.now()}`;
    selectedIdsRef.current = new Set(picked.map(p => String(p.id)));

    // Build payload we POST to the scraper
    const payload = picked.map(p =>
      p.raw && Object.keys(p.raw).length ? p.raw : {
        id: Number(p.id) || p.id,
        full_name: p.name,
        company_name: p.company,
        email: p.email,
        phone: p.phone,
        website: p.website,
        post_code: p.postcode,
        address: p.address,
      }
    );

    // move/mark - attach raw payload to review items
    setReview(cur => {
      const ids = new Set(cur.map(x => x.id));
      const merged = [...cur];
      for (const p of picked) {
        const rawOfThis = payload.find((x: any) => String(x.id) === String(p.id)) ?? p.raw ?? null;
        const mark = { ...p, raw: rawOfThis, scrape: { sessionId: clientSession, status: "inprogress", startedAt: Date.now() } };
        if (!ids.has(p.id)) merged.push(mark);
        else merged.forEach((x, i) => { if (x.id === p.id) merged[i] = mark; });
      }
      return merged;
    });
    setActiveTab("review");

    try {
      const loggedEmail = getLoggedInEmail();
      if (!loggedEmail) {
        console.warn("No signed-in email found; using fallback identity.");
      }
      const requestBody = {
        architects: payload,
        currently_logged_in_email: loggedEmail ?? "unknown@archifi.local",
      };

      const resp = await postJSON(SCRAPE_ENDPOINT, requestBody);

      let serverSession: string | null = null;

      try {
        const data = await resp.clone().json();
        if (data && typeof data === "object") {
          serverSession = (data.session || data.session_id || data.id) ?? null;
        }
      } catch { /* ignore non-JSON */ }

      const sessionId = (serverSession || clientSession).toString();
      setScrapeSessionId(sessionId);

      // 1) mark selected cards as in progress + session (no details merge here)
      setReview(curr => curr.map(a => {
        if (!selectedIdsRef.current.has(String(a.id))) return a;
        return deepMergeArchitect(a, {
          scrape: {
            ...(a.scrape ?? {}),
            status: "inprogress",
            sessionId, // prefer backend session id; fallback to client-generated if needed
            startedAt: Date.now(),
          },
        });
      }));

      // 2) begin polling every 10s for this session
      startScrapePolling(sessionId);
    } catch (e) {
      console.warn("scrape POST failed", e);
      // On error, still mark as inprogress and start polling
      const sessionId = clientSession;
      setScrapeSessionId(sessionId);
      setReview(curr => curr.map(a => {
        if (!selectedIdsRef.current.has(String(a.id))) return a;
        return deepMergeArchitect(a, {
          scrape: {
            ...(a.scrape ?? {}),
            status: "inprogress",
            sessionId,
            startedAt: Date.now(),
          },
        });
      }));
      startScrapePolling(sessionId);
    }
  }

  async function fetchScrapedDetails(archId: string): Promise<Partial<Architect> | null> {
    try {
      const res = await fetch(`${DETAILS_ENDPOINT}?id=${encodeURIComponent(archId)}`, { cache: "no-store" });
      if (!res.ok) return null; // details endpoint not configured or not available
      const d = await res.json();
      return {
        email: d.email ?? undefined,
        phone: d.phone ?? undefined,
        website: d.website ?? undefined,
        socials: {
          linkedin: d.linkedin_profile_url ?? d.company_linkedin_profile_url ?? undefined,
          instagram: d.instagram_profile_url ?? d.company_instagram_profile_url ?? undefined,
          facebook: d.facebook_profile_url ?? d.company_facebook_profile_url ?? undefined,
        },
        address: d.address ?? undefined,
        postcode: d.post_code ?? d.postcode ?? undefined,
        company: d.company_name ?? d.company ?? undefined,
        name: d.full_name ?? d.name ?? undefined,
      };
    } catch {
      return null;
    }
  }

  // Hydrate a single architect's details from the scrape endpoint (or our existing fallback)
  async function hydrateFromScrape(archId: string, sessionId: string) {
    try {
      // Try to fetch from details endpoint first
      let details: any = null;
      const detailsRes = await fetchScrapedDetails(archId);
      if (detailsRes) {
        // Convert the partial details to a format mapScrapeToPatch can use
        details = detailsRes;
      } else {
        // Fallback: try to get from status endpoint (might include full details)
        try {
          const statusRes = await fetch(`${SCRAPE_STATUS_ENDPOINT}?session=${encodeURIComponent(sessionId)}`, { cache: "no-store" });
          if (statusRes.ok) {
            const statusData = await safeJson<any[]>(statusRes);
            if (Array.isArray(statusData)) {
              // Find the event for this architect that has details
              const event = statusData.find((e: any) => 
                String(e.architect_id ?? e.id ?? "") === String(archId) &&
                (e.email !== undefined || e.website !== undefined || e.company_bio !== undefined)
              );
              if (event) details = event;
            }
          }
        } catch {
          // ignore
        }
      }

      // If still no details, try mock fallback
      if (!details) {
        const mock = MOCK_ENRICHED_BY_ID[String(archId)];
        if (mock) details = mock;
      }

      if (!details) return;

      const patch = mapScrapeToPatch(details);
      if (!patch) return;

      // Merge into review list without changing selection/ordering
      setReview((prev) =>
        prev.map((card) =>
          String(card.id) === String(archId)
            ? { ...card, ...patch, scrape: { ...(card.scrape || {}), status: "success", sessionId } }
            : card
        )
      );
    } catch {
      // silent: don't break UI if details fetch is unavailable; the success status will still stick
    }
  }

  // Polling functions
  async function pollScrapeStatusOnce(sessionId: string) {
    // Call the ngrok status endpoint you wired earlier
    // Expect: Array<{ id, created_at, session, architect_id, status, architect_name }>
    const res = await fetch(
      `${SCRAPE_STATUS_ENDPOINT}?session=${encodeURIComponent(sessionId)}`,
      { method: "GET", cache: "no-store" }
    );
  if (!res.ok) throw new Error(`status fetch failed: ${res.status}`);
  const list = await safeJson<Array<any>>(res);
  if (!Array.isArray(list)) return [];
  return list;
  }

  // Keep a single interval per active session
  const scrapeIntervalRef = React.useRef<number | null>(null);
  const activeScrapeSessionRef = React.useRef<string | null>(null);

  function stopScrapePolling() {
    if (scrapeIntervalRef.current !== null) {
      clearInterval(scrapeIntervalRef.current);
      scrapeIntervalRef.current = null;
    }
    activeScrapeSessionRef.current = null;
  }

  function startScrapePolling(sessionId: string) {
    if (scrapeIntervalRef.current) {
      if (activeScrapeSessionRef.current === sessionId) return;
      stopScrapePolling();
    }

    const tick = async () => {
      try {
        const statuses = await pollScrapeStatusOnce(sessionId);
        if (!statuses.length) return;

        const latestById = latestStatusPerArchitect(statuses);
        if (!latestById.size) return;

        const newlySuccessfulIds: string[] = [];
        let snapshot: Architect[] = reviewRef.current;

        setReview(prev => {
          const nextState = prev.map(card => {
            const key = String(card.id);
            const statusEntry = latestById.get(key);
            if (!statusEntry) return card;

            const prevStatus = normStatus(card.scrape?.status);
            const candidateStatus = normStatus(statusEntry.status);
            const nextStatus = TERMINAL_STATUSES.has(prevStatus) ? prevStatus : candidateStatus;

            if (nextStatus === prevStatus && card.scrape?.sessionId === sessionId) {
              return card;
            }

            if (nextStatus === "success" && prevStatus !== "success") {
              newlySuccessfulIds.push(key);
            }

            return deepMergeArchitect(card, {
              scrape: {
                ...(card.scrape ?? {}),
                status: nextStatus,
                sessionId,
              },
            });
          });

          snapshot = nextState;
          return nextState;
        });

        if (newlySuccessfulIds.length) {
          const uniqueSuccessIds = Array.from(new Set(newlySuccessfulIds));
          fetchScrapedDetailsByIds(uniqueSuccessIds)
            .then(details => {
              if (!details?.length) return;
              const patches = details.map(d => mapScrapeToPatch(d)).filter(Boolean);
              if (!patches.length) return;

              setReview(curr => {
                const byId = new Map(
                  patches
                    .filter((p): p is Partial<Architect> & { id?: string | number } => !!p)
                    .map(p => [String((p as any).id ?? ""), p])
                );
                if (!byId.size) return curr;

                return curr.map(card => {
                  const patch = byId.get(String(card.id));
                  return patch ? deepMergeArchitect(card, patch) : card;
                });
              });
            })
            .catch(() => {});
        }

        const allTerminal = snapshot
          .filter(card => card.scrape?.sessionId === sessionId)
          .every(card => TERMINAL_STATUSES.has(normStatus(card.scrape?.status)));

        if (allTerminal && scrapeIntervalRef.current) {
          clearInterval(scrapeIntervalRef.current);
          scrapeIntervalRef.current = null;
          activeScrapeSessionRef.current = null;
        }
      } catch {
        // silent; try again on next tick
      }
    };

    void tick();
    scrapeIntervalRef.current = window.setInterval(tick, 10_000);
    activeScrapeSessionRef.current = sessionId;
  }

  // Start polling when sessionId is set
  useEffect(() => {
    if (scrapeSessionId) {
      startScrapePolling(scrapeSessionId);
    }
    return () => {
      stopScrapePolling();
    };
  }, [scrapeSessionId]);

  function clearReview() {
    stopScrapePolling();
    setReview([]);
    setReviewSelected({});
    setDetailsId(null);
    detailsIdRef.current = null;
    setDetailsLoading(false);
  }
  function clearOutreach() {
    Object.keys(outreachTimersRef.current).forEach(stopOutreachPolling);
    setOutreach([]);
    setOutreachSelected({});
  }

  async function handleSelectReviewArchitect(arch: Architect) {
    setDetailsId(arch.id);
    detailsIdRef.current = arch.id;

    const sourceId = arch.raw?.id ?? arch.id;
    let numericId = Number(sourceId);
    if (!Number.isFinite(numericId)) {
      const digits = String(sourceId ?? "").replace(/[^\d]/g, "");
      numericId = digits ? Number(digits) : NaN;
    }

    if (!Number.isFinite(numericId)) {
      setDetailsLoading((current) =>
        detailsIdRef.current === arch.id ? false : current
      );
      return;
    }

    const selectionKey = String(arch.id);
    setDetailsLoading(true);
    try {
      const fresh = await fetchArchitectDetailsById(numericId);
      const patch = mapScrapeToPatch(fresh);
      if (patch) {
        setReview((prev) =>
          prev.map((card) =>
            String(card.id) === selectionKey ? deepMergeArchitect(card, patch) : card
          )
        );
      }
    } catch (error) {
      console.warn("Failed to refresh architect details", error);
    } finally {
      setDetailsLoading((current) =>
        detailsIdRef.current === selectionKey ? false : current
      );
    }
  }

  const pageContent = (
    <div className="min-h-[90vh] w-full min-w-0 overflow-hidden bg-neutral-50 p-4 sm:p-6">
      {/* Top bar */}
      <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white/80 px-4 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-neutral-100 text-neutral-500 shadow-inner">A</div>
          <div className="text-sm font-semibold tracking-wide text-neutral-400">ARCHIFI</div>
        </div>
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Input id="q" name="q" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Town or Postcode" className="min-w-0 flex-1" />
          {!DEMO_MODE && (
            <Select id="jobType" name="jobType" value={jobType} onChange={setJobType} options={["All Job Types", "New Build", "Renovation", "Extension", "Interior Fit-Out"]} className="w-56" />
          )}
          {false && (
            <div className="flex items-center gap-2 rounded-2xl border border-neutral-300 px-3 py-2">
              <span className="text-xs text-neutral-500">Value(m)</span>
              <Input id="valueMin" name="valueMin" type="number" min={0} max={5} step="0.1" value={valueMin} onChange={(e) => setValueMin(Number(e.target.value))} className="h-8 w-20" />
              <span className="text-neutral-400 select-none" aria-hidden="true">{'\u2013'}</span>
              <Input id="valueMax" name="valueMax" type="number" min={0} max={5} step="0.1" value={valueMax} onChange={(e) => setValueMax(Number(e.target.value))} className="h-8 w-20" />
            </div>
          )}
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
            {DEMO_MODE ? (
              <div className="space-y-3">
                {["Coming soon", "Coming soon", "Coming soon"].map((label, i) => (
                  <div
                    key={`soon-${i}`}
                    className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-neutral-800">{label}</div>
                    </div>
                    <div className="mt-1 text-sm text-neutral-500">
                      This panel will load your full scraped architect library.
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              library.map((a) => (
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
              ))
            )}
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
                {visibleItems.map((a) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-800">{a.name}</div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
                            <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{a.city} • {a.postcode}</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" />{a.company}</span>
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
                {visibleItems.length === 0 && (
                  <div className="flex h-full items-center justify-center text-sm text-neutral-500">
                    Hit <span className="mx-1 rounded-md bg-neutral-900 px-2 py-0.5 text-white">Search</span> to load architects.
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
                        const add = chosen
                          .filter(c=>!ids.has(c.id))
                          .map(c => ({
                            ...c,
                            outreachPlatform: c.outreachPlatform ?? "linkedin",
                            outreachStatus: c.outreachStatus ?? "queued",
                          }));
                        return [...prev, ...add];
                      });
                      setOutreachSelected(prev=>({ ...prev, ...Object.fromEntries(chosen.map(c=>[c.id,true])) }));
                      setActiveTab("outreach");
                    }}>Approve to Outreach</Btn>
                  </div>
                </div>
                <div className="min-w-0 h-[calc(72vh-56px)] space-y-2 overflow-y-auto p-3 overscroll-contain">
                  {review.map((a) => (
                    <Card key={a.id} onClick={() => void handleSelectReviewArchitect(a)} className={`cursor-pointer p-4 ${detailsId === a.id ? "ring-1 ring-neutral-800" : ""}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-semibold text-neutral-800">{a.name}</div>
                          <div className="mt-1 text-xs text-neutral-500">{a.city} • {a.postcode}</div>
                          <div className="mt-1 text-xs text-neutral-500">Grade {a.grade} • {a.company}</div>
                          {/* Status line (small, inline) */}
                          <div className="mt-1 text-xs">
                            <span className="text-neutral-500">Scrape: </span>
                            <span className={
                              (a.scrape?.status || "").toLowerCase() === "success" ? "text-green-600" :
                              (a.scrape?.status || "").toLowerCase().includes("progress") ? "text-amber-600" :
                              (a.scrape?.status || "").toLowerCase() === "failed" ? "text-red-600" :
                              "text-neutral-600"
                            }>
                              {a.scrape?.status || "idle"}
                            </span>
                            { (a.scrape?.status || "").toLowerCase() === "failed" && (
                              <button
                                className="ml-2 rounded-lg border border-neutral-300 px-2 py-0.5 text-[11px] hover:bg-neutral-50"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const session = `session-scrape-${Date.now()}`;
                                  setScrapeSessionId(session);
                                  // restart scrape for this single architect
                                  const body = [a.raw || {
                                    id: Number(a.id) || a.id,
                                    full_name: a.name, company_name: a.company,
                                    email: a.email, phone: a.phone, website: a.website,
                                    post_code: a.postcode, address: a.address
                                  }];
                                  // mark as inprogress
                                  setReview(cur => cur.map(r => r.id===a.id ? { ...r, scrape: { sessionId: session, status: "inprogress", startedAt: Date.now(), statusUpdatedAt: Date.now() } } : r));
                                  postJSON(SCRAPE_ENDPOINT, body).then(() => setTimeout(()=>setScrapeTicker(t=>t+1), 1500)).catch(() => {
                                    setReview(cur => cur.map(r => r.id===a.id ? { ...r, scrape: { sessionId: session, status: "failed", statusUpdatedAt: Date.now() } } : r));
                                  });
                                }}
                              >
                                Retry
                              </button>
                            )}
                          </div>
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

              <Card className="col-span-12 h-full overflow-hidden p-0 lg:col-span-6 flex flex-col min-h-0">
                <div className="border-b border-neutral-200 px-4 py-3 text-sm font-medium text-neutral-700">Architect Details</div>
                <div className="nice-scroll overflow-y-auto overflow-x-hidden mt-4 min-h-0 flex-1 overscroll-contain p-4 pb-6">
                  {selectedReview ? (
                    <ArchiDetails a={selectedReview} loading={detailsLoading} />
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
                  <Btn
                    variant="outline"
                    className="h-8 px-3 py-1 text-xs rounded-xl"
                    onClick={async () => {
                      const chosen = outreach.filter(r => outreachSelected[r.id]);
                      if (!chosen.length) return;
                      const groupedByPlatform: Record<OutreachPlatform, Architect[]> = { linkedin: [], instagram: [] };
                      for (const c of chosen) {
                        const p = (c.outreachPlatform ?? "linkedin") as OutreachPlatform;
                        groupedByPlatform[p].push(c);
                      }
                      await Promise.all([
                        groupedByPlatform.linkedin.length ? postOutreachForCards(groupedByPlatform.linkedin, "linkedin") : Promise.resolve(),
                        groupedByPlatform.instagram.length ? postOutreachForCards(groupedByPlatform.instagram, "instagram") : Promise.resolve(),
                      ]);
                    }}
                  >
                    Reach out to selected Architects
                  </Btn>
                </div>
              </div>
              <div className="grid h-[calc(72vh-56px)] grid-cols-1 gap-3 overflow-y-auto p-3 md:grid-cols-2">
                {outreach.map((a) => {
                  const currentPlatform = (a.outreachPlatform ?? "linkedin") as OutreachPlatform;
                  const currentPlatformLabel = outreachPlatformLabel(currentPlatform);
                  const canReachOut = !!pickSocialUrl(a, currentPlatform);
                  const statusValue = a.outreachStatus ?? (outreachSelected[a.id] ? "queued" : undefined);
                  const statusLabel = statusValue
                    ? statusValue === "inprogress"
                      ? "In progress"
                      : statusValue.charAt(0).toUpperCase() + statusValue.slice(1)
                    : "Not started";

                  return (
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
                        <Select
                          value={currentPlatformLabel}
                          onChange={(v) => {
                            const nextPlatform = labelToOutreachPlatform(v);
                            setOutreach(prev => prev.map(card => card.id === a.id ? { ...card, outreachPlatform: nextPlatform } : card));
                          }}
                          options={outreachPlatformOptions.map(outreachPlatformLabel)}
                        />
                        <Btn
                          onClick={async () => {
                            await postOutreachForCards([a], currentPlatform);
                          }}
                          disabled={!canReachOut}
                        >
                          Reach Out
                        </Btn>
                      </div>
                      <Card className="mt-3 p-3 text-xs text-neutral-600">
                        <div className="font-medium text-neutral-700">Outreach Status</div>
                        <div className="mt-1">Platform: {currentPlatformLabel}</div>
                        <div>Status: {statusLabel}</div>
                      </Card>
                    </Card>
                  );
                })}
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

  return <AuthGate>{pageContent}</AuthGate>;
}

// Details panel
const LabelRow: React.FC<{ icon?: React.ReactNode; label: string; value?: React.ReactNode }>
 = ({ icon, label, value }) => (
  <div className="grid grid-cols-12 gap-2 py-1.5">
    <div className="col-span-4 flex items-center gap-2 text-xs text-neutral-500">{icon}{label}</div>
    <div className="col-span-8 min-w-0 break-words text-sm text-neutral-800">{value}</div>
  </div>
);

function ArchiDetails({ a, loading }: { a: Architect; loading?: boolean }) {
  const isUrl = (s?: string | null) => !!s && typeof s === "string" && /^https?:\/\//i.test(s);

  const formatValue = (value: string | null | undefined): string => {
    return value ?? "";
  };

  return (
    <div className="min-w-0 space-y-3">
      {loading ? (
        <div className="text-xs text-neutral-500">Refreshing details…</div>
      ) : null}
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
            <LabelRow 
              icon={<Mail className="h-3.5 w-3.5" />} 
              label="Email" 
              value={a.email ? <a className="underline" href={`mailto:${a.email}`}>{a.email}</a> : formatValue(a.email)} 
            />
            <LabelRow 
              icon={<Mail className="h-3.5 w-3.5" />} 
              label="Alternate email" 
              value={a.alternate_email ? <a className="underline" href={`mailto:${a.alternate_email}`}>{a.alternate_email}</a> : formatValue(a.alternate_email)} 
            />
            <LabelRow 
              icon={<Phone className="h-3.5 w-3.5" />} 
              label="Phone" 
              value={formatValue(a.phone)} 
            />
            <LabelRow 
              icon={<Phone className="h-3.5 w-3.5" />} 
              label="Alternate phone" 
              value={formatValue(a.alternate_phone)} 
            />
            <LabelRow 
              icon={<Globe className="h-3.5 w-3.5" />} 
              label="Website" 
              value={a.website ? <a className="break-all underline" href={a.website} target="_blank" rel="noreferrer">{a.website}</a> : formatValue(a.website)} 
            />
          </div>
        </Card>
      </div>

      {/* Socials - Personal */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Socials – Personal</div>
        <div className="mt-2">
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="LinkedIn" 
            value={a.linkedin_profile_url && isUrl(a.linkedin_profile_url) ? (
              <a className="break-all underline" href={a.linkedin_profile_url} target="_blank" rel="noreferrer">{a.linkedin_profile_url}</a>
            ) : formatValue(a.linkedin_profile_url)} 
          />
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="Instagram" 
            value={a.instagram_profile_url && isUrl(a.instagram_profile_url) ? (
              <a className="break-all underline" href={a.instagram_profile_url} target="_blank" rel="noreferrer">{a.instagram_profile_url}</a>
            ) : formatValue(a.instagram_profile_url)} 
          />
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="Facebook" 
            value={a.facebook_profile_url && isUrl(a.facebook_profile_url) ? (
              <a className="break-all underline" href={a.facebook_profile_url} target="_blank" rel="noreferrer">{a.facebook_profile_url}</a>
            ) : formatValue(a.facebook_profile_url)} 
          />
        </div>
      </Card>

      {/* Socials - Company */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Socials – Company</div>
        <div className="mt-2">
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="LinkedIn" 
            value={a.company_linkedin_profile_url && isUrl(a.company_linkedin_profile_url) ? (
              <a className="break-all underline" href={a.company_linkedin_profile_url} target="_blank" rel="noreferrer">{a.company_linkedin_profile_url}</a>
            ) : formatValue(a.company_linkedin_profile_url)} 
          />
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="Instagram" 
            value={a.company_instagram_profile_url && isUrl(a.company_instagram_profile_url) ? (
              <a className="break-all underline" href={a.company_instagram_profile_url} target="_blank" rel="noreferrer">{a.company_instagram_profile_url}</a>
            ) : formatValue(a.company_instagram_profile_url)} 
          />
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="Facebook" 
            value={a.company_facebook_profile_url && isUrl(a.company_facebook_profile_url) ? (
              <a className="break-all underline" href={a.company_facebook_profile_url} target="_blank" rel="noreferrer">{a.company_facebook_profile_url}</a>
            ) : formatValue(a.company_facebook_profile_url)} 
          />
        </div>
      </Card>

      {/* Address */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Address</div>
        <div className="mt-2">
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Address" 
            value={formatValue(a.address)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Alternate address" 
            value={formatValue(a.alternate_address)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Country" 
            value={formatValue(a.country)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Post code" 
            value={formatValue(a.post_code)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Post code area" 
            value={formatValue(a.post_code_area)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Address line 1" 
            value={formatValue(a.address_line_1)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Address line 2" 
            value={formatValue(a.address_line2)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Address line 3" 
            value={formatValue(a.address_line3)} 
          />
          <LabelRow 
            icon={<MapPin className="h-3.5 w-3.5" />} 
            label="Address line 4" 
            value={formatValue(a.address_line_4)} 
          />
        </div>
      </Card>

      {/* Narrative */}
      <Card className="p-4">
        <div className="text-sm font-medium text-neutral-700 mb-2">Narrative</div>
        <div className="mt-2">
          <LabelRow 
            icon={<User className="h-3.5 w-3.5" />} 
            label="Architect bio" 
            value={<span className="whitespace-pre-wrap">{formatValue(a.bio)}</span>} 
          />
          <LabelRow 
            icon={<Building2 className="h-3.5 w-3.5" />} 
            label="Company bio" 
            value={<span className="whitespace-pre-wrap">{formatValue(a.company_bio)}</span>} 
          />
          <LabelRow 
            icon={<User className="h-3.5 w-3.5" />} 
            label="Notes" 
            value={<span className="whitespace-pre-wrap">{formatValue(a.notes)}</span>} 
          />
        </div>
      </Card>

      {/* Registration */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Registration</div>
        <div className="mt-2">
          <LabelRow 
            icon={<Building2 className="h-3.5 w-3.5" />} 
            label="Registration number" 
            value={formatValue(a.registration_number)} 
          />
          <LabelRow 
            icon={<LinkIcon className="h-3.5 w-3.5" />} 
            label="Registration link" 
            value={a.registration_link && isUrl(a.registration_link) ? (
              <a className="break-all underline" href={a.registration_link} target="_blank" rel="noreferrer">{a.registration_link}</a>
            ) : formatValue(a.registration_link)} 
          />
        </div>
      </Card>

      {/* Past Projects */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Past Projects</div>
        <div className="mt-2">
          {Array.isArray(a.past_projects) && a.past_projects.length > 0 ? (
            <ul className="list-disc pl-5 text-sm text-neutral-700 space-y-1">
              {a.past_projects.map((p, i) => (
                <li key={i}>{typeof p === "string" ? p : JSON.stringify(p)}</li>
              ))}
            </ul>
          ) : (
            <span className="text-sm text-neutral-500">{formatValue(null)}</span>
          )}
        </div>
      </Card>

      {/* Meta */}
      <Card className="p-3">
        <div className="text-sm font-medium text-neutral-700 mb-2">Meta</div>
        <div className="mt-2">
          <LabelRow 
            icon={<User className="h-3.5 w-3.5" />} 
            label="Created at" 
            value={a.created_at ? new Date(a.created_at).toLocaleString() : formatValue(a.created_at)} 
          />
          <LabelRow 
            icon={<User className="h-3.5 w-3.5" />} 
            label="Last scraped" 
            value={a.last_scraped ? new Date(a.last_scraped).toLocaleString() : formatValue(a.last_scraped)} 
          />
        </div>
      </Card>
    </div>
  );
}