import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { User } from '../users/entities/user.entity';
import { Post } from '../posts/entities/post.entity';
import moment from 'moment-timezone';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment)
    private commentRepository: Repository<Comment>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Post)
    private postRepository: Repository<Post>,
  ) {}

  async create(commentData: {
    content: string;
    postId: number;
    authorId: number;
  }): Promise<Comment> {
    const user = await this.userRepository.findOne({
      where: { id: commentData.authorId },
    });
    const post = await this.postRepository.findOne({
      where: { id: commentData.postId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const comment = this.commentRepository.create({
      content: commentData.content,
      author: user,
      post: post,
    });

    return await this.commentRepository.save(comment);
  }

  async findOne(id: number): Promise<Comment> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author', 'post', 'likedBy'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    return comment;
  }

  async findByPost(postId: number): Promise<Comment[]> {
    const comments = await this.commentRepository.find({
      where: { post: { id: postId } },
      relations: ['author', 'likedBy'],
      order: { createdAt: 'ASC' },
    });

    return comments.map((comment) => ({
      ...comment,
      likes: comment.likedBy?.length || 0,
    }));
  }

  async remove(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['author'],
    });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (comment.author.id !== userId) {
      throw new ForbiddenException('댓글을 삭제할 권한이 없습니다.');
    }

    await this.commentRepository.remove(comment);
  }

  async likeComment(id: number, userId: number): Promise<void> {
    const comment = await this.commentRepository.findOne({
      where: { id },
      relations: ['likedBy'],
    });

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!comment) {
      throw new NotFoundException('댓글을 찾을 수 없습니다.');
    }

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const isLiked = comment.likedBy.some((likeUser) => likeUser.id === userId);

    if (isLiked) {
      // 좋아요 취소
      comment.likedBy = comment.likedBy.filter(
        (likeUser) => likeUser.id !== userId,
      );
    } else {
      // 좋아요 추가
      comment.likedBy.push(user);
    }

    await this.commentRepository.save(comment);
  }

  async countTodayComments(): Promise<number> {
    const startOfDay = moment().tz('Asia/Seoul').startOf('day').toDate();
    const endOfDay = moment().tz('Asia/Seoul').endOf('day').toDate();

    return this.commentRepository.count({
      where: {
        createdAt: Between(startOfDay, endOfDay),
      },
    });
  }
}
