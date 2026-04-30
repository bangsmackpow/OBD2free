const WORKER_URL = "https://obd2free-worker.curtislamasters.workers.dev";

export async function onRequest(context: EventContext): Promise<Response> {
  const {request} = context;
  const url = new URL(request.url);
  const path = url.pathname + url.search;

  const workerUrl = `${WORKER_URL}${path}`;

  // Forward headers, but filter ones that shouldn't be forwarded
  const headers = new Headers(request.headers);
  headers.delete("host");

  const proxyRequest = new Request(workerUrl, {
    method: request.method,
    headers,
    body: request.body,
  });

  const response = await fetch(proxyRequest);

  // Return the response with CORS headers for the Pages domain
  const respHeaders = new Headers(response.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: respHeaders,
  });
}
