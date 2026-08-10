# 🚀 GraphQL Interview & System Design Mastery Guide

This document is an exhaustive, production-grade reference manual for **GraphQL**. It is designed for senior backend engineers, system design interviews, and API architecture preparation.

---

## 📋 Table of Contents
1. [Executive Overview & Core Architecture](#1-executive-overview--core-architecture)
2. [How GraphQL Works Under the Hood (Execution Lifecycle)](#2-how-graphql-works-under-the-hood-execution-lifecycle)
3. [The N+1 Problem & DataLoader Deep Dive](#3-the-n1-problem--dataloader-deep-dive)
4. [Pros, Cons & REST vs GraphQL Comparison](#4-pros-cons--rest-vs-graphql-comparison)
5. [Security, Caching & Performance Tuning](#5-security-caching--performance-tuning)
6. [Enterprise GraphQL Federation & Governance](#6-enterprise-graphql-federation--governance)
7. [Top Senior Interview Questions & Answers](#7-top-senior-interview-questions--answers)

---

# 1. Executive Overview & Core Architecture

## What is GraphQL?
GraphQL is an open-source **query language for APIs** and a server-side runtime for executing queries using a type system defined for your data. Created by Facebook in 2012 and open-sourced in 2015, GraphQL provides a declarative, strongly-typed alternative to REST.

### Simple Definitions:
- **Declarative Data Fetching**: The client specifies the *exact* shape and fields of data it needs in a single request, and the server returns that exact shape in JSON.
- **GraphQL Schema (The Contract)**: A strongly typed blueprint that defines all possible queries, mutations, subscriptions, types, and fields available in the API.
- **Field Resolver**: A function on the server responsible for fetching or calculating the value for a single field in a GraphQL type.

---

## Core GraphQL Operations

```
                   +----------------------------------+
                   |       GraphQL Client App         |
                   +----------------+-----------------+
                                    |
            HTTP POST /graphql      |       WebSockets / WSS
       (Queries & Mutations)        |        (Subscriptions)
                                    v
                   +----------------+-----------------+
                   |     GraphQL API Gateway / Engine |
                   +----------------+-----------------+
                                    |
          +-------------------------+-------------------------+
          |                         |                         |
+---------v---------+     +---------v---------+     +---------v---------+
|   Users Resolver  |     |   Posts Resolver  |     | Comments Resolver |
+---------+---------+     +---------+---------+     +---------+---------+
          |                         |                         |
          v                         v                         v
   [ PostgreSQL DB ]         [ Redis Cache ]           [ Microservice ]
```

1. **Queries (`query`)**: Read operations (analogous to HTTP `GET`).
2. **Mutations (`mutation`)**: Write operations (create, update, delete - analogous to HTTP `POST`/`PUT`/`DELETE`).
3. **Subscriptions (`subscription`)**: Real-time push streams over persistent WebSockets connections.

---

## What is a GraphQL API Gateway / Engine?

- **GraphQL Engine**: The core runtime (`graphql-js`, `@apollo/server`) that parses query strings into ASTs, validates types against the schema, and executes field resolvers. In a **monolithic app** (like this NestJS project), the Engine runs **in-process** directly inside your server application.
- **GraphQL Gateway / Router**: A dedicated **separate server process** (e.g. Apollo Router, Apollo Gateway) placed in front of multiple microservices. It accepts client queries, creates a distributed execution plan, fetches data concurrently from microservice subgraphs, and merges the responses into a single JSON result.

---

# 2. How GraphQL Works Under the Hood (Execution Lifecycle)

When a GraphQL server receives a POST request at `/graphql`, it executes 3 distinct pipeline phases:

```
GraphQL Document String
          |
          v
  [ 1. PARSING ] ----------> Converts raw string to Abstract Syntax Tree (AST)
          |
          v
  [ 2. VALIDATION ] -------> Validates AST against Schema types & constraints
          |
          v
  [ 3. EXECUTION ] --------> Traverses AST nodes depth-first, invokes Resolvers,
                             builds JSON response payload
          |
          v
  JSON Response Envelope ({ data: {...}, errors: [...] })
```

---

## 1. Parsing Phase & AST (Abstract Syntax Tree)
The server parses the raw query string into a memory tree structure called an **Abstract Syntax Tree (AST)**.

Example Query:
```graphql
query { user(id: "1") { name } }
```

Generated AST Node Tree:
```
Document -> OperationDefinition (query) -> Field (user) -> SelectionSet -> Field (name)
```

---

## 2. Validation Phase
Before executing resolvers, the GraphQL engine validates the AST against the schema:
- Do the requested fields exist on the type?
- Are mandatory arguments supplied with correct scalar types?
- Are query fragments valid and non-cyclical?

If validation fails, execution halts immediately, returning an `errors` array without executing database queries.

---

## 3. Execution Phase & Resolver Tree Traversal
The engine traverses the AST **depth-first** starting from root fields (`Query`, `Mutation`):

1. **Root Field Execution**: Invokes `Query.user(id: "1")`.
2. **Type Resolution**: Obtains the `User` object (`{ id: "1", name: "Alex" }`).
3. **Child Field Execution**: Evaluates child fields (`name`). If a field has a custom `@ResolveField()`, the engine calls that resolver, passing the parent object as `parent` / `root`.
4. **Response Assembly**: Assembles the resulting values into a JSON object matching the query structure.

---

## The GraphQL Response Envelope
GraphQL HTTP responses always follow a standardized 3-key JSON envelope:

```json
{
  "data": {
    "user": {
      "id": "1",
      "name": "Alex"
    }
  },
  "errors": [
    {
      "message": "Field specific error message",
      "code": "BAD_REQUEST",
      "path": ["user", "posts", 0, "comments"]
    }
  ],
  "extensions": {
    "tracing": { "duration": 15420000 }
  }
}
```

---

# 3. The N+1 Problem & DataLoader Deep Dive

## What is the N+1 Problem?

Suppose a query requests 10 posts and their respective authors:

```graphql
query GetPosts {
  posts {
    id
    title
    author {    # Field resolver on Post object
      name
    }
  }
}
```

### Unoptimized Execution Flow:
1. `Query.posts()` executes **1 SQL query** fetching 10 posts.
2. For Post #1, `Post.author()` executes `SELECT * FROM users WHERE id = 'user-1'`.
3. For Post #2, `Post.author()` executes `SELECT * FROM users WHERE id = 'user-2'`.
4. ... repeats for all 10 posts.
5. **Total Queries**: 1 + 10 = **11 SQL queries** (N+1!). For 1,000 posts, this triggers 1,001 database queries!

---

## How DataLoader Works Step-by-Step

DataLoader is a utility created by Facebook to solve N+1 queries using **Batching** and **Memoization (Caching)**.

```
Request Tick 1:
Post 1 asks for Author "A-1"  \
Post 2 asks for Author "A-2"   ---> DataLoader Queue [ "A-1", "A-2", "A-3" ]
Post 3 asks for Author "A-3"  /
                                           |
                               NodeJS Event Loop Tick
                                           v
                              Batch Batch Loading Function:
                              SELECT * FROM users WHERE id IN ('A-1', 'A-2', 'A-3')
                                           |
                                           v
                              DataLoader resolves individual Promises for Post 1, 2, 3!
```

### The 2 Pillars of DataLoader:

1. **Batching via Event Loop Ticks (`process.nextTick` / Microtasks)**:
   - When a field resolver calls `loader.load(authorId)`, DataLoader returns a `Promise` and pushes `authorId` into an in-memory queue.
   - It defers execution until the current synchronous execution tick of the Node.js event loop completes.
   - On the next microtask tick, DataLoader flushes the queue, deduplicates keys, and passes array `['A-1', 'A-2', 'A-3']` into a single batch function:
     ```typescript
     async (ids: readonly string[]) => {
       const users = await userRepository.findBy({ id: In([...ids]) });
       const map = new Map(users.map(u => [u.id, u]));
       return ids.map(id => map.get(id) || null);
     }
     ```
2. **Request-Scoped Cache**:
   - If Post #1 and Post #5 have the exact same `authorId` (`'A-1'`), DataLoader returns the cached Promise for `'A-1'` immediately without even adding it to the batch queue!
   - **Crucial Requirement**: DataLoader instances **MUST be Request-Scoped** (created new per HTTP request) to prevent sharing cached user data across different users/requests!

---

# 4. Pros, Cons & REST vs GraphQL Comparison

## Pros of GraphQL
1. **No Over-Fetching or Under-Fetching**: Clients fetch only the exact fields they need, saving network bandwidth on mobile devices.
2. **Single Network Endpoint (`/graphql`)**: Fetch deeply nested relational data (Users -> Posts -> Comments -> Author) in **1 single HTTP request** instead of 4 separate REST endpoints.
3. **Strongly Typed Schema Contract**: Serves as single source of truth; enables auto-generated TypeScript SDKs for frontend apps.
4. **Built-in Introspection & Self-Documentation**: Tools like Apollo Sandbox auto-generate documentation from code annotations.

## Cons of GraphQL
1. **Complex HTTP Caching**: Standard REST APIs leverage HTTP GET edge caching (CDNs/Varnish) by URL path (`/users/123`). GraphQL uses HTTP `POST` payloads, requiring specialized field-level caching or Normalized Client Caching (Apollo Client InMemoryCache).
2. **Arbitrary Query Complexity & Security Risks**: A client can send a malicious, deeply nested query (`user { posts { comments { author { posts { ... } } } } }`) that overwhelms server CPU/RAM.
3. **File Upload Complexity**: Uploading binary files over GraphQL requires multipart requests (`graphql-upload`) or pre-signed S3 URLs.
4. **N+1 Performance Pitfall**: Requires explicit developer awareness to implement DataLoaders.

---

## REST vs GraphQL Architectural Comparison

| Feature | REST API | GraphQL API |
| :--- | :--- | :--- |
| **Endpoint Structure** | Multiple URLs (`/users`, `/posts/123/comments`) | Single URL (`POST /graphql`) |
| **Data Shape** | Fixed by server endpoint | Declarative (Defined by client request) |
| **Network Requests** | Multiple round-trips for nested relations | Single round-trip for nested relations |
| **Versioning** | URL versioning (`/v1/users`, `/v2/users`) | Schema evolution (field `@deprecated` directive) |
| **Caching** | Native HTTP GET / CDN Caching | Client Normalized Cache / Persisted Queries |
| **Error Handling** | HTTP Status Codes (`404`, `401`, `500`) | Envelope (`HTTP 200 OK` + `errors` JSON array) |

---

# 5. Security, Caching & Performance Tuning

## 1. Protecting Against DoS: Query Depth & Cost Limiting

To prevent clients from crashing your server with malicious nested queries:

1. **Depth Limiting (`graphql-depth-limit`)**:
   Enforces a maximum nesting depth limit (e.g., maximum depth = 5 levels).
2. **Query Complexity Analysis (`graphql-query-complexity`)**:
   Assigns point values to fields (e.g., scalar field = 1 point, paginated list = 10 points). If a query exceeds max complexity (e.g., > 1,000 points), the server rejects it during validation!

```typescript
// NestJS Query Complexity Guard Example
GraphQLModule.forRoot<ApolloDriverConfig>({
  driver: ApolloDriver,
  validationRules: [
    depthLimit(5),
    createComplexityRule({
      maximumComplexity: 1000,
      variables: {},
      onComplete: (complexity) => console.log('Query Complexity:', complexity),
    }),
  ],
});
```

---

## 2. Persisted Queries (Automatic Persisted Queries - APQ)

To optimize network payloads and prevent arbitrary query execution in production:

1. Frontend sends a SHA-256 hash of the GraphQL query string instead of sending the long query string over the wire.
2. Server checks its Redis cache for the SHA-256 hash:
   - **Cache Hit**: Executes cached query AST immediately. Saves 95% of upload bandwidth!
   - **Cache Miss**: Asks client to send full query string, caches the hash for future requests.

---

# 6. Enterprise GraphQL Federation & Governance

In enterprise microservices, a single monolithic GraphQL server becomes a development bottleneck. **GraphQL Federation (Apollo Federation)** allows independent microservice teams to combine their subgraphs into a unified **Supergraph**.

```
                           +------------------------+
                           |  Apollo Router Gateway |
                           |      (Supergraph)      |
                           +-----------+------------+
                                       |
            +--------------------------+--------------------------+
            |                          |                          |
  +---------v---------+      +---------v---------+      +---------v---------+
  |   Users Subgraph  |      |   Posts Subgraph  |      | Analytics Subgraph|
  |  (Users Microservice)    |  (Posts Microservice)    | (Analytics Service) |
  +-------------------+      +-------------------+      +-------------------+
```

### Key Federation Directives:
- **`@key(fields: "id")`**: Marks an entity (e.g., `User`) as resolvable across multiple subgraphs by its primary key.
- **`@external`**: Declares that a field originates from another subgraph microservice.
- **`@requires(fields: "...")`**: Specifies required external fields needed to compute a local field.

---

# 7. Top Senior Interview Questions & Answers

### Q1: How does GraphQL execute a query under the hood, and what is an AST?
**Answer**: When a request arrives at `/graphql`, the engine parses the raw query string into an **Abstract Syntax Tree (AST)**—a memory tree representation of operation nodes. Next, it validates the AST against schema types. Finally, in the execution phase, it traverses AST nodes depth-first, invoking root resolvers and child field resolvers to construct the matching JSON response payload.

---

### Q2: Why does a GraphQL query return HTTP Status `200 OK` even when an error occurs?
**Answer**: HTTP POST in GraphQL acts purely as a transport layer. An `HTTP 200 OK` status indicates that the HTTP request was successfully delivered and parsed by the server engine. Application, validation, or database errors are populated inside the standardized GraphQL response envelope's `errors` array (`{ "errors": [...], "data": null }`). HTTP 4xx/5xx status codes are reserved for transport failures (e.g. invalid JSON format, broken connection, or unhandled gateway crashes).

---

### Q3: Explain how DataLoader works and why DataLoader instances must be request-scoped.
**Answer**: DataLoader defers batch loading using Node.js event-loop microtask ticks (`process.nextTick`). When field resolvers call `loader.load(id)`, DataLoader queues keys and returns pending Promises. On the next microtask tick, it deduplicates keys and passes the array to a single batch loader function (`WHERE id IN (...)`). DataLoader instances must be **Request-Scoped** so that cached data in DataLoader's internal Map is not leaked across different HTTP requests or users.

---

### Q4: How do you prevent malicious clients from sending infinite nested queries that crash your database?
**Answer**:
1. **Query Depth Limiting**: Rejects queries exceeding a fixed depth (e.g. > 5 nested levels).
2. **Query Complexity Analysis**: Assigns numeric costs to fields and lists, rejecting queries that exceed a total complexity threshold (e.g. > 1,000 points).
3. **Automatic Persisted Queries (APQ)**: In production, restrict execution to pre-approved query SHA-256 hashes.

---

### Q5: What is GraphQL Federation and how does it differ from a Schema Stitching monolith?
**Answer**: Schema Stitching uses a centralized gateway that imperatively merges schemas and forwards requests. **GraphQL Federation** uses a declarative, distributed architecture where each microservice owns its subgraph schema and entity definitions using `@key`. An intelligent gateway (like Apollo Router) automatically inspects subgraphs, builds an optimized query execution plan across microservices, and merges responses transparently.
