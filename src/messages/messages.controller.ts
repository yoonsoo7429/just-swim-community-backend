import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  // 메시지 전송
  @Post()
  async sendMessage(
    @Body() createMessageDto: CreateMessageDto,
    @Request() req,
  ) {
    return this.messagesService.sendMessage(req.user.id, createMessageDto);
  }

  // 대화 목록 조회
  @Get('conversations')
  async getConversations(@Request() req) {
    return this.messagesService.getConversations(req.user.id);
  }

  // 특정 사용자와의 메시지 목록 조회
  @Get('conversations/:friendId')
  async getMessages(
    @Param('friendId', ParseIntPipe) friendId: number,
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const limitNum = limit ? parseInt(limit) : 50;
    const offsetNum = offset ? parseInt(offset) : 0;
    return this.messagesService.getMessages(
      req.user.id,
      friendId,
      limitNum,
      offsetNum,
    );
  }

  // 메시지 읽음 처리
  @Put(':id/read')
  async markAsRead(
    @Param('id', ParseIntPipe) messageId: number,
    @Request() req,
  ) {
    return this.messagesService.markAsRead(messageId, req.user.id);
  }

  // 대화의 모든 메시지 읽음 처리
  @Put('conversations/:friendId/read')
  async markConversationAsRead(
    @Param('friendId', ParseIntPipe) friendId: number,
    @Request() req,
  ) {
    await this.messagesService.markConversationAsRead(req.user.id, friendId);
    return { success: true };
  }

  // 메시지 삭제
  @Delete(':id')
  async deleteMessage(
    @Param('id', ParseIntPipe) messageId: number,
    @Request() req,
  ) {
    await this.messagesService.deleteMessage(messageId, req.user.id);
    return { success: true };
  }
}
