import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Browserbase } from "@browserbasehq/sdk";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sessionId: string }> },
) {
  try {
    const { orgId } = await auth();

    if (!orgId) {
      return NextResponse.json(
        { error: "Unauthorized — organization required" },
        { status: 401 },
      );
    }

    const { sessionId } = await params;

    const apiKey = process.env.BROWSERBASE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Browserbase API key not configured" },
        { status: 500 },
      );
    }

    const bb = new Browserbase({ apiKey });

    // Step 1: Retrieve replay metadata.
    // When the recording isn't ready yet, Browserbase returns 404 with
    // {"message": "Replay not found"}. We pass that through so the client
    // can keep polling.
    let replayMeta;
    try {
      replayMeta = await bb.sessions.replays.retrieve(sessionId);
    } catch (err) {
      if (
        err instanceof Browserbase.APIError &&
        err.status === 404
      ) {
        return NextResponse.json(
          { status: "not-ready" },
          { status: 202 },
        );
      }

      console.error("Browserbase replay retrieve error:", err);
      return NextResponse.json(
        { error: "Failed to retrieve replay metadata" },
        { status: 502 },
      );
    }

    // Step 2: Grab the first page's ID.
    const firstPage = replayMeta.pages?.[0];
    if (!firstPage) {
      return NextResponse.json(
        { status: "not-ready" },
        { status: 202 },
      );
    }

    // Step 3: Retrieve the HLS (.m3u8) playlist for that page.
    const playlistResponse = await bb.sessions.replays.retrievePage(
      sessionId,
      firstPage.pageId,
    );
    const m3u8 = await playlistResponse.text();

    return NextResponse.json({
      status: "ready",
      playlist: m3u8,
      pageId: firstPage.pageId,
      url: firstPage.url,
      startTimeMs: firstPage.startTimeMs,
      endTimeMs: firstPage.endTimeMs,
    });
  } catch (err) {
    console.error("Replay API error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve replay" },
      { status: 500 },
    );
  }
}
