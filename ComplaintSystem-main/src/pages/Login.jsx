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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/invalid-credential") setError("Wrong email or password.");
      else if (err.code === "auth/user-not-found") setError("No account found with this email.");
      else if (err.code === "auth/wrong-password") setError("Wrong password.");
      else setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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
