import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";

// ✅ import helper
import { complaintsCollectionName } from "../utils/tenantCollections";

export default function MyComplaints() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [colName, setColName] = useState(null); // ✅ store tenant collection name
  const navigate = useNavigate();

  useEffect(() => {
    let unsubFirestore = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        navigate("/login");
        return;
      }

      try {
        // ✅ load user profile to get tenantId
        const userSnap = await getDoc(doc(db, "users", u.uid));
        if (!userSnap.exists()) {
          setError("User profile not found in Firestore.");
          return;
        }

        const userData = userSnap.data();
        const tenantCollection = complaintsCollectionName(userData.tenantId);
        setColName(tenantCollection);

        const q = query(
          collection(db, tenantCollection),
          where("createdByUid", "==", u.uid)
        );

        unsubFirestore = onSnapshot(
          q,
          (snap) => {
            const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
            setItems(rows);
          },
          (err) => setError(err.message)
        );
      } catch (err) {
        setError(err.message);
      }
    });

    return () => {
      unsubAuth();
      if (unsubFirestore) unsubFirestore();
    };
  }, [navigate]);

  const confirmClose = async (complaintId) => {
    setError("");

    if (!auth.currentUser) {
      setError("You are not logged in.");
      return;
    }

    if (!colName) {
      setError("Tenant collection not loaded yet.");
      return;
    }

    try {
      await updateDoc(doc(db, colName, complaintId), {
        status: "Closed",
        closedByConsumer: true,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div
      style={{
        width: "100vw",
        minHeight: "calc(100vh - 70px)", // leaves space for navbar
        display: "flex",
        justifyContent: "center",
        alignItems: "flex-start", // ✅ keep it top-ish, but centered horizontally
        padding: 20,
        boxSizing: "border-box",
      }}
    >
      <div style={{ width: "100%", maxWidth: 900 }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <h2 style={{ margin: 0 }}>My Complaints</h2>

          <Link to="/new-complaint" style={{ textDecoration: "none" }}>
            + New
          </Link>
        </div>

        {error && <p style={{ color: "red" }}>{error}</p>}

        {items.length === 0 ? (
          <p>No complaints yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #444",
                  borderRadius: 12,
                  padding: 16,
                  background: "#1e1e1e",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <b>{c.title}</b>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "4px 10px",
                      borderRadius: 999,
                      border: "1px solid #666",
                    }}
                  >
                    {c.status}
                  </span>
                </div>

                <p style={{ marginTop: 10, opacity: 0.9 }}>{c.description}</p>

                {c.helpdeskMessage && (
                  <p style={{ marginTop: 10 }}>
                    <b>Helpdesk message:</b> {c.helpdeskMessage}
                  </p>
                )}

                {c.supportMessage && (
                  <p style={{ marginTop: 10 }}>
                    <b>Support Engineer Message:</b> {c.supportMessage}
                  </p>
                )}

                {c.assignedToEmail && (
                  <p style={{ marginTop: 10 }}>
                    <b>Assigned to:</b> {c.assignedToEmail}
                  </p>
                )}

                {c.resolutionNotes && (
                  <p style={{ marginTop: 10 }}>
                    <b>Resolution:</b> {c.resolutionNotes}
                  </p>
                )}

                {/* ✅ Consumer confirmation to close */}
                {c.status === "Done" && (
                  <button onClick={() => confirmClose(c.id)} style={{ marginTop: 12 }}>
                    Confirm & Close
                  </button>
                )}

                {c.status === "Closed" && (
                  <p style={{ marginTop: 12, color: "#9be29b" }}>
                    ✅ Closed (you confirmed)
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
