import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgram } from './entities/training-program.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingProgram)
    private trainingProgramRepository: Repository<TrainingProgram>,
  ) {}

  // Training Program Methods
  async createProgram(
    programData: Partial<TrainingProgram>,
    userId: number,
  ): Promise<TrainingProgram> {
    const program = this.trainingProgramRepository.create({
      ...programData,
      user: { id: userId },
    });
    return await this.trainingProgramRepository.save(program);
  }

  async findAllPrograms(): Promise<TrainingProgram[]> {
    return await this.trainingProgramRepository.find({
      where: { isPublished: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublicPrograms(): Promise<TrainingProgram[]> {
    return await this.trainingProgramRepository.find({
      where: { isPublished: true, visibility: 'public' },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findMyPrograms(userId: number): Promise<TrainingProgram[]> {
    return await this.trainingProgramRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProgramById(id: number): Promise<TrainingProgram> {
    const program = await this.trainingProgramRepository.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!program) {
      throw new NotFoundException(`Training program with ID ${id} not found`);
    }
    return program;
  }

  async updateProgram(
    id: number,
    programData: Partial<TrainingProgram>,
    userId: number,
  ): Promise<TrainingProgram> {
    const program = await this.findProgramById(id);
    if (program.user.id !== userId) {
      throw new ForbiddenException('You can only update your own programs');
    }

    Object.assign(program, programData);
    return await this.trainingProgramRepository.save(program);
  }

  async deleteProgram(id: number, userId: number): Promise<void> {
    const program = await this.findProgramById(id);
    if (program.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own programs');
    }

    await this.trainingProgramRepository.remove(program);
  }

  async joinProgram(programId: number, userId: number): Promise<void> {
    const program = await this.findProgramById(programId);
    if (program.visibility === 'private') {
      throw new ForbiddenException('Cannot join private program');
    }

    // 참여자 수 제한 확인은 현재 구현되지 않음
    // 향후 참여자 관리 시스템 구현 시 추가 예정
  }

  async leaveProgram(programId: number, userId: number): Promise<void> {
    await this.findProgramById(programId);
  }

  async findProgramParticipants(programId: number): Promise<any[]> {
    // 프로그램 참여자 목록 조회
    // 실제로는 참여 테이블에서 조회해야 함
    // 현재는 간단하게 빈 배열 반환
    return [];
  }

  async findCommunityTemplates(): Promise<TrainingProgram[]> {
    // 현재는 간단하게 공개된 프로그램들을 반환
    return await this.trainingProgramRepository.find({
      where: {
        isPublished: true,
        visibility: 'public',
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSharedPrograms(): Promise<TrainingProgram[]> {
    // 현재는 간단하게 공개된 프로그램들을 반환
    return await this.trainingProgramRepository.find({
      where: {
        isPublished: true,
        visibility: 'public',
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async duplicateProgram(
    programId: number,
    userId: number,
  ): Promise<TrainingProgram> {
    const originalProgram = await this.findProgramById(programId);

    // 새 프로그램 생성 (복제)
    const newProgram = this.trainingProgramRepository.create({
      title: `${originalProgram.title} (복사본)`,
      description: originalProgram.description,
      difficulty: originalProgram.difficulty,
      visibility: 'private', // 복사본은 기본적으로 private
      isPublished: false,
      user: { id: userId },
    });

    const savedProgram = await this.trainingProgramRepository.save(newProgram);

    return savedProgram;
  }
}
