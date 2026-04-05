import { useState, useRef, useEffect } from "react";
import { Mail, Lock, Eye, EyeOff, Loader, AlertCircle } from "lucide-react";
import { MONO } from "../utils/constants";

// ─── LoginScreen ───────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin }) {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState(null);
  const [mounted, setMounted]   = useState(false);
  const emailRef = useRef();

  useEffect(() => {
    setTimeout(() => setMounted(true), 60);
    emailRef.current?.focus();
  }, []);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (loading) return;

    if (!email.trim() || !password) {
      setError("Заповніть всі поля");
      return;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    if (!emailOk) {
      setError("Невірний формат пошти");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("http://localhost:8080/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email.trim(), password }),
      });

      if (!res.ok) {
        // Try to parse error message from server
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || body.error || `Помилка ${res.status}`);
      }

      const data = await res.json();
      const jwt = data.token ?? data.accessToken ?? data.jwt;

      if (!jwt) throw new Error("Сервер не повернув токен");

      localStorage.setItem("jwt_token", jwt);
      onLogin(jwt);
    } catch (err) {
      setError(err.message || "Не вдалося підключитися до сервера");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0f1a",
        backgroundImage:
          "radial-gradient(ellipse 80% 55% at 50% -5%, rgba(29,58,138,0.28) 0%, transparent 65%)," +
          "radial-gradient(ellipse 40% 40% at 80% 90%, rgba(99,102,241,0.08) 0%, transparent 60%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: MONO,
        padding: 16,
      }}
    >
      {/* Card */}
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(18px)",
          transition: "opacity 0.45s ease, transform 0.45s ease",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-0.025em" }}>
            <span style={{ color: "#f1f5f9" }}>Drone</span>
            <span
              style={{
                background: "linear-gradient(90deg,#60a5fa,#38bdf8)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Log
            </span>
            <span style={{ color: "#334155", fontWeight: 400 }}> Analyzer</span>
          </span>
          <p style={{ marginTop: 8, fontSize: 11, color: "#334155", letterSpacing: "0.06em" }}>
            УВІЙДІТЬ ДО СИСТЕМИ
          </p>
        </div>

        {/* Form panel */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "28px 28px 24px",
            boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Corner accents */}
          {[
            { top: 0, left: 0, borderTop: true, borderLeft: true },
            { top: 0, right: 0, borderTop: true, borderRight: true },
            { bottom: 0, left: 0, borderBottom: true, borderLeft: true },
            { bottom: 0, right: 0, borderBottom: true, borderRight: true },
          ].map((pos, i) => (
            <span
              key={i}
              style={{
                position: "absolute",
                width: 14, height: 14,
                borderTop: pos.borderTop ? "1px solid rgba(96,165,250,0.2)" : "none",
                borderBottom: pos.borderBottom ? "1px solid rgba(96,165,250,0.2)" : "none",
                borderLeft: pos.borderLeft ? "1px solid rgba(96,165,250,0.2)" : "none",
                borderRight: pos.borderRight ? "1px solid rgba(96,165,250,0.2)" : "none",
                top: pos.top ?? "auto", bottom: pos.bottom ?? "auto",
                left: pos.left ?? "auto", right: pos.right ?? "auto",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Email field */}
          <Field
            label="Електронна пошта"
            icon={<Mail size={13} color="#475569" />}
            type="email"
            placeholder="pilot@example.com"
            value={email}
            onChange={(v) => { setEmail(v); setError(null); }}
            inputRef={emailRef}
            onEnter={handleSubmit}
            autoComplete="email"
          />

          {/* Password field */}
          <Field
            label="Пароль"
            icon={<Lock size={13} color="#475569" />}
            type={showPwd ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(v) => { setPassword(v); setError(null); }}
            onEnter={handleSubmit}
            autoComplete="current-password"
            suffix={
              <button
                type="button"
                onClick={() => setShowPwd((p) => !p)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  padding: "0 4px", display: "flex", alignItems: "center",
                  color: "#334155",
                }}
              >
                {showPwd ? <EyeOff size={13} /> : <Eye size={13} />}
              </button>
            }
          />

          {/* Error */}
          <div
            style={{
              height: error ? "auto" : 0,
              overflow: "hidden",
              transition: "height 0.2s ease",
              marginBottom: error ? 14 : 0,
            }}
          >
            {error && (
              <div
                style={{
                  display: "flex", alignItems: "center", gap: 7,
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.2)",
                  borderRadius: 8, padding: "8px 11px",
                  fontFamily: MONO, fontSize: 11, color: "#f87171",
                }}
              >
                <AlertCircle size={12} />
                {error}
              </div>
            )}
          </div>

          {/* Submit */}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 10,
              border: "none",
              background: loading
                ? "rgba(96,165,250,0.15)"
                : "linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)",
              boxShadow: loading ? "none" : "0 4px 20px rgba(37,99,235,0.32)",
              color: loading ? "#334155" : "#fff",
              fontFamily: MONO,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.06em",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.25s ease",
            }}
          >
            {loading ? (
              <>
                <Loader size={13} style={{ animation: "spin 1s linear infinite" }} />
                Перевірка…
              </>
            ) : (
              "УВІЙТИ"
            )}
          </button>
        </div>

        <p style={{ textAlign: "center", marginTop: 18, fontSize: 10, color: "#1e293b", letterSpacing: "0.05em" }}>
          DroneLog Analyzer · ENU Coordinate System
        </p>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─── Field component ───────────────────────────────────────────────────────────
function Field({ label, icon, type, placeholder, value, onChange, inputRef, onEnter, autoComplete, suffix }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          display: "block",
          fontFamily: MONO,
          fontSize: 9,
          color: focused ? "#60a5fa" : "#334155",
          letterSpacing: "0.09em",
          textTransform: "uppercase",
          marginBottom: 6,
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          background: focused ? "rgba(96,165,250,0.06)" : "rgba(255,255,255,0.03)",
          border: `1px solid ${focused ? "rgba(96,165,250,0.4)" : "rgba(255,255,255,0.08)"}`,
          borderRadius: 9,
          padding: "0 12px",
          transition: "border-color 0.2s, background 0.2s",
          boxShadow: focused ? "0 0 0 3px rgba(96,165,250,0.08)" : "none",
        }}
      >
        {icon}
        <input
          ref={inputRef}
          type={type}
          placeholder={placeholder}
          value={value}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontFamily: MONO,
            fontSize: 12,
            color: "#e2e8f0",
            padding: "10px 0",
            caretColor: "#60a5fa",
          }}
        />
        {suffix}
      </div>
    </div>
  );
}