import request from "supertest";
import { app } from "../server.js";
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
      .get("/api/post/")
      .set("Authorization", token)
      .set("Cookie", [refreshTokenCookie]);
    expect(response.status).toBe(200);
    expect(response.body.response.data).toBeDefined();
  });
});




























// import request from "supertest";
// import app from "../server.js";
// import { createUser } from "../users.js";

// describe("Auth API tests", () => {

//   beforeEach(async () => {
//     // reset fake DB
//     // users array is imported in users.js
//     // so easiest hack for now:
//     const { users } = await import("../users.js");
//     users.length = 0;
//   });

//   test("User can register", async () => {
//     const res = await request(app)
//       .post("/register")
//       .send({ email: "test@example.com", password: "123456" });

//     expect(res.status).toBe(201);
//     expect(res.body.message).toBe("User registered");
//   });

//   test("User can login and receive token", async () => {
//     await createUser("test@example.com", "123456");

//     const res = await request(app)
//       .post("/login")
//       .send({ email: "test@example.com", password: "123456" });

//     expect(res.status).toBe(200);
//     expect(res.body.token).toBeDefined();
//     expect(typeof res.body.token).toBe("string");
//   });

//   test("Reject invalid credentials", async () => {
//     await createUser("test@example.com", "123456");

//     const res = await request(app)
//       .post("/login")
//       .send({ email: "test@example.com", password: "wrongpass" });

//     expect(res.status).toBe(401);
//     expect(res.body.error).toBe("Invalid credentials");
//   });

//   test("Reject login for non-existing user", async () => {
//     const res = await request(app)
//       .post("/login")
//       .send({ email: "ghost@example.com", password: "lol" });

//     expect(res.status).toBe(401);
//   });

// });
