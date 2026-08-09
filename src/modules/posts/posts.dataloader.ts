import { Injectable, Scope } from '@nestjs/common';
import * as DataLoader from 'dataloader';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Comment } from '../comments/entities/comment.entity';

@Injectable({ scope: Scope.REQUEST })
export class PostsDataLoader {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  // Batch load authors by user IDs in a single SQL query
  public readonly authorsLoader = new DataLoader<string, User>(
    async (authorIds: readonly string[]) => {
      console.log(`[DataLoader] Batch fetching authors for IDs: ${authorIds.join(', ')}`);
      const users = await this.userRepository.findBy({ id: In([...authorIds]) });
      const userMap = new Map(users.map((u) => [u.id, u]));
      return authorIds.map((id) => userMap.get(id) || null);
    },
  );

  // Batch load comment counts per post ID in a single SQL query
  public readonly commentCountLoader = new DataLoader<string, number>(
    async (postIds: readonly string[]) => {
      console.log(`[DataLoader] Batch counting comments for post IDs: ${postIds.join(', ')}`);
      const counts = await this.commentRepository
        .createQueryBuilder('comment')
        .select('comment.postId', 'postId')
        .addSelect('COUNT(comment.id)', 'count')
        .where('comment.postId IN (:...postIds)', { postIds: [...postIds] })
        .groupBy('comment.postId')
        .getRawMany();

      const countMap = new Map<string, number>();
      counts.forEach((row) => countMap.set(row.postId, parseInt(row.count, 10)));
      return postIds.map((id) => countMap.get(id) || 0);
    },
  );
}
