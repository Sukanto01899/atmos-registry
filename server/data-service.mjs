import { createServer } from "node:http";
import { URL } from "node:url";

const HOST = process.env.API_HOST ?? "127.0.0.1";
const PORT = Number.parseInt(process.env.API_PORT ?? "4000", 10);

const datasets = [
  {
    id: 1,
    name: "Delta Wind Profile",
    description: "Hourly lower-atmosphere wind measurements over the delta.",
    dataType: "wind",
    status: "verified",
    owner: "SP1WINDPROFILE000000000000000000000001",
    isPublic: true,
    verified: true,
    metadataFrozen: true,
    collectionDate: 1704067200,
    createdAt: 865432,
    altitudeMin: 120,
    altitudeMax: 3200,
    latitude: 23456789,
    longitude: 90123456,
    ipfsHash: "QmWindProfileExampleHash",
  },
  {
    id: 2,
    name: "Monsoon Moisture Grid",
    description: "Regional humidity mesh for monsoon corridor forecasting.",
    dataType: "humidity",
    status: "pending",
    owner: "SP1MONSOONGRID000000000000000000000002",
    isPublic: true,
    verified: false,
    metadataFrozen: false,
    collectionDate: 1706745600,
    createdAt: 872211,
    altitudeMin: 50,
    altitudeMax: 1800,
    latitude: 22112233,
    longitude: 88776655,
    ipfsHash: "QmMonsoonGridExampleHash",
  },
  {
    id: 3,
    name: "Stratosphere Trace Scan",
    description: "Private trace-gas scan prepared for downstream review.",
    dataType: "trace-gas",
    status: "active",
    owner: "SP1TRACEGAS000000000000000000000000003",
    isPublic: false,
    verified: false,
    metadataFrozen: false,
    collectionDate: 1709251200,
    createdAt: 879905,
    altitudeMin: 2200,
    altitudeMax: 14500,
    latitude: 19765432,
    longitude: 72567890,
    ipfsHash: "QmTraceGasExampleHash",
  },
];

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(payload, null, 2));
};

const matchDatasetId = (pathname) => {
  const matched = pathname.match(/^\/api\/datasets\/(\d+)$/);
  if (!matched) {
    return null;
  }
  return Number.parseInt(matched[1], 10);
};

const filterDatasets = (searchParams) => {
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const status = searchParams.get("status")?.trim().toLowerCase() ?? "";
  const owner = searchParams.get("owner")?.trim().toLowerCase() ?? "";
  const visibility = searchParams.get("visibility")?.trim().toLowerCase() ?? "";

  return datasets.filter((dataset) => {
    if (search) {
      const haystack = [
        dataset.id,
        dataset.name,
        dataset.description,
        dataset.dataType,
        dataset.ipfsHash,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(search)) {
        return false;
      }
    }

    if (status && dataset.status.toLowerCase() !== status) {
      return false;
    }

    if (owner && !dataset.owner.toLowerCase().includes(owner)) {
      return false;
    }

    if (visibility === "public" && !dataset.isPublic) {
      return false;
    }

    if (visibility === "private" && dataset.isPublic) {
      return false;
    }

    return true;
  });
};

const buildSummary = (items) => ({
  total: items.length,
  verified: items.filter((dataset) => dataset.verified).length,
  public: items.filter((dataset) => dataset.isPublic).length,
  statuses: items.reduce((summary, dataset) => {
    summary[dataset.status] = (summary[dataset.status] ?? 0) + 1;
    return summary;
  }, {}),
});

const handleRequest = (request, response) => {
  if (!request.url) {
    sendJson(response, 400, { error: "Request URL is missing." });
    return;
  }

  if (request.method === "OPTIONS") {
    response.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    response.end();
    return;
  }

  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host ?? "localhost"}`);
  const { pathname, searchParams } = url;
  const filtered = filterDatasets(searchParams);

  if (pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "atmos-data-service",
      datasetCount: datasets.length,
    });
    return;
  }

  if (pathname === "/api/datasets") {
    sendJson(response, 200, {
      total: filtered.length,
      items: filtered,
    });
    return;
  }

  if (pathname === "/api/summary") {
    sendJson(response, 200, buildSummary(filtered));
    return;
  }

  const datasetId = matchDatasetId(pathname);
  if (datasetId !== null) {
    const dataset = datasets.find((item) => item.id === datasetId);
    if (!dataset) {
      sendJson(response, 404, { error: `Dataset ${datasetId} was not found.` });
      return;
    }
    sendJson(response, 200, dataset);
    return;
  }

  sendJson(response, 404, {
    error: "Not found.",
    routes: ["/health", "/api/datasets", "/api/datasets/:id", "/api/summary"],
  });
};

export const createDataServiceServer = () => createServer(handleRequest);

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === new URL(process.argv[1], "file:").href;

if (isDirectRun) {
  createDataServiceServer().listen(PORT, HOST, () => {
    console.log(`Atmos data service listening at http://${HOST}:${PORT}`);
  });
}
