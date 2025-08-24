"use client";

import { useEffect, useMemo, useState } from "react";

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

function fmtDuration(ms?: number | null) {
  if (!ms || ms <= 0) return "—";
  const sec = Math.round(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
}

export default function EventDetails({ eventId }: { eventId: string }) {
  const [data, setData] = useState<EventResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useMemo(
    () => async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await fetch(`/api/proxy/events/${eventId}`, { method: "GET" });
        if (!res.ok) throw new Error(`Failed to fetch event (${res.status})`);
        const json: EventResponse = await res.json();
        setData(json);
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

  // Refresh when uploader finishes
  useEffect(() => {
    const onUpdated = (e: Event) => {
      // optional: you could check (e as CustomEvent).detail.eventId === eventId
      load();
    };
    window.addEventListener("assets:updated", onUpdated);
    return () => window.removeEventListener("assets:updated", onUpdated);
  }, [load]);

  return (
    <section className="space-y-4">
      <div className="rounded-xl border p-4">
        {loading ? (
          <div className="animate-pulse text-gray-500">Loading event…</div>
        ) : err ? (
          <div className="text-red-600">Error: {err}</div>
        ) : data ? (
          <>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{data.title || "Untitled Event"}</h2>
                <p className="text-sm text-gray-500">ID: {data.id}</p>
              </div>
              <button
                onClick={load}
                className="rounded-lg border px-3 py-1.5 text-sm hover:bg-gray-50"
              >
                Refresh
              </button>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <div className="text-xs text-gray-500">Assets</div>
                <div className="text-lg font-semibold">{data.assets_count}</div>
              </div>
              {/* Add more summary tiles here if needed */}
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
                  </tr>
                </thead>
                <tbody>
                  {data.assets.length === 0 ? (
                    <tr>
                      <td className="p-3 text-gray-500" colSpan={5}>
                        No assets yet.
                      </td>
                    </tr>
                  ) : (
                    data.assets.map((a) => (
                      <tr key={a.id} className="border-b last:border-0">
                        <td className="p-2">
                          <div className="font-medium">{a.name}</div>
                          <div className="text-xs text-gray-500">{a.path || "—"}</div>
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
                        <td className="p-2">{a.active ? "Yes" : "No"}</td>
                      </tr>
                    ))
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
