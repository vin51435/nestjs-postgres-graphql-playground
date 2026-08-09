import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      relations: ['profile'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['profile'],
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // Demonstration of PostgreSQL ACID Transaction using TypeORM QueryRunner
  async create(createUserInput: CreateUserInput): Promise<User> {
    const existing = await this.findByEmail(createUserInput.email);
    if (existing) {
      throw new ConflictException(`User with email ${createUserInput.email} already exists`);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step 1: Insert User
      const user = this.userRepository.create({
        email: createUserInput.email,
        name: createUserInput.name,
        role: createUserInput.role,
        bio: createUserInput.bio,
      });
      const savedUser = await queryRunner.manager.save(user);

      // Step 2: Insert Profile if provided
      if (createUserInput.profile) {
        const profile = this.profileRepository.create({
          ...createUserInput.profile,
          userId: savedUser.id,
        });
        await queryRunner.manager.save(profile);
      }

      await queryRunner.commitTransaction();
      return this.findOne(savedUser.id);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async update(updateUserInput: UpdateUserInput): Promise<User> {
    const user = await this.findOne(updateUserInput.id);
    Object.assign(user, updateUserInput);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<boolean> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
    return true;
  }
}
