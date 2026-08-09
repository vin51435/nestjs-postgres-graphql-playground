import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Comment } from './entities/comment.entity';
import { CommentsService } from './comments.service';
import { CommentsResolver } from './comments.resolver';

@Module({
  imports: [TypeOrmModule.forFeature([Comment])],
  providers: [CommentsService, CommentsResolver],
  exports: [CommentsService, TypeOrmModule],
})
export class CommentsModule {}
