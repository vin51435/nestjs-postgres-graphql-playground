import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsOptional, IsUUID } from 'class-validator';

@InputType()
export class CreatePostInput {
  @Field()
  @IsNotEmpty({ message: 'Title is required' })
  title: string;

  @Field()
  @IsNotEmpty({ message: 'Content is required' })
  content: string;

  @Field(() => ID)
  @IsUUID('4')
  authorId: string;

  @Field(() => [String], { nullable: true, description: 'Category IDs to attach to the post' })
  @IsOptional()
  categoryIds?: string[];

  @Field(() => [String], { nullable: true, description: 'Tag names to assign or auto-create' })
  @IsOptional()
  tagNames?: string[];

  @Field({ nullable: true, defaultValue: false })
  @IsOptional()
  published?: boolean;
}
