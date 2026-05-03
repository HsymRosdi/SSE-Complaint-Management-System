import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

// SECURITY FIX
// Weakness ID: W3
// Fix ID: F3 - Add rate limiting and lockout on login form
// STRIDE: Spoofing
// OWASP: A07 Identification and Authentication Failures
// CWE: CWE-307
// CIA: Confidentiality, Availability
// ASVS: V2.1 - Authentication
// D3FEND: D3-RLC Rate Limiting Communications

  const MAX_ATTEMPTS = 5;
  const LOCKOUT_DURATION = 5 * 60 * 1000;

  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);

  const handleLogin = async (e) => {
  e.preventDefault();
  setError("");

  if (lockedUntil && Date.now() < lockedUntil) {
    const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
    setError(`Too many attempts. Please wait ${remaining} seconds.`);
    return;
  }

  setLoading(true);

  try {
    await signInWithEmailAndPassword(auth, email.trim(), password);
    setAttempts(0);
    setLockedUntil(null);
    navigate("/dashboard");
  } catch (err) {
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setLockedUntil(Date.now() + LOCKOUT_DURATION);
      setError("Too many failed attempts. Account locked for 5 minutes.");
    } else {
      setError(`Wrong email or password. ${MAX_ATTEMPTS - newAttempts} attempts remaining.`);
    }
  } finally {
    setLoading(false);
  }
};
// ------------------------------------------------------------------------------------------------------

  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 380,
          border: "1px solid #333",
          borderRadius: 10,
          padding: 18,
          background: "#1e1e1e",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Login</h2>

        <form onSubmit={handleLogin} style={{ display: "grid", gap: 10 }}>
          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Email</span>
            <input
              placeholder="example@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Password</span>
            <input
              placeholder="********"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
                outline: "none",
              }}
            />
          </label>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #444",
              background: loading ? "#2a2a2a" : "#111",
              color: "white",
              cursor: loading ? "not-allowed" : "pointer",
              fontWeight: 600,
            }}
          >
            {loading ? "Logging in..." : "Login"}
          </button>

          {error && (
            <div
              style={{
                marginTop: 6,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #5a1f1f",
                background: "#2a1111",
                color: "#ffb3b3",
                fontSize: 14,
              }}
            >
              {error}
            </div>
          )}
        </form>

        <p style={{ marginTop: 12, fontSize: 14, opacity: 0.85 }}>
          Don’t have an account?{" "}
          <Link to="/register" style={{ color: "#8ab4f8" }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
