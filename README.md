# 🚀 NestJS PostgreSQL & GraphQL Mastery Playground

A full-featured NestJS application built for hands-on learning and testing of **PostgreSQL** and **GraphQL**.

This project reuses your existing Docker PostgreSQL container (`scheduler_postgres` on port `5433` with shared volume `postgres_data`) so it does **not** duplicate disk space or memory overhead.

---

## 🛠️ Features Included

1. **PostgreSQL Relational Concepts**:
   - **1-to-1**: `User` ↔ `Profile` (with `ON DELETE CASCADE`)
   - **1-to-Many**: `User` → `Post`, `Post` → `Comment`
   - **Many-to-Many**: `Post` ↔ `Category`, `Post` ↔ `Tag`
   - **Tree / Self-Referential**: `Comment` → `parentComment` (Threaded replies)
   - **Indexing**: B-Tree indexes, composite indexes (`published, createdAt`), unique indexes (`email`, `slug`)
   - **ACID Transactions**: Atomic creation using TypeORM `QueryRunner` (`BEGIN...COMMIT`)
   - **Raw SQL & Aggregations**: `LEFT JOIN`, `GROUP BY`, `COUNT`, `SUM`, and PostgreSQL stats from `pg_stat_user_tables`
   - **EXPLAIN ANALYZE**: Resolver to analyze SQL query plans and index scans

2. **GraphQL Features**:
   - NestJS **Code-First** GraphQL approach
   - **Queries**: Offset pagination, filtering, fuzzy search, sorting
   - **Mutations**: Nested input types, bulk operations, auto-generated slugs
   - **DataLoader**: Solves N+1 query problem by batching & caching SQL queries per request tick
   - **Subscriptions**: Real-time WebSockets notifications (`postCreated`, `commentAdded`)
   - **Validation**: Strict DTO validation with `class-validator`

---

## 💻 Quick Setup

### 1. Environment & Docker
The project comes preconfigured to connect to your existing PostgreSQL container:

```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5433
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nestjs_graphql_db
```

To start the database container (if not already running):
```bash
docker compose up -d
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start NestJS Application (Auto-starts Docker Container)
```bash
npm run start:dev
```
*`npm run start`, `npm run start:dev`, and `npm run start:debug` automatically execute `docker compose up -d` beforehand so you never have to remember to start Docker manually!*

### 4. Seed Database
Populate the database with rich sample users, posts, categories, tags, and threaded comments:
```bash
npm run seed
```

Open your browser at **[http://localhost:3000/graphql](http://localhost:3000/graphql)** to launch Apollo Playground.

---

## 📖 Comprehensive Learning Documentation & Interview Guides

1. **[POSTGRES_INTERVIEW_MASTERY_GUIDE.md](POSTGRES_INTERVIEW_MASTERY_GUIDE.md)**: Exhaustive interview & system design manual covering Postgres process architecture, 8KB page layout, MVCC, WAL, Isolation Levels, Vacuum bloat, Index types (B-Tree, GIN, BRIN), Partitioning, Replication, PgBouncer, and senior interview Q&A.
2. **[POSTGRES_GRAPHQL_MASTERY_DOCS.md](POSTGRES_GRAPHQL_MASTERY_DOCS.md)**: Hands-on lab textbook covering GraphQL Code-First paradigm, DataLoader N+1 benchmarks, raw SQL aggregations (`GROUP BY`, `LEFT JOIN`), `EXPLAIN ANALYZE`, and step-by-step practice exercises!
3. **[GRAPHQL_POSTGRES_GUIDE.md](GRAPHQL_POSTGRES_GUIDE.md)**: Copy-pasteable query and mutation cheat sheet.

