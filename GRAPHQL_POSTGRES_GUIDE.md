# Comprehensive GraphQL & PostgreSQL Learning Guide

Welcome to the NestJS PostgreSQL & GraphQL Learning Playground! This guide provides copy-pasteable queries, mutations, subscriptions, and database concepts to help you master both PostgreSQL and GraphQL.

---

## 🚀 Quick Start Commands

```bash
# 1. Start NestJS Dev Server
npm run start:dev

# 2. Open GraphQL Apollo Playground in Browser
http://localhost:3000/graphql

# 3. Seed Database with Initial Data
npm run seed
```

---

## 📚 Section 1: GraphQL Queries (Learning Concepts)

### 1. Simple Query with Nested Relations
Fetch users along with their extended profiles, published posts, and comments.

```graphql
query GetAllUsers {
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
      published
      views
    }
  }
}
```

---

### 2. Paginated Posts Query (Offset & Filtering)
Filter posts by search keyword, publication state, and apply pagination limit/offset.

```graphql
query GetPaginatedPosts {
  posts(
    filter: { published: true, search: "PostgreSQL" }
    pagination: { skip: 0, take: 5 }
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
        name
      }
      tags {
        name
      }
    }
  }
}
```

---

### 3. Demonstrating N+1 Problem vs DataLoader Batching

#### Optimized Query (Uses `author` with DataLoader - 1 Batched SQL Query):
Observe your terminal logs when running this query!

```graphql
query GetPostsWithOptimizedAuthor {
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
*Terminal SQL output:*
`[DataLoader] Batch fetching authors for IDs: uuid-1, uuid-2...` -> **Only 1 SQL query!**

#### Unoptimized Query (Uses `naiveAuthor` - N+1 SQL Queries):

```graphql
query GetPostsWithNaiveAuthor {
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
*Terminal SQL output:*
`[Naive N+1 Resolver] Executing individual SQL SELECT for authorId...` -> **N individual SQL queries generated!**

---

## ✍️ Section 2: GraphQL Mutations

### 1. Create User with Nested Profile (ACID Transaction)
Creates a user and profile inside a single PostgreSQL database transaction (`BEGIN ... COMMIT`).

```graphql
mutation CreateUser {
  createUser(
    input: {
      name: "David Miller"
      email: "david.miller@example.com"
      role: AUTHOR
      bio: "PostgreSQL Performance Engineer"
      profile: {
        githubUrl: "https://github.com/davidmiller"
        website: "https://davidmiller.io"
      }
    }
  ) {
    id
    name
    email
    profile {
      githubUrl
      website
    }
  }
}
```

---

### 2. Create Post with Dynamic Categories & Auto-Created Tags

```graphql
mutation CreateNewPost($authorId: String!) {
  createPost(
    input: {
      title: "Deep Dive into PostgreSQL WAL and Index Scans"
      content: "Write Ahead Logging (WAL) ensures durability in ACID transactions..."
      published: true
      authorId: $authorId
      tagNames: ["PostgreSQL", "Database", "WAL", "Performance"]
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

### 3. Create Threaded Comment (Self-Referential Relation)

```graphql
mutation ReplyToComment($postId: ID!, $authorId: ID!, $parentId: ID!) {
  createComment(
    input: {
      postId: $postId
      authorId: $authorId
      parentId: $parentId
      text: "Thanks for explaining WAL! How does it affect replication speed?"
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

## ⚡ Section 3: PostgreSQL Raw SQL & EXPLAIN ANALYZE

### 1. Complex Aggregation Raw SQL Query
Executes raw SQL query using `LEFT JOIN`, `GROUP BY`, and `COUNT/SUM` aggregations.

```graphql
query GetUserAnalytics {
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

---

### 2. Inspect Table Sizes & Row Counts from PostgreSQL `pg_stat_user_tables`

```graphql
query GetDatabaseTableStats {
  postgresTableStats {
    tableName
    rowCount
    totalSize
  }
}
```

---

### 3. PostgreSQL EXPLAIN ANALYZE Query Execution Planner
Run `EXPLAIN (ANALYZE, FORMAT JSON)` on any PostgreSQL SQL query string to inspect query costs and index usage!

```graphql
query ExplainQueryExecution {
  explainPostgresQuery(
    sqlQuery: "SELECT * FROM posts WHERE published = true ORDER BY \"createdAt\" DESC"
  ) {
    query
    executionPlanJson
  }
}
```

---

## 📡 Section 4: Real-time WebSockets Subscriptions

In Apollo Playground, open a subscription tab and run:

```graphql
subscription OnPostCreated {
  postCreated {
    id
    title
    slug
    published
    createdAt
  }
}
```

Now execute a `createPost` mutation in another tab, and watch the new post instantly stream into the subscription tab over WebSockets!
