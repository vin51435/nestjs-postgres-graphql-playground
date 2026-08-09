# 🎓 Complete PostgreSQL & GraphQL Mastery Manual & Practice Guide

This document is your comprehensive textbook, practice workbook, and hands-on lab manual for mastering **PostgreSQL** and **GraphQL** using this NestJS codebase.

---

## 📋 Table of Contents
1. [Core Learning Roadmap & Mental Models](#1-core-learning-roadmap--mental-models)
   - [PostgreSQL Architecture & Relational Concepts](#postgresql-architecture--relational-concepts)
   - [GraphQL Code-First Paradigm & Lifecycle](#graphql-code-first-paradigm--lifecycle)
   - [The N+1 Query Problem & DataLoader Solution](#the-n1-query-problem--dataloader-solution)
2. [Complete Hands-on Query & Mutation Workbook](#2-complete-hands-on-query--mutation-workbook)
   - [Module 1: Queries & Advanced Filtering](#module-1-queries--advanced-filtering)
   - [Module 2: N+1 DataLoader Benchmark Lab](#module-2-n1-dataloader-benchmark-lab)
   - [Module 3: Mutations & ACID Database Transactions](#module-3-mutations--acid-database-transactions)
   - [Module 4: PostgreSQL Raw SQL, Aggregations & EXPLAIN ANALYZE](#module-4-postgresql-raw-sql-aggregations--explain-analyze)
   - [Module 5: Real-time WebSockets Subscriptions](#module-5-real-time-websockets-subscriptions)
3. [PostgreSQL Performance & Indexing Deep Dive](#3-postgresql-performance--indexing-deep-dive)
4. [Step-by-Step Practice Exercises](#4-step-by-step-practice-exercises)

---

# 1. Core Learning Roadmap & Mental Models

## PostgreSQL Architecture & Relational Concepts

PostgreSQL is an advanced, enterprise-grade Object-Relational Database Management System (ORDBMS) offering strict ACID guarantees.

### Key Concepts Implemented in this Project:
1. **Primary & Foreign Key Constraints**:
   - **UUID Primary Keys**: Universally Unique Identifiers (v4) prevent key enumeration attacks and allow client-side key generation before insertion.
   - **Foreign Keys & Cascading Actions**:
     - `ON DELETE CASCADE`: Deleting a `User` automatically deletes their `Profile` and `Posts`. Deleting a `Post` automatically deletes all its `Comments`.
     - `ON DELETE SET NULL`: Ensures referential integrity without orphan records.
2. **Relational Models Implemented**:
   - **One-to-One (1:1)**: `User` ↔ `Profile` (One user has exactly one profile; `userId` is marked `UNIQUE`).
   - **One-to-Many (1:N)**: `User` → `Post` and `Post` → `Comment`.
   - **Many-to-Many (M:N)**: `Post` ↔ `Category` and `Post` ↔ `Tag` (Junction tables `posts_categories` & `posts_tags`).
   - **Self-Referential Tree (1:N)**: `Comment` → `parentComment` (Threaded comments where comments can reply to other comments).
3. **ACID Transactions**:
   - **Atomicity**: All operations in a transaction succeed together or fail together.
   - **Consistency**: Database transitions from one valid state to another.
   - **Isolation**: Concurrent transactions do not interfere with each other.
   - **Durability**: Committed data survives system crashes via Write-Ahead Logging (WAL).

---

## GraphQL Code-First Paradigm & Lifecycle

GraphQL is a strongly typed query language for your API. Unlike REST, where endpoints return fixed data structures, GraphQL allows clients to specify the exact shape of the response.

### NestJS Code-First Architecture:
- `@ObjectType()`: Defines a GraphQL Output Type corresponding to database entities.
- `@InputType()`: Defines structured payload arguments passed into Mutations/Queries.
- `@Resolver()`: Handles data fetching logic for queries, mutations, subscriptions, and field resolvers.
- `@Query()`: Read operations (analogous to `GET` in REST).
- `@Mutation()`: Write operations (analogous to `POST`, `PUT`, `DELETE` in REST).
- `@Subscription()`: Real-time event streams over persistent WebSockets connections.

---

## The N+1 Query Problem & DataLoader Solution

### What is the N+1 Query Problem?
Imagine fetching 10 posts. For each post, GraphQL executes the `@ResolveField()` to fetch the author.
- **1 Query** to fetch 10 posts.
- **10 Queries** to fetch the author for each post (`SELECT * FROM users WHERE id = ...`).
- **Total**: 1 + 10 = **11 SQL queries** executed! Under heavy traffic, this destroys database performance.

### How DataLoader Solves It:
DataLoader collects all keys requested during a single event loop tick, deduplicates them, and batches them into a **single** SQL query:
```sql
SELECT * FROM users WHERE id IN ('uuid-1', 'uuid-2', 'uuid-3');
```
Result: **2 SQL queries total**, regardless of whether you fetch 10, 100, or 1,000 posts!

---

# 2. Complete Hands-on Query & Mutation Workbook

Launch the Apollo Sandbox at **`http://localhost:3000/graphql`** and execute the queries below!

---

## Module 1: Queries & Advanced Filtering

### Query 1: Fetch All Users with Nested Relations
Fetch users, their profiles, posts, and nested comments in a single request.

```graphql
query GetAllUsersWithRelations {
  users {
    id
    name
    email
    role
    bio
    profile {
      avatarUrl
      githubUrl
      website
    }
    posts {
      id
      title
      slug
      published
      views
    }
  }
}
```

### Query 2: Paginated & Filtered Posts
Filter posts by title/content keyword (`search`), category, or tag, with offset pagination (`skip`/`take`).

```graphql
query GetPaginatedFilteredPosts {
  posts(
    filter: {
      published: true
      search: "PostgreSQL"
    }
    pagination: {
      skip: 0
      take: 5
    }
  ) {
    totalCount
    skip
    take
    hasMore
    items {
      id
      title
      slug
      views
      createdAt
      categories {
        id
        name
      }
      tags {
        id
        name
      }
    }
  }
}
```

---

## Module 2: N+1 DataLoader Benchmark Lab

Compare the performance of DataLoader batching vs naïve individual field resolving by monitoring your NestJS terminal output!

### 🧪 Step A: Run the DataLoader Optimized Query
```graphql
query OptimizedDataLoaderQuery {
  posts {
    items {
      id
      title
      author {
        name
        email
      }
      commentCount
    }
  }
}
```
**Terminal Output**:
```
[DataLoader] Batch fetching authors for IDs: 8a7c..., 9b2d...
[DataLoader] Batch counting comments for post IDs: 8a7c..., 9b2d...
```
*(Notice: Exactly 1 batched SQL query for authors and 1 query for comments!)*

---

### 🧪 Step B: Run the Naive Unoptimized Query
```graphql
query NaiveNPlusOneQuery {
  posts {
    items {
      id
      title
      naiveAuthor {
        name
        email
      }
    }
  }
}
```
**Terminal Output**:
```
[Naive N+1 Resolver] Executing individual SQL SELECT for authorId: 8a7c...
[Naive N+1 Resolver] Executing individual SQL SELECT for authorId: 9b2d...
[Naive N+1 Resolver] Executing individual SQL SELECT for authorId: c3e1...
```
*(Notice: N individual SQL queries executed!)*

---

## Module 3: Mutations & ACID Database Transactions

### Mutation 1: Create User + Profile in an Atomic Database Transaction
Executes a PostgreSQL transaction (`BEGIN` -> `INSERT user` -> `INSERT profile` -> `COMMIT`).

```graphql
mutation CreateUserAtomicTransaction {
  createUser(
    input: {
      name: "Marcus Vance"
      email: "marcus.vance@example.com"
      role: AUTHOR
      bio: "PostgreSQL Database Administrator & GraphQL Architect"
      profile: {
        githubUrl: "https://github.com/marcusvance"
        website: "https://marcusvance.io"
        avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"
      }
    }
  ) {
    id
    name
    email
    role
    profile {
      id
      githubUrl
      website
    }
  }
}
```

---

### Mutation 2: Create Post with Auto-Generated Slug & Auto-Created Tags

```graphql
mutation CreatePostWithTags($authorId: String!) {
  createPost(
    input: {
      title: "Advanced PostgreSQL Indexing and WAL Optimizations"
      content: "Write-Ahead Logging (WAL) ensures durability in PostgreSQL ACID transactions..."
      published: true
      authorId: $authorId
      tagNames: ["PostgreSQL", "WAL", "Performance", "Database"]
    }
  ) {
    id
    title
    slug
    published
    tags {
      id
      name
    }
  }
}
```

---

### Mutation 3: Create Threaded Reply to an Existing Comment

```graphql
mutation CreateThreadedCommentReply(
  $postId: ID!
  $authorId: ID!
  $parentId: ID!
) {
  createComment(
    input: {
      postId: $postId
      authorId: $authorId
      parentId: $parentId
      text: "How does Write-Ahead Logging affect streaming replication performance?"
    }
  ) {
    id
    text
    createdAt
    author {
      name
    }
    parentComment {
      id
      text
    }
  }
}
```

---

## Module 4: PostgreSQL Raw SQL, Aggregations & EXPLAIN ANALYZE

### Raw Query 1: Execute Complex Raw SQL Aggregation (`GROUP BY`, `LEFT JOIN`)

```graphql
query GetRawSqlAnalytics {
  rawSqlUserAnalytics {
    userId
    userName
    userEmail
    totalPosts
    publishedPosts
    totalViews
    totalComments
  }
}
```
**Underlying Raw SQL Executed**:
```sql
SELECT 
  u.id AS "userId",
  u.name AS "userName",
  u.email AS "userEmail",
  COUNT(DISTINCT p.id)::int AS "totalPosts",
  COUNT(DISTINCT CASE WHEN p.published = true THEN p.id END)::int AS "publishedPosts",
  COALESCE(SUM(p.views), 0)::int AS "totalViews",
  COUNT(DISTINCT c.id)::int AS "totalComments"
FROM users u
LEFT JOIN posts p ON p."authorId" = u.id
LEFT JOIN comments c ON c."authorId" = u.id
GROUP BY u.id, u.name, u.email
ORDER BY "totalPosts" DESC;
```

---

### Raw Query 2: Inspect Database Table Disk Usage & Row Counts
Queries `pg_stat_user_tables` and `pg_total_relation_size()` directly from PostgreSQL system catalog:

```graphql
query GetPostgresDatabaseStats {
  postgresTableStats {
    tableName
    rowCount
    totalSize
  }
}
```

---

### Raw Query 3: Analyze PostgreSQL Query Planner (`EXPLAIN ANALYZE`)

```graphql
query InspectPostgresQueryPlan {
  explainPostgresQuery(
    sqlQuery: "SELECT * FROM posts WHERE published = true ORDER BY \"createdAt\" DESC"
  ) {
    query
    executionPlanJson
  }
}
```

---

## Module 5: Real-time WebSockets Subscriptions

1. Open Tab 1 in Apollo Sandbox and run:
   ```graphql
   subscription OnPostPublished {
     postCreated {
       id
       title
       slug
       published
       createdAt
     }
   }
   ```
2. Open Tab 2 and run `createPost` mutation.
3. Watch the new post instantly arrive in Tab 1 over WebSockets!

---

# 3. PostgreSQL Performance & Indexing Deep Dive

In PostgreSQL, indexes drastically reduce read latency by maintaining a B-Tree structure instead of scanning every disk block.

### Indexes Implemented in this Project:
1. **Primary Key B-Tree Index**: Automatically created on `id` columns.
2. **Unique B-Tree Indexes**: Created on `users.email` and `posts.slug` to enforce uniqueness at the database engine layer.
3. **Composite Index (`idx_posts_published_created`)**:
   Defined on `posts(published, createdAt)`. This accelerates queries filtering by publication state and ordering by creation date:
   ```sql
   SELECT * FROM posts WHERE published = true ORDER BY "createdAt" DESC;
   ```

---

# 4. Step-by-Step Practice Exercises

To solidify your learning, complete these exercises in the codebase:

### 🏋️ Exercise 1: Add a "Like" Entity & Resolver
1. Create a `Like` entity in `src/modules/posts/entities/like.entity.ts` with `userId` and `postId`.
2. Add a `likesCount` DataLoader in `PostsDataLoader`.
3. Add a `@ResolveField(() => Int) likesCount` resolver in `PostsResolver`.

### 🏋️ Exercise 2: Write a Top Categories Aggregation Query
1. Add a method `getTopCategories()` in `AnalyticsService` executing raw SQL:
   ```sql
   SELECT c.name, COUNT(pc."postId") AS post_count 
   FROM categories c 
   JOIN posts_categories pc ON pc."categoryId" = c.id 
   GROUP BY c.name 
   ORDER BY post_count DESC;
   ```
2. Expose it via a GraphQL query `@Query(() => [CategoryStats])`.

### 🏋️ Exercise 3: Benchmark Index Scans vs Sequential Scans
1. Run `explainPostgresQuery` on a non-indexed column search:
   `SELECT * FROM posts WHERE content LIKE '%WAL%'`
2. Observe `Seq Scan` (Sequential Scan) in the execution plan JSON.
3. Compare it against `Index Scan` on `posts.slug`!
