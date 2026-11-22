"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function RoleLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? "Login gagal. Coba lagi.");
        return;
      }
      router.replace(result.redirectTo);
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <label htmlFor="email">Email akun</label>
      <input id="email" name="email" type="email" autoComplete="username" maxLength={254} required />
      <label htmlFor="password">Kata sandi</label>
      <input id="password" name="password" type="password" autoComplete="current-password" maxLength={128} required />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={busy}>{busy ? "Memeriksa…" : "Masuk"}</button>
    </form>
  );
}
