import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto, UpdatePostDto } from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from '../comments/comments.service';

@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly commentsService: CommentsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createPostDto: CreatePostDto, @Request() req) {
    return this.postsService.create(createPostDto, req.user.id);
  }

  @Post('swimming-record')
  @UseGuards(JwtAuthGuard)
  createSwimmingRecordPost(
    @Body() data: { recordId: string; additionalContent?: string },
    @Request() req: any,
  ) {
    return this.postsService.createSwimmingRecordPost(
      data.recordId,
      req.user.id,
      data.additionalContent || '수영 기록을 공유합니다.',
    );
  }

  @Get('swimming-record/:recordId/status')
  @UseGuards(JwtAuthGuard)
  async getSwimmingRecordShareStatus(
    @Param('recordId') recordId: string,
    @Request() req: any,
  ) {
    console.log('req.user:', req.user);
    console.log('req.user.id:', req.user?.id);

    return this.postsService.getSwimmingRecordShareStatus(
      parseInt(recordId),
      req.user.id,
    );
  }

  @Post('update-titles')
  async updateExistingPostTitles() {
    await this.postsService.updateExistingPostTitles();
    return { message: '기존 게시물 제목이 업데이트되었습니다.' };
  }

  @Get()
  findAll(@Query('category') category?: string, @Request() req?: any) {
    const currentUserId = req?.user?.id;
    if (category) {
      return this.postsService.findByCategory(category, currentUserId);
    }
    return this.postsService.findAll(currentUserId);
  }

  @Get('popular')
  findPopular(@Request() req?: any) {
    const currentUserId = req?.user?.id;
    return this.postsService.findPopular(currentUserId);
  }

  @Get('category/:category')
  findByCategory(@Param('category') category: string, @Request() req?: any) {
    const currentUserId = req?.user?.id;
    return this.postsService.findByCategory(category, currentUserId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req?: any) {
    const currentUserId = req?.user?.id;
    return this.postsService.findOne(+id, currentUserId);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Request() req,
  ) {
    return this.postsService.update(+id, updatePostDto, req.user.id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string, @Request() req) {
    return this.postsService.remove(+id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likePost(@Param('id') id: string, @Request() req) {
    return this.postsService.likePost(+id, req.user.id);
  }

  // Comment-related endpoints
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.commentsService.findByPost(+id);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  createComment(
    @Param('id') id: string,
    @Body() commentData: { content: string },
    @Request() req,
  ) {
    return this.commentsService.create({
      content: commentData.content,
      postId: +id,
      authorId: req.user.id,
    });
  }
}
