import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// GET: /api/get-link?link-id=<id>
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const linkId = searchParams.get("link-id");

  if (!linkId) {
    return NextResponse.json({ error: "link-id param is required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  // Fetch link data
  const { data: link, error: linkError } = await supabase
    .from("user_links")
    .select("*")
    .eq("id", linkId)
    .single();

  if (linkError || !link) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  // Fetch clicks with lat/lng for Google Maps
  const { data: clicks, error: clicksError } = await supabase
    .from("link_clicks")
    .select("id, lat, lng, ip_address, created_at")
    .eq("user_link_id", linkId);

  if (clicksError) {
    return NextResponse.json({ error: "Error fetching clicks" }, { status: 500 });
  }

  return NextResponse.json({
    data: {
      link,
      clicks: clicks || []
    }
  });
}
