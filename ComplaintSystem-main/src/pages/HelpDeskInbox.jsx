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
  addDoc,
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { complaintsCollectionName } from "../utils/tenantCollections";

export default function HelpdeskInbox() {
  const [me, setMe] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [supportUsers, setSupportUsers] = useState([]);
  const [error, setError] = useState("");

  // per-complaint draft inputs (message/resolution)
  const [draft, setDraft] = useState({}); // { [complaintId]: { message, resolution } }

  // Phone-call logging form
  const [phoneEmail, setPhoneEmail] = useState("");
  const [phoneTitle, setPhoneTitle] = useState("");
  const [phoneDesc, setPhoneDesc] = useState("");
  const [savingPhone, setSavingPhone] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    let unsubComplaints = null;
    let unsubSupport = null;

    const unsubAuth = onAuthStateChanged(auth, async (u) => {
      if (!u) return navigate("/login");

      const mySnap = await getDoc(doc(db, "users", u.uid));
      const myData = mySnap.exists() ? mySnap.data() : null;

      if (!myData) {
        setError("Your Firestore user profile is missing.");
        return;
      }

      if (myData.role !== "helpdesk") {
        setError("Access denied. You are not a helpdesk user.");
        return;
      }

      setError("");
      setMe({ uid: u.uid, ...myData });

      // Load support users in same tenant
      const supportQ = query(
        collection(db, "users"),
        where("tenantId", "==", myData.tenantId),
        where("role", "==", "support")
      );

      unsubSupport = onSnapshot(
        supportQ,
        (snap) => {
          setSupportUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => setError(err.message)
      );

      // Load ALL complaints for this tenant collection
      const colName = complaintsCollectionName(myData.tenantId);
      const complaintsQ = query(collection(db, colName));

      unsubComplaints = onSnapshot(
        complaintsQ,
        (snap) => {
          setComplaints(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        },
        (err) => setError(err.message)
      );
    });

    return () => {
      unsubAuth();
      if (unsubComplaints) unsubComplaints();
      if (unsubSupport) unsubSupport();
    };
  }, [navigate]);

  const setDraftField = (complaintId, field, value) => {
    setDraft((prev) => ({
      ...prev,
      [complaintId]: {
        ...(prev[complaintId] || { message: "", resolution: "" }),
        [field]: value,
      },
    }));
  };

  // Helpdesk logs a complaint on behalf of consumer (phone call)
  const logPhoneComplaint = async (e) => {
    e.preventDefault();
    setError("");

    if (!me) {
      setError("Helpdesk profile not loaded yet.");
      return;
    }

    if (!phoneEmail.trim() || !phoneTitle.trim() || !phoneDesc.trim()) {
      setError("Please fill consumer email, title, and description.");
      return;
    }

    try {
      setSavingPhone(true);

      // Find consumer by email (consumer must already be registered)
      const qUser = query(
        collection(db, "users"),
        where("email", "==", phoneEmail.trim())
      );
      const snap = await getDocs(qUser);

      if (snap.empty) {
        setError("No user found with that email. Consumer must be registered first.");
        return;
      }

      const consumerDoc = snap.docs[0];
      const consumerUid = consumerDoc.id;
      const consumerData = consumerDoc.data();

      // Must be same tenant
      if (consumerData.tenantId !== me.tenantId) {
        setError(`Consumer is not in your tenant (${me.tenantId}).`);
        return;
      }

      const colName = complaintsCollectionName(me.tenantId);

      await addDoc(collection(db, colName), {
        sector: me.tenantId,

        createdByUid: consumerUid,
        createdByEmail: phoneEmail.trim(),

        title: phoneTitle.trim(),
        description: phoneDesc.trim(),

        status: "New",
        assignedToUid: null,
        assignedToEmail: null,

        helpdeskMessage: "Logged by helpdesk (phone call).",
        resolutionNotes: "",

        closedByConsumer: false,

        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // reset form
      setPhoneEmail("");
      setPhoneTitle("");
      setPhoneDesc("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPhone(false);
    }
  };

  // Assign to support person
  const assignToSupport = async (complaintId, support) => {
    setError("");
    try {
      const msg = draft[complaintId]?.message || "";
      const colName = complaintsCollectionName(me.tenantId);

      await updateDoc(doc(db, colName, complaintId), {
        assignedToUid: support.id,
        assignedToEmail: support.email,
        status: "Assigned",
        helpdeskMessage: msg,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteComplaint = async (complaintId) => {
    setError("");
    const ok = window.confirm("Delete this complaint? This action cannot be undone.");
    if (!ok) return;

    try {
      const colName = complaintsCollectionName(me.tenantId);
      await deleteDoc(doc(db, colName, complaintId));
    } catch (err) {
      setError(err.message);
    }
  };

  // Resolve online (helpdesk)
  const resolveNow = async (complaintId) => {
    setError("");
    try {
      const msg = draft[complaintId]?.message || "";
      const resolution = draft[complaintId]?.resolution || "";
      const colName = complaintsCollectionName(me.tenantId);

      await updateDoc(doc(db, colName, complaintId), {
        status: "Done",
        helpdeskMessage: msg,
        resolutionNotes: resolution,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const setPending = async (complaintId) => {
    setError("");
    try {
      const msg = draft[complaintId]?.message || "";
      const colName = complaintsCollectionName(me.tenantId);

      await updateDoc(doc(db, colName, complaintId), {
        status: "Pending",
        helpdeskMessage: msg || "We are currently working on your issue.",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  // Update consumer message without changing status
  const updateMessageOnly = async (complaintId) => {
    setError("");
    try {
      const msg = draft[complaintId]?.message || "";
      const colName = complaintsCollectionName(me.tenantId);

      await updateDoc(doc(db, colName, complaintId), {
        helpdeskMessage: msg,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const badgeStyle = (status) => ({
    display: "inline-block",
    padding: "4px 10px",
    borderRadius: 999,
    border: "1px solid #666",
    marginLeft: 8,
  });

  if (error) return <div style={{ padding: 20, color: "red" }}>{error}</div>;
  if (!me) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ padding: 30, maxWidth: 950 }}>
      <h2>Help Desk Inbox (All Tenant Complaints)</h2>
      <p>
        <b>Tenant:</b> {me.tenantId}
      </p>

      {/* Log complaint by phone call */}
      <div style={{ border: "1px solid #444", borderRadius: 8, padding: 12, marginBottom: 16 }}>
        <h3 style={{ marginTop: 0 }}>Log complaint (phone call)</h3>

        <form onSubmit={logPhoneComplaint} style={{ display: "grid", gap: 10 }}>
          <input
            placeholder="Consumer email (must be registered)"
            value={phoneEmail}
            onChange={(e) => setPhoneEmail(e.target.value)}
          />
          <input
            placeholder="Title"
            value={phoneTitle}
            onChange={(e) => setPhoneTitle(e.target.value)}
          />
          <textarea
            rows={3}
            placeholder="Description"
            value={phoneDesc}
            onChange={(e) => setPhoneDesc(e.target.value)}
          />

          <button type="submit" disabled={savingPhone}>
            {savingPhone ? "Saving..." : "Create complaint"}
          </button>
        </form>
      </div>

      {complaints.length === 0 ? (
        <p>No complaints for your tenant.</p>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {complaints.map((c) => (
            <div
              key={c.id}
              style={{
                border: "1px solid #444",
                borderRadius: 8,
                padding: 12,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                <b>{c.title}</b>
                <span style={badgeStyle(c.status)}>{c.status}</span>
              </div>

              <p style={{ opacity: 0.9 }}>{c.description}</p>

              <p style={{ fontSize: 14, opacity: 0.8 }}>
                <b>From:</b> {c.createdByEmail}
              </p>

              {c.assignedToEmail && (
                <p style={{ fontSize: 14, opacity: 0.85 }}>
                  <b>Assigned to:</b> {c.assignedToEmail}
                </p>
              )}

              {c.helpdeskMessage && (
                <p style={{ fontSize: 14, opacity: 0.9 }}>
                  <b>Message to consumer:</b> {c.helpdeskMessage}
                </p>
              )}

              {c.resolutionNotes && (
                <p style={{ fontSize: 14, opacity: 0.9 }}>
                  <b>Resolution:</b> {c.resolutionNotes}
                </p>
              )}

              {c.status === "Closed" && (
                <>
                  <p style={{ fontSize: 14, color: "#9be29b" }}>
                    ✅ Closed (consumer confirmed)
                  </p>
                  <button
                    onClick={() => deleteComplaint(c.id)}
                    style={{ background: "#b00020", color: "white" }}
                  >
                    Delete
                  </button>
                </>
              )}

              <div style={{ marginTop: 12, display: "grid", gap: 10 }}>
                <input
                  placeholder="Message to consumer (status update)"
                  value={draft[c.id]?.message || ""}
                  onChange={(e) => setDraftField(c.id, "message", e.target.value)}
                />

                <textarea
                  rows={3}
                  placeholder="Resolution notes (if you can solve online)"
                  value={draft[c.id]?.resolution || ""}
                  onChange={(e) => setDraftField(c.id, "resolution", e.target.value)}
                />

                <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
                  <button onClick={() => updateMessageOnly(c.id)}>
                    Update Message Only
                  </button>

                  <button onClick={() => setPending(c.id)}>
                    Still Working (Pending)
                  </button>

                  <button onClick={() => resolveNow(c.id)}>
                    Resolve Online (Done)
                  </button>

                  <span style={{ marginLeft: 10 }}>Assign to:</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selected = supportUsers.find((s) => s.id === selectedId);
                      if (selected) assignToSupport(c.id, selected);
                      e.target.value = "";
                    }}
                  >
                    <option value="" disabled>
                      Select support engineer...
                    </option>
                    {supportUsers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.email}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
