import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgramProgress } from './entities/training-program-progress.entity';
import { TrainingSessionCompletion } from './entities/training-session-completion.entity';

@Injectable()
export class TrainingProgressService {
  constructor(
    @InjectRepository(TrainingProgramProgress)
    private trainingProgramProgressRepository: Repository<TrainingProgramProgress>,
    @InjectRepository(TrainingSessionCompletion)
    private trainingSessionCompletionRepository: Repository<TrainingSessionCompletion>,
  ) {}

  // Program Progress Methods
  async startProgram(
    programId: number,
    userId: number,
    totalSessions: number,
  ): Promise<TrainingProgramProgress> {
    // 이미 시작한 프로그램인지 확인
    const existingProgress =
      await this.trainingProgramProgressRepository.findOne({
        where: { program: { id: programId }, user: { id: userId } },
      });

    if (existingProgress) {
      throw new ForbiddenException('You have already started this program');
    }

    // 프로그램 진행률 생성
    const progress = this.trainingProgramProgressRepository.create({
      program: { id: programId },
      user: { id: userId },
      totalSessions,
      startDate: new Date(),
      status: 'active',
    });

    return await this.trainingProgramProgressRepository.save(progress);
  }

  async completeSession(
    sessionId: number,
    userId: number,
    programId: number,
    completionData: any,
  ): Promise<TrainingSessionCompletion> {
    // 이미 완료한 세션인지 확인
    const existingCompletion =
      await this.trainingSessionCompletionRepository.findOne({
        where: { session: { id: sessionId }, user: { id: userId } },
      });

    if (existingCompletion) {
      throw new ForbiddenException('Session already completed');
    }

    // 세션 완료 생성
    const completion = this.trainingSessionCompletionRepository.create({
      session: { id: sessionId },
      user: { id: userId },
      completedDate: new Date(),
      status: completionData.status || 'completed',
      actualDuration: completionData.actualDuration,
      difficultyRating: completionData.difficultyRating,
      notes: completionData.notes,
      performanceMetrics: completionData.performanceMetrics,
    });

    await this.trainingSessionCompletionRepository.save(completion);

    // 프로그램 진행률 업데이트
    await this.updateProgramProgress(programId, userId);

    return completion;
  }

  async updateProgramProgress(
    programId: number,
    userId: number,
  ): Promise<TrainingProgramProgress> {
    const progress = await this.trainingProgramProgressRepository.findOne({
      where: { program: { id: programId }, user: { id: userId } },
    });

    if (!progress) {
      throw new NotFoundException('Program progress not found');
    }

    // 완료된 세션 수 계산
    const completedSessions =
      await this.trainingSessionCompletionRepository.count({
        where: {
          user: { id: userId },
          session: { trainingProgram: { id: programId } },
          status: 'completed',
        },
      });

    // 진행률 계산
    const progressPercentage =
      progress.totalSessions > 0
        ? (completedSessions / progress.totalSessions) * 100
        : 0;

    // 상태 업데이트
    let status = progress.status;
    if (progressPercentage >= 100) {
      status = 'completed';
    } else if (progressPercentage > 0) {
      status = 'active';
    }

    Object.assign(progress, {
      completedSessions,
      progressPercentage,
      lastCompletedDate: new Date(),
      status,
    });

    return await this.trainingProgramProgressRepository.save(progress);
  }

  async getProgramProgress(
    programId: number,
    userId: number,
  ): Promise<TrainingProgramProgress> {
    const progress = await this.trainingProgramProgressRepository.findOne({
      where: { program: { id: programId }, user: { id: userId } },
      relations: ['program'],
    });

    if (!progress) {
      throw new NotFoundException('Program progress not found');
    }

    return progress;
  }

  async getUserProgramsProgress(
    userId: number,
  ): Promise<TrainingProgramProgress[]> {
    return await this.trainingProgramProgressRepository.find({
      where: { user: { id: userId } },
      relations: ['program'],
      order: { updatedAt: 'DESC' },
    });
  }

  async getSessionCompletion(
    sessionId: number,
    userId: number,
  ): Promise<TrainingSessionCompletion | null> {
    return await this.trainingSessionCompletionRepository.findOne({
      where: { session: { id: sessionId }, user: { id: userId } },
    });
  }

  async updateSessionCompletion(
    sessionId: number,
    userId: number,
    updateData: any,
  ): Promise<TrainingSessionCompletion> {
    const completion = await this.trainingSessionCompletionRepository.findOne({
      where: { session: { id: sessionId }, user: { id: userId } },
    });

    if (!completion) {
      throw new NotFoundException('Session completion not found');
    }

    Object.assign(completion, updateData);
    return await this.trainingSessionCompletionRepository.save(completion);
  }

  async deleteSessionCompletion(
    sessionId: number,
    userId: number,
  ): Promise<void> {
    const completion = await this.trainingSessionCompletionRepository.findOne({
      where: { session: { id: sessionId }, user: { id: userId } },
    });

    if (!completion) {
      throw new NotFoundException('Session completion not found');
    }

    await this.trainingSessionCompletionRepository.remove(completion);
  }
}
