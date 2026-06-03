const DRAWING_WORLD_ROOMS_URL = "https://drawing-world.onrender.com/api/rooms";

export default async function handler(request, response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");

  if (request.method === "OPTIONS") {
    response.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    response.status(204).end();
    return;
  }

  if (request.method !== "GET") {
    response.status(405).json({ ok: false, reason: "method_not_allowed" });
    return;
  }

  try {
    const upstream = await fetch(DRAWING_WORLD_ROOMS_URL, { cache: "no-store" });
    const payload = await upstream.json();
    if (!upstream.ok || !Array.isArray(payload?.rooms)) {
      response.status(502).json({ ok: false, reason: "drawing_world_rooms_unavailable" });
      return;
    }
    response.status(200).json({ ok: true, rooms: payload.rooms });
  } catch {
    response.status(502).json({ ok: false, reason: "drawing_world_rooms_unavailable" });
  }
}
