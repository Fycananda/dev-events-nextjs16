import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

const connectMock = vi.fn();
const dbMock = vi.fn();
const ensureEventIndexesMock = vi.fn();
const ensureBookingIndexesMock = vi.fn();

vi.mock("mongodb", () => {
  return {
    MongoClient: vi.fn().mockImplementation((uri: string) => ({
      connect: connectMock,
      db: dbMock,
      __uri: uri,
    })),
  };
});

vi.mock("@/repository/events", () => ({
  ensureEventIndexes: ensureEventIndexesMock,
}));

vi.mock("@/repository/bookings", () => ({
  ensureBookingIndexes: ensureBookingIndexesMock,
}));

function clearGlobalCache() {
  delete (globalThis as { _mongoCache?: unknown })._mongoCache;
}

describe("lib/mongodb", () => {
  beforeEach(() => {
    vi.resetModules();
    connectMock.mockReset().mockResolvedValue(undefined);
    dbMock.mockReset().mockReturnValue({ __fakeDb: true });
    ensureEventIndexesMock.mockReset().mockResolvedValue(undefined);
    ensureBookingIndexesMock.mockReset().mockResolvedValue(undefined);
    process.env = { ...ORIGINAL_ENV };
    clearGlobalCache();
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
    clearGlobalCache();
  });

  it("throws if MONGODB_URI is not defined", async () => {
    delete process.env.MONGODB_URI;
    process.env.MONGODB_DB = "testdb";

    await expect(import("@/lib/mongodb")).rejects.toThrow(
      "Please define MONGODB_URI in .env.local",
    );
  });

  it("throws if MONGODB_DB is not defined", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017";
    delete process.env.MONGODB_DB;

    await expect(import("@/lib/mongodb")).rejects.toThrow(
      "Please define MONGODB_DB in .env.local",
    );
  });

  it("connects, ensures indexes, and returns the database", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017";
    process.env.MONGODB_DB = "testdb";

    const { getDb } = await import("@/lib/mongodb");
    const { MongoClient } = await import("mongodb");

    const db = await getDb();

    expect(MongoClient).toHaveBeenCalledWith("mongodb://localhost:27017");
    expect(connectMock).toHaveBeenCalledTimes(1);
    expect(dbMock).toHaveBeenCalledWith("testdb");
    expect(ensureEventIndexesMock).toHaveBeenCalledTimes(1);
    expect(ensureBookingIndexesMock).toHaveBeenCalledTimes(1);
    expect(db).toEqual({ __fakeDb: true });
  });

  it("returns the cached db on subsequent calls without reconnecting", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017";
    process.env.MONGODB_DB = "testdb";

    const { getDb } = await import("@/lib/mongodb");

    const first = await getDb();
    const second = await getDb();

    expect(first).toBe(second);
    expect(connectMock).toHaveBeenCalledTimes(1);

    const { MongoClient } = await import("mongodb");
    expect(MongoClient).toHaveBeenCalledTimes(1);
  });

  it("only opens a single connection when getDb is called concurrently", async () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017";
    process.env.MONGODB_DB = "testdb";

    const { getDb } = await import("@/lib/mongodb");

    const [first, second] = await Promise.all([getDb(), getDb()]);

    expect(first).toBe(second);
    expect(connectMock).toHaveBeenCalledTimes(1);

    const { MongoClient } = await import("mongodb");
    expect(MongoClient).toHaveBeenCalledTimes(1);
  });
});