import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { complaintsCollectionName } from "../utils/tenantCollections";

export default function SupportInbox() {
  const [me, setMe] = useState(null);
  const [items, setItems] = useState([]);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({});
  const [colName, setColName] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let unsub = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");

      const snap = await getDoc(doc(db, "users", u.uid));
      const data = snap.exists() ? snap.data() : null;

      if (!data || data.role !== "support") {
        setError("Access denied. You are not a support engineer.");
        return;
      }

      const tenantCollection = complaintsCollectionName(data.tenantId);
      setColName(tenantCollection);

      setMe({ uid: u.uid, ...data });

      const q = query(
        collection(db, tenantCollection),
        where("assignedToUid", "==", u.uid)
      );

      unsub = onSnapshot(
        q,
        (s) => setItems(s.docs.map((d) => ({ id: d.id, ...d.data() }))),
        (err) => setError(err.message)
      );
    });

    return () => {
      unsubAuth();
      if (unsub) unsub();
    };
  }, [navigate]);

  const setDraftField = (id, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { msgToConsumer: "", resolutionNotes: "" }),
        [field]: value,
      },
    }));
  };

  const sendMessageOnly = async (id) => {
    setError("");
    if (!colName) return setError("Tenant collection not loaded yet.");

    try {
      const msgToConsumer = draft[id]?.msgToConsumer || "";
      await updateDoc(doc(db, colName, id), {
        supportMessage: msgToConsumer,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const setPending = async (id) => {
    setError("");
    if (!colName) return setError("Tenant collection not loaded yet.");

    try {
      const msgToConsumer = draft[id]?.msgToConsumer || "";
      await updateDoc(doc(db, colName, id), {
        status: "Pending",
        supportMessage: msgToConsumer || "Support is working on your issue.",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const setDone = async (id) => {
    setError("");
    if (!colName) return setError("Tenant collection not loaded yet.");

    try {
      const msgToConsumer = draft[id]?.msgToConsumer || "";
      const resolutionNotes = draft[id]?.resolutionNotes || "";

      await updateDoc(doc(db, colName, id), {
        status: "Done",
        supportMessage: msgToConsumer,
        resolutionNotes,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  if (!me) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    // ✅ FULL-WIDTH WRAPPER THAT CENTERS CONTENT
    <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {/* ✅ INNER WRAPPER CONTROLS MAX WIDTH + AUTO CENTER */}
      <div style={{ width: "100%", maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
        <h2>Support Inbox (Assigned to me)</h2>
        <p>
          <b>Tenant:</b> {me.tenantId}
        </p>

        {items.length === 0 ? (
          <p>No assigned complaints yet.</p>
        ) : (
          <div style={{ display: "grid", gap: 12 }}>
            {items.map((c) => (
              <div
                key={c.id}
                style={{
                  border: "1px solid #444",
                  borderRadius: 8,
                  padding: 12,
                  background: "#1e1e1e",
                }}
              >
                <b>{c.title}</b>
                <p style={{ opacity: 0.9 }}>{c.description}</p>
                <p>
                  <b>Status:</b> {c.status}
                </p>

                <textarea
                  rows={2}
                  placeholder="Message to consumer (status update)"
                  value={draft[c.id]?.msgToConsumer ?? c.supportMessage ?? ""}
                  onChange={(e) => setDraftField(c.id, "msgToConsumer", e.target.value)}
                  style={{ width: "100%", marginTop: 10 }}
                />

                <textarea
                  rows={3}
                  placeholder="Resolution notes (internal)"
                  value={draft[c.id]?.resolutionNotes ?? c.resolutionNotes ?? ""}
                  onChange={(e) => setDraftField(c.id, "resolutionNotes", e.target.value)}
                  style={{ width: "100%", marginTop: 10 }}
                />

                <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button onClick={() => sendMessageOnly(c.id)}>Send Message Only</button>
                  <button onClick={() => setPending(c.id)}>Set Pending</button>
                  <button onClick={() => setDone(c.id)}>Set Done</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
