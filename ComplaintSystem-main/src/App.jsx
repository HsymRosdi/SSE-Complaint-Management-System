import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

import Register from "./pages/Register";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewComplaint from "./pages/NewComplaint";
import MyComplaints from "./pages/MyComplaints";
import HelpdeskInbox from "./pages/HelpdeskInbox";
import SupportInbox from "./pages/SupportInbox";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <BrowserRouter>
      <AppInner />
    </BrowserRouter>
  );
}

function AppInner() {
  const [me, setMe] = useState(null);
  const location = useLocation();

  // hide navbar on login/register
  const isAuthPage =
    location.pathname === "/login" || location.pathname === "/register";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setMe(null);
        return;
      }
      const snap = await getDoc(doc(db, "users", u.uid));
      setMe(snap.exists() ? { uid: u.uid, ...snap.data() } : null);
    });

    return () => unsub();
  }, []);

  const NAV_HEIGHT = 64;

  const Nav = () => {
    if (isAuthPage) return null;

    // not logged in: small nav (optional)
    if (!me) {
      return (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: NAV_HEIGHT,
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "0 20px",
            background: "#1e1e1e",
            borderBottom: "1px solid #333",
            zIndex: 9999,
          }}
        >
          <Link to="/register">Register</Link>
          <Link to="/login">Login</Link>
        </div>
      );
    }

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          height: NAV_HEIGHT,
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "0 20px",
          background: "#1e1e1e",
          borderBottom: "1px solid #333",
          zIndex: 9999,
        }}
      >
        <Link to="/dashboard">Dashboard</Link>

        {me.role === "consumer" && (
          <>
            <Link to="/new-complaint">New Complaint</Link>
            <Link to="/my-complaints">My Complaints</Link>
          </>
        )}

        {me.role === "helpdesk" && <Link to="/helpdesk">Helpdesk</Link>}
        {me.role === "support" && <Link to="/support">Support</Link>}

        <button style={{ marginLeft: "auto" }} onClick={() => auth.signOut()}>
          Logout
        </button>
      </div>
    );
  };

  return (
    <>
      <Nav />

      {/* ✅ spacer so content starts below fixed navbar */}
      {!isAuthPage && <div style={{ height: NAV_HEIGHT }} />}

      {/* ✅ make sure routes area is full width */}
      <div style={{ width: "100%" }}>
        <Routes>
          {/* Public */}
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />

          {/* Protected */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Consumer */}
          <Route
            path="/new-complaint"
            element={
              <ProtectedRoute>
                <NewComplaint />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute>
                <MyComplaints />
              </ProtectedRoute>
            }
          />

          {/* Helpdesk */}
          <Route
            path="/helpdesk"
            element={
              <ProtectedRoute>
                <HelpdeskInbox />
              </ProtectedRoute>
            }
          />

          {/* Support */}
          <Route
            path="/support"
            element={
              <ProtectedRoute>
                <SupportInbox />
              </ProtectedRoute>
            }
          />

          {/* Default */}
          <Route path="*" element={<Login />} />
        </Routes>
      </div>
    </>
  );
}
