import { DataSource } from 'typeorm';
import { Client } from 'pg';
import * as dotenv from 'dotenv';
import { User, UserRole } from '../../modules/users/entities/user.entity';
import { Profile } from '../../modules/users/entities/profile.entity';
import { Post } from '../../modules/posts/entities/post.entity';
import { Category } from '../../modules/posts/entities/category.entity';
import { Tag } from '../../modules/posts/entities/tag.entity';
import { Comment } from '../../modules/comments/entities/comment.entity';

dotenv.config();

async function ensureDatabaseExists() {
  const host = process.env.POSTGRES_HOST || 'localhost';
  const port = parseInt(process.env.POSTGRES_PORT || '5433', 10);
  const user = process.env.POSTGRES_USER || 'postgres';
  const password = process.env.POSTGRES_PASSWORD || 'postgres';
  const targetDb = process.env.POSTGRES_DB || 'nestjs_graphql_db';

  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb],
    );
    if (res.rowCount === 0) {
      console.log(`📦 Database '${targetDb}' does not exist. Auto-creating...`);
      await client.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✅ Database '${targetDb}' created successfully!`);
    }
  } catch (err) {
    console.warn(`⚠️ Warning checking database existence: ${err.message}`);
  } finally {
    await client.end().catch(() => {});
  }
}

async function runSeed() {
  console.log('🚀 Starting Database Seed...');
  await ensureDatabaseExists();

  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_PORT || '5433', 10),
    username: process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_PASSWORD || 'postgres',
    database: process.env.POSTGRES_DB || 'nestjs_graphql_db',
    entities: [User, Profile, Post, Category, Tag, Comment],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('✅ Connected to PostgreSQL for Seeding');

  // Clear existing data using PostgreSQL TRUNCATE CASCADE
  await dataSource.query(
    'TRUNCATE TABLE comments, posts_categories, posts_tags, posts, profiles, users, categories, tags RESTART IDENTITY CASCADE;',
  );

  // 1. Create Categories
  const catPg = await dataSource.getRepository(Category).save({
    name: 'PostgreSQL',
    description: 'Relational database concepts, indexing, transactions, and performance tuning.',
  });

  const catGql = await dataSource.getRepository(Category).save({
    name: 'GraphQL',
    description: 'API design, schema definitions, resolvers, subscriptions, and DataLoader.',
  });

  const catNest = await dataSource.getRepository(Category).save({
    name: 'NestJS',
    description: 'Server-side Node.js framework building scalable enterprise applications.',
  });

  // 2. Create Tags
  const tagSql = await dataSource.getRepository(Tag).save({ name: 'SQL' });
  const tagPerformance = await dataSource.getRepository(Tag).save({ name: 'Performance' });
  const tagDataLoader = await dataSource.getRepository(Tag).save({ name: 'DataLoader' });
  const tagArchitecture = await dataSource.getRepository(Tag).save({ name: 'Architecture' });

  // 3. Create Users with Profiles
  const user1 = await dataSource.getRepository(User).save({
    email: 'alex.dev@example.com',
    name: 'Alex Rivera',
    role: UserRole.ADMIN,
    bio: 'Fullstack Systems Architect passionate about PostgreSQL performance and GraphQL API design.',
    profile: {
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      githubUrl: 'https://github.com/alexrivera',
      website: 'https://alexrivera.dev',
    },
  });

  const user2 = await dataSource.getRepository(User).save({
    email: 'sarah.coder@example.com',
    name: 'Sarah Chen',
    role: UserRole.AUTHOR,
    bio: 'Backend Engineer & Technical Writer exploring NestJS microservices.',
    profile: {
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      githubUrl: 'https://github.com/sarahchen',
    },
  });

  const user3 = await dataSource.getRepository(User).save({
    email: 'michael.reader@example.com',
    name: 'Michael Scott',
    role: UserRole.READER,
    bio: 'Avid tech learner.',
  });

  // 4. Create Posts
  const post1 = await dataSource.getRepository(Post).save({
    title: 'Mastering PostgreSQL Indexing: B-Tree vs Composite Indexes',
    slug: 'mastering-postgresql-indexing-b-tree-vs-composite-indexes-1001',
    content:
      'Indexes in PostgreSQL act as pointers to rows. B-Tree indexes speed up equality and range queries, while composite indexes optimize queries filtering on multiple columns like (published, createdAt)...',
    published: true,
    views: 1420,
    author: user1,
    categories: [catPg],
    tags: [tagSql, tagPerformance],
  });

  const post2 = await dataSource.getRepository(Post).save({
    title: 'Solving GraphQL N+1 Problem in NestJS using DataLoader',
    slug: 'solving-graphql-n-1-problem-in-nestjs-using-dataloader-1002',
    content:
      'When resolving nested relationships in GraphQL, naive field resolvers generate N+1 database queries. DataLoader solves this by batching and caching keys per request tick...',
    published: true,
    views: 980,
    author: user1,
    categories: [catGql, catNest],
    tags: [tagDataLoader, tagPerformance, tagArchitecture],
  });

  const post3 = await dataSource.getRepository(Post).save({
    title: 'Building Real-time NestJS Subscriptions with WebSockets',
    slug: 'published-real-time-nestjs-subscriptions-with-websockets-1003',
    content:
      'GraphQL Subscriptions enable real-time push notifications over WebSockets. In this post, we set up PubSub in NestJS GraphQL module...',
    published: false,
    views: 45,
    author: user2,
    categories: [catGql, catNest],
    tags: [tagArchitecture],
  });

  // 5. Create Threaded Comments
  const comment1 = await dataSource.getRepository(Comment).save({
    text: 'Great explanation of B-Tree indexes! Could you also explain EXPLAIN ANALYZE?',
    post: post1,
    author: user2,
  });

  await dataSource.getRepository(Comment).save({
    text: 'Thanks Sarah! You can run EXPLAIN ANALYZE directly in this app via the explainPostgresQuery GraphQL query!',
    post: post1,
    author: user1,
    parentComment: comment1,
  });

  await dataSource.getRepository(Comment).save({
    text: 'DataLoader saved our production database from crashing under high read load!',
    post: post2,
    author: user3,
  });

  console.log('🎉 Seed Completed Successfully!');
  console.log(`Created: 3 Users, 3 Categories, 4 Tags, 3 Posts, and 3 Threaded Comments.`);

  await dataSource.destroy();
}

runSeed().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
