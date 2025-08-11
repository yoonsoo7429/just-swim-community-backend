import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { SwimmingService } from './swimming.service';
import { CreateSwimmingDto } from './dto/create-swimming.dto';
import { UpdateSwimmingDto } from './dto/update-swimming.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('swimming')
export class SwimmingController {
  constructor(private readonly swimmingService: SwimmingService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() createSwimmingDto: CreateSwimmingDto, @Request() req: any) {
    return this.swimmingService.create(createSwimmingDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.swimmingService.findAll();
  }

  @Get('my-records')
  @UseGuards(JwtAuthGuard)
  findMyRecords(@Request() req) {
    return this.swimmingService.findByUser(req.user.id);
  }

  @Get('recent')
  getRecentRecords(@Query('limit') limit?: string) {
    const limitNum = limit ? parseInt(limit) : 10;
    return this.swimmingService.getRecentRecords(limitNum);
  }

  @Get('style/:style')
  getRecordsByStyle(@Param('style') style: string) {
    return this.swimmingService.getRecordsByStyle(style);
  }

  @Get('stats')
  getStats() {
    return this.swimmingService.getStats();
  }

  @Get('my-stats')
  @UseGuards(JwtAuthGuard)
  getMyStats(@Request() req) {
    return this.swimmingService.getUserStats(req.user.id);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.swimmingService.findOne(+id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id') id: string,
    @Body() updateSwimmingDto: UpdateSwimmingDto,
  ) {
    return this.swimmingService.update(+id, updateSwimmingDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id') id: string) {
    return this.swimmingService.remove(+id);
  }

  // 좋아요 추가
  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  addLike(@Param('id') id: string, @Request() req: any) {
    return this.swimmingService.addLike(+id, req.user.id);
  }

  // 좋아요 제거
  @Delete(':id/like')
  @UseGuards(JwtAuthGuard)
  removeLike(@Param('id') id: string, @Request() req: any) {
    return this.swimmingService.removeLike(+id, req.user.id);
  }

  // 댓글 추가
  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Param('id') id: string,
    @Body() createCommentDto: CreateCommentDto,
    @Request() req: any,
  ) {
    return this.swimmingService.addComment(+id, req.user.id, createCommentDto);
  }

  // 댓글 목록 조회
  @Get(':id/comments')
  getComments(@Param('id') id: string) {
    return this.swimmingService.getComments(+id);
  }

  // 댓글 삭제
  @Delete('comments/:commentId')
  @UseGuards(JwtAuthGuard)
  removeComment(@Param('commentId') commentId: string, @Request() req: any) {
    return this.swimmingService.removeComment(+commentId, req.user.id);
  }

  // 사용자가 특정 기록을 좋아요했는지 확인
  @Get(':id/like-status')
  @UseGuards(JwtAuthGuard)
  getLikeStatus(@Param('id') id: string, @Request() req: any) {
    return this.swimmingService.isLikedByUser(+id, req.user.id);
  }
}
