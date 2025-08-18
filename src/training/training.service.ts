import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TrainingProgram } from './entities/training-program.entity';
import { TrainingSession } from './entities/training-session.entity';
import { TrainingSeries } from './entities/training-series.entity';
import { TrainingMeeting } from './entities/training-meeting.entity';
import { TrainingMeetingParticipation } from './entities/training-meeting-participation.entity';

@Injectable()
export class TrainingService {
  constructor(
    @InjectRepository(TrainingProgram)
    private trainingProgramRepository: Repository<TrainingProgram>,
    @InjectRepository(TrainingSession)
    private trainingSessionRepository: Repository<TrainingSession>,
    @InjectRepository(TrainingSeries)
    private trainingSeriesRepository: Repository<TrainingSeries>,
    @InjectRepository(TrainingMeeting)
    private trainingMeetingRepository: Repository<TrainingMeeting>,
    @InjectRepository(TrainingMeetingParticipation)
    private trainingMeetingParticipationRepository: Repository<TrainingMeetingParticipation>,
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
      relations: ['user', 'sessions'],
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

    if (!program.isPublished) {
      throw new ForbiddenException('Cannot join unpublished program');
    }

    if (program.visibility === 'private') {
      throw new ForbiddenException('Cannot join private program');
    }

    // 참여자 수 제한 확인
    if (program.maxParticipants) {
      const currentParticipants = program.participantsCount || 0;
      if (currentParticipants >= program.maxParticipants) {
        throw new ForbiddenException('Program is full');
      }
    }
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

  // Training Session Methods
  async createSession(
    sessionData: Partial<TrainingSession>,
    userId: number,
  ): Promise<TrainingSession> {
    // TrainingSession은 TrainingProgram에 속하므로 user 정보는 TrainingProgram을 통해 확인
    const session = this.trainingSessionRepository.create({
      ...sessionData,
      user: { id: userId },
    });
    return await this.trainingSessionRepository.save(session);
  }

  async findAllSessions(): Promise<TrainingSession[]> {
    return await this.trainingSessionRepository.find({
      relations: ['trainingProgram'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSessionsByProgram(programId: number): Promise<TrainingSession[]> {
    return await this.trainingSessionRepository.find({
      where: { trainingProgram: { id: programId } },
      order: { weekNumber: 'ASC', sessionNumber: 'ASC' },
    });
  }

  // Training Series Methods
  async createSeries(
    seriesData: Partial<TrainingSeries>,
    userId: number,
  ): Promise<TrainingSeries> {
    const series = this.trainingSeriesRepository.create({
      ...seriesData,
      user: { id: userId },
    });
    return await this.trainingSeriesRepository.save(series);
  }

  async findMySeries(userId: number): Promise<TrainingSeries[]> {
    return await this.trainingSeriesRepository.find({
      where: { user: { id: userId } },
      relations: ['trainingProgram', 'meetings'],
      order: { createdAt: 'DESC' },
    });
  }

  async findPublicSeries(): Promise<TrainingSeries[]> {
    return await this.trainingSeriesRepository.find({
      where: { isPublished: true, isActive: true },
      relations: ['user', 'trainingProgram', 'meetings'],
      order: { createdAt: 'DESC' },
    });
  }

  async findSeriesById(id: number): Promise<TrainingSeries> {
    const series = await this.trainingSeriesRepository.findOne({
      where: { id },
      relations: [
        'user',
        'trainingProgram',
        'meetings',
        'meetings.participations',
      ],
    });
    if (!series) {
      throw new NotFoundException('Training series not found');
    }
    return series;
  }

  async updateSeries(
    id: number,
    updateData: Partial<TrainingSeries>,
    userId: number,
  ): Promise<TrainingSeries> {
    const series = await this.findSeriesById(id);
    if (series.user.id !== userId) {
      throw new ForbiddenException('You can only update your own series');
    }

    Object.assign(series, updateData);
    return await this.trainingSeriesRepository.save(series);
  }

  async deleteSeries(id: number, userId: number): Promise<void> {
    const series = await this.findSeriesById(id);
    if (series.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own series');
    }

    await this.trainingSeriesRepository.remove(series);
  }

  async publishSeries(id: number, userId: number): Promise<TrainingSeries> {
    const series = await this.findSeriesById(id);
    if (series.user.id !== userId) {
      throw new ForbiddenException('You can only publish your own series');
    }

    series.isPublished = true;
    return await this.trainingSeriesRepository.save(series);
  }

  async unpublishSeries(id: number, userId: number): Promise<TrainingSeries> {
    const series = await this.findSeriesById(id);
    if (series.user.id !== userId) {
      throw new ForbiddenException('You can only unpublish your own series');
    }

    series.isPublished = false;
    return await this.trainingSeriesRepository.save(series);
  }

  // Training Meeting Methods
  async createMeeting(
    meetingData: Partial<TrainingMeeting>,
  ): Promise<TrainingMeeting> {
    const meeting = this.trainingMeetingRepository.create(meetingData);
    return await this.trainingMeetingRepository.save(meeting);
  }

  async findMeetingsBySeries(seriesId: number): Promise<TrainingMeeting[]> {
    return await this.trainingMeetingRepository.find({
      where: { series: { id: seriesId } },
      relations: ['participations', 'participations.user'],
      order: { meetingDate: 'ASC' },
    });
  }

  async findMeetingById(id: number): Promise<TrainingMeeting> {
    const meeting = await this.trainingMeetingRepository.findOne({
      where: { id },
      relations: ['series', 'participations', 'participations.user'],
    });
    if (!meeting) {
      throw new NotFoundException('Training meeting not found');
    }
    return meeting;
  }

  async updateMeeting(
    id: number,
    updateData: Partial<TrainingMeeting>,
    userId: number,
  ): Promise<TrainingMeeting> {
    const meeting = await this.findMeetingById(id);
    if (meeting.series.user.id !== userId) {
      throw new ForbiddenException(
        'You can only update meetings in your own series',
      );
    }

    // 수정된 경우 표시
    if (
      JSON.stringify(updateData) !==
      JSON.stringify({
        title: meeting.title,
        description: meeting.description,
        location: meeting.location,
        minParticipants: meeting.minParticipants,
        maxParticipants: meeting.maxParticipants,
      })
    ) {
      updateData.isModified = true;
    }

    Object.assign(meeting, updateData);
    return await this.trainingMeetingRepository.save(meeting);
  }

  async deleteMeeting(id: number, userId: number): Promise<void> {
    const meeting = await this.findMeetingById(id);
    if (meeting.series.user.id !== userId) {
      throw new ForbiddenException(
        'You can only delete meetings in your own series',
      );
    }

    await this.trainingMeetingRepository.remove(meeting);
  }

  // Meeting Participation Methods
  async joinMeeting(
    meetingId: number,
    userId: number,
    data: any,
  ): Promise<TrainingMeetingParticipation> {
    const meeting = await this.findMeetingById(meetingId);

    // 이미 참여 중인지 확인
    const existingParticipation =
      await this.trainingMeetingParticipationRepository.findOne({
        where: { meeting: { id: meetingId }, user: { id: userId } },
      });

    if (existingParticipation) {
      throw new ForbiddenException(
        'You are already participating in this meeting',
      );
    }

    // 모임이 가득 찼는지 확인
    if (meeting.currentParticipants >= meeting.maxParticipants) {
      throw new ForbiddenException('This meeting is already full');
    }

    // 참여 생성
    const participation = this.trainingMeetingParticipationRepository.create({
      meeting: { id: meetingId },
      user: { id: userId },
      status: 'confirmed',
      isRegularParticipant: data.isRegularParticipant || false,
      notes: data.notes,
    });

    await this.trainingMeetingParticipationRepository.save(participation);

    // 참여자 수 업데이트
    meeting.currentParticipants += 1;
    if (meeting.currentParticipants >= meeting.maxParticipants) {
      meeting.status = 'full';
    }
    await this.trainingMeetingRepository.save(meeting);

    return participation;
  }

  async leaveMeeting(meetingId: number, userId: number): Promise<void> {
    const participation =
      await this.trainingMeetingParticipationRepository.findOne({
        where: { meeting: { id: meetingId }, user: { id: userId } },
      });

    if (!participation) {
      throw new NotFoundException('Participation not found');
    }

    await this.trainingMeetingParticipationRepository.remove(participation);

    // 참여자 수 업데이트
    const meeting = await this.findMeetingById(meetingId);
    meeting.currentParticipants -= 1;
    if (meeting.status === 'full') {
      meeting.status = 'open';
    }
    await this.trainingMeetingRepository.save(meeting);
  }

  async findMeetingParticipants(
    meetingId: number,
  ): Promise<TrainingMeetingParticipation[]> {
    return await this.trainingMeetingParticipationRepository.find({
      where: { meeting: { id: meetingId } },
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });
  }

  async findMyMeetingParticipations(
    userId: number,
  ): Promise<TrainingMeetingParticipation[]> {
    return await this.trainingMeetingParticipationRepository.find({
      where: { user: { id: userId } },
      relations: ['meeting', 'meeting.series'],
      order: { createdAt: 'DESC' },
    });
  }

  // Auto-generation Methods
  async generateNextMeetings(
    seriesId: number,
    userId: number,
  ): Promise<TrainingMeeting[]> {
    const series = await this.findSeriesById(seriesId);
    if (series.user.id !== userId) {
      throw new ForbiddenException(
        'You can only generate meetings for your own series',
      );
    }

    if (series.type !== 'recurring') {
      throw new ForbiddenException(
        'Only recurring series can generate next meetings',
      );
    }

    const meetings: TrainingMeeting[] = [];
    const now = new Date();
    let currentDate = new Date(series.startDate || now);

    // 다음 모임부터 4주간 생성
    for (let week = 0; week < 4; week++) {
      // 각 반복 요일에 대해 모임 생성
      for (const day of series.repeatDays || []) {
        const dayOfWeek = this.getDayOfWeek(day);
        let targetDate = new Date(currentDate);

        // 다음 해당 요일 찾기
        while (targetDate.getDay() !== dayOfWeek) {
          targetDate.setDate(targetDate.getDate() + 1);
        }

        // 이미 지난 날짜는 건너뛰기
        if (targetDate <= now) {
          continue;
        }

        // 종료 날짜가 설정되어 있고 지났으면 건너뛰기
        if (series.endDate && targetDate > series.endDate) {
          continue;
        }

        // 이미 존재하는 모임인지 확인
        const existingMeeting = await this.trainingMeetingRepository.findOne({
          where: {
            series: { id: seriesId },
            meetingDate: targetDate,
          },
        });

        if (!existingMeeting) {
          const meeting = this.trainingMeetingRepository.create({
            title: series.title,
            description: series.description,
            meetingDate: targetDate,
            startTime: series.repeatTime,
            duration: series.duration,
            location: series.defaultLocation,
            minParticipants: series.defaultMinParticipants,
            maxParticipants: series.defaultMaxParticipants,
            currentParticipants: 0,
            status: 'open',
            series: { id: seriesId },
            isModified: false,
          });

          meetings.push(await this.trainingMeetingRepository.save(meeting));
        }
      }

      // 다음 주로 이동
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  }

  async generateRecurringMeetings(
    seriesId: number,
    userId: number,
    weeks: number = 4,
  ): Promise<TrainingMeeting[]> {
    const series = await this.findSeriesById(seriesId);

    if (series.user.id !== userId) {
      throw new ForbiddenException(
        'You can only generate meetings for your own series',
      );
    }

    if (series.type !== 'recurring') {
      throw new ForbiddenException(
        'Only recurring series can generate meetings',
      );
    }

    const meetings: TrainingMeeting[] = [];
    const now = new Date();
    let currentDate = new Date(series.startDate || now);

    // 설정된 주 수만큼 모임 생성
    for (let week = 0; week < weeks; week++) {
      // 각 반복 요일에 대해 모임 생성
      for (const day of series.repeatDays || []) {
        const dayOfWeek = this.getDayOfWeek(day);
        let targetDate = new Date(currentDate);

        // 다음 해당 요일 찾기
        while (targetDate.getDay() !== dayOfWeek) {
          targetDate.setDate(targetDate.getDate() + 1);
        }

        // 이미 지난 날짜는 건너뛰기
        if (targetDate <= now) {
          continue;
        }

        // 종료 날짜가 설정되어 있고 지났으면 건너뛰기
        if (series.endDate && targetDate > series.endDate) {
          continue;
        }

        // 이미 존재하는 모임인지 확인
        const existingMeeting = await this.trainingMeetingRepository.findOne({
          where: {
            series: { id: seriesId },
            meetingDate: targetDate,
          },
        });

        if (!existingMeeting) {
          const meeting = this.trainingMeetingRepository.create({
            title: `${series.title} - ${week + 1}주차`,
            description: series.description,
            meetingDate: targetDate,
            startTime: series.repeatTime,
            duration: series.duration,
            location: series.defaultLocation,
            minParticipants: series.defaultMinParticipants,
            maxParticipants: series.defaultMaxParticipants,
            currentParticipants: 0,
            status: 'open',
            series: { id: seriesId },
            isModified: false,
          });

          meetings.push(await this.trainingMeetingRepository.save(meeting));
        }
      }

      // 다음 주로 이동
      currentDate.setDate(currentDate.getDate() + 7);
    }

    return meetings;
  }

  private getDayOfWeek(day: string): number {
    const dayMap: { [key: string]: number } = {
      sunday: 0,
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
    };
    return dayMap[day.toLowerCase()] || 0;
  }
}
