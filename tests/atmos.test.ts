import { describe, expect, it } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("atmos contract tests", () => {
  it("ensures simnet is well initialised", () => {
    expect(simnet.blockHeight).toBeDefined();
  });

  it("should have initial dataset count of 0", () => {
    const { result } = simnet.callReadOnlyFn("atmos", "get-dataset-count", [], deployer);
    expect(result).toBeOk(Cl.uint(0));
  });

  it("should return contract admin", () => {
    const { result } = simnet.callReadOnlyFn("atmos", "get-contract-admin", [], deployer);
    expect(result).toBeOk(Cl.principal(deployer));
  });

  it("should allow registering a new dataset", () => {
    const { result } = simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Temperature Data"),
      Cl.stringUtf8("Atmospheric temperature measurements"),
      Cl.stringUtf8("temperature"),
      Cl.uint(1640995200), // Unix timestamp
      Cl.uint(1000), // altitude-min
      Cl.uint(5000), // altitude-max
      Cl.int(40000000), // latitude (40.0 degrees * 1000000)
      Cl.int(-74000000), // longitude (-74.0 degrees * 1000000)
      Cl.stringAscii("QmTestHash123"),
      Cl.bool(true) // is-public
    ], wallet1);
    
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should increment dataset count after registration", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Humidity Data"),
      Cl.stringUtf8("Atmospheric humidity measurements"),
      Cl.stringUtf8("humidity"),
      Cl.uint(1640995200),
      Cl.uint(500),
      Cl.uint(3000),
      Cl.int(35000000),
      Cl.int(-80000000),
      Cl.stringAscii("QmTestHash456"),
      Cl.bool(false)
    ], wallet2);

    const { result } = simnet.callReadOnlyFn("atmos", "get-dataset-count", [], deployer);
    expect(result).toBeOk(Cl.uint(1));
  });

  it("should retrieve dataset information", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Pressure Data"),
      Cl.stringUtf8("Atmospheric pressure measurements"),
      Cl.stringUtf8("pressure"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(10000),
      Cl.int(45000000),
      Cl.int(-75000000),
      Cl.stringAscii("QmTestHash789"),
      Cl.bool(true)
    ], wallet1);

    const { result } = simnet.callReadOnlyFn("atmos", "get-dataset", [Cl.uint(1)], deployer);
    expect(result).toBeOk(Cl.tuple({
      owner: Cl.principal(wallet1),
      name: Cl.stringUtf8("Pressure Data"),
      description: Cl.stringUtf8("Atmospheric pressure measurements"),
      "data-type": Cl.stringUtf8("pressure"),
      "collection-date": Cl.uint(1640995200),
      "altitude-min": Cl.uint(0),
      "altitude-max": Cl.uint(10000),
      latitude: Cl.int(45000000),
      longitude: Cl.int(-75000000),
      "ipfs-hash": Cl.stringAscii("QmTestHash789"),
      "is-public": Cl.bool(true),
      "metadata-frozen": Cl.bool(false),
      "created-at": Cl.uint(0)
    }));
  });

  it("should check if dataset is public", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Wind Data"),
      Cl.stringUtf8("Wind speed and direction"),
      Cl.stringUtf8("wind"),
      Cl.uint(1640995200),
      Cl.uint(100),
      Cl.uint(2000),
      Cl.int(50000000),
      Cl.int(-70000000),
      Cl.stringAscii("QmWindHash"),
      Cl.bool(false)
    ], wallet2);

    const { result } = simnet.callReadOnlyFn("atmos", "is-dataset-public", [Cl.uint(1)], deployer);
    expect(result).toBeOk(Cl.bool(false));
  });

  it("should allow owner to update dataset metadata", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Original Name"),
      Cl.stringUtf8("Original description"),
      Cl.stringUtf8("original"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(1000),
      Cl.int(30000000),
      Cl.int(-90000000),
      Cl.stringAscii("QmOriginalHash"),
      Cl.bool(false)
    ], wallet1);

    const { result } = simnet.callPublicFn("atmos", "update-dataset-metadata", [
      Cl.uint(1),
      Cl.stringUtf8("Updated Name"),
      Cl.stringUtf8("Updated description"),
      Cl.stringUtf8("updated"),
      Cl.bool(true)
    ], wallet1);

    expect(result).toBeOk(Cl.bool(true));
  });

  it("should not allow non-owner to update dataset metadata", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Protected Data"),
      Cl.stringUtf8("Protected dataset"),
      Cl.stringUtf8("protected"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(1000),
      Cl.int(25000000),
      Cl.int(-85000000),
      Cl.stringAscii("QmProtectedHash"),
      Cl.bool(false)
    ], wallet1);

    const { result } = simnet.callPublicFn("atmos", "update-dataset-metadata", [
      Cl.uint(1),
      Cl.stringUtf8("Hacked Name"),
      Cl.stringUtf8("Hacked description"),
      Cl.stringUtf8("hacked"),
      Cl.bool(true)
    ], wallet2);

    expect(result).toBeErr(Cl.uint(401)); // ERR-NOT-AUTHORIZED
  });

  it("should allow owner to freeze dataset metadata", () => {
    simnet.callPublicFn("atmos", "register-dataset", [
      Cl.stringUtf8("Freezable Data"),
      Cl.stringUtf8("Data that will be frozen"),
      Cl.stringUtf8("freezable"),
      Cl.uint(1640995200),
      Cl.uint(0),
      Cl.uint(1000),
      Cl.int(20000000),
      Cl.int(-80000000),
      Cl.stringAscii("QmFreezableHash"),
      Cl.bool(false)
    ], wallet1);

    const { result } = simnet.callPublicFn("atmos", "freeze-dataset-metadata", [Cl.uint(1)], wallet1);
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
