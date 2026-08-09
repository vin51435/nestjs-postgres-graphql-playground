import { Resolver, Query, Args } from '@nestjs/graphql';
import {
  AnalyticsService,
  UserActivityStats,
  PostgresTableStats,
  QueryPlanResult,
} from './analytics.service';

@Resolver()
export class AnalyticsResolver {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Query(() => [UserActivityStats], {
    name: 'rawSqlUserAnalytics',
    description:
      'Executes complex raw PostgreSQL SELECT query with LEFT JOINs, GROUP BY, and aggregations',
  })
  async getRawSqlUserAnalytics(): Promise<UserActivityStats[]> {
    return this.analyticsService.getUserActivityAnalytics();
  }

  @Query(() => [PostgresTableStats], {
    name: 'postgresTableStats',
    description:
      'Inspect PostgreSQL table stats, row counts, and disk usage from pg_stat_user_tables',
  })
  async getPostgresTableStats(): Promise<PostgresTableStats[]> {
    return this.analyticsService.getPostgresTableStats();
  }

  @Query(() => QueryPlanResult, {
    name: 'explainPostgresQuery',
    description:
      'Run EXPLAIN ANALYZE on custom SQL string to inspect query execution plan & index usage',
  })
  async explainPostgresQuery(
    @Args('sqlQuery', {
      defaultValue: 'SELECT * FROM posts WHERE published = true ORDER BY "createdAt" DESC',
    })
    sqlQuery: string,
  ): Promise<QueryPlanResult> {
    return this.analyticsService.explainQuery(sqlQuery);
  }
}
