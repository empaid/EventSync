"use client"

import { useRouter } from "next/navigation"
import { useState, FormEvent } from "react"


export default function LoginForm() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<string|null>(null);

      async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok || !data?.ok) {
        setError(data?.error || "Invalid credentials");
        setPending(false);
        return;
      }

      router.replace("/dashboard");
    } catch (err) {
      setError("Network error");
      setPending(false);
    }
  }

      return (
    <form onSubmit={onSubmit} className="mx-auto mt-16 max-w-sm space-y-4 rounded-2xl border p-6 shadow">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-lg border px-3 py-2 outline-none focus:ring"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-2 text-sm text-red-700">{error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-xl px-4 py-2 font-semibold shadow disabled:opacity-60 border"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>

      <p className="pt-1 text-center text-sm text-gray-500">
        Don&apos;t have an account? <a href="/register" className="underline">Register</a>
      </p>
    </form>
  );
}
