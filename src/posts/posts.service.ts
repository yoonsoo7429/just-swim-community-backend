import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, IsNull, In } from 'typeorm';
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
      author: { id: userId },
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

    if (post.author.id !== userId) {
      throw new ForbiddenException('게시물을 수정할 권한이 없습니다.');
    }

    await this.postsRepository.update(id, updatePostDto);
    return await this.findOne(id);
  }

  async remove(id: number, userId: number): Promise<void> {
    const post = await this.findOne(id);

    if (post.author.id !== userId) {
      throw new ForbiddenException('게시물을 삭제할 권한이 없습니다.');
    }

    await this.postsRepository.delete(id);
  }

  async likePost(id: number, userId: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: ['likedBy', 'author', 'comments'],
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

  async findTrending(currentUserId?: number): Promise<PostResponseDto[]> {
    // 최근 7일간의 게시물 중에서 인기순으로 정렬
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const posts = await this.postsRepository.find({
      where: {
        createdAt: sevenDaysAgo,
      },
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    // 시간 가중치를 적용한 점수 계산
    const sortedPosts = posts.sort((a, b) => {
      const aScore = this.calculateTrendingScore(a);
      const bScore = this.calculateTrendingScore(b);
      return bScore - aScore;
    });

    return sortedPosts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async searchPosts(
    query: string,
    category?: string,
    currentUserId?: number,
  ): Promise<PostResponseDto[]> {
    const queryBuilder = this.postsRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.author', 'author')
      .leftJoinAndSelect('post.comments', 'comments')
      .leftJoinAndSelect('post.likedBy', 'likedBy')
      .where(
        '(post.title LIKE :query OR post.content LIKE :query OR post.tags LIKE :query)',
        { query: `%${query}%` },
      );

    if (category && category !== '전체') {
      queryBuilder.andWhere('post.category = :category', { category });
    }

    const posts = await queryBuilder
      .orderBy('post.createdAt', 'DESC')
      .getMany();

    return posts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async getPopularTags(): Promise<string[]> {
    const posts = await this.postsRepository.find({
      select: ['tags'],
      where: {
        tags: Not(IsNull()),
      },
    });

    const tagCounts: { [key: string]: number } = {};
    posts.forEach((post) => {
      if (post.tags) {
        post.tags.forEach((tag) => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });

    return Object.entries(tagCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([tag]) => tag);
  }

  async getCategories(): Promise<string[]> {
    const categories = await this.postsRepository
      .createQueryBuilder('post')
      .select('post.category', 'category')
      .addSelect('COUNT(*)', 'count')
      .groupBy('post.category')
      .orderBy('count', 'DESC')
      .getRawMany();

    return categories.map((cat) => cat.category);
  }

  async findRecent(currentUserId?: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
      take: 20,
    });

    return posts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async getRecommendedPosts(userId: number): Promise<PostResponseDto[]> {
    // 사용자의 관심사와 활동 패턴을 기반으로 추천
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['posts', 'posts.category'],
    });

    if (!user) {
      return [];
    }

    // 사용자가 좋아요한 게시물의 카테고리 분석
    const likedPosts = await this.postsRepository.find({
      relations: ['likedBy', 'category'],
      where: {
        likedBy: { id: userId },
      },
    });

    const preferredCategories = likedPosts.map((post) => post.category);

    // 선호 카테고리의 게시물 중 인기순으로 추천
    const recommendedPosts = await this.postsRepository.find({
      where: {
        category: In(preferredCategories),
        author: Not(userId),
      },
      relations: ['author', 'comments', 'likedBy'],
      order: { createdAt: 'DESC' },
      take: 10,
    });

    return recommendedPosts.map((post) =>
      this.transformToResponseDto(post, userId),
    );
  }

  private calculateTrendingScore(post: Post): number {
    const now = new Date();
    const postAge =
      (now.getTime() - post.createdAt.getTime()) / (1000 * 60 * 60 * 24); // 일 단위

    const likes = post.likedBy?.length || 0;
    const comments = post.comments?.length || 0;

    // 시간 가중치 (최신일수록 높은 점수)
    const timeWeight = Math.max(0, 1 - postAge / 7);

    // 인기도 점수
    const popularityScore = likes * 2 + comments * 3;

    return popularityScore * timeWeight;
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
      likes: post.likedBy?.length || 0,
      comments: post.comments?.length || 0,
      tags: post.tags,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      isLiked,
    };
  }
}
