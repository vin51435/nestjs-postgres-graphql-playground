import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  OneToMany,
  Index,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Post } from '../../posts/entities/post.entity';
import { Comment } from '../../comments/entities/comment.entity';

export enum UserRole {
  ADMIN = 'ADMIN',
  AUTHOR = 'AUTHOR',
  READER = 'READER',
}

registerEnumType(UserRole, {
  name: 'UserRole',
  description: 'Role assigned to the user defining their platform permissions',
});

@ObjectType({ description: 'User account representation' })
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  @Index('idx_users_email')
  email: string;

  @Field()
  @Column()
  name: string;

  @Field(() => UserRole)
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.READER,
  })
  role: UserRole;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Field(() => Profile, { nullable: true })
  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  profile?: Profile;

  @Field(() => [Post], { nullable: true })
  @OneToMany(() => Post, (post) => post.author)
  posts?: Post[];

  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.author)
  comments?: Comment[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
