import { InputType, Field, ID, PartialType } from '@nestjs/graphql';
import { CreateUserInput } from './create-user.input';
import { IsUUID } from 'class-validator';

@InputType()
export class UpdateUserInput extends PartialType(CreateUserInput) {
  @Field(() => ID)
  @IsUUID('4', { message: 'Must be a valid UUID v4' })
  id: string;
}
