import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgram } from './entities/training-program.entity';
import { TrainingSession } from './entities/training-session.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingProgram)
    private trainingProgramRepository: Repository<TrainingProgram>,
    @InjectRepository(TrainingSession)
    private trainingSessionRepository: Repository<TrainingSession>,
  ) {}

  async createProgram(
    programData: Partial<TrainingProgram>,
  ): Promise<TrainingProgram> {
    const program = this.trainingProgramRepository.create(programData);
    return await this.trainingProgramRepository.save(program);
  }

  async findAllPrograms(): Promise<TrainingProgram[]> {
    return await this.trainingProgramRepository.find({
      where: { isPublished: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findProgramById(id: number): Promise<TrainingProgram> {
    const program = await this.trainingProgramRepository.findOne({
      where: { id },
      relations: ['user', 'sessions'],
    });
    if (!program) {
      throw new NotFoundException(`Training program with ID ${id} not found`);
    }
    return program;
  }

  async createSession(
    sessionData: Partial<TrainingSession>,
  ): Promise<TrainingSession> {
    const session = this.trainingSessionRepository.create(sessionData);
    return await this.trainingSessionRepository.save(session);
  }

  async findSessionsByProgram(programId: number): Promise<TrainingSession[]> {
    return await this.trainingSessionRepository.find({
      where: { trainingProgramId: programId },
      order: { weekNumber: 'ASC', sessionNumber: 'ASC' },
    });
  }
}
