import { Controller, Get } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';

@Controller('community')
export class CommunityController {
  constructor(private readonly postsService: PostsService) {}

  @Get('stats')
  getStats() {
    return this.postsService.getCommunityStats();
  }
}
