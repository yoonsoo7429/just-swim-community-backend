import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { Post } from './entities/post.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { TrainingProgram } from '../training/entities/training-program.entity';
import { CommentsModule } from '../comments/comments.module';
import { Challenge } from '../social/entities/challenge.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Post,
      User,
      SwimmingRecord,
      TrainingProgram,
      Challenge,
    ]),
    CommentsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
