import { createServer } from "node:http";
import { URL, pathToFileURL } from "node:url";

const HOST = process.env.API_HOST ?? "127.0.0.1";
const PORT = Number.parseInt(process.env.API_PORT ?? "4000", 10);

const datasets = [
  {
    id: 1,
    name: "Delta Wind Profile",
    description: "Hourly lower-atmosphere wind measurements over the delta.",
    dataType: "wind",
    tags: ["wind", "hourly", "delta"],
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
    tags: ["humidity", "forecast", "monsoon"],
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
    tags: ["trace-gas", "private", "review"],
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

const clamp = (value, { min, max }) => Math.min(max, Math.max(min, value));

const parseOptionalIntParam = (searchParams, name) => {
  const raw = searchParams.get(name);
  if (raw === null || raw.trim() === "") return undefined;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed;
};

const parseOptionalBoolParam = (searchParams, name) => {
  const raw = searchParams.get(name);
  if (raw === null) return undefined;
  const normalized = raw.trim().toLowerCase();
  if (normalized === "") return undefined;
  if (normalized === "true" || normalized === "1") return true;
  if (normalized === "false" || normalized === "0") return false;
  return null;
};

const parseOptionalFloatParam = (searchParams, name) => {
  const raw = searchParams.get(name);
  if (raw === null || raw.trim() === "") return undefined;
  const parsed = Number.parseFloat(raw);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
};

const parseOptionalBboxParam = (searchParams) => {
  const raw = searchParams.get("bbox");
  if (raw === null || raw.trim() === "") return undefined;

  const parts = raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

  if (parts.length !== 4) {
    return null;
  }

  const numbers = parts.map((value) => Number.parseFloat(value));
  if (numbers.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [minLon, minLat, maxLon, maxLat] = numbers;

  if (minLat < -90 || minLat > 90 || maxLat < -90 || maxLat > 90) {
    return null;
  }

  if (minLon < -180 || minLon > 180 || maxLon < -180 || maxLon > 180) {
    return null;
  }

  if (minLat > maxLat || minLon > maxLon) {
    return null;
  }

  return { minLon, minLat, maxLon, maxLat };
};

const normalizeSort = (raw) => {
  const sort = (raw ?? "").trim().toLowerCase();
  if (!sort) return "created_at_desc";
  return sort;
};

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

const sendText = (response, statusCode, payload, contentType, extraHeaders) => {
  response.writeHead(statusCode, {
    "Content-Type": contentType,
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Cache-Control": "no-store",
    ...(extraHeaders ?? {}),
  });
  response.end(payload);
};

const escapeCsv = (value) => {
  const raw = value === null || value === undefined ? "" : String(value);
  const needsQuotes = /[",\n\r]/.test(raw);
  const escaped = raw.replace(/"/g, '""');
  return needsQuotes ? `"${escaped}"` : escaped;
};

const datasetsToCsv = (items) => {
  const columns = [
    "id",
    "name",
    "description",
    "dataType",
    "tags",
    "status",
    "owner",
    "isPublic",
    "verified",
    "metadataFrozen",
    "collectionDate",
    "createdAt",
    "altitudeMin",
    "altitudeMax",
    "latitude",
    "longitude",
    "ipfsHash",
  ];

  const lines = [
    columns.join(","),
    ...items.map((dataset) =>
      [
        dataset.id,
        dataset.name,
        dataset.description,
        dataset.dataType,
        Array.isArray(dataset.tags) ? dataset.tags.join("|") : "",
        dataset.status,
        dataset.owner,
        dataset.isPublic,
        dataset.verified,
        dataset.metadataFrozen,
        dataset.collectionDate,
        dataset.createdAt,
        dataset.altitudeMin,
        dataset.altitudeMax,
        dataset.latitude,
        dataset.longitude,
        dataset.ipfsHash ?? "",
      ]
        .map(escapeCsv)
        .join(","),
    ),
  ];

  return `\uFEFF${lines.join("\n")}`;
};

const datasetsToGeoJson = (items) => ({
  type: "FeatureCollection",
  features: items.map((dataset) => ({
    type: "Feature",
    id: dataset.id,
    geometry: {
      type: "Point",
      coordinates: [dataset.longitude / 1_000_000, dataset.latitude / 1_000_000],
    },
    properties: {
      name: dataset.name,
      description: dataset.description,
      dataType: dataset.dataType,
      tags: dataset.tags,
      status: dataset.status,
      owner: dataset.owner,
      isPublic: dataset.isPublic,
      verified: dataset.verified,
      metadataFrozen: dataset.metadataFrozen,
      collectionDate: dataset.collectionDate,
      createdAt: dataset.createdAt,
      altitudeMin: dataset.altitudeMin,
      altitudeMax: dataset.altitudeMax,
      ipfsHash: dataset.ipfsHash ?? "",
    },
  })),
});

const matchDatasetId = (pathname) => {
  const matched = pathname.match(/^\/(?:api\/)?datasets\/(\d+)$/);
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
  const dataType = searchParams.get("dataType")?.trim().toLowerCase() ?? "";
  const tagsParam = searchParams.get("tags")?.trim() ?? "";
  const tagParam = searchParams.get("tag")?.trim() ?? "";
  const bbox = parseOptionalBboxParam(searchParams);
  const verified = parseOptionalBoolParam(searchParams, "verified");
  const metadataFrozen = parseOptionalBoolParam(searchParams, "metadataFrozen");

  const isPublicRaw = searchParams.get("isPublic")?.trim().toLowerCase() ?? "";
  const isPublic =
    isPublicRaw === ""
      ? undefined
      : isPublicRaw === "true" || isPublicRaw === "1"
        ? true
        : isPublicRaw === "false" || isPublicRaw === "0"
          ? false
          : null;

  const from = parseOptionalIntParam(searchParams, "from");
  const to = parseOptionalIntParam(searchParams, "to");

  const createdAtFrom = parseOptionalIntParam(searchParams, "createdAtFrom");
  const createdAtTo = parseOptionalIntParam(searchParams, "createdAtTo");

  const altitudeMin = parseOptionalFloatParam(searchParams, "altitudeMin");
  const altitudeMax = parseOptionalFloatParam(searchParams, "altitudeMax");

  if (isPublic === null) {
    return { error: "Invalid isPublic. Expected true/false (or 1/0)." };
  }

  if (from === null || to === null) {
    return { error: "Invalid from/to. Expected unix epoch seconds as integers." };
  }

  if (createdAtFrom === null || createdAtTo === null) {
    return { error: "Invalid createdAtFrom/createdAtTo. Expected block heights as integers." };
  }

  if (
    typeof createdAtFrom === "number" &&
    typeof createdAtTo === "number" &&
    createdAtFrom > createdAtTo
  ) {
    return { error: "Invalid createdAtFrom/createdAtTo. Expected createdAtFrom <= createdAtTo." };
  }

  if (verified === null) {
    return { error: "Invalid verified. Expected true/false (or 1/0)." };
  }

  if (metadataFrozen === null) {
    return { error: "Invalid metadataFrozen. Expected true/false (or 1/0)." };
  }

  if (bbox === null) {
    return {
      error:
        "Invalid bbox. Expected 'minLon,minLat,maxLon,maxLat' in degrees (e.g. bbox=90.35,23.65,90.55,23.85).",
    };
  }

  if (altitudeMin === null || altitudeMax === null) {
    return { error: "Invalid altitudeMin/altitudeMax. Expected numbers in meters." };
  }

  if (typeof altitudeMin === "number" && typeof altitudeMax === "number" && altitudeMin > altitudeMax) {
    return { error: "Invalid altitudeMin/altitudeMax. Expected altitudeMin <= altitudeMax." };
  }

  const rawTags = tagsParam || tagParam;
  const requiredTags = rawTags
    ? rawTags
        .split(",")
        .map((tag) => tag.trim().toLowerCase())
        .filter(Boolean)
    : [];

  return {
    items: datasets.filter((dataset) => {
    if (bbox) {
      const minLat = Math.round(bbox.minLat * 1_000_000);
      const maxLat = Math.round(bbox.maxLat * 1_000_000);
      const minLon = Math.round(bbox.minLon * 1_000_000);
      const maxLon = Math.round(bbox.maxLon * 1_000_000);

      if (dataset.latitude < minLat || dataset.latitude > maxLat) {
        return false;
      }

      if (dataset.longitude < minLon || dataset.longitude > maxLon) {
        return false;
      }
    }

    if (search) {
      const haystack = [
        dataset.id,
        dataset.name,
        dataset.description,
        dataset.dataType,
        dataset.ipfsHash,
        ...(Array.isArray(dataset.tags) ? dataset.tags : []),
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

    if (dataType && dataset.dataType.toLowerCase() !== dataType) {
      return false;
    }

    if (verified !== undefined && dataset.verified !== verified) {
      return false;
    }

    if (metadataFrozen !== undefined && dataset.metadataFrozen !== metadataFrozen) {
      return false;
    }

    if (isPublic !== undefined && dataset.isPublic !== isPublic) {
      return false;
    }

    if (visibility === "public" && !dataset.isPublic) {
      return false;
    }

    if (visibility === "private" && dataset.isPublic) {
      return false;
    }

    if (typeof from === "number" && dataset.collectionDate < from) {
      return false;
    }

    if (typeof to === "number" && dataset.collectionDate > to) {
      return false;
    }

    if (typeof createdAtFrom === "number" && dataset.createdAt < createdAtFrom) {
      return false;
    }

    if (typeof createdAtTo === "number" && dataset.createdAt > createdAtTo) {
      return false;
    }

    if (typeof altitudeMin === "number" && dataset.altitudeMin < altitudeMin) {
      return false;
    }

    if (typeof altitudeMax === "number" && dataset.altitudeMax > altitudeMax) {
      return false;
    }

    if (requiredTags.length > 0) {
      const datasetTags = (Array.isArray(dataset.tags) ? dataset.tags : [])
        .map((tag) => String(tag).toLowerCase())
        .filter(Boolean);
      const tagSet = new Set(datasetTags);
      for (const requiredTag of requiredTags) {
        if (!tagSet.has(requiredTag)) {
          return false;
        }
      }
    }

    return true;
    }),
  };
};

const sortDatasets = (items, sort) => {
  const normalized = normalizeSort(sort);
  const sorted = items.slice();

  const sorters = {
    id_asc: (a, b) => a.id - b.id,
    id_desc: (a, b) => b.id - a.id,
    created_at_asc: (a, b) => (a.createdAt ?? 0) - (b.createdAt ?? 0),
    created_at_desc: (a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0),
    collection_date_asc: (a, b) => (a.collectionDate ?? 0) - (b.collectionDate ?? 0),
    collection_date_desc: (a, b) => (b.collectionDate ?? 0) - (a.collectionDate ?? 0),
    name_asc: (a, b) => String(a.name ?? "").localeCompare(String(b.name ?? "")),
    name_desc: (a, b) => String(b.name ?? "").localeCompare(String(a.name ?? "")),
  };

  const sorter = sorters[normalized];
  if (!sorter) {
    return { items: sorted, sort: "created_at_desc", sortValid: false };
  }

  sorted.sort(sorter);
  return { items: sorted, sort: normalized, sortValid: true };
};

const paginateDatasets = (items, searchParams) => {
  const cursor = parseOptionalIntParam(searchParams, "cursor");
  if (cursor === null) {
    return { error: "Invalid cursor. Expected an integer offset." };
  }

  const limitRaw = parseOptionalIntParam(searchParams, "limit");
  if (limitRaw === null) {
    return { error: "Invalid limit. Expected an integer." };
  }

  const limit = clamp(limitRaw ?? 50, { min: 1, max: 200 });
  const offset = clamp(cursor ?? 0, { min: 0, max: Number.MAX_SAFE_INTEGER });

  const paged = items.slice(offset, offset + limit);
  const nextOffset = offset + paged.length;
  const nextCursor = nextOffset < items.length ? String(nextOffset) : undefined;

  return { items: paged, nextCursor, limit, cursor: String(offset) };
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

const buildTagSummary = (items) => {
  const counts = new Map();
  for (const dataset of items) {
    const tags = Array.isArray(dataset.tags) ? dataset.tags : [];
    for (const tag of tags) {
      const normalized = String(tag).trim().toLowerCase();
      if (!normalized) continue;
      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }
  }

  const tagCounts = Array.from(counts.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));

  return {
    totalDatasets: items.length,
    totalTags: tagCounts.length,
    items: tagCounts,
  };
};

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
  if ("error" in filtered) {
    sendJson(response, 400, { error: filtered.error });
    return;
  }

  if (pathname === "/health") {
    sendJson(response, 200, {
      ok: true,
      service: "atmos-data-service",
      datasetCount: datasets.length,
    });
    return;
  }

  if (pathname === "/api/datasets" || pathname === "/datasets") {
    const { items: sortedItems, sort, sortValid } = sortDatasets(
      filtered.items,
      searchParams.get("sort"),
    );

    const paged = paginateDatasets(sortedItems, searchParams);
    if ("error" in paged) {
      sendJson(response, 400, { error: paged.error });
      return;
    }

    sendJson(response, 200, {
      total: sortedItems.length,
      items: paged.items,
      nextCursor: paged.nextCursor,
      cursor: paged.cursor,
      limit: paged.limit,
      sort,
      sortValid,
      allowedSort: [
        "created_at_desc",
        "created_at_asc",
        "collection_date_desc",
        "collection_date_asc",
        "id_desc",
        "id_asc",
        "name_asc",
        "name_desc",
      ],
    });
    return;
  }

  if (pathname === "/api/datasets.csv" || pathname === "/datasets.csv") {
    const { items: sortedItems } = sortDatasets(
      filtered.items,
      searchParams.get("sort"),
    );

    const paged = paginateDatasets(sortedItems, searchParams);
    if ("error" in paged) {
      sendJson(response, 400, { error: paged.error });
      return;
    }

    sendText(
      response,
      200,
      datasetsToCsv(paged.items),
      "text/csv; charset=utf-8",
      { "Content-Disposition": "attachment; filename=\"atmos-datasets.csv\"" },
    );
    return;
  }

  if (
    pathname === "/api/datasets.geojson" ||
    pathname === "/datasets.geojson" ||
    pathname === "/api/datasets.geojson.json" ||
    pathname === "/datasets.geojson.json"
  ) {
    const { items: sortedItems } = sortDatasets(
      filtered.items,
      searchParams.get("sort"),
    );

    const paged = paginateDatasets(sortedItems, searchParams);
    if ("error" in paged) {
      sendJson(response, 400, { error: paged.error });
      return;
    }

    sendJson(response, 200, datasetsToGeoJson(paged.items));
    return;
  }

  if (pathname === "/api/summary" || pathname === "/summary") {
    sendJson(response, 200, buildSummary(filtered.items));
    return;
  }

  if (
    pathname === "/api/tags" ||
    pathname === "/tags" ||
    pathname === "/datasets/tags" ||
    pathname === "/api/datasets/tags"
  ) {
    sendJson(response, 200, buildTagSummary(filtered.items));
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
    routes: [
      "/health",
      "/datasets",
      "/datasets/:id",
      "/datasets/tags",
      "/datasets.csv",
      "/datasets.geojson",
      "/summary",
      "/tags",
      "/api/datasets (legacy alias)",
      "/api/datasets/:id (legacy alias)",
      "/api/datasets/tags (legacy alias)",
      "/api/datasets.csv (legacy alias)",
      "/api/datasets.geojson (legacy alias)",
      "/api/summary (legacy alias)",
      "/api/tags (legacy alias)",
    ],
  });
};

export const createDataServiceServer = () => createServer(handleRequest);

const isDirectRun =
  typeof process.argv[1] === "string" &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  createDataServiceServer().listen(PORT, HOST, () => {
    console.log(`Atmos data service listening at http://${HOST}:${PORT}`);
  });
}


const gracefulShutdown = () => {
  console.log("Shutting down data service...");
  process.exit(0);
}

const shutdownSignals = ["SIGINT", "SIGTERM", "SIGQUIT"];
shutdownSignals.forEach((signal) => {
  process.on(signal, gracefulShutdown);
});

const uncaughtSignals = ["uncaughtException", "unhandledRejection"];
uncaughtSignals.forEach((event) => {
  process.on(event, (error) => {
    console.error(`Uncaught ${event}:`, error);
    gracefulShutdown();
  });
});
