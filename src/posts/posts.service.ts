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
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { TrainingProgram } from '../training/entities/training-program.entity';
import { TrainingSeries } from '../training/entities/training-series.entity';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(Post)
    private postsRepository: Repository<Post>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordsRepository: Repository<SwimmingRecord>,
    @InjectRepository(TrainingProgram)
    private trainingProgramsRepository: Repository<TrainingProgram>,
    @InjectRepository(TrainingSeries)
    private trainingSeriesRepository: Repository<TrainingSeries>,
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

  async createSwimmingRecordPost(
    recordId: string,
    userId: number,
    additionalContent?: string,
  ): Promise<PostResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 수영 기록 정보 가져오기
    const swimmingRecord = await this.swimmingRecordsRepository.findOne({
      where: { id: parseInt(recordId) },
      select: ['title'],
    });

    if (!swimmingRecord) {
      throw new NotFoundException('수영 기록을 찾을 수 없습니다.');
    }

    const post = this.postsRepository.create({
      title: swimmingRecord.title,
      content: additionalContent || '수영 기록을 공유합니다.',
      category: '기록 공유',
      author: { id: userId },
      swimmingRecord: { id: parseInt(recordId) },
    });

    const savedPost = await this.postsRepository.save(post);
    return this.transformToResponseDto(savedPost);
  }

  async createTrainingProgramPost(
    programId: string,
    userId: number,
    additionalContent?: string,
  ): Promise<PostResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 훈련 프로그램 정보 가져오기
    const trainingProgram = await this.trainingProgramsRepository.findOne({
      where: { id: parseInt(programId) },
      select: ['title', 'difficulty', 'totalWeeks', 'sessionsPerWeek'],
    });

    if (!trainingProgram) {
      throw new NotFoundException('훈련 프로그램을 찾을 수 없습니다.');
    }

    const post = this.postsRepository.create({
      title: trainingProgram.title,
      content: additionalContent || '훈련 프로그램을 공유합니다.',
      category: '훈련 후기',
      author: { id: userId },
      trainingProgram: { id: parseInt(programId) },
    });

    const savedPost = await this.postsRepository.save(post);
    return this.transformToResponseDto(savedPost);
  }

  async createTrainingSeriesPost(
    seriesId: string,
    userId: number,
    additionalContent?: string,
  ): Promise<PostResponseDto> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // 정기 모임 시리즈 정보 가져오기
    const trainingSeries = await this.trainingSeriesRepository.findOne({
      where: { id: parseInt(seriesId) },
      select: [
        'title',
        'description',
        'difficulty',
        'type',
        'repeatDays',
        'repeatTime',
        'defaultLocation',
      ],
    });

    if (!trainingSeries) {
      throw new NotFoundException('정기 모임 시리즈를 찾을 수 없습니다.');
    }

    // 시리즈 정보를 포함한 내용 생성
    let content = additionalContent || '';
    if (trainingSeries.type === 'recurring') {
      const repeatDays = trainingSeries.repeatDays
        ?.map((day) => {
          const dayMap: { [key: string]: string } = {
            monday: '월요일',
            tuesday: '화요일',
            wednesday: '수요일',
            thursday: '목요일',
            friday: '금요일',
            saturday: '토요일',
            sunday: '일요일',
          };
          return dayMap[day] || day;
        })
        .join(', ');

      content += `\n\n📅 정기 모임 정보:\n`;
      content += `• 반복 요일: ${repeatDays || '설정 없음'}\n`;
      content += `• 시작 시간: ${trainingSeries.repeatTime || '설정 없음'}\n`;
      content += `• 장소: ${trainingSeries.defaultLocation || '설정 없음'}\n`;
      content += `• 난이도: ${trainingSeries.difficulty}\n`;
    } else {
      content += `\n\n📅 일회성 모임입니다.`;
    }

    const post = this.postsRepository.create({
      title: `[정기 모임] ${trainingSeries.title}`,
      content: content || '정기 모임에 참여하세요!',
      category: '훈련 후기',
      author: { id: userId },
      trainingSeries: { id: parseInt(seriesId) },
    });

    const savedPost = await this.postsRepository.save(post);
    return this.transformToResponseDto(savedPost);
  }

  async getSwimmingRecordShareStatus(
    recordId: number,
    userId: number,
  ): Promise<{ isShared: boolean; postId?: number }> {
    console.log(`공유 상태 확인 요청: recordId=${recordId}, userId=${userId}`);

    // 해당 수영 기록이 현재 사용자에 의해 커뮤니티에 공유되었는지 확인
    const sharedPost = await this.postsRepository.findOne({
      where: {
        swimmingRecord: { id: recordId },
        author: { id: userId },
        category: '기록 공유',
      },
      select: ['id'],
    });

    console.log(`찾은 공유 게시물:`, sharedPost);

    const result = {
      isShared: !!sharedPost,
      postId: sharedPost?.id,
    };

    console.log(`반환할 결과:`, result);
    return result;
  }

  async getTrainingProgramShareStatus(
    programId: number,
    userId: number,
  ): Promise<{ isShared: boolean; postId?: number }> {
    // 해당 훈련 프로그램이 현재 사용자에 의해 커뮤니티에 공유되었는지 확인
    const sharedPost = await this.postsRepository.findOne({
      where: {
        trainingProgram: { id: programId },
        author: { id: userId },
        category: '훈련 후기',
      },
      select: ['id'],
    });

    return {
      isShared: !!sharedPost,
      postId: sharedPost?.id,
    };
  }

  // 기존 게시물들의 제목을 실제 수영 기록 제목으로 업데이트
  async updateExistingPostTitles(): Promise<void> {
    const posts = await this.postsRepository.find({
      where: { category: '기록 공유' },
      relations: ['swimmingRecord'],
    });

    for (const post of posts) {
      if (post.swimmingRecord && post.title.startsWith('수영 기록 공유 - ')) {
        await this.postsRepository.update(post.id, {
          title: post.swimmingRecord.title,
        });
      }
    }
  }

  async seedSamplePosts(): Promise<{ message: string; count: number }> {
    const samplePosts = [
      {
        title: '자유형 100m 기록 단축 팁',
        content:
          '자유형 100m를 더 빠르게 수영하는 방법을 공유합니다. 호흡 타이밍과 팔 동작을 개선하면 상당한 시간 단축이 가능합니다.',
        category: '팁 공유',
        author: { id: 1 }, // 기본 사용자 ID
      },
      {
        title: '첫 수영 대회 참가 후기',
        content:
          '처음으로 수영 대회에 참가했습니다. 긴장했지만 좋은 경험이었고, 다음에는 더 좋은 기록을 세우고 싶습니다.',
        category: '훈련 후기',
        author: { id: 1 },
      },
      {
        title: '수영 초보자를 위한 가이드',
        content:
          '수영을 처음 시작하는 분들을 위한 기본적인 팁과 주의사항을 정리했습니다. 물에 대한 두려움을 극복하는 방법도 포함되어 있습니다.',
        category: '가이드',
        author: { id: 1 },
      },
      {
        title: '월간 수영 챌린지 참여',
        content:
          '이번 달에 20km 수영 챌린지에 참여하고 있습니다. 함께 도전해보시는 건 어떨까요?',
        category: '챌린지',
        author: { id: 1 },
      },
      {
        title: '수영장 선택 가이드',
        content:
          '서울 지역 수영장들을 비교 분석했습니다. 가격, 시설, 접근성 등을 고려한 추천 리스트입니다.',
        category: '가이드',
        author: { id: 1 },
      },
    ];

    let createdCount = 0;
    for (const postData of samplePosts) {
      try {
        const post = this.postsRepository.create(postData);
        await this.postsRepository.save(post);
        createdCount++;
      } catch (error) {
        console.error('샘플 게시물 생성 실패:', error);
      }
    }

    return {
      message: `${createdCount}개의 샘플 게시물이 생성되었습니다.`,
      count: createdCount,
    };
  }

  async findAll(currentUserId?: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: [
        'author',
        'comments',
        'likedBy',
        'swimmingRecord',
        'trainingProgram',
      ],
      order: { createdAt: 'DESC' },
    });

    return posts.map((post) =>
      this.transformToResponseDto(post, currentUserId),
    );
  }

  async findOne(id: number, currentUserId?: number): Promise<PostResponseDto> {
    const post = await this.postsRepository.findOne({
      where: { id },
      relations: [
        'author',
        'comments',
        'comments.author',
        'likedBy',
        'swimmingRecord',
        'trainingProgram',
      ],
    });

    if (!post) {
      throw new NotFoundException('게시물을 찾을 수 없습니다.');
    }

    return this.transformToResponseDto(post, currentUserId);
  }

  async findPopular(currentUserId?: number): Promise<PostResponseDto[]> {
    const posts = await this.postsRepository.find({
      relations: [
        'author',
        'comments',
        'likedBy',
        'swimmingRecord',
        'trainingProgram',
      ],
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
      relations: [
        'author',
        'comments',
        'likedBy',
        'swimmingRecord',
        'trainingProgram',
      ],
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
      swimmingRecord: post.swimmingRecord
        ? {
            id: post.swimmingRecord.id,
            title: post.swimmingRecord.title,
            totalDistance: post.swimmingRecord.totalDistance,
            totalDuration: post.swimmingRecord.totalDuration,
            poolLength: post.swimmingRecord.poolLength,
            strokes: post.swimmingRecord.strokes || [],
            calories: post.swimmingRecord.calories,
          }
        : undefined,
      trainingProgram: post.trainingProgram
        ? {
            id: post.trainingProgram.id,
            title: post.trainingProgram.title,
            difficulty: post.trainingProgram.difficulty,
            totalWeeks: post.trainingProgram.totalWeeks,
            sessionsPerWeek: post.trainingProgram.sessionsPerWeek,
          }
        : undefined,
    };
  }
}
