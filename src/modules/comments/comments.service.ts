import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private readonly commentRepository: Repository<Comment>,
  ) {}

  async findByPost(postId: string): Promise<Comment[]> {
    return this.commentRepository.find({
      where: { postId, parentId: null },
      relations: ['author', 'replies', 'replies.author'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'post', 'replies'],
    });
    if (!comment) {
      throw new NotFoundException(`Comment with ID ${id} not found`);
    }
    return comment;
  }

  async create(createCommentInput: CreateCommentInput): Promise<Comment> {
    if (createCommentInput.parentId) {
      const parent = await this.commentRepository.findOneBy({ id: createCommentInput.parentId });
      if (!parent) {
        throw new NotFoundException(`Parent comment with ID ${createCommentInput.parentId} not found`);
      }
    }

    const comment = this.commentRepository.create(createCommentInput);
    const saved = await this.commentRepository.save(comment);
    return this.findOne(saved.id);
  }

  async remove(id: string): Promise<boolean> {
    const comment = await this.findOne(id);
    await this.commentRepository.remove(comment);
    return true;
  }
}
