import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sector, setSector] = useState("Bank");
// SECURITY FIX
// Weakness ID: W1
// Fix ID: F1 - Remove self-assigned role at registration
// STRIDE: Elevation of Privilege
// OWASP: A01 Broken Access Control
// CWE: CWE-269
// CIA: Integrity
// ASVS: V8.1 - Authorization
// D3FEND: D3-UAP User Account Permissions
  const FIXED_ROLE = ("consumer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCred = await createUserWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );
      const uid = userCred.user.uid;

      await setDoc(doc(db, "users", uid), {
        email: email.trim(),
        role: FIXED_ROLE,
        sector,
        tenantId: sector,
        createdAt: serverTimestamp(),
      });

      navigate("/dashboard");
    } catch (err) {
      if (err.code === "auth/email-already-in-use") setError("This email is already registered.");
      else if (err.code === "auth/weak-password") setError("Password should be at least 6 characters.");
      else if (err.code === "auth/invalid-email") setError("Please enter a valid email.");
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
          maxWidth: 420,
          border: "1px solid #333",
          borderRadius: 10,
          padding: 18,
          background: "#1e1e1e",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 12 }}>Register</h2>

        <form onSubmit={handleRegister} style={{ display: "grid", gap: 10 }}>
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
              placeholder="Minimum 6 characters"
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

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Sector</span>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
                outline: "none",
              }}
            >
              <option value="Bank">Bank</option>
              <option value="Airline">Airline</option>
              <option value="Telecom">Telecom</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: 6 }}>
            <span style={{ fontSize: 14, opacity: 0.9 }}>Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              style={{
                padding: "10px 12px",
                borderRadius: 8,
                border: "1px solid #444",
                background: "#111",
                color: "white",
                outline: "none",
              }}
            >
              <option value="consumer">Consumer</option>
              <option value="helpdesk">Help Desk</option>
              <option value="support">Support Engineer</option>
            </select>
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
            {loading ? "Creating..." : "Create account"}
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
          Already have an account?{" "}
          <Link to="/login" style={{ color: "#8ab4f8" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
