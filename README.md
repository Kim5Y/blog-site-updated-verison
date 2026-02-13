# Blog Site Backend

This is a robust backend for a blog application, built with Node.js, Express, PostgreSQL, and Redis. It features a layered architecture separating concerns into controllers, services, and models.

## Features

- **Authentication**: Secure user authentication using JWT (Access & Refresh Tokens), email-based OTP verification, and password reset.
- **User Management**: User profile management (update username, bio, age, profile image), secure password updates.
- **Posts**: Create, read (paginated), update, and delete posts. Supports rich text content, categories, and image URLs.
- **Comments**: Threaded comments (nested replies) on posts.
- **Search**: Full-text search for posts and users using PostgreSQL's text search capabilities.
- **Real-time Updates**: Socket.io integration for real-time notifications on new posts, comments, replies, and reactions.
- **Notifications**: System notifications for interactions (likes, comments, replies).
- **Caching**: Redis caching for optimized performance on read-heavy operations (e.g., fetching posts).

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Caching**: Redis
- **Real-time**: Socket.io
- **Authentication**: JSON Web Tokens (JWT), Bcrypt
- **Email**: Nodemailer (via `sendCode` utility)

## Setup

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- Redis

### Installation

1.  Clone the repository:

    ```bash
    git clone <repository-url>
    cd blog-site-updated-verison
    ```

2.  Install dependencies:

    ```bash
    npm install
    ```

3.  Environment Variables:
    Create a `.env` file in the root directory and configure the following:
    ```env
    PORT=3000
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_HOST=localhost
    DB_PORT=5432
    DB_NAME=your_db_name
    REFRESH_TOKEN_SECRET=your_jwt_secret
    EMAIL=your_email_service_user
    PASSWORD=your_email_service_password
    # Add other necessary variables
    ```

### Database Setup

Ensure your PostgreSQL database is running and the schema is set up. You may need to run migration scripts (if available) or create tables manually matching the models.

### Running the Application

- Development mode with hot-reload:

  ```bash
  npm run start:dev
  ```

- Production start:
  ```bash
  npm start:prod
  ```

## API Documentation

See [API_DOCS.md](./API_DOCS.md) for detailed endpoint information.

You can also view the [Postman Documentation](https://documenter.getpostman.com/view/45206479/2sBXcBnMsA).

## Wrapper Documentation (Socket.IO)

The application uses Socket.IO for real-time updates.

### Connection

```javascript
const socket = io("http://localhost:8080", {
  auth: {
    token: "YOUR_JWT_TOKEN",
  },
});
```

### Events

#### Client -> Server (Emitters)

| Event           | Payload                | Description                                  |
| :-------------- | :--------------------- | :------------------------------------------- |
| `join:post`     | `{ postId }`           | Join a room for a specific post.             |
| `leave:post`    | `{ postId }`           | Leave a post room.                           |
| `join:comment`  | `{ postId }`           | Join room for top-level comments of a post.  |
| `leave:comment` | `{ postId }`           | Leave top-level comments room.               |
| `join:reply`    | `{ postId, parentId }` | Join room for replies to a specific comment. |
| `leave:reply`   | `{ postId, parentId }` | Leave replies room.                          |

#### Server -> Client (Listeners)

**Posts**

- `post:new`: Receives new post data.
- `post:updated`: Receives updated post data.
- `post:deleted`: Receives deleted post ID/data.
- `post:reactionLike`: Receives like reaction data.
- `post:reactionDislike`: Receives dislike reaction data.

**Comments**

- `comment:new`: Receives new comment data.
- `comment:updated`: Receives updated comment data.
- `comment:deleted`: Receives deleted comment data.
- `comment:reactionLike`: Receives like reaction on comment.
- `comment:reactionDislike`: Receives dislike reaction on comment.

**Replies**

- `reply:new`: Receives new reply data.
- `reply:updated`: Receives updated reply data.
- `reply:deleted`: Receives deleted reply data.

**Notifications**

- `notification`: Receives user-specific notifications.

**Errors**

- `tokenExpired`: specific error event.
- `unauthorized`: specific error event.

## Project Structure

- `controllers/`: Handles incoming HTTP requests and responses.
- `services/`: Encapsulates business logic.
- `models/`: Database interactions (legacy, moving to services/repositories).
- `routes/`: API route definitions.
- `utils/`: Utility functions (Error handling, Responses, etc.).
- `config/`: Configuration files (Database, Redis, etc.).
