import { InputType, Field, Int, ObjectType } from '@nestjs/graphql';
import { IsOptional, IsBoolean, Min } from 'class-validator';
import { Post } from '../entities/post.entity';

@InputType()
export class PostFilterInput {
  @Field({ nullable: true, description: 'Search term matching title or content' })
  @IsOptional()
  search?: string;

  @Field({ nullable: true })
  @IsOptional()
  @IsBoolean()
  published?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  categoryId?: string;

  @Field({ nullable: true })
  @IsOptional()
  authorId?: string;

  @Field({ nullable: true })
  @IsOptional()
  tagName?: string;
}

@InputType()
export class PaginationInput {
  @Field(() => Int, { defaultValue: 0 })
  @IsOptional()
  @Min(0)
  skip: number = 0;

  @Field(() => Int, { defaultValue: 10 })
  @IsOptional()
  @Min(1)
  take: number = 10;
}

@ObjectType()
export class PaginatedPosts {
  @Field(() => [Post])
  items: Post[];

  @Field(() => Int)
  totalCount: number;

  @Field(() => Int)
  skip: number;

  @Field(() => Int)
  take: number;

  @Field(() => Boolean)
  hasMore: boolean;
}
