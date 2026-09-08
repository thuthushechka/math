export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  try {
    const { ensureDb } = await import("@/lib/ensure-db");
    await ensureDb();
  } catch (error) {
    console.error("Database bootstrap failed:", error);
  }
}
