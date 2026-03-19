export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiated' | 'won' | 'lost';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar: string;
  quota: number;
}

export interface UserProfile {
  id: string;
  theme: 'light' | 'dark' | 'system';
  profilePicURL?: string;
  status?: string;
  statusUpdatedAt?: any;
  timeZone: string;
  notificationSoundsEnabled: boolean;
  defaultLeadStatus: LeadStatus;
  compactModeEnabled: boolean;
  autoArchiveClosedLeadsAfterDays?: number;
  language: string;
  currency: string;
  tabLayouts: Record<string, TabPreferences>;
  organization?: string;
  displayName?: string;
}

export interface Lead {
  id: string;
  ownerUid: string; // Unified ownership field
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

export interface Contact {
  id: string;
  ownerUid: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  linkedLeadId?: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export interface Activity {
  id: string;
  leadId?: string;
  ownerUid: string;
  ownerName?: string;
  type: 'note' | 'call' | 'status_change' | 'tag_added' | 'event_created' | 'whatsapp_sent' | 'lead_added';
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
  eventType: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: any;
}

export interface TrainingMaterial {
  id: string;
  ownerUid: string;
  title: string;
  subject: string;
  content: string;
  type?: 'pdf' | 'link' | 'video' | 'doc' | 'image';
  fileUrl?: string;
  createdAt: any;
  updatedAt: any;
}

export interface UserNote {
  id: string;
  ownerUid: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export interface TabPreferences {
  visibleSections: string[];
  density: 'compact' | 'normal';
  sortBy?: string;
  hideArchived?: boolean;
}
