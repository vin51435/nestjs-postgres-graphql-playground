import { InputType, Field, ID } from '@nestjs/graphql';
import { IsNotEmpty, IsUUID, IsOptional } from 'class-validator';

@InputType()
export class CreateCommentInput {
  @Field()
  @IsNotEmpty({ message: 'Comment text cannot be empty' })
  text: string;

  @Field(() => ID)
  @IsUUID('4')
  postId: string;

  @Field(() => ID)
  @IsUUID('4')
  authorId: string;

  @Field(() => ID, { nullable: true, description: 'Parent comment ID for threaded replies' })
  @IsOptional()
  @IsUUID('4')
  parentId?: string;
}
