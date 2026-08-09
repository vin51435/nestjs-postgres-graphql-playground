import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { ObjectType, Field, Int, Float } from '@nestjs/graphql';

@ObjectType()
export class UserActivityStats {
  @Field()
  userId: string;

  @Field()
  userName: string;

  @Field()
  userEmail: string;

  @Field(() => Int)
  totalPosts: number;

  @Field(() => Int)
  publishedPosts: number;

  @Field(() => Int)
  totalViews: number;

  @Field(() => Int)
  totalComments: number;
}

@ObjectType()
export class PostgresTableStats {
  @Field()
  tableName: string;

  @Field(() => Int)
  rowCount: number;

  @Field()
  totalSize: string;
}

@ObjectType()
export class QueryPlanResult {
  @Field()
  query: string;

  @Field()
  executionPlanJson: string;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly dataSource: DataSource) {}

  // Complex Aggregation using Raw PostgreSQL SQL
  async getUserActivityAnalytics(): Promise<UserActivityStats[]> {
    const rawQuery = `
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
    `;

    return this.dataSource.query(rawQuery);
  }

  // Get PostgreSQL statistics directly from pg_catalog / pg_stat_user_tables
  async getPostgresTableStats(): Promise<PostgresTableStats[]> {
    const rawQuery = `
      SELECT 
        relname AS "tableName",
        n_live_tup::int AS "rowCount",
        pg_size_pretty(pg_total_relation_size(relid)) AS "totalSize"
      FROM pg_stat_user_tables
      ORDER BY pg_total_relation_size(relid) DESC;
    `;

    return this.dataSource.query(rawQuery);
  }

  // Execute PostgreSQL EXPLAIN ANALYZE for query optimization learning
  async explainQuery(sqlQuery: string): Promise<QueryPlanResult> {
    const explainSql = `EXPLAIN (ANALYZE, COSTS, VERBOSE, BUFFERS, FORMAT JSON) ${sqlQuery}`;
    const result = await this.dataSource.query(explainSql);
    
    return {
      query: sqlQuery,
      executionPlanJson: JSON.stringify(result[0]['QUERY PLAN'], null, 2),
    };
  }
}
