import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from './entities/message.entity';
import { CreateMessageDto } from './dto/create-message.dto';
import {
  Friendship,
  FriendshipStatus,
} from '../social/entities/friendship.entity';

export interface Conversation {
  user: {
    id: number;
    name: string;
    profileImage?: string;
    userLevel: number;
  };
  lastMessage?: {
    id: number;
    content: string;
    createdAt: Date;
    isRead: boolean;
    senderId: number;
  };
  unreadCount: number;
}

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(Message)
    private messageRepository: Repository<Message>,
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
  ) {}

  // 메시지 전송
  async sendMessage(
    senderId: number,
    createMessageDto: CreateMessageDto,
  ): Promise<Message> {
    const {
      receiverId,
      content,
      messageType = 'text',
      metadata,
    } = createMessageDto;

    // 친구 관계 확인
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: senderId },
          addressee: { id: receiverId },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: { id: receiverId },
          addressee: { id: senderId },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) {
      throw new ForbiddenException('You can only send messages to friends');
    }

    const message = this.messageRepository.create({
      senderId,
      receiverId,
      content,
      messageType,
      metadata,
    });

    return this.messageRepository.save(message);
  }

  // 대화 목록 조회
  async getConversations(userId: number): Promise<Conversation[]> {
    // 친구 목록 조회
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    const conversations: Conversation[] = [];

    for (const friendship of friendships) {
      const friendUser =
        friendship.requester.id === userId
          ? friendship.addressee
          : friendship.requester;

      // 마지막 메시지 조회
      const lastMessage = await this.messageRepository.findOne({
        where: [
          { senderId: userId, receiverId: friendUser.id },
          { senderId: friendUser.id, receiverId: userId },
        ],
        order: { createdAt: 'DESC' },
      });

      // 읽지 않은 메시지 수 조회
      const unreadCount = await this.messageRepository.count({
        where: {
          senderId: friendUser.id,
          receiverId: userId,
          isRead: false,
        },
      });

      conversations.push({
        user: {
          id: friendUser.id,
          name: friendUser.name,
          profileImage: friendUser.profileImage,
          userLevel: friendUser.userLevel,
        },
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              createdAt: lastMessage.createdAt,
              isRead: lastMessage.isRead,
              senderId: lastMessage.senderId,
            }
          : undefined,
        unreadCount,
      });
    }

    // 마지막 메시지 시간순으로 정렬
    conversations.sort((a, b) => {
      if (!a.lastMessage && !b.lastMessage) return 0;
      if (!a.lastMessage) return 1;
      if (!b.lastMessage) return -1;
      return (
        new Date(b.lastMessage.createdAt).getTime() -
        new Date(a.lastMessage.createdAt).getTime()
      );
    });

    return conversations;
  }

  // 특정 사용자와의 메시지 목록 조회
  async getMessages(
    userId: number,
    friendId: number,
    limit: number = 50,
    offset: number = 0,
  ): Promise<Message[]> {
    // 친구 관계 확인
    const friendship = await this.friendshipRepository.findOne({
      where: [
        {
          requester: { id: userId },
          addressee: { id: friendId },
          status: FriendshipStatus.ACCEPTED,
        },
        {
          requester: { id: friendId },
          addressee: { id: userId },
          status: FriendshipStatus.ACCEPTED,
        },
      ],
    });

    if (!friendship) {
      throw new ForbiddenException('You can only view messages with friends');
    }

    return this.messageRepository.find({
      where: [
        { senderId: userId, receiverId: friendId },
        { senderId: friendId, receiverId: userId },
      ],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // 메시지 읽음 처리
  async markAsRead(messageId: number, userId: number): Promise<Message> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, receiverId: userId },
    });

    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (!message.isRead) {
      message.isRead = true;
      message.readAt = new Date();
      return this.messageRepository.save(message);
    }

    return message;
  }

  // 대화의 모든 메시지 읽음 처리
  async markConversationAsRead(
    userId: number,
    friendId: number,
  ): Promise<void> {
    await this.messageRepository.update(
      {
        senderId: friendId,
        receiverId: userId,
        isRead: false,
      },
      {
        isRead: true,
        readAt: new Date(),
      },
    );
  }

  // 메시지 삭제
  async deleteMessage(messageId: number, userId: number): Promise<void> {
    const message = await this.messageRepository.findOne({
      where: { id: messageId, senderId: userId },
    });

    if (!message) {
      throw new NotFoundException(
        'Message not found or you are not the sender',
      );
    }

    await this.messageRepository.remove(message);
  }
}
