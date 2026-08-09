import { ObjectType, Field, ID } from '@nestjs/graphql';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Post } from './post.entity';

@ObjectType({ description: 'Tag label for post organization' })
@Entity('tags')
export class Tag {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  name: string;

  @Field(() => [Post], { nullable: true })
  @ManyToMany(() => Post, (post) => post.tags)
  posts?: Post[];
}
