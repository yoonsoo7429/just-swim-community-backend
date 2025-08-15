import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgramRecruitment } from './entities/training-program-recruitment.entity';
import { TrainingRecruitmentParticipation } from './entities/training-recruitment-participation.entity';

@Injectable()
export class CommunityRecruitmentService {
  constructor(
    @InjectRepository(TrainingProgramRecruitment)
    private trainingProgramRecruitmentRepository: Repository<TrainingProgramRecruitment>,
    @InjectRepository(TrainingRecruitmentParticipation)
    private trainingRecruitmentParticipationRepository: Repository<TrainingRecruitmentParticipation>,
  ) {}

  // Community Recruitment Methods
  async createCommunityRecruitment(
    programId: number,
    userId: number,
    recruitmentData: any,
  ): Promise<TrainingProgramRecruitment> {
    const recruitment = this.trainingProgramRecruitmentRepository.create({
      user: { id: userId },
      program: { id: programId },
      type: recruitmentData.type,
      title: recruitmentData.title,
      description: recruitmentData.description,
      startDate: recruitmentData.startDate,
      endDate: recruitmentData.endDate,
      meetingTime: recruitmentData.meetingTime,
      location: recruitmentData.location,
      repeatDays: recruitmentData.repeatDays,
      recurringStartDate: recruitmentData.recurringStartDate,
      recurringEndDate: recruitmentData.recurringEndDate,
      minParticipants: recruitmentData.minParticipants,
      maxParticipants: recruitmentData.maxParticipants,
      targetLevel: recruitmentData.targetLevel,
      requirements: recruitmentData.requirements,
      isActive: true,
      lastRecruitmentUpdate: new Date(),
    });

    return await this.trainingProgramRecruitmentRepository.save(recruitment);
  }

  async getCommunityRecruitments(
    type?: 'short-term' | 'recurring',
    targetLevel?: string,
    status?: string,
  ): Promise<TrainingProgramRecruitment[]> {
    const queryBuilder = this.trainingProgramRecruitmentRepository
      .createQueryBuilder('recruitment')
      .leftJoinAndSelect('recruitment.user', 'user')
      .leftJoinAndSelect('recruitment.program', 'program')
      .where('recruitment.isActive = :isActive', { isActive: true });

    if (type) {
      queryBuilder.andWhere('recruitment.type = :type', { type });
    }

    if (targetLevel && targetLevel !== 'all') {
      queryBuilder.andWhere('recruitment.targetLevel = :targetLevel', {
        targetLevel,
      });
    }

    if (status) {
      queryBuilder.andWhere('recruitment.status = :status', { status });
    }

    return await queryBuilder
      .orderBy('recruitment.createdAt', 'DESC')
      .getMany();
  }

  async getMyRecruitments(
    userId: number,
  ): Promise<TrainingProgramRecruitment[]> {
    return await this.trainingProgramRecruitmentRepository.find({
      where: { user: { id: userId } },
      relations: ['program'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateRecruitment(
    recruitmentId: number,
    userId: number,
    updateData: any,
  ): Promise<TrainingProgramRecruitment> {
    const recruitment = await this.trainingProgramRecruitmentRepository.findOne(
      {
        where: { id: recruitmentId },
        relations: ['user'],
      },
    );

    if (!recruitment) {
      throw new NotFoundException('Recruitment not found');
    }

    if (recruitment.user.id !== userId) {
      throw new ForbiddenException('You can only update your own recruitments');
    }

    Object.assign(recruitment, updateData);
    recruitment.lastRecruitmentUpdate = new Date();

    return await this.trainingProgramRecruitmentRepository.save(recruitment);
  }

  async deleteRecruitment(
    recruitmentId: number,
    userId: number,
  ): Promise<void> {
    const recruitment = await this.trainingProgramRecruitmentRepository.findOne(
      {
        where: { id: recruitmentId },
        relations: ['user'],
      },
    );

    if (!recruitment) {
      throw new NotFoundException('Recruitment not found');
    }

    if (recruitment.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own recruitments');
    }

    await this.trainingProgramRecruitmentRepository.remove(recruitment);
  }

  async joinRecruitment(
    recruitmentId: number,
    userId: number,
    joinData: any,
  ): Promise<TrainingRecruitmentParticipation> {
    const recruitment = await this.trainingProgramRecruitmentRepository.findOne(
      {
        where: { id: recruitmentId },
      },
    );

    if (!recruitment) {
      throw new NotFoundException('Recruitment not found');
    }

    if (!recruitment.isActive || recruitment.status !== 'open') {
      throw new ForbiddenException('Recruitment is not open for joining');
    }

    // 이미 참여 중인지 확인
    const existingParticipation =
      await this.trainingRecruitmentParticipationRepository.findOne({
        where: { recruitment: { id: recruitmentId }, user: { id: userId } },
      });

    if (existingParticipation) {
      throw new ForbiddenException(
        'You are already participating in this recruitment',
      );
    }

    // 참여자 수 제한 확인
    if (recruitment.currentParticipants >= recruitment.maxParticipants) {
      throw new ForbiddenException('Recruitment is full');
    }

    // 참여 생성
    const participation =
      this.trainingRecruitmentParticipationRepository.create({
        recruitment: { id: recruitmentId },
        user: { id: userId },
        status: 'pending',
        message: joinData.message,
        isRegularParticipant: joinData.isRegularParticipant || false,
        joinDate: new Date(),
        notes: joinData.notes,
      });

    await this.trainingRecruitmentParticipationRepository.save(participation);

    // 참여자 수 업데이트
    recruitment.currentParticipants += 1;
    if (recruitment.currentParticipants >= recruitment.maxParticipants) {
      recruitment.status = 'full';
    }
    await this.trainingProgramRecruitmentRepository.save(recruitment);

    return participation;
  }

  async leaveRecruitment(recruitmentId: number, userId: number): Promise<void> {
    const participation =
      await this.trainingRecruitmentParticipationRepository.findOne({
        where: { recruitment: { id: recruitmentId }, user: { id: userId } },
      });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    await this.trainingRecruitmentParticipationRepository.remove(participation);

    // 참여자 수 업데이트
    const recruitment = await this.trainingProgramRecruitmentRepository.findOne(
      {
        where: { id: recruitmentId },
      },
    );

    if (recruitment) {
      recruitment.currentParticipants -= 1;
      if (recruitment.status === 'full') {
        recruitment.status = 'open';
      }
      await this.trainingProgramRecruitmentRepository.save(recruitment);
    }
  }

  async getRecruitmentParticipants(
    recruitmentId: number,
  ): Promise<TrainingRecruitmentParticipation[]> {
    return await this.trainingRecruitmentParticipationRepository.find({
      where: { recruitment: { id: recruitmentId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async getMyRecruitmentParticipations(
    userId: number,
  ): Promise<TrainingRecruitmentParticipation[]> {
    return await this.trainingRecruitmentParticipationRepository.find({
      where: { user: { id: userId } },
      relations: ['recruitment', 'recruitment.program'],
      order: { createdAt: 'DESC' },
    });
  }

  // Auto-update recurring recruitments
  async updateRecurringRecruitments(): Promise<void> {
    const now = new Date();

    // 정기 모임 중 활성화된 것들 조회
    const recurringRecruitments =
      await this.trainingProgramRecruitmentRepository.find({
        where: {
          type: 'recurring',
          isActive: true,
          status: 'open',
        },
      });

    for (const recruitment of recurringRecruitments) {
      // 종료 날짜가 지났으면 자동 종료
      if (recruitment.recurringEndDate && recruitment.recurringEndDate < now) {
        recruitment.status = 'completed';
        recruitment.isActive = false;
        await this.trainingProgramRecruitmentRepository.save(recruitment);
        continue;
      }

      // 마지막 갱신 후 1주일이 지났으면 모집 글 갱신
      const lastUpdate =
        recruitment.lastRecruitmentUpdate || recruitment.createdAt;
      const daysSinceUpdate = Math.floor(
        (now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysSinceUpdate >= 7) {
        // 모집 글 자동 갱신 (새로운 모집 글 생성)
        const newRecruitment = this.trainingProgramRecruitmentRepository.create(
          {
            user: { id: recruitment.user.id },
            program: { id: recruitment.program.id },
            type: recruitment.type,
            title: `${recruitment.title} - ${new Date().toLocaleDateString('ko-KR')} 모집`,
            description: recruitment.description,
            startDate: recruitment.startDate,
            endDate: recruitment.endDate,
            meetingTime: recruitment.meetingTime,
            location: recruitment.location,
            repeatDays: recruitment.repeatDays,
            recurringStartDate: recruitment.recurringStartDate,
            recurringEndDate: recruitment.recurringEndDate,
            minParticipants: recruitment.minParticipants,
            maxParticipants: recruitment.maxParticipants,
            targetLevel: recruitment.targetLevel,
            requirements: recruitment.requirements,
            isActive: true,
            lastRecruitmentUpdate: new Date(),
          },
        );

        await this.trainingProgramRecruitmentRepository.save(newRecruitment);

        // 기존 모집 글은 아카이브
        recruitment.status = 'closed';
        recruitment.isActive = false;
        await this.trainingProgramRecruitmentRepository.save(recruitment);
      }
    }
  }

  // Auto-close short-term recruitments
  async closeExpiredShortTermRecruitments(): Promise<void> {
    const now = new Date();

    // 단기 모임 중 종료 날짜가 지난 것들 조회
    const expiredRecruitments =
      await this.trainingProgramRecruitmentRepository.find({
        where: {
          type: 'short-term',
          isActive: true,
          status: 'open',
        },
      });

    for (const recruitment of expiredRecruitments) {
      if (recruitment.endDate && recruitment.endDate < now) {
        recruitment.status = 'completed';
        recruitment.isActive = false;
        await this.trainingProgramRecruitmentRepository.save(recruitment);
      }
    }
  }

  // Get recruitment statistics
  async getRecruitmentStatistics(recruitmentId: number): Promise<any> {
    const recruitment = await this.trainingProgramRecruitmentRepository.findOne(
      {
        where: { id: recruitmentId },
      },
    );

    if (!recruitment) {
      throw new NotFoundException('Recruitment not found');
    }

    const participants = await this.getRecruitmentParticipants(recruitmentId);
    const confirmedParticipants = participants.filter(
      (p) => p.status === 'confirmed',
    );
    const pendingParticipants = participants.filter(
      (p) => p.status === 'pending',
    );

    return {
      totalParticipants: participants.length,
      confirmedParticipants: confirmedParticipants.length,
      pendingParticipants: pendingParticipants.length,
      availableSpots:
        recruitment.maxParticipants - recruitment.currentParticipants,
      completionRate:
        recruitment.maxParticipants > 0
          ? (recruitment.currentParticipants / recruitment.maxParticipants) *
            100
          : 0,
    };
  }
}
