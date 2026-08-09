import { InputType, Field } from '@nestjs/graphql';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

@InputType()
export class CreateProfileInput {
  @Field({ nullable: true })
  @IsOptional()
  avatarUrl?: string;

  @Field({ nullable: true })
  @IsOptional()
  website?: string;

  @Field({ nullable: true })
  @IsOptional()
  githubUrl?: string;
}

@InputType()
export class CreateUserInput {
  @Field()
  @IsEmail({}, { message: 'Must be a valid email address' })
  email: string;

  @Field()
  @IsNotEmpty({ message: 'Name cannot be empty' })
  @MinLength(2, { message: 'Name must be at least 2 characters' })
  name: string;

  @Field(() => UserRole, { nullable: true, defaultValue: UserRole.READER })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @Field({ nullable: true })
  @IsOptional()
  bio?: string;

  @Field(() => CreateProfileInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateProfileInput)
  profile?: CreateProfileInput;
}
