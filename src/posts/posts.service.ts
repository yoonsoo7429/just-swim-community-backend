import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Post } from './entities/post.entity';
import { CreatePostDto, UpdatePostDto } from './dto';
import { PostResponseDto } from './dto/post-response.dto';
import { User } from '../users/entities/user.entity';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private commentsService: CommentsService,
  ) {}

  async create(
    createPostDto: CreatePostDto,
    userId: number,
  ): Promise<PostResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const post = this.postsRepository.create({
      ...createPostDto,
      authorId: userId,
    });

    const savedPost = await this.postsRepository.save(post);
    return this.transformToResponseDto(savedPost);
  }

  async findAll(currentUserId?: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
    });

    return posts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async findOne(id: number, currentUserId?: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['author', 'comments', 'comments.author', 'likedBy'],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    return this.transformToResponseDto(post, currentUserId);
  }

  async findPopular(currentUserId?: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // 좋아요 수와 댓글 수로 정렬
    const sortedPosts = posts.sort((a, b) => {
      const aScore = (a.likedBy?.length || 0) + (a.comments?.length || 0);
      const bScore = (b.likedBy?.length || 0) + (b.comments?.length || 0);
      return bScore - aScore;
    });

    return sortedPosts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async findByCategory(
    category: string,
    currentUserId?: number,
  ): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      where: { category },
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
    });

    return posts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async update(
    id: number,
    updatePostDto: UpdatePostDto,
    userId: number,
  ): Promise<PostResponseDto> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('게시물을 수정할 권한이 없습니다.');
    }

    await this.postsRepository.update(id, updatePostDto);
    return await this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id);

    if (post.authorId !== userId) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.delete(id);
  }

  async likePost(id: number, userId: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['likedBy'],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    const isLiked = post.likedBy.some((likeUser) => likeUser.id === userId);

    if (isLiked) {
      // 좋아요 취소
      post.likedBy = post.likedBy.filter((likeUser) => likeUser.id !== userId);
    } else {
      // 좋아요 추가
      post.likedBy.push(user);
    }

    await this.postsRepository.save(post);

    // 업데이트된 게시물 정보를 반환
    return this.transformToResponseDto(post, userId);
  }

  async getCommunityStats() {
    const totalMembers = await this.usersRepository.count();
    const todayPosts = await this.postsRepository.count({
      where: {
        createdAt: new Date(new Date().setHours(0, 0, 0, 0)),
      },
    });

    // 오늘 댓글 수 계산
    const todayComments = await this.commentsService.countTodayComments();

    // 활성 사용자 수 (최근 7일간 게시물을 작성한 사용자)
    const activeUsers = await this.postsRepository
      .createQueryBuilder('post')
      .select('COUNT(DISTINCT post.authorId)', 'count')
      .where('post.createdAt >= :date', {
        date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      })
      .getRawOne();

    return {
      totalMembers,
      todayPosts,
      todayComments,
      activeUsers: parseInt(activeUsers.count) || 0,
    };
  }

  private transformToResponseDto(
    post: Post,
    currentUserId?: number,
  ): PostResponseDto {
    const isLiked = currentUserId
      ? post.likedBy?.some((user) => user.id === currentUserId) || false
      : false;

    return {
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category,
      author: post.author,
      authorId: post.authorId,
      likes: post.likedBy?.length || 0,
      comments: post.comments?.length || 0,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked,
    };
  }
}
