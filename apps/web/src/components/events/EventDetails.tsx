"use client";

import { useEffect, useMemo, useState } from "react";
import LiveEvent from "./LiveEvent";
import QRCode from "./QRcode";
type Asset = {
  id: string;
  name: string;
  mime_type: string;
  status: string;
  duration_ms?: number | null;
  path?: string | null;
  start_media_ms?: number | null;
  active?: boolean | null;
};

type EventResponse = {
  id: string;
  title: string;
  assets_count: number;
  assets: Asset[];
};

const FPS = 25;

function fmtDuration(ms?: number | null) {
  if (!ms || ms <= 0) return "—";
  const sec = Math.round(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function msToTimecode(ms?: number | null) {
  const v = Math.max(0, ms ?? 0);
  const totalSeconds = Math.floor(v / 1000);
  const hh = Math.floor(totalSeconds / 3600);
  const mm = Math.floor((totalSeconds % 3600) / 60);
  const ss = totalSeconds % 60;
  const frame = Math.round(((v % 1000) / 1000) * FPS);
  const ff = Math.min(frame, FPS - 1);
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:${String(
    ss
  ).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}

function timecodeToMs(tc: string): number | null {
  const m = /^(\d{2}):(\d{2}):(\d{2}):(\d{2})$/.exec(tc.trim());
  if (!m) return null;
  const hh = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const ss = parseInt(m[3], 10);
  const ff = parseInt(m[4], 10);
  if (mm > 59 || ss > 59 || ff >= FPS) return null;
  const ms = (((hh * 60 + mm) * 60 + ss) * 1000) + Math.round((ff / FPS) * 1000);
  return ms;
}

export default function EventDetails({ eventId }: { eventId: string }) {
  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [tcInputs, setTcInputs] = useState<Record<string, string>>({});
  const [tcErrors, setTcErrors] = useState<Record<string, string | null>>({});

  const [sortAsc, setSortAsc] = useState(true);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/proxy/events/${eventId}`, { method: "GET" });
        if (!res.ok) throw new Error(`Failed to fetch event (${res.status})`);
        const json: EventResponse = await res.json();
        setData(json);

        const seed: Record<string, string> = {};
        for (const a of json.assets) seed[a.id] = msToTimecode(a.start_media_ms);
        setTcInputs(seed);
        setTcErrors({});
      } catch (e: any) {
        setErr(e.message || "Failed to load event");
      } finally {
        setLoading(false);
      }
    },
    [eventId]
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onUpdated = () => load();
    window.addEventListener("assets:updated", onUpdated);
    return () => window.removeEventListener("assets:updated", onUpdated);
  }, [load]);

  const sortedAssets = useMemo(() => {
    if (!data) return [];
    const arr = [...data.assets];
    return arr.sort((a, b) => {
      const aActive = !!a.active;
      const bActive = !!b.active;
      if (aActive !== bActive) return aActive ? -1 : 1;

      const av = a.start_media_ms ?? Number.MAX_SAFE_INTEGER;
      const bv = b.start_media_ms ?? Number.MAX_SAFE_INTEGER;
      if (av === bv) return a.name.localeCompare(b.name);
      return sortAsc ? av - bv : bv - av;
    });
  }, [data, sortAsc]);

  async function patchAsset(assetId: string, payload: Partial<Pick<Asset, "active" | "start_media_ms">>) {
    const res = await fetch(`/api/proxy/events/${eventId}/assets/${assetId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`PATCH failed (${res.status}) ${text}`);
    }
    return res.json();
  }

  async function handleToggleActive(a: Asset, next: boolean) {
    setSaving((s) => ({ ...s, [a.id]: true }));
    try {
      setData((prev) =>
        prev
          ? { ...prev, assets: prev.assets.map(x => x.id === a.id ? { ...x, active: next } : x) }
          : prev
      );
      await patchAsset(a.id, { active: next });
    } catch (e: any) {
      setErr(e.message || "Failed to update active");
      setData((prev) =>
        prev
          ? { ...prev, assets: prev.assets.map(x => x.id === a.id ? { ...x, active: a.active ?? false } : x) }
          : prev
      );
    } finally {
      setSaving((s) => ({ ...s, [a.id]: false }));
    }
  }

  async function saveTimecode(a: Asset) {
    const str = tcInputs[a.id] ?? msToTimecode(a.start_media_ms);
    const ms = timecodeToMs(str);
    if (ms === null) {
      setTcErrors((m) => ({ ...m, [a.id]: `Invalid timecode for ${FPS}fps` }));
      return;
    }
    setTcErrors((m) => ({ ...m, [a.id]: null }));
    setSaving((s) => ({ ...s, [a.id]: true }));
    try {
      setData((prev) =>
        prev
          ? { ...prev, assets: prev.assets.map(x => x.id === a.id ? { ...x, start_media_ms: ms } : x) }
          : prev
      );
      await patchAsset(a.id, { start_media_ms: ms });
    } catch (e: any) {
      setErr(e.message || "Failed to update timecode");
      setTcInputs((m) => ({ ...m, [a.id]: msToTimecode(a.start_media_ms) }));
    } finally {
      setSaving((s) => ({ ...s, [a.id]: false }));
    }
  }

  return (
    <section className="space-y-4">
      <LiveEvent eventId={eventId} />
      <div className="rounded-xl border p-4">
        {loading ? (
          <div className="animate-pulse text-gray-500">Loading event…</div>
        ) : err ? (
          <div className="text-red-600">Error: {err}</div>
        ) : data ? (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-semibold">{data.title || "Untitled Event"}</h2>
                <div className="mt-4">
                  <QRCode eventId={data.id} />
                </div>
                <p className="text-sm text-gray-500">ID: {data.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={load}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                >
                  Refresh
                </button>
                <button
                  onClick={() => setSortAsc((v) => !v)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
                  title="Toggle ascending/descending timecode (active pinned on top)"
                >
                  Sort: {sortAsc ? "TC ↑" : "TC ↓"}
                </button>
              </div>
            </div>

            <div className="mt-2 text-xs text-gray-500">
              Inactive items are always listed below active ones. Within each group, sorted by Start (TC) {sortAsc ? "ascending" : "descending"}.
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Assets</div>
                <div className="text-lg font-semibold">{data.assets_count}</div>
              </div>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left">
                    <th className="p-2">Name</th>
                    <th className="p-2">MIME</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Duration</th>
                    <th className="p-2">Active</th>
                    <th className="p-2">Start (TC)</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedAssets.length === 0 ? (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={6}>
                        No assets yet.
                      </td>
                    </tr>
                  ) : (
                    sortedAssets.map((a) => {
                      const isSaving = !!saving[a.id];
                      const tcVal = tcInputs[a.id] ?? msToTimecode(a.start_media_ms);
                      const tcErr = tcErrors[a.id];

                      return (
                        <tr key={a.id} className="border-b last:border-0 align-top">
                          <td className="p-2">
                            <div className="font-medium">{a.name}</div>
                            <audio
                                src={a.path?? undefined}
                                controls
                                className="w-64"
                                />
                          </td>
                          <td className="p-2">{a.mime_type}</td>
                          <td className="p-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs ${
                                a.status === "ready"
                                  ? "bg-green-100 text-green-700"
                                  : a.status === "processing"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {a.status}
                            </span>
                          </td>
                          <td className="p-2">{fmtDuration(a.duration_ms)}</td>
                          <td className="p-2">
                            <label className="inline-flex items-center gap-2">
                              <input
                                type="checkbox"
                                className="h-4 w-4"
                                checked={!!a.active}
                                onChange={(e) => handleToggleActive(a, e.target.checked)}
                                disabled={isSaving}
                              />
                              <span className="text-xs text-gray-600">
                                {a.active ? "Active" : "Inactive"}
                              </span>
                            </label>
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              <input
                                value={tcVal}
                                onChange={(e) =>
                                  setTcInputs((m) => ({ ...m, [a.id]: e.target.value }))
                                }
                                onBlur={() => saveTimecode(a)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") {
                                    (e.currentTarget as HTMLInputElement).blur();
                                  }
                                }}
                                spellCheck={false}
                                className={`w-32 rounded border p-1 font-mono text-xs ${
                                  tcErr ? "border-red-400" : ""
                                }`}
                                placeholder="HH:MM:SS:FF"
                                title={`Frames are 0–${FPS - 1} at ${FPS} fps`}
                                disabled={isSaving}
                              />
                              {isSaving ? (
                                <span className="text-xs text-gray-500">Saving…</span>
                              ) : null}
                              {tcErr ? (
                                <span className="text-xs text-red-500">{tcErr}</span>
                              ) : null}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}