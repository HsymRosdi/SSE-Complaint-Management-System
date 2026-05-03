import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

export default function Dashboard() {
  const [authUser, setAuthUser] = useState(null);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setAuthUser(u);
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        setUserData(snap.exists() ? snap.data() : null);
      } else {
        setUserData(null);
      }
    });

    return () => unsub();
  }, []);

  if (!authUser) return <div style={{ padding: 20 }}>Not logged in.</div>;

  return (
    <div
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        top: 80, // space for navbar
        bottom: 0,
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
          borderRadius: 10,
          padding: 18,
          background: "#1e1e1e",
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 14 }}>Dashboard</h2>

        <div style={{ display: "grid", gap: 10 }}>
          <p style={{ margin: 0 }}>
            <b>Email:</b> {authUser.email}
          </p>
          <p style={{ margin: 0 }}>
            <b>Role:</b> {userData?.role || "-"}
          </p>
          <p style={{ margin: 0 }}>
            <b>Sector:</b> {userData?.sector || "-"}
          </p>
        </div>
      </div>
    </div>
  );
}
