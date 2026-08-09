import { Module, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Client } from 'pg';
import { User } from '../modules/users/entities/user.entity';
import { Profile } from '../modules/users/entities/profile.entity';
import { Post } from '../modules/posts/entities/post.entity';
import { Category } from '../modules/posts/entities/category.entity';
import { Tag } from '../modules/posts/entities/tag.entity';
import { Comment } from '../modules/comments/entities/comment.entity';

async function ensureDatabaseExists(configService: ConfigService) {
  const logger = new Logger('DatabaseInitializer');
  const host = configService.get<string>('POSTGRES_HOST', 'localhost');
  const port = configService.get<number>('POSTGRES_PORT', 5433);
  const user = configService.get<string>('POSTGRES_USER', 'postgres');
  const password = configService.get<string>('POSTGRES_PASSWORD', 'postgres');
  const targetDb = configService.get<string>('POSTGRES_DB', 'nestjs_graphql_db');

  // Connect to default 'postgres' database first to check/create targetDb
  const client = new Client({
    host,
    port,
    user,
    password,
    database: 'postgres',
  });

  try {
    await client.connect();
    const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [targetDb]);
    if (res.rowCount === 0) {
      logger.log(`Database '${targetDb}' does not exist. Creating automatically...`);
      await client.query(`CREATE DATABASE "${targetDb}"`);
      logger.log(`Database '${targetDb}' created successfully!`);
    } else {
      logger.log(`Database '${targetDb}' already exists. Connecting...`);
    }
  } catch (error) {
    logger.warn(
      `Database initialization check warning: ${error.message}. Proceeding with connection attempt.`,
    );
  } finally {
    await client.end().catch(() => {});
  }
}

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        await ensureDatabaseExists(configService);

        return {
          type: 'postgres',
          host: configService.get<string>('POSTGRES_HOST', 'localhost'),
          port: configService.get<number>('POSTGRES_PORT', 5433),
          username: configService.get<string>('POSTGRES_USER', 'postgres'),
          password: configService.get<string>('POSTGRES_PASSWORD', 'postgres'),
          database: configService.get<string>('POSTGRES_DB', 'nestjs_graphql_db'),
          entities: [User, Profile, Post, Category, Tag, Comment],
          synchronize: true, // Set to true for learning/dev playgound schema auto-sync
          logging: ['query', 'error', 'schema'],
        };
      },
    }),
  ],
})
export class DatabaseModule {}
