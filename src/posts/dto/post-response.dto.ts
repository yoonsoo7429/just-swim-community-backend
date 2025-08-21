import { User } from '../../users/entities/user.entity';

export class PostResponseDto {
  id: number;
  title: string;
  content: string;
  category: string;
  author: User;
  likes: number;
  comments: number;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
  isLiked?: boolean;

  // 연동된 수영 기록 정보
  swimmingRecord?: {
    id: number;
    title: string;
    totalDistance: number;
    totalDuration: number;
    poolLength: number;
    poolName?: string;
    strokes: Array<{ style: string; distance: number }>;
    calories?: number;
  };

  // 연동된 훈련 프로그램 정보
  trainingProgram?: {
    id: number;
    title: string;
    difficulty: string;
    description?: string;
    visibility?: string;
    isPublished?: boolean;
  };

  // 훈련 모집 관련 정보 (category가 '훈련 모집'일 때만)
  recruitmentInfo?: {
    type?: string;
    meetingDays?: string[];
    meetingTime?: string;
    meetingDateTime?: Date;
    location?: string;
    maxParticipants?: number;
    currentParticipants?: number;
    status?: string;
  };
}
