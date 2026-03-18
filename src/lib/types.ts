export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiated' | 'won' | 'lost';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  quota: number;
}

export interface TeamSettings {
  id: string;
  totalTeamQuota: number;
  monthlyTarget: number;
  updatedAt: any;
}

export interface Lead {
  id: string;
  ownerUid: string;
  ownerName?: string;
  ownerAvatar?: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  tags: string[];
  dealValue: number;
  source: string;
  nextFollowUpAt?: any; // Firestore Timestamp or Date
  lastContactAt?: any;   // Firestore Timestamp or Date
  createdAt: any;
  updatedAt: any;
  customFields: Record<string, any>;
  notesCount: number;
  callsCount: number;
}

export interface Activity {
  id: string;
  leadId: string;
  ownerUid: string;
  ownerName?: string;
  type: 'note' | 'call' | 'status_change' | 'tag_added' | 'event_created';
  content: string;
  createdAt: any;
  oldStatus?: string;
  newStatus?: string;
}

export interface CalendarEvent {
  id: string;
  ownerUid: string;
  ownerName?: string;
  leadId?: string;
  title: string;
  description: string;
  startAt: any;
  endAt?: any;
  allDay: boolean;
  eventType: 'follow-up' | 'meeting' | 'task' | 'reminder';
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface TrainingMaterial {
  id: string;
  userId: string;
  title: string;
  subject: string;
  content: string;
  createdAt: any;
}
