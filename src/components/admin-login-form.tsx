"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/auth/admin-login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Login gagal. Coba lagi.");
        return;
      }
      router.replace("/admin");
      router.refresh();
    } catch {
      setError("Koneksi bermasalah. Coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={onSubmit}>
      <label htmlFor="email">Email tim RAI</label>
      <input id="email" name="email" type="email" autoComplete="username" required maxLength={254} />
      <label htmlFor="password">Kata sandi</label>
      <input id="password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="button" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Memeriksa…" : "Masuk ke panel"}
      </button>
    </form>
  );
}
