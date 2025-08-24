"use client";

import { useEffect, useState } from "react";

type EventItem = {
  id: string;
  title: string;
};

export default function EventList() {
  const [events, setEvents] = useState<EventItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const res = await fetch("/api/proxy/events/");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `Failed to load (${res.status})`);
      }
      const data = await res.json();
      setEvents(Array.isArray(data) ? data : data.events ?? []);
    } catch (e: any) {
      setError(e.message || "Failed to load events");
    }
  }

  useEffect(() => {
    load();
  }, []);


  useEffect(() => {
    function onRefresh() {
      load();
    }
    window.addEventListener("events:refresh", onRefresh);
    return () => window.removeEventListener("events:refresh", onRefresh);
  }, []);

  if (error) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-4 text-red-800">
        {error}{" "}
        <button onClick={load} className="underline ml-2">
          Retry
        </button>
      </div>
    );
  }

  if (!events) {
    return (
      <ul className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <li
            key={i}
            className="h-12 animate-pulse rounded bg-gray-100"
            aria-hidden
          />
        ))}
      </ul>
    );
  }

  if (events.length === 0) {
    return <p className="text-gray-500">No events yet. Create your first one!</p>;
  }

  return (
    <ul className="divide-y rounded border">
      {events.map((ev) => (
        <li key={ev.id} className="p-4 flex items-center justify-between">
          <div className="min-w-0">
            <p className="font-medium truncate">{ev.title}</p>
            <p className="text-sm text-gray-500 truncate">{ev.id}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
