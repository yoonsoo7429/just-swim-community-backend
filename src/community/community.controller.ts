import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { PostsService } from '../posts/posts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@Controller('community')
export class CommunityController {
  constructor(private readonly postsService: PostsService) {}

  @Get('stats')
  getStats() {
    return this.postsService.getCommunityStats();
  }

  @Get('popular')
  getPopularPosts() {
    return this.postsService.findPopular();
  }

  @Get('trending')
  getTrendingPosts() {
    return this.postsService.findTrending();
  }

  @Get('search')
  searchPosts(@Query('q') query: string, @Query('category') category?: string) {
    return this.postsService.searchPosts(query, category);
  }

  @Get('tags')
  getPopularTags() {
    return this.postsService.getPopularTags();
  }

  @Get('categories')
  getCategories() {
    return this.postsService.getCategories();
  }

  @Get('recent')
  getRecentPosts() {
    return this.postsService.findRecent();
  }

  @UseGuards(JwtAuthGuard)
  @Get('recommendations')
  getRecommendedPosts(@User('id') userId: number) {
    return this.postsService.getRecommendedPosts(userId);
  }
}
