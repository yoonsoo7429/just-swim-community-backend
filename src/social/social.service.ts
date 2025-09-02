import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not } from 'typeorm';
import { Friendship, FriendshipStatus } from './entities/friendship.entity';
import {
  Challenge,
  ChallengeStatus,
  ChallengeType,
} from './entities/challenge.entity';
import {
  ChallengeParticipant,
  ParticipantStatus,
} from './entities/challenge-participant.entity';
import {
  SocialActivity,
  ActivityType,
} from './entities/social-activity.entity';
import { User } from '../users/entities/user.entity';
import { SwimmingRecord } from '../swimming/entities/swimming.entity';
import { CreateFriendshipDto } from './dto/create-friendship.dto';
import { CreateChallengeDto } from './dto/create-challenge.dto';
import { RespondFriendshipDto } from './dto/respond-friendship.dto';
import { GoalsService } from '../goals/goals.service';
import { GoalDifficulty } from '../goals/entities/goal.entity';

export interface FriendInfo {
  user: User;
  friendship: Friendship;
  mutualFriends: number;
  recentActivity?: SocialActivity;
}

export interface ChallengeInfo {
  challenge: Challenge;
  participantCount: number;
  userParticipation?: ChallengeParticipant;
  topParticipants: ChallengeParticipant[];
  allParticipants?: ChallengeParticipant[];
}

@Injectable()
export class SocialService {
  constructor(
    @InjectRepository(Friendship)
    private friendshipRepository: Repository<Friendship>,
    @InjectRepository(Challenge)
    private challengeRepository: Repository<Challenge>,
    @InjectRepository(ChallengeParticipant)
    private challengeParticipantRepository: Repository<ChallengeParticipant>,
    @InjectRepository(SocialActivity)
    private socialActivityRepository: Repository<SocialActivity>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SwimmingRecord)
    private swimmingRecordRepository: Repository<SwimmingRecord>,
    private readonly goalsService: GoalsService,
  ) {}

  // 친구 요청 보내기
  async sendFriendRequest(
    requesterId: number,
    createFriendshipDto: CreateFriendshipDto,
  ): Promise<Friendship> {
    const { addresseeId, message } = createFriendshipDto;

    if (requesterId === addresseeId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    // 이미 친구 관계가 있는지 확인
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: requesterId }, addressee: { id: addresseeId } },
        { requester: { id: addresseeId }, addressee: { id: requesterId } },
      ],
    });

    if (existingFriendship) {
      throw new ConflictException('Friendship already exists');
    }

    const friendship = this.friendshipRepository.create({
      requester: { id: requesterId },
      addressee: { id: addresseeId },
      message,
      status: FriendshipStatus.PENDING,
    });

    const savedFriendship = await this.friendshipRepository.save(friendship);

    // 소셜 활동 기록
    await this.createSocialActivity({
      userId: requesterId,
      type: ActivityType.FRIENDSHIP_ACCEPTED,
      title: '친구 요청을 보냈습니다',
      data: { friendshipId: savedFriendship.id },
    });

    return savedFriendship;
  }

  // 친구 요청 응답
  async respondToFriendRequest(
    friendshipId: number,
    userId: number,
    respondDto: RespondFriendshipDto,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, addressee: { id: userId } },
    });

    if (!friendship) {
      throw new NotFoundException('Friend request not found');
    }

    friendship.status = respondDto.status;
    if (respondDto.status === FriendshipStatus.ACCEPTED) {
      friendship.acceptedAt = new Date();
    }

    const updatedFriendship = await this.friendshipRepository.save(friendship);

    // 수락 시 소셜 활동 기록
    if (respondDto.status === FriendshipStatus.ACCEPTED) {
      await this.createSocialActivity({
        userId,
        type: ActivityType.FRIENDSHIP_ACCEPTED,
        title: '새로운 친구가 되었습니다',
        data: {
          friendshipId: friendship.id,
          friendId: friendship.requester.id,
        },
      });
    }

    return updatedFriendship;
  }

  // 친구 목록 조회
  async getFriends(userId: number): Promise<FriendInfo[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
      relations: ['requester', 'addressee'],
    });

    const friendInfos: FriendInfo[] = [];

    for (const friendship of friendships) {
      const friendUser =
        friendship.requester.id === userId
          ? friendship.addressee
          : friendship.requester;

      // 공통 친구 수 계산
      const mutualFriends = await this.getMutualFriendsCount(
        userId,
        friendUser.id,
      );

      // 최근 활동 조회
      const recentActivity = await this.socialActivityRepository.findOne({
        where: { user: { id: friendUser.id }, isPublic: true },
        order: { createdAt: 'DESC' },
      });

      friendInfos.push({
        user: friendUser,
        friendship,
        mutualFriends,
        recentActivity: recentActivity || undefined,
      });
    }

    return friendInfos;
  }

  // 친구 요청 목록 조회
  async getFriendRequests(userId: number): Promise<Friendship[]> {
    return this.friendshipRepository.find({
      where: { addressee: { id: userId }, status: FriendshipStatus.PENDING },
      relations: ['requester'],
      order: { createdAt: 'DESC' },
    });
  }

  // 챌린지 생성
  async createChallenge(
    creatorId: number,
    createChallengeDto: CreateChallengeDto,
  ): Promise<Challenge> {
    const challenge = this.challengeRepository.create({
      ...createChallengeDto,
      creator: { id: creatorId },
      startDate: new Date(createChallengeDto.startDate),
      endDate: new Date(createChallengeDto.endDate),
      rewardXP: this.calculateChallengeRewardXP(createChallengeDto),
      rewardPoints: this.calculateChallengeRewardPoints(createChallengeDto),
    });

    const savedChallenge = await this.challengeRepository.save(challenge);

    // 생성자를 자동으로 참가자로 추가
    await this.joinChallenge(savedChallenge.id, creatorId);

    // 초대된 사용자들을 참가자로 추가
    if (
      createChallengeDto.invitedUserIds &&
      createChallengeDto.invitedUserIds.length > 0
    ) {
      for (const invitedUserId of createChallengeDto.invitedUserIds) {
        await this.inviteToChallenge(savedChallenge.id, invitedUserId);
      }
    }

    return savedChallenge;
  }

  // 챌린지 참가
  async joinChallenge(
    challengeId: number,
    userId: number,
  ): Promise<ChallengeParticipant> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    if (
      challenge.status !== ChallengeStatus.UPCOMING &&
      challenge.status !== ChallengeStatus.ACTIVE
    ) {
      throw new BadRequestException('Challenge is not available for joining');
    }

    // 이미 참가했는지 확인
    const existingParticipant =
      await this.challengeParticipantRepository.findOne({
        where: { challenge: { id: challengeId }, user: { id: userId } },
      });

    if (existingParticipant) {
      throw new ConflictException('Already joined this challenge');
    }

    // 최대 참가자 수 확인
    if (challenge.maxParticipants > 0) {
      const currentParticipants =
        await this.challengeParticipantRepository.count({
          where: {
            challenge: { id: challengeId },
            status: ParticipantStatus.JOINED,
          },
        });

      if (currentParticipants >= challenge.maxParticipants) {
        throw new BadRequestException('Challenge is full');
      }
    }

    const participant = this.challengeParticipantRepository.create({
      challenge: { id: challengeId },
      user: { id: userId },
      status: ParticipantStatus.JOINED,
    });

    const savedParticipant =
      await this.challengeParticipantRepository.save(participant);

    // 소셜 활동 기록
    await this.createSocialActivity({
      userId,
      type: ActivityType.CHALLENGE_JOINED,
      title: `"${challenge.title}" 챌린지에 참가했습니다`,
      data: { challengeId },
    });

    // 챌린지 참가 시 자동으로 연동된 개인 목표 생성
    await this.goalsService.createChallengeLinkedGoal(
      userId,
      challenge.id,
      challenge.title,
      challenge.targetValue,
      challenge.unit,
      new Date(challenge.startDate),
      new Date(challenge.endDate),
    );

    return savedParticipant;
  }

  // 챌린지 초대
  async inviteToChallenge(
    challengeId: number,
    userId: number,
  ): Promise<ChallengeParticipant> {
    const participant = this.challengeParticipantRepository.create({
      challenge: { id: challengeId },
      user: { id: userId },
      status: ParticipantStatus.INVITED,
    });

    return this.challengeParticipantRepository.save(participant);
  }

  // 공개 챌린지 목록 조회
  async getPublicChallenges(
    userId?: number,
    status?: ChallengeStatus,
  ): Promise<ChallengeInfo[]> {
    const whereConditions: any = { isPublic: true };
    if (status) {
      whereConditions.status = status;
    }

    const challenges = await this.challengeRepository.find({
      where: whereConditions,
      order: { createdAt: 'DESC' },
      take: 20,
    });

    const challengeInfos: ChallengeInfo[] = [];

    for (const challenge of challenges) {
      const participantCount = await this.challengeParticipantRepository.count({
        where: {
          challenge: { id: challenge.id },
          status: ParticipantStatus.JOINED,
        },
      });

      let userParticipation: ChallengeParticipant | undefined = undefined;
      if (userId) {
        const participant = await this.challengeParticipantRepository.findOne({
          where: { challenge: { id: challenge.id }, user: { id: userId } },
        });
        userParticipation = participant || undefined;
      }

      const topParticipants = await this.challengeParticipantRepository.find({
        where: {
          challenge: { id: challenge.id },
          status: ParticipantStatus.JOINED,
        },
        order: { currentProgress: 'DESC' },
        take: 3,
        relations: ['user'],
      });

      challengeInfos.push({
        challenge,
        participantCount,
        userParticipation,
        topParticipants,
      });
    }

    return challengeInfos;
  }

  // 사용자 챌린지 목록 조회
  async getUserChallenges(userId: number): Promise<ChallengeInfo[]> {
    const participants = await this.challengeParticipantRepository.find({
      where: { user: { id: userId } },
      relations: ['challenge'],
      order: { createdAt: 'DESC' },
    });

    const challengeInfos: ChallengeInfo[] = [];

    for (const participant of participants) {
      const participantCount = await this.challengeParticipantRepository.count({
        where: {
          challenge: { id: participant.challenge.id },
          status: ParticipantStatus.JOINED,
        },
      });

      const topParticipants = await this.challengeParticipantRepository.find({
        where: {
          challenge: { id: participant.challenge.id },
          status: ParticipantStatus.JOINED,
        },
        order: { currentProgress: 'DESC' },
        take: 3,
        relations: ['user'],
      });

      challengeInfos.push({
        challenge: participant.challenge,
        participantCount,
        userParticipation: participant,
        topParticipants,
      });
    }

    return challengeInfos;
  }

  // 챌린지 상세 정보 조회
  async getChallengeDetails(
    challengeId: number,
    userId: number,
  ): Promise<ChallengeInfo> {
    const challenge = await this.challengeRepository.findOne({
      where: { id: challengeId },
      relations: ['creator'],
    });

    if (!challenge) {
      throw new NotFoundException('Challenge not found');
    }

    const participantCount = await this.challengeParticipantRepository.count({
      where: {
        challenge: { id: challengeId },
        status: ParticipantStatus.JOINED,
      },
    });

    const userParticipation = await this.challengeParticipantRepository.findOne(
      {
        where: {
          challenge: { id: challengeId },
          user: { id: userId },
        },
      },
    );

    const topParticipants = await this.challengeParticipantRepository.find({
      where: {
        challenge: { id: challengeId },
        status: ParticipantStatus.JOINED,
      },
      order: { currentProgress: 'DESC' },
      take: 3,
      relations: ['user'],
    });

    const allParticipants = await this.challengeParticipantRepository.find({
      where: {
        challenge: { id: challengeId },
        status: ParticipantStatus.JOINED,
      },
      order: { currentProgress: 'DESC' },
      relations: ['user'],
    });

    return {
      challenge,
      participantCount,
      userParticipation: userParticipation || undefined,
      topParticipants,
      allParticipants,
    };
  }

  // 소셜 피드 조회
  async getSocialFeed(
    userId: number,
    limit: number = 20,
  ): Promise<SocialActivity[]> {
    // 친구들의 ID 목록 조회
    const friendIds = await this.getFriendIds(userId);

    const allUserIds = [userId, ...friendIds];

    return this.socialActivityRepository.find({
      where: {
        user: { id: In(allUserIds) },
        isPublic: true,
      },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  // 챌린지 진행도 업데이트
  async updateChallengeProgress(
    userId: number,
    challengeId: number,
    progress: number,
  ): Promise<ChallengeParticipant> {
    const participant = await this.challengeParticipantRepository.findOne({
      where: { user: { id: userId }, challenge: { id: challengeId } },
      relations: ['challenge'],
    });

    if (!participant) {
      throw new NotFoundException('Challenge participation not found');
    }

    const challenge = participant.challenge;
    const progressPercentage = Math.min(
      100,
      (progress / challenge.targetValue) * 100,
    );

    participant.currentProgress = progress;
    participant.progressPercentage = progressPercentage;
    participant.lastActivityAt = new Date();

    if (
      progressPercentage >= 100 &&
      participant.status !== ParticipantStatus.COMPLETED
    ) {
      participant.status = ParticipantStatus.COMPLETED;
      participant.completedAt = new Date();

      // 챌린지 완료 시 보상 지급
      await this.awardChallengeRewards(userId, challenge);

      // 완료 시 소셜 활동 기록
      await this.createSocialActivity({
        userId,
        type: ActivityType.CHALLENGE_COMPLETED,
        title: `"${challenge.title}" 챌린지를 완료했습니다!`,
        data: { challengeId },
      });
    }

    return this.challengeParticipantRepository.save(participant);
  }

  // 사용자 검색 (친구 추가용)
  async searchUsers(
    query: string,
    currentUserId: number,
    limit: number = 10,
  ): Promise<User[]> {
    const users = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :currentUserId', { currentUserId })
      .andWhere('(user.name LIKE :query OR user.email LIKE :query)', {
        query: `%${query}%`,
      })
      .take(limit)
      .getMany();

    return users;
  }

  // 헬퍼 메서드들
  private async getFriendIds(userId: number): Promise<number[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.ACCEPTED },
        { addressee: { id: userId }, status: FriendshipStatus.ACCEPTED },
      ],
    });

    return friendships.map((f) =>
      f.requester.id === userId ? f.addressee.id : f.requester.id,
    );
  }

  private async getMutualFriendsCount(
    userId1: number,
    userId2: number,
  ): Promise<number> {
    const user1Friends = await this.getFriendIds(userId1);
    const user2Friends = await this.getFriendIds(userId2);

    return user1Friends.filter((id) => user2Friends.includes(id)).length;
  }

  private calculateChallengeRewardXP(dto: CreateChallengeDto): number {
    const baseXP = Math.floor(dto.targetValue / 10);
    const typeMultiplier = dto.type === ChallengeType.GROUP ? 1.5 : 1;
    const durationDays = Math.ceil(
      (new Date(dto.endDate).getTime() - new Date(dto.startDate).getTime()) /
        (1000 * 60 * 60 * 24),
    );
    const durationMultiplier = Math.max(1, durationDays / 7); // 주당 배율

    return Math.floor(baseXP * typeMultiplier * durationMultiplier);
  }

  private calculateChallengeRewardPoints(dto: CreateChallengeDto): number {
    return Math.floor(this.calculateChallengeRewardXP(dto) / 5);
  }

  private async createSocialActivity(data: {
    userId: number;
    type: ActivityType;
    title: string;
    description?: string;
    data?: any;
    isPublic?: boolean;
  }): Promise<SocialActivity> {
    const activity = this.socialActivityRepository.create({
      ...data,
      isPublic: data.isPublic !== false,
    });

    return this.socialActivityRepository.save(activity);
  }

  // 챌린지 완료 시 보상 지급
  private async awardChallengeRewards(
    userId: number,
    challenge: Challenge,
  ): Promise<void> {
    try {
      const user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) return;

      // XP 보상 지급
      if (challenge.rewardXP > 0) {
        user.experience += challenge.rewardXP;

        // 레벨업 체크 (LevelsService가 있다면 사용)
        // await this.levelsService.addXPAndCheckLevelUp(userId, challenge.rewardXP);
      }

      // 포인트 보상 지급 (User 엔티티에 points 필드가 있다면)
      // if (challenge.rewardPoints > 0) {
      //   user.points = (user.points || 0) + challenge.rewardPoints;
      // }

      await this.userRepository.save(user);
    } catch (error) {
      console.error('Failed to award challenge rewards:', error);
    }
  }

  // 친구 추천
  async getFriendSuggestions(
    userId: number,
    limit: number = 5,
  ): Promise<User[]> {
    const currentFriendIds = await this.getFriendIds(userId);
    const pendingRequestIds = await this.getPendingRequestIds(userId);
    const excludeIds = [...currentFriendIds, ...pendingRequestIds, userId];

    // 공통 친구가 있는 사용자들을 우선 추천
    const suggestions = await this.userRepository
      .createQueryBuilder('user')
      .where('user.id NOT IN (:...excludeIds)', { excludeIds })
      .orderBy('user.createdAt', 'DESC') // 최근 가입자 우선
      .take(limit)
      .getMany();

    return suggestions;
  }

  private async getPendingRequestIds(userId: number): Promise<number[]> {
    const pendingRequests = await this.friendshipRepository.find({
      where: [
        { requester: { id: userId }, status: FriendshipStatus.PENDING },
        { addressee: { id: userId }, status: FriendshipStatus.PENDING },
      ],
    });

    return pendingRequests.map((f) =>
      f.requester.id === userId ? f.addressee.id : f.requester.id,
    );
  }

  // 친구 상태 확인
  async getFriendshipStatus(
    currentUserId: number,
    targetUserId: number,
  ): Promise<{ isFriend: boolean; friendRequestSent: boolean }> {
    const friendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: currentUserId }, addressee: { id: targetUserId } },
        { requester: { id: targetUserId }, addressee: { id: currentUserId } },
      ],
    });

    if (!friendship) {
      return { isFriend: false, friendRequestSent: false };
    }

    if (friendship.status === FriendshipStatus.ACCEPTED) {
      return { isFriend: true, friendRequestSent: false };
    }

    if (friendship.status === FriendshipStatus.PENDING) {
      const friendRequestSent = friendship.requester.id === currentUserId;
      return { isFriend: false, friendRequestSent };
    }

    return { isFriend: false, friendRequestSent: false };
  }
}
