import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function NewComplaint() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [userData, setUserData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      setUserData(snap.exists() ? snap.data() : null);
    });
    return () => unsub();
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!title.trim() || !description.trim()) {
      setError("Title and Description are required.");
      return;
    }
    if (!auth.currentUser) {
      setError("You are not logged in.");
      return;
    }
    if (!userData) {
      setError("User profile not found in Firestore.");
      return;
    }

    try {
      setLoading(true);

      await addDoc(collection(db, "complaints"), {
        tenantId: userData.tenantId,
        sector: userData.sector,
        createdByUid: auth.currentUser.uid,
        createdByEmail: auth.currentUser.email,
        title: title.trim(),
        description: description.trim(),
        status: "New",
        assignedToUid: null,
        assignedToEmail: null,
        helpdeskMessage: "",
        resolutionNotes: "",
        closedByConsumer: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      navigate("/my-complaints");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
  <div
    style={{
      width: "100vw",
      minHeight: "calc(100vh - 70px)", // space for navbar
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
        maxWidth: 520,
        border: "1px solid #333",
        borderRadius: 12,
        padding: 20,
        background: "#1e1e1e",
      }}
    >
      <h2 style={{ marginTop: 0 }}>New Complaint</h2>

      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, opacity: 0.85 }}>Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a short title"
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #444",
              background: "#2a2a2a",
              color: "white",
            }}
          />
        </div>

        <div style={{ display: "grid", gap: 6 }}>
          <label style={{ fontSize: 14, opacity: 0.85 }}>Description</label>
          <textarea
            rows={6}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your issue..."
            style={{
              padding: 10,
              borderRadius: 8,
              border: "1px solid #444",
              background: "#2a2a2a",
              color: "white",
              resize: "vertical",
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 12,
            borderRadius: 10,
            border: "1px solid #444",
            background: "#111",
            color: "white",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Submitting..." : "Submit Complaint"}
        </button>

        {error && <p style={{ color: "red", margin: 0 }}>{error}</p>}
      </form>
    </div>
  </div>
);
}