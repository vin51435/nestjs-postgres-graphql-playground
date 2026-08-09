import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent, Int } from '@nestjs/graphql';
import { PostsService } from './posts.service';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { CreatePostInput } from './dto/create-post.input';
import { UpdatePostInput } from './dto/update-post.input';
import { PostFilterInput, PaginationInput, PaginatedPosts } from './dto/post-filter.input';
import { PostsDataLoader } from './posts.dataloader';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { pubSub, POST_CREATED_EVENT } from './posts-subscriptions.resolver';

@Resolver(() => Post)
export class PostsResolver {
  constructor(
    private readonly postsService: PostsService,
    private readonly postsDataLoader: PostsDataLoader,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  @Query(() => PaginatedPosts, {
    name: 'posts',
    description: 'Get paginated list of posts with filtering and search capabilities',
  })
  async getPosts(
    @Args('filter', { nullable: true }) filter?: PostFilterInput,
    @Args('pagination', { nullable: true }) pagination?: PaginationInput,
  ): Promise<PaginatedPosts> {
    return this.postsService.findPaginated(filter, pagination);
  }

  @Query(() => Post, { name: 'post', description: 'Get post by ID' })
  async getPost(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    return this.postsService.findOne(id);
  }

  @Mutation(() => Post, { description: 'Create a new post' })
  async createPost(@Args('input') createPostInput: CreatePostInput): Promise<Post> {
    const newPost = await this.postsService.create(createPostInput);
    pubSub.publish(POST_CREATED_EVENT, { postCreated: newPost });
    return newPost;
  }

  @Mutation(() => Post, { description: 'Increment post views counter' })
  async incrementPostViews(@Args('id', { type: () => ID }) id: string): Promise<Post> {
    return this.postsService.incrementViews(id);
  }

  @Mutation(() => Post, { description: 'Update an existing post' })
  async updatePost(@Args('input') updatePostInput: UpdatePostInput): Promise<Post> {
    return this.postsService.update(updatePostInput);
  }

  @Mutation(() => Boolean, { description: 'Delete a post' })
  async deletePost(@Args('id', { type: () => ID }) id: string): Promise<boolean> {
    return this.postsService.remove(id);
  }

  // --- FIELD RESOLVERS & DATALOADER DEMONSTRATIONS ---

  @ResolveField(() => User, {
    description:
      'Optimized Author field resolver using DataLoader (Batched SQL Query - NO N+1 Problem)',
  })
  async author(@Parent() post: Post): Promise<User> {
    return this.postsDataLoader.authorsLoader.load(post.authorId);
  }

  @ResolveField(() => User, {
    description:
      'Unoptimized Author field resolver (Triggers 1 SQL query per post - Demonstrates N+1 Problem)',
  })
  async naiveAuthor(@Parent() post: Post): Promise<User> {
    console.log(
      `[Naive N+1 Resolver] Executing individual SQL SELECT for authorId: ${post.authorId}`,
    );
    return this.userRepository.findOneBy({ id: post.authorId });
  }

  @ResolveField(() => Int, {
    description: 'Total count of comments for this post using DataLoader batching',
  })
  async commentCount(@Parent() post: Post): Promise<number> {
    return this.postsDataLoader.commentCountLoader.load(post.id);
  }
}
