import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Category } from './category.entity';
import { Tag } from './tag.entity';
import { Comment } from '../../comments/entities/comment.entity';

@ObjectType({ description: 'Blog post content model' })
@Entity('posts')
@Index('idx_posts_published_created', ['published', 'createdAt'])
export class Post {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  title: string;

  @Field()
  @Column({ unique: true })
  @Index('idx_posts_slug')
  slug: string;

  @Field()
  @Column({ type: 'text' })
  content: string;

  @Field()
  @Column({ default: false })
  published: boolean;

  @Field(() => Int)
  @Column({ default: 0 })
  views: number;

  @Field()
  @Column()
  authorId: string;

  @Field(() => User)
  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'authorId' })
  author: User;

  @Field(() => [Category], { nullable: true })
  @ManyToMany(() => Category, (category) => category.posts, { cascade: true })
  @JoinTable({
    name: 'posts_categories',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'categoryId', referencedColumnName: 'id' },
  })
  categories?: Category[];

  @Field(() => [Tag], { nullable: true })
  @ManyToMany(() => Tag, (tag) => tag.posts, { cascade: true })
  @JoinTable({
    name: 'posts_tags',
    joinColumn: { name: 'postId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'tagId', referencedColumnName: 'id' },
  })
  tags?: Tag[];

  @Field(() => [Comment], { nullable: true })
  @OneToMany(() => Comment, (comment) => comment.post)
  comments?: Comment[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
