
export enum ServiceCategory {
  MINISTRY = 'MINISTRY',
  COUNSELING = 'COUNSELING',
  LIFE_COACHING = 'LIFE_COACHING',
  ABA_THERAPY = 'ABA_THERAPY',
  MENTAL_THERAPY = 'MENTAL_THERAPY'
}

export type BookingStatus = 'PENDING' | 'APPROVED' | 'COMPLETED' | 'CANCELLED';
export type UserRole = 'USER' | 'ADMIN';

export interface UserProfile {
  id: string;
  name: string;
  preferredName?: string;
  avatarUrl?: string;
  email: string;
  bio?: string;
  location?: string;
  focusAreas: string[];
  joinedDate: string;
  role: UserRole;
}

export interface AdminNote {
  id: string;
  userId: string;
  text: string;
  date: string;
  time: string;
  createdAt: string;
}

export interface Service {
  id: ServiceCategory;
  title: string;
  description: string;
  icon: string;
  color: string;
  secondaryColor: string;
  themeClass: string;
  vibe: string;
}

export interface BookingDetails {
  id: string;
  userId: string;
  serviceId: ServiceCategory;
  serviceTitle: string;
  date: string;
  time: string;
  reason: string;
  status: BookingStatus;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  text?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'audio';
  timestamp: string;
  isRead: boolean;
}

export interface Resource {
  id: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  image: string;
}
