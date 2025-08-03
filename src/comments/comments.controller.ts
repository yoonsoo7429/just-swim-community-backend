import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { CommentsService } from './comments.service';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  create(@Body() commentData: any) {
    return this.commentsService.create(commentData);
  }

  @Get('swimming-record/:id')
  findBySwimmingRecord(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.findBySwimmingRecord(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.commentsService.remove(id);
  }
}
