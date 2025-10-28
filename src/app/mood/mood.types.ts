export interface MoodRequestDTO { moodText: string; }
export interface MoodResponseDTO {
  userId: string;
  moodText: string;
  aiSummary?: string;
  day: string;
}
