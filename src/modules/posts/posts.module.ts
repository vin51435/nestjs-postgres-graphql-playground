import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Post } from './entities/post.entity';
import { Category } from './entities/category.entity';
import { Tag } from './entities/tag.entity';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';
import { PostsService } from './posts.service';
import { PostsResolver } from './posts.resolver';
import { PostsSubscriptionsResolver } from './posts-subscriptions.resolver';
import { PostsDataLoader } from './posts.dataloader';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, Tag, User, Comment])],
  providers: [PostsService, PostsResolver, PostsSubscriptionsResolver, PostsDataLoader],
  exports: [PostsService, TypeOrmModule],
})
export class PostsModule {}
