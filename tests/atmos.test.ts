import { describe, expect, it } from "vitest";
import { Cl, cvToJSON } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

const unwrapOk = (cv: unknown) => {
  const json = cvToJSON(cv as any) as any;
  if (json.success === true && json.value !== undefined) {
    return json.value;
  }
  if (json.success === false) {
    throw new Error("Expected ok response");
  }
  if (json.type === "response" && json.value?.type === "ok") {
    return json.value.value;
  }
  if (json.type === "ok") {
    return json.value;
  }
  if (json.type && json.value !== undefined) {
    return json;
  }
  throw new Error("Expected ok response");
};

const uintFromResponse = (cv: unknown) => {
  const value = unwrapOk(cv) as any;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number.parseInt(value, 10);
  return Number.parseInt(String(value?.value ?? "0"), 10);
};

const tupleFromResponse = (cv: unknown) => {
  const value = unwrapOk(cv) as any;
  if (value?.type === "tuple") {
    return value.value ?? {};
  }
  if (typeof value?.type === "string" && value.type.startsWith("(tuple")) {
    return value.value ?? {};
  }
  if (value?.type && value.value) {
    return value.value ?? {};
  }
  if (value?.value) {
    return value.value ?? {};
  }
  throw new Error("Expected tuple");
};

const getDatasetCount = () => {
  const { result } = simnet.callReadOnlyFn("atmos", "get-dataset-count", [], deployer);
  return uintFromResponse(result);
};

const registerDataset = (sender: string, name: string, dataType = "temperature") => {
  const { result } = simnet.callPublicFn("atmos", "register-dataset", [
    Cl.stringUtf8(name),
    Cl.stringUtf8("Atmospheric dataset"),
    Cl.stringUtf8(dataType),
    Cl.uint(1640995200),
    Cl.uint(1000),
    Cl.uint(5000),
    Cl.int(40000000),
    Cl.int(-74000000),
    Cl.stringAscii("QmTestHash123"),
    Cl.bool(true)
  ], sender);

  return uintFromResponse(result);
};

describe("atmos contract tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("should return a dataset count", () => {
    const count = getDatasetCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  it("should return contract admin", () => {
    const { result } = simnet.callReadOnlyFn("atmos", "get-contract-admin", [], deployer);
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("should allow registering a new dataset", () => {
    const before = getDatasetCount();
    const id = registerDataset(wallet1, "Temperature Data");
    expect(id).toBe(before + 1);
  });

  it("should increment dataset count after registration", () => {
    const before = getDatasetCount();
    registerDataset(wallet2, "Humidity Data");
    const after = getDatasetCount();
    expect(after).toBe(before + 1);
  });

  it("should retrieve dataset information", () => {
    const id = registerDataset(wallet1, "Pressure Data", "pressure");

    const { result } = simnet.callReadOnlyFn("atmos", "get-dataset", [Cl.uint(id)], deployer);
    const tuple = tupleFromResponse(result);
    expect(tuple.owner.value).toBe(wallet1);
    expect(tuple.name.value).toBe("Pressure Data");
    expect(tuple["data-type"].value).toBe("pressure");
    expect(tuple["is-public"].value).toBe(true);
    expect(tuple.status.value).toBe("active");
  });

  it("should return datasets by owner", () => {
    const id = registerDataset(wallet2, "Wind Data", "wind");
    const { result } = simnet.callReadOnlyFn("atmos", "get-datasets-by-owner", [Cl.principal(wallet2)], deployer);
    const json = cvToJSON(result as any) as any;
    const ids = (json.value ?? []).map((item: any) => Number.parseInt(String(item.value ?? "0"), 10));
    expect(ids).toContain(id);
  });

  it("should allow owner to update dataset metadata", () => {
    const id = registerDataset(wallet1, "Original Name");

    const { result } = simnet.callPublicFn("atmos", "update-dataset-metadata", [
      Cl.uint(id),
      Cl.stringUtf8("Updated Name"),
      Cl.stringUtf8("Updated description"),
      Cl.stringUtf8("updated"),
      Cl.bool(true)
    ], wallet1);

    expect(result).toBeOk(Cl.bool(true));
  });

  it("should not allow non-owner to update dataset metadata", () => {
    const id = registerDataset(wallet1, "Protected Data");

    const { result } = simnet.callPublicFn("atmos", "update-dataset-metadata", [
      Cl.uint(id),
      Cl.stringUtf8("Hacked Name"),
      Cl.stringUtf8("Hacked description"),
      Cl.stringUtf8("hacked"),
      Cl.bool(true)
    ], wallet2);

    expect(result).toBeErr(Cl.uint(401)); // ERR-NOT-AUTHORIZED
  });

  it("should allow owner to freeze dataset metadata", () => {
    const id = registerDataset(wallet1, "Freezable Data");

    const { result } = simnet.callPublicFn("atmos", "freeze-dataset-metadata", [Cl.uint(id)], wallet1);
    expect(result).toBeOk(Cl.bool(true));
  });

  it("should reject invalid latitude", () => {
    const { result } = simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Invalid Lat Data"),
      Cl.stringUtf8("Dataset with invalid latitude"),
      Cl.stringUtf8("invalid"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(1000),
      Cl.int(95000000), // Invalid latitude > 90 degrees
      Cl.int(-80000000),
      Cl.stringAscii("QmInvalidHash"),
      Cl.bool(false)
    ], wallet1);

    expect(result).toBeErr(Cl.uint(400)); // ERR-INVALID-PARAMS
  });

  it("should reject invalid longitude", () => {
    const { result } = simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Invalid Lon Data"),
      Cl.stringUtf8("Dataset with invalid longitude"),
      Cl.stringUtf8("invalid"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(1000),
      Cl.int(45000000),
      Cl.int(185000000), // Invalid longitude > 180 degrees
      Cl.stringAscii("QmInvalidHash2"),
      Cl.bool(false)
    ], wallet1);

    expect(result).toBeErr(Cl.uint(400)); // ERR-INVALID-PARAMS
  });

  it("should reject invalid altitude range", () => {
    const { result } = simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Invalid Alt Data"),
      Cl.stringUtf8("Dataset with invalid altitude range"),
      Cl.stringUtf8("invalid"),
      Cl.uint(1640995200),
      Cl.uint(5000), // altitude-min > altitude-max
      Cl.uint(1000),
      Cl.int(45000000),
      Cl.int(-75000000),
      Cl.stringAscii("QmInvalidHash3"),
      Cl.bool(false)
    ], wallet1);

    expect(result).toBeErr(Cl.uint(400)); // ERR-INVALID-PARAMS
  });
});
