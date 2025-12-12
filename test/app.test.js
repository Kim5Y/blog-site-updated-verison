import request from "supertest";
import { app } from "../serverTest.js";
let token;
let refreshTokenCookie;

beforeAll(async () => {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email: "kima10@gmail.com", password: "anothernewPassword!1" });
  expect(response.status).toBe(200);
  expect(response.body.response.data.token).toBeDefined();
  expect(typeof response.body.response.data.token).toBe("string");
  refreshTokenCookie = response.headers["set-cookie"].find((c) =>
    c.startsWith("refresh_token=")
  );
  token = response.body.response.data.token;
});

describe("testing login edpoint", () => {
  test("get porducts", async () => {
    const response = await request(app)
      .get("/api/post")
      .set("Authorization", token)
      .set("Cookie", [refreshTokenCookie]);
    expect(response.status).toBe(200);
    expect(response.body.response.data).toBeDefined();
  });
});

//documentation with swgger