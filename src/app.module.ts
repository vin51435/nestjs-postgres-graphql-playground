import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { join } from 'path';
import { AppController } from './app.controller';
import { DatabaseModule } from './database/database.module';
import { UsersModule } from './modules/users/users.module';
import { PostsModule } from './modules/posts/posts.module';
import { CommentsModule } from './modules/comments/comments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DatabaseModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/schema.gql'),
      sortSchema: true,
      playground: false,
      plugins: [ApolloServerPluginLandingPageLocalDefault({ embed: true })],
      introspection: true,
      subscriptions: {
        'graphql-ws': true,
        'subscriptions-transport-ws': true,
      },
      formatError: (error: any) => {
        const originalError = error.extensions?.originalError as any;
        let code = error.extensions?.code || 'INTERNAL_SERVER_ERROR';

        if (originalError?.statusCode === 409 || originalError?.error === 'Conflict') {
          code = 'CONFLICT';
        } else if (originalError?.statusCode === 400 || originalError?.error === 'Bad Request') {
          code = 'BAD_REQUEST';
        } else if (originalError?.statusCode === 404 || originalError?.error === 'Not Found') {
          code = 'NOT_FOUND';
        }

        return {
          message: error.message,
          code,
          path: error.path,
          ...(originalError?.message && Array.isArray(originalError.message)
            ? { validationErrors: originalError.message }
            : {}),
        };
      },
    }),
    UsersModule,
    PostsModule,
    CommentsModule,
    AnalyticsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
