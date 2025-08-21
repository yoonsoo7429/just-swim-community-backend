import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgramProgress } from './entities/training-program-progress.entity';

@Injectable()
export class TrainingProgressService {
  constructor(
    @InjectRepository(TrainingProgramProgress)
    private trainingProgramProgressRepository: Repository<TrainingProgramProgress>,
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

    // 현재는 세션 완료 기능이 구현되지 않음
    // 향후 세션 관리 시스템 구현 시 추가 예정
    const completedSessions = 0;

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
}
