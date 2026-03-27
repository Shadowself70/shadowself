const UPSTREAM_URL = "https://shadowself.ca/games/harmres.html";

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (!["/", "/index.html", "/harmres.html"].includes(url.pathname)) {
      return new Response("Not found.", { status: 404 });
    }

    const upstreamResponse = await fetch(UPSTREAM_URL, {
      headers: {
        "user-agent": request.headers.get("user-agent") || "harmres-site-worker"
      }
    });

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("cache-control", "public, max-age=300");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders
    });
  }
};
