export function complaintsCollectionName(tenantId) {
  const t = (tenantId || "").toLowerCase();

  if (t === "bank") return "complaints_bank";
  if (t === "airline") return "complaints_airline";
  if (t === "telecom") return "complaints_telecom";

  // fallback (optional)
  return "complaints_bank";
}
