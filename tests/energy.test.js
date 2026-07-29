const request = require("supertest");
const app = require("../app"); // your Express app entry point
const EnergyLog = require("../models/EnergyLog");

describe("Energy Battery endpoints", () => {
  it("creates a new energy log entry", async () => {
    const res = await request(app)
      .post("/api/energy")
      .send({ level: 7, note: "feeling okay" });

    expect(res.statusCode).toBe(201);
    expect(res.body.level).toBe(7);
  });

  it("rejects an invalid energy level", async () => {
    const res = await request(app).post("/api/energy").send({ level: 999 });

    expect(res.statusCode).toBe(400);
  });

  it("fetches historical energy data for heatmap", async () => {
    await EnergyLog.create({ level: 5, date: new Date() });
    const res = await request(app).get("/api/energy/history");

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});
