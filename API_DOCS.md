# API Documentation

## Base URL

`/api/v1` (Assuming this is the prefix, based on typical express apps, but router.js shows sub-routes. Let's assume the main app file mounts `router` at `/api/v1` or similar. I'll verify main app file later or just document relative paths from router mount point).

## Authentication (`/auth`)

| Method | Endpoint                   | Description                   | Auth Required |
| :----- | :------------------------- | :---------------------------- | :------------ |
| POST   | `/create-account/otp`      | Send OTP for account creation | No            |
| POST   | `/create-account/verify`   | Verify OTP and create account | No            |
| POST   | `/login`                   | User login                    | No            |
| POST   | `/refresh`                 | Refresh access token          | No            |
| GET    | `/profile/:id`             | Get user profile              | Yes           |
| PATCH  | `/profile`                 | Update user profile           | Yes           |
| POST   | `/logout`                  | Logout user                   | Yes           |
| POST   | `/password-reset/otp`      | Send OTP for password reset   | No            |
| POST   | `/password-reset/verify`   | Verify password reset OTP     | No            |
| PUT    | `/password-reset/complete` | Set new password              | No            |
| POST   | `/email-reset/otp`         | Send OTP for email update     | Yes           |
| PUT    | `/email-reset/complete`    | Verify OTP and update email   | Yes           |

## Posts (`/post`)

| Method | Endpoint        | Description                   | Auth Required |
| :----- | :-------------- | :---------------------------- | :------------ |
| POST   | `/`             | Create a new post             | Yes           |
| GET    | `/`             | Get all posts (paginated)     | Yes           |
| GET    | `/:slug`        | Get a single post by slug     | Yes           |
| DELETE | `/:id`          | Delete a post                 | Yes           |
| PATCH  | `/:id`          | Edit a post                   | Yes           |
| POST   | `/reaction/:id` | React to a post (like/unlike) | Yes           |

## Comments (`/comment`)

| Method | Endpoint        | Description                                                            | Auth Required |
| :----- | :-------------- | :--------------------------------------------------------------------- | :------------ |
| POST   | `/:id`          | Add a comment to a post (`:id` = Post ID)                              | Yes           |
| GET    | `/:id`          | Get comments for a post (`:id` = Post ID)                              | Yes           |
| DELETE | `/:id`          | Delete a comment (`:id` = Post ID, body contains `commentId`)          | Yes           |
| PATCH  | `/:id`          | Edit a comment (`:id` = Post ID, body contains `commentId`, `content`) | Yes           |
| POST   | `/reaction/:id` | React to a comment (`:id` = Comment ID)                                | Yes           |

## Notifications (`/notification`)

| Method | Endpoint     | Description               | Auth Required |
| :----- | :----------- | :------------------------ | :------------ |
| GET    | `/`          | Get user notifications    | Yes           |
| POST   | `/read/:id`  | Mark notification as read | Yes           |
| DELETE | `/clear-all` | Clear all notifications   | Yes           |

## Search (`/search`)

| Method | Endpoint | Description                                   | Auth Required |
| :----- | :------- | :-------------------------------------------- | :------------ |
| GET    | `/`      | Search posts and users (query param: `query`) | Yes           |
