export type ItemType = 'nota' | 'lembrete' | 'link';

export interface CardItem {
  id: string;
  type: ItemType;
  title: string;
  content: string; // The URL for link, text content for notes/reminders
  date?: string; // Optional date (deadline for reminder, context date for notes)
  createdAt: string;
  completed?: boolean; // For reminders, toggle completion
  imageUrl?: string; // Optional analyzed image source or original
  aiGenerated?: boolean; // Label notes generated/enhanced by Gemini
  aiSummary?: string; // Optional AI summarized insights/metadata
}

export interface UserSettings {
  isPasswordSet: boolean;
  theme: 'light' | 'dark';
}
