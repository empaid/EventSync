"use client";

import { useRef, useState } from "react";

type SignedPost = { url: string; fields: Record<string, string> };

async function getAudioDurationMs(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const audio = document.createElement("audio");
    audio.preload = "metadata";
    audio.src = URL.createObjectURL(file);
    audio.onloadedmetadata = () => {
      if (isFinite(audio.duration)) {
        const ms = Math.round(audio.duration * 1000);
        URL.revokeObjectURL(audio.src);
        resolve(ms);
      } else {
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx = new Ctx();
        file
          .arrayBuffer()
          .then((buf) => ctx.decodeAudioData(buf))
          .then((decoded) => resolve(Math.round(decoded.duration * 1000)))
          .catch(reject)
          .finally(() => URL.revokeObjectURL(audio.src));
      }
    };
    audio.onerror = () => reject(new Error("Unable to read audio metadata"));
  });
}

export default function EventUploader({ eventId }: { eventId: string }) {
  const [log, setLog] = useState<string[]>([]);
  const [progress, setProgress] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  function push(msg: string) {
    setLog((l) => [msg, ...l].slice(0, 80));
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setProgress(null);
    try {
      for (const file of Array.from(files)) {
        push(`Preparing upload for "${file.name}" (${file.type || "unknown"})`);

        const createRes = await fetch(`/api/proxy/events/${eventId}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name, mime_type: file.type || "audio/mpeg" }),
        });
        if (!createRes.ok) throw new Error(`Failed to get upload URL (${createRes.status})`);
        const { id: assetId, upload_url }: { id: string; upload_url: SignedPost } = await createRes.json();

        const form = new FormData();
        Object.entries(upload_url.fields).forEach(([k, v]) => form.append(k, v));
        form.append("file", file);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("POST", upload_url.url, true);
          xhr.upload.onprogress = (evt) => {
            if (evt.lengthComputable) {
              setProgress(Math.round((evt.loaded / evt.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve();
            else reject(new Error(`S3 upload failed (${xhr.status})`));
          };
          xhr.onerror = () => reject(new Error("Network error during S3 upload"));
          xhr.send(form);
        });

        push(`Uploaded to S3: ${file.name}`);

        let duration_ms = 0;
        try {
          duration_ms = await getAudioDurationMs(file);
          push(`Duration detected: ${Math.round(duration_ms / 1000)}s`);
        } catch {
          push("Could not detect duration; server can compute later.");
        }

        const completeRes = await fetch(
          `/api/proxy/events/${eventId}/assets/${assetId}/upload_complete`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(duration_ms ? { duration_ms } : {}),
          }
        );
        if (!completeRes.ok) throw new Error(`Failed to finalize asset (${completeRes.status})`);
        const done = await completeRes.json();
        push(`Asset finalized: ${done.id} (status: ${done.status})`);
      }

      push("All uploads complete.");
      // Notify the details component to refresh
      window.dispatchEvent(new CustomEvent("assets:updated", { detail: { eventId } }));
      // Reset input & close modal
      if (fileInputRef.current) fileInputRef.current.value = "";
      setProgress(null);
      setOpen(false);
    } catch (err: any) {
      push(`Error: ${err.message || String(err)}`);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <>
   
      <button
        onClick={() => setOpen(true)}
        className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-60"
        disabled={busy}
      >
        Upload files
      </button>

      
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => (!busy ? setOpen(false) : null)}
          aria-modal="true"
          role="dialog"
        >
          <div
            className="w-full max-w-xl rounded-xl bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Upload audio (MP3/WAV/M4A)</h3>
              <button
                className="rounded-md px-2 py-1 text-sm text-gray-600 hover:bg-gray-100"
                onClick={() => (!busy ? setOpen(false) : null)}
              >
                Close
              </button>
            </div>

            <label className="mb-3 block">
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                disabled={busy}
                onChange={(e) => handleFiles(e.target.files)}
                className="block w-full rounded border p-2"
              />
            </label>

            {progress !== null && (
              <div className="w-full rounded border p-2">
                <div className="text-sm">Uploading… {progress}%</div>
                <div className="mt-2 h-2 overflow-hidden rounded bg-gray-100">
                  <div className="h-2 bg-blue-500" style={{ width: `${progress}%` }} />
                </div>
              </div>
            )}

            <div className="mt-3 h-40 overflow-auto rounded border bg-gray-50 p-3 text-sm">
              {log.length === 0 ? (
                <em>No activity yet.</em>
              ) : (
                <ul className="space-y-1">{log.map((l, i) => <li key={i}>• {l}</li>)}</ul>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
