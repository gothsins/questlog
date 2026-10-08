# 🎮 Questlog

Questlog is a full-stack game backlog and personal library application built with **Spring Boot, PostgreSQL, Redis, React and TypeScript**.

The project allows users to authenticate, manage their personal game library, track game status, ratings and played hours, while providing a foundation for future game discovery, external metadata integration, reviews and social features.

The main goal of Questlog is to serve as a production-oriented portfolio project focused on backend architecture, security, caching, observability and full-stack integration.

---

## ✨ Current Features

### Authentication

- User registration
- User login
- Password hashing with BCrypt
- JWT authentication
- Stateless Spring Security configuration
- Protected backend endpoints
- Protected frontend routes
- Automatic logout when an invalid or expired token is detected

### Game Catalog

- Create games
- List games
- Find games by ID
- Redis caching for game data
- Cache invalidation when catalog data changes

### Personal Library

Users can add games from the global catalog to their personal library and track:

- Game status
    - Backlog
    - Playing
    - Completed
    - Dropped
    - Wishlist
- Rating
- Played hours
- Creation and update timestamps

Supported operations:

- Add a game to the library
- List authenticated user's library
- Update a library entry
- Remove a library entry
- Prevent duplicate games in the same user's library
- Resource ownership protection

### API Protection

- JWT authentication
- Rate limiting with Bucket4j + Redis
- Database constraints for data integrity
- Validation with Jakarta Validation
- Standardized API error responses
- Conflict handling for database integrity violations

### Caching

Redis is currently used for:

- Individual game cache
- Game catalog cache
- Rate limiting state

Cache entries use JSON serialization and expiration policies.

### Observability

- Spring Boot Actuator
- Micrometer
- Prometheus-compatible metrics
- PostgreSQL health monitoring
- Redis health monitoring
- HTTP request metrics
- Custom Questlog domain metrics

Example custom metric:

```text
questlog.games.created
```

### API Documentation

OpenAPI documentation is generated with springdoc.

Swagger UI is available at:

```text
http://localhost:8080/swagger-ui.html
```

OpenAPI specification:

```text
http://localhost:8080/v3/api-docs
```

### Frontend

The frontend currently includes:

- React + TypeScript
- Vite development environment
- Login page
- Integration with the Spring Boot authentication API
- JWT session handling
- React Router
- Protected routes
- Authenticated application layout
- Navigation header
- Personal library page
- Responsive game cards
- Status badges
- Loading, empty and error states
- Fallback UI for unavailable game covers

---

## 🛠 Tech Stack

### Backend

- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA
- Spring Security
- JWT
- Hibernate
- Jakarta Validation
- PostgreSQL
- Flyway
- Redis
- Bucket4j
- Spring Boot Actuator
- Micrometer
- Prometheus Registry
- OpenAPI / Swagger
- Lombok
- JUnit 5
- Mockito
- Maven

### Frontend

- React
- TypeScript
- Vite
- React Router
- CSS

### Infrastructure

- Docker
- Docker Compose
- PostgreSQL 17
- Redis 7

---

## 🏗 Architecture

Questlog currently follows a layered backend architecture:

```text
HTTP Request
     ↓
Controller
     ↓
Service
     ↓
Repository
     ↓
PostgreSQL
```

Authentication follows:

```text
Client
  ↓
JWT
  ↓
JwtAuthenticationFilter
  ↓
Spring Security
  ↓
Controller
```

Redis participates in multiple parts of the application:

```text
Redis
├── Game caching
├── Catalog caching
└── Distributed rate limiting
```

The frontend communicates exclusively with the Questlog backend:

```text
React
  ↓
REST API
  ↓
Spring Boot
  ↓
Security / Business Logic
  ↓
PostgreSQL + Redis
```

---

## 🗃 Database

Database schema changes are managed exclusively through **Flyway migrations**.

Current migrations:

```text
V1__create_users_table.sql
V2__create_games_table.sql
V3__create_library_entries_table.sql
```

Applied migrations should not be edited.

Future schema changes must be introduced through new migration files.

Example:

```text
V4__add_external_game_id.sql
```

---

## 📁 Project Structure

```text
questlog/
│
├── backend/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/gothsins/questlog/
│   │   │   └── resources/
│   │   │       └── db/migration/
│   │   └── test/
│   │
│   ├── pom.xml
│   └── mvnw
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── types/
│   │
│   └── package.json
│
├── compose.yaml
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Running Locally

### Requirements

Make sure you have installed:

- Java 21
- Docker
- Docker Compose
- Node.js
- npm

---

## 1. Clone the repository

```bash
git clone https://github.com/gothsins/questlog.git
cd questlog
```

---

## 2. Configure environment variables

The repository contains:

```text
.env.example
```

Example configuration:

```env
POSTGRES_DB=questlog
POSTGRES_USER=questlog
POSTGRES_PASSWORD=questlog
POSTGRES_PORT=5432

# Must contain a Base64-encoded secret with at least 32 random bytes
JWT_SECRET=YOUR_BASE64_ENCODED_SECRET_HERE

JWT_EXPIRATION=3600000
```

Do not commit real secrets.

### Generate a JWT secret

PowerShell:

```powershell
$bytes = New-Object byte[] 32
[System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Linux / macOS:

```bash
openssl rand -base64 32
```

The generated value should be provided to the backend through an environment variable or IDE Run Configuration.

Example PowerShell session:

```powershell
$env:JWT_SECRET="YOUR_GENERATED_SECRET"
```

---

## 3. Start PostgreSQL and Redis

From the project root:

```bash
docker compose up -d
```

Check the containers:

```bash
docker compose ps
```

Expected services:

```text
questlog-postgres
questlog-redis
```

PostgreSQL data is persisted through a Docker volume.

Redis currently stores cache and temporary rate-limiting state.

---

## 4. Start the backend

Enter the backend directory:

```bash
cd backend
```

Linux / macOS:

```bash
./mvnw spring-boot:run
```

Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

You can also configure `JWT_SECRET` inside the IntelliJ IDEA Run Configuration and start the application normally through the IDE.

---

## 5. Configure the frontend

Inside:

```text
frontend/
```

create:

```text
.env
```

with:

```env
VITE_API_URL=http://localhost:8080
```

Frontend environment variables exposed to Vite must use the `VITE_` prefix.

---

## 6. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs by default at:

```text
http://localhost:5173
```

The backend CORS configuration allows requests from this development origin.

---

## 🧪 Running Tests

### Backend

From `backend/`:

Windows:

```powershell
.\mvnw.cmd clean test
```

Linux / macOS:

```bash
./mvnw clean test
```

### Frontend production build

From `frontend/`:

```bash
npm run build
```

---

## 🔗 Main API Endpoints

### Authentication

```text
POST /api/auth/register
POST /api/auth/login
```

### Games

```text
POST /api/games
GET  /api/games
GET  /api/games/{id}
```

### Library

```text
POST   /api/library
GET    /api/library
PATCH  /api/library/{id}
DELETE /api/library/{id}
```

### Observability

```text
GET /actuator/health
GET /actuator/info
GET /actuator/metrics
GET /actuator/prometheus
```

---

## 🔐 Security

Questlog currently uses:

- BCrypt password hashing
- JWT authentication
- Stateless sessions
- Protected API endpoints
- Resource ownership validation
- Rate limiting
- CORS configuration
- Input validation
- Database constraints
- Generic internal error responses

JWT secrets and other sensitive credentials must never be committed to the repository.

The current frontend uses session storage during development for the JWT access token.

A future authentication hardening milestone will evaluate:

- Short-lived access tokens
- Refresh tokens
- HttpOnly cookies
- Secure cookies
- SameSite policies
- Token rotation
- Logout / revocation strategy
- CSRF and XSS protections

---

## ⚡ Rate Limiting

Authentication endpoints are protected with **Bucket4j + Redis**.

Conceptually:

```text
Request
   ↓
Bucket4j
   ↓
Token available?
  ↙       ↘
yes       no
 ↓         ↓
continue   429 Too Many Requests
```

Redis stores distributed bucket state.

---

## 📊 Observability

Actuator and Micrometer provide application metrics including:

```text
http.server.requests
jvm.memory.used
jvm.threads.live
process.cpu.usage
system.cpu.usage
```

Questlog also exposes domain-specific metrics such as:

```text
questlog.games.created
```

Prometheus-compatible metrics are exposed through:

```text
/actuator/prometheus
```

---

## 🧭 Roadmap

### Game Discovery

- Game catalog frontend
- Search
- Pagination
- Sorting and filtering

### External Game Data

Planned integration with **IGDB** for:

- Real game covers
- Release dates
- Genres
- Descriptions
- External identifiers
- Game metadata

The integration will be performed through the backend so external API credentials are never exposed to the browser.

Redis may be used to cache external searches and metadata.

### Library Improvements

- Update game status through the frontend
- Update played hours
- Update personal ratings
- Better filtering
- Sorting
- Pagination

### Security Improvements

- User roles
- Restricted global catalog management
- Improved authentication lifecycle
- Refresh tokens
- HttpOnly cookies

### Social Features

Long-term plans include a game-focused social experience inspired by media diary platforms:

- Public user profiles
- Game reviews
- Community ratings
- Favorite games
- Likes
- Activity feeds
- Following users
- Review spoiler marking

### Architecture and Infrastructure

- Integration tests
- Testcontainers
- CI/CD
- GitHub Actions
- Production Docker configuration
- Deployment
- Additional metrics
- Messaging / asynchronous processing where appropriate

---

## 🎯 Project Goals

Questlog is designed to demonstrate practical experience with:

- REST API design
- Java and Spring Boot
- Authentication and authorization
- Relational database modeling
- Database migrations
- Data validation
- Error handling
- Caching
- Rate limiting
- Observability
- API documentation
- Testing
- Docker
- React
- TypeScript
- Full-stack communication
- Software architecture and incremental development

The project intentionally evolves in milestones, with new technologies introduced when they solve a concrete problem rather than simply increasing the technology count.

---

## 👨‍💻 Author

Developed by **gothsins**

GitHub:

```text
https://github.com/gothsins
```

---

## 📌 Project Status

Questlog is currently under active development.

Current focus:

```text
Backend hardening
→ Frontend foundations
→ Game catalog
→ IGDB integration
→ Library interactions
→ Social features
```