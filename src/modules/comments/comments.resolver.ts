import { Resolver, Query, Mutation, Args, ID, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';

const pubSub = new PubSub();
const COMMENT_ADDED_EVENT = 'commentAdded';

@Resolver(() => Comment)
export class CommentsResolver {
  constructor(private readonly commentsService: CommentsService) {}

  @Query(() => [Comment], {
    name: 'commentsByPost',
    description: 'Get top-level comments and nested replies for a post',
  })
  async getCommentsByPost(@Args('postId', { type: () => ID }) postId: string): Promise<Comment[]> {
    return this.commentsService.findByPost(postId);
  }

  @Mutation(() => Comment, { description: 'Post a comment or reply to existing comment' })
  async createComment(@Args('input') createCommentInput: CreateCommentInput): Promise<Comment> {
    const comment = await this.commentsService.create(createCommentInput);
    pubSub.publish(COMMENT_ADDED_EVENT, { commentAdded: comment });
    return comment;
  }

  @Mutation(() => Boolean, { description: 'Delete a comment and its nested replies' })
  async deleteComment(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.commentsService.remove(id);
  }

  @Subscription(() => Comment, {
    description: 'Real-time subscription triggered whenever a comment is created',
  })
  commentAdded() {
    return pubSub.asyncIterableIterator(COMMENT_ADDED_EVENT);
  }
}
