"use client";

import { useState } from "react";
import NewEventForm from "./NewEventForm";

export default function NewEventButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="rounded bg-black px-4 py-2 text-white hover:opacity-90"
        onClick={() => setOpen(true)}
      >
        New Event
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded bg-white p-6 shadow"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Event</h3>
              <button
                className="rounded px-2 py-1 text-sm hover:bg-gray-100"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <NewEventForm
              onCreated={() => {
                setOpen(false);
                window.dispatchEvent(new Event("events:refresh"));
              }}
            />
          </div>
        </div>
      )}
    </>
  );
}
