import request from "supertest";
import { app } from "../serverTest.js"; // Using serverTest.js
import pool from "../config/db.config.js";

let token;
let refreshTokenCookie;
let userId;

beforeAll(async () => {
  // Log in to get a token
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "kima10@gmail.com", password: "anothernewPassword!1" });

  expect(response.status).toBe(200);
  token = response.body.response.data.token;
  refreshTokenCookie = response.headers["set-cookie"].find((c) =>
    c.startsWith("refresh_token=")
  );

  // Get user ID from token payload (assuming it's there)
  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  userId = payload.id;

  // Clean up any previous notifications for this user to ensure a clean slate
  await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
});

afterAll(async () => {
  // Clean up created notifications
  if (userId) {
    await pool.query(`DELETE FROM notifications WHERE user_id = $1`, [userId]);
  }
  await pool.end();
});

describe("Notification API", () => {
  let notificationId;

  test("should not fetch notifications without authentication", async () => {
    const response = await request(app).get("/api/notification/");
    expect(response.status).toBe(401);
  });

  test("should fetch zero notifications for a user who has none", async () => {
    const response = await request(app)
      .get("/api/notification/")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", [refreshTokenCookie]);

    expect(response.status).toBe(200);
    expect(response.body.response.data.notifications).toHaveLength(0);
    expect(response.body.response.meta.total).toBe("0");
  });

  test("should fetch notifications for an authenticated user", async () => {
    // First, create a notification to fetch
    const insertRes = await pool.query(
      `INSERT INTO notifications (user_id, message) VALUES ($1, 'You have a new like!') RETURNING id`,
      [userId]
    );
    notificationId = insertRes.rows[0].id;

    const response = await request(app)
      .get("/api/notification/")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", [refreshTokenCookie]);

    expect(response.status).toBe(200);
    expect(response.body.response.data.notifications.length).toBeGreaterThan(0);
    expect(response.body.response.data.notifications[0].message).toBe(
      "You have a new like!"
    );
    expect(response.body.response.data.notifications[0].is_read).toBe(false);
  });

  test("should mark a notification as read", async () => {
    const response = await request(app)
      .post(`/api/notification/read/${notificationId}`)
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", [refreshTokenCookie]);

    expect(response.status).toBe(200);
    expect(response.body.response.message).toBe(
      "notificaitons updated successfully"
    );
  });

  test("should clear all notifications for a user", async () => {
    const response = await request(app)
      .delete("/api/notification/clear-all")
      .set("Authorization", `Bearer ${token}`)
      .set("Cookie", [refreshTokenCookie]);

    expect(response.status).toBe(200);
    expect(response.body.response.message).toBe(
      "notifications cleared successfully"
    );
  });
});
