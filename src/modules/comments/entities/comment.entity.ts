import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Post } from '../../posts/entities/post.entity';

@ObjectType({ description: 'Comment on a post supporting nested thread replies' })
@Entity('comments')
export class Comment {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ type: 'text' })
  text: string;

  @Field()
  @Column()
  postId: string;

  @Field(() => Post)
  @ManyToOne(() => Post, (post) => post.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Field()
  @Column()
  authorId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.comments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Field({ nullable: true })
  @Column({ nullable: true })
  parentId?: string;

  @Field(() => Comment, { nullable: true })
  @ManyToOne(() => Comment, (comment) => comment.replies, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({ name: 'parentId' })
  parentComment?: Comment;

  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.parentComment)
  replies?: Comment[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;
}
