import request from "supertest";
import { app } from "../serverTest.js";
import pool from "../config/db.config.js";

let token;
let refreshTokenCookie;
let userId;

describe("Auth API", () => {
  // We will use a new user for auth tests to avoid conflicts
  const testUser = {
    email: `testuser_${Date.now()}@example.com`,
    password: "aValidPassword!1",
    username: `testuser_${Date.now()}`,
    categories: ["tech", "sports"],
  };
  let otpCode; // This would be retrieved from email in a real scenario

  afterAll(async () => {
    // Clean up the created user
    if (testUser.email) {
      await pool.query(`DELETE FROM users WHERE email = $1`, [testUser.email]);
    }
    await pool.end();
  });

  // This is a mock for getting the OTP. In a real test suite, you might mock the email service.
  // For now, we can't get the real OTP, so we will skip the verification part.
  // You would need to adjust this to fit how you can retrieve the OTP in your test environment.
  test.skip("should send an OTP for account creation", async () => {
    const response = await request(app)
      .post("/api/auth/create-account/otp")
      .send(testUser);
    expect(response.status).toBe(200);
    expect(response.body.response.message).toContain(
      "OTP code successfully sent"
    );
    // In a real test, you'd get the OTP here to use in the next step.
  });

  test.skip("should fail to verify OTP with wrong code", async () => {
    const response = await request(app)
      .post("/api/auth/create-account/verify")
      .send({ email: testUser.email, otpCode: "000000" }); // Assuming this is wrong
    expect(response.status).toBe(400);
  });

  describe("Endpoints requiring login", () => {
    beforeAll(async () => {
      // Log in with an existing user to get a token for other tests
      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({ email: "kima10@gmail.com", password: "anothernewPassword!1" });

      expect(loginResponse.status).toBe(200);
      token = loginResponse.body.response.data.token;
      refreshTokenCookie = loginResponse.headers["set-cookie"].find((c) =>
        c.startsWith("refresh_token=")
      );
      const payload = JSON.parse(
        Buffer.from(token.split(".")[1], "base64").toString()
      );
      userId = payload.id;
    });

    test("should login an existing user", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "kima10@gmail.com", password: "anothernewPassword!1" });

      expect(response.status).toBe(200);
      expect(response.body.response.data.token).toBeDefined();
    });

    test("should fail to login with wrong password", async () => {
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: "kima10@gmail.com", password: "wrongPassword!1" });

      expect(response.status).toBe(400);
      expect(response.body.response.message).toBe("incorrect password");
    });

    test("should fetch a user profile", async () => {
      const response = await request(app)
        .get(`/api/auth/profile/${userId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.response.data.userInfo.id).toBe(userId);
    });

    test("should update a user profile", async () => {
      const newUsername = `updated_user_${Date.now()}`;
      const response = await request(app)
        .patch("/api/auth/profile")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ username: newUsername });

      expect(response.status).toBe(200);
      expect(response.body.response.data.username).toBe(newUsername);
    });

    test("should refresh the access token", async () => {
      const response = await request(app)
        .post("/api/auth/refresh")
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.response.data.token).toBeDefined();
    });

    test("should logout a user", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.response.message).toBe("logged out successfully");
    });
  });
});
