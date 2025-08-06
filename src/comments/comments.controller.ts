import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(
    @Body() commentData: { content: string; postId: number },
    @Request() req,
  ) {
    return this.commentsService.create({
      ...commentData,
      authorId: req.user.id,
    });
  }

  @Get('post/:id')
  findByPost(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findByPost(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commentsService.remove(id, req.user.id);
  }

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  likeComment(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.commentsService.likeComment(id, req.user.id);
  }
}
