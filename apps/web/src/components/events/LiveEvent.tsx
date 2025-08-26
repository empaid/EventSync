"use client";

import { useEffect, useState, useRef } from "react";
import { io, Socket } from "socket.io-client";

const FPS = 25;
const MAX_SAMPLES=6;
const NEXT_PUBLIC_WEBSOCKET_URL = process.env.NEXT_PUBLIC_WEBSOCKET_URL;

function msToTimecode(ms: number) {
    const totalSeconds = Math.floor(ms / 1000);
    const hh = Math.floor(totalSeconds / 3600);
    const mm = Math.floor((totalSeconds % 3600) / 60);
    const ss = totalSeconds % 60;
    const frame = Math.round(((ms % 1000) / 1000) * FPS);
    const ff = Math.min(frame, FPS - 1);
    return `${String(hh).padStart(2, "0")}:${String(mm).padStart(
        2,
        "0"
    )}:${String(ss).padStart(2, "0")}:${String(ff).padStart(2, "0")}`;
}

export default function LiveEvent({ eventId }: { eventId: string }) {
    const [isLive, setIsLive] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [currentTime, setCurrentTime] = useState(0);
    const socketRef = useRef<Socket | null>(null);
    const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const calibIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);


    const rttSamplesRef = useRef<number[]>([]);
    const offsetSamplesRef = useRef<number[]>([]);

    const avg = (arr: number[]) =>
        arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

    const addSample = (arrRef: React.RefObject<number[]>, v: number) => {
        const arr = arrRef.current;
        arr.push(v);
        while (arr.length > MAX_SAMPLES) arr.shift();
    };

    const pingServerForTime = () => {
        const t0 = Date.now();
        socketRef.current?.emit("fetch_server_time", t0);
    }

    useEffect(() => {
        socketRef.current = io(NEXT_PUBLIC_WEBSOCKET_URL, {
            transports: ["websocket"], 
        });
        
        socketRef.current.on("connect", () => {
            console.log("Connected to WebSocket");
            // pingServerForTime();
            calibIntervalRef.current = setInterval(pingServerForTime, 3000);
            socketRef.current?.emit("join_event", { event_id: eventId });
            pingServerForTime();
        });


        socketRef?.current?.on("server_time", (data) => {
            const t2 = Date.now();
            const rtt = t2 - data.client_echo_ms;
            const offset = data.server_now_ms - (data.client_echo_ms + rtt / 2);
            addSample(rttSamplesRef, rtt);
            addSample(offsetSamplesRef, offset);
        });
        socketRef.current.on("disconnect", () => {
            console.log("Disconnected from WebSocket");
        });

        return () => {
            socketRef.current?.disconnect();
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
            if (syncIntervalRef.current) {
                clearInterval(syncIntervalRef.current);
            }
        };
    }, [eventId]);

    const goLive = async () => {
        try {
            const res = await fetch(`/api/proxy/events/${eventId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ live: true }),
            });
            if (res.ok) {
                setIsLive(true);
                const now = Date.now();
                setStartTime(now);
                setCurrentTime(0);

                timerIntervalRef.current = setInterval(() => {
                    setCurrentTime(Date.now() - now);
                }, 1000 / FPS);

                syncIntervalRef.current = setInterval(() => {
                    const rtt_ms = Math.round(avg(rttSamplesRef.current));
                    const uplink_est_ms = Math.max(0, Math.round(rtt_ms / 2));
                    socketRef.current?.emit("sync", {
                        event_id: eventId,
                        elapsed_ms: Date.now() - now + uplink_est_ms,
                    });
                }, 5000);
            } else {
                console.error("Failed to go live");
            }
        } catch (error) {
            console.error("Error going live:", error);
        }
    };

    return (
        <div className="rounded-xl border p-4">
            <h2 className="text-xl font-semibold">Live Event Control</h2>
            {!isLive ? (
                <button
                    onClick={goLive}
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                >
                    Go Live
                </button>
            ) : (
                <div className="mt-4">
                    <p className="text-lg font-semibold text-green-600">
                        Event is Live
                    </p>
                    <div className="mt-2 font-mono text-4xl">
                        {msToTimecode(currentTime)}
                    </div>
                </div>
            )}
        </div>
    );
}