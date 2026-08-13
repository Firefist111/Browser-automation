import type { Stagehand } from "@browserbasehq/stagehand"
import { isValidUrl } from "../lib/urls"

export async function openUrl({
  stagehand,
  url,
}: {
  stagehand: Stagehand
  url: string
}) {
  const raw = (url ?? "").trim()
  if (!raw) {
    throw new Error("URL parameter is required for Open URL step.")
  }
  // Fail fast with a clear message on syntactically-invalid URLs instead of
  // letting the browser choke on them. (Syntactically-valid but unreachable
  // hosts are not detected here — they load a browser error page.)
  if (!isValidUrl(raw)) {
    throw new Error(
      `Invalid URL: "${raw}". Expected a valid URL (e.g. https://example.com).`
    )
  }

  // Automatically prepend https:// if protocol is omitted (e.g. youtube.com -> https://youtube.com)
  let targetUrl = raw
  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`
  }

  const pages = stagehand.context.pages()
  const page = pages.length > 0 ? pages[0] : await stagehand.context.newPage()

  await page.goto(targetUrl, { waitUntil: "load", timeoutMs: 30000 })

  return {
    url: page.url(),
    title: await page.title(),
  }
}
