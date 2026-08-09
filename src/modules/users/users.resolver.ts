import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => [User], { name: 'users', description: 'Get all registered users' })
  async getUsers(): Promise<User[]> {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user', description: 'Get a specific user by UUID' })
  async getUser(@Args('id', { type: () => ID }) id: string): Promise<User> {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User, { description: 'Create a new user with optional nested profile in a database transaction' })
  async createUser(
    @Args('input') createUserInput: CreateUserInput,
  ): Promise<User> {
    return this.usersService.create(createUserInput);
  }

  @Mutation(() => User, { description: 'Update existing user profile' })
  async updateUser(
    @Args('input') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return this.usersService.update(updateUserInput);
  }

  @Mutation(() => Boolean, { description: 'Delete a user and cascade delete associated records' })
  async deleteUser(
    @Args('id', { type: () => ID }) id: string,
  ): Promise<boolean> {
    return this.usersService.remove(id);
  }
}
