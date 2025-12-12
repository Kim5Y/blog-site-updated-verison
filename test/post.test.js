import request from "supertest";
import { app } from "../serverTest.js";
import pool from "../config/db.config.js";
import { v4 as uuidv4 } from "uuid";

let token;
let refreshTokenCookie;
let userId;
let postId;
let postSlug;
let commentId;
const nonExistentId = uuidv4();

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

  const payload = JSON.parse(
    Buffer.from(token.split(".")[1], "base64").toString()
  );
  userId = payload.id;

  // Clean up previous test data
  await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);
  await pool.query(`DELETE FROM posts WHERE user_id = $1`, [userId]);
});

afterAll(async () => {
  // Clean up created test data
  if (userId) {
    await pool.query(`DELETE FROM comments WHERE user_id = $1`, [userId]);
    await pool.query(`DELETE FROM posts WHERE user_id = $1`, [userId]);
  }
  await pool.end();
});

describe("Post and Comment API", () => {
  describe("Post Endpoints", () => {
    test("should not create a post without authentication", async () => {
      const response = await request(app).post("/api/post").send({
        title: "Unauthorized Post",
        content: "This should not be created.",
        category: "tech",
      });
      expect(response.status).toBe(401);
    });

    test("should not create a post with invalid data (missing title)", async () => {
      const response = await request(app).post("/api/post").set("Authorization", `Bearer ${token}`).set("Cookie", [refreshTokenCookie]).send({ content: "This post has no title.", category: "tech" });
      expect(response.status).toBe(422);
    });

    test("should create a new post", async () => {
      const response = await request(app)
        .post("/api/post")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({
          title: "My Test Post from Supertest",
          content: "This is the content of the test post.",
          category: "tech",
        });

      expect(response.status).toBe(201);
      expect(response.body.response.data.newPost.title).toBe(
        "My Test Post from Supertest"
      );
      postId = response.body.response.data.newPost.id;
      postSlug = response.body.response.data.newPost.slug;
    });

    test("should fetch all posts", async () => {
      const response = await request(app)
        .get("/api/post")
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.response.data)).toBe(true);
    });

    test("should fetch a single post by slug", async () => {
      const response = await request(app)
        .get(`/api/post/${postSlug}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.response.data.id).toBe(postId);
    });

    test("should return 404 for a non-existent post slug", async () => {
      const response = await request(app)
        .get(`/api/post/non-existent-slug`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(404);
    });

    test("should update a post", async () => {
      const updatedTitle = "My Updated Test Post";
      const response = await request(app)
        .patch(`/api/post/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ title: updatedTitle, content: "The content has been updated.", category: "tech" });

      expect(response.status).toBe(200);
      expect(response.body.response.data.updatedPost.title).toBe(updatedTitle);
    });

    test("should add a reaction to a post", async () => {
      const response = await request(app)
        .post(`/api/post/reaction/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ reaction: "👍" });

      expect(response.status).toBe(200);
      expect(response.body.response.message).toBe("reaction added successfully");
    });

    test("should delete a post", async () => {
      const response = await request(app)
        .delete(`/api/post/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);
      expect(response.status).toBe(200);
    });
  });

  describe("Comment Endpoints", () => {
    test("should create a new comment on a post", async () => {
      const response = await request(app)
        .post(`/api/comment/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ content: "This is a test comment." });

      expect(response.status).toBe(201);
      expect(response.body.response.data.newComment.content).toBe(
        "This is a test comment."
      );
      commentId = response.body.response.data.newComment.id;
    });

    test("should not create a comment on a non-existent post", async () => {
      const response = await request(app)
        .post(`/api/comment/${nonExistentId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ content: "This should fail." });
      expect(response.status).toBe(404);
    });

    test("should fetch comments for a post", async () => {
      const response = await request(app)
        .get(`/api/comment/${postId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);

      expect(response.status).toBe(200);
      expect(response.body.response.success).toBe(true);
      expect(response.body.response.data.length).toBeGreaterThan(0);
    });

    test("should update a comment", async () => {
      const updatedContent = "This is an updated comment.";
      const response = await request(app)
        .patch(`/api/comment/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie])
        .send({ content: updatedContent });

      expect(response.status).toBe(200);
      expect(response.body.response.data.updatedComment.content).toBe(updatedContent);
    });

    test("should delete a comment", async () => {
      const response = await request(app)
        .delete(`/api/comment/${commentId}`)
        .set("Authorization", `Bearer ${token}`)
        .set("Cookie", [refreshTokenCookie]);
      expect(response.status).toBe(200);
    });
  });
});
