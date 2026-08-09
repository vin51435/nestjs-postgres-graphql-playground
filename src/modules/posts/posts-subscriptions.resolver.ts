import { Resolver, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { Post } from './entities/post.entity';

export const pubSub = new PubSub();
export const POST_CREATED_EVENT = 'postCreated';

@Resolver(() => Post)
export class PostsSubscriptionsResolver {
  @Subscription(() => Post, {
    description: 'Real-time WebSockets subscription triggered when a new post is created',
  })
  postCreated() {
    return pubSub.asyncIterableIterator(POST_CREATED_EVENT);
  }
}
