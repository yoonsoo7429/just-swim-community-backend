import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { PostsModule } from '../posts/posts.module';

@Module({
  imports: [PostsModule],
  controllers: [CommunityController],
})
export class CommunityModule {}
