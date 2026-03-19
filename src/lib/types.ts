
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

export interface Contact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  secondaryPhone?: string;
  email?: string;
  notes?: string;
  linkedLeadId?: string;
  createdAt: any;
  updatedAt: any;
}

export interface WhatsAppLog {
  id: string;
  relatedId: string; // leadId or contactId
  message: string;
  status: 'sent' | 'failed';
  createdAt: any;
}

export interface Activity {
  id: string;
  leadId: string;
  ownerUid: string;
  ownerName?: string;
  type: 'note' | 'call' | 'status_change' | 'tag_added' | 'event_created' | 'whatsapp_sent';
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
  type?: 'pdf' | 'link' | 'video' | 'doc' | 'image';
  fileUrl?: string;
  createdAt: any;
}

export interface UserNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: any;
  updatedAt: any;
}

export interface TabPreferences {
  [tabName: string]: {
    visibleSections: string[];
    density: 'compact' | 'normal';
    sortBy?: string;
    hideArchived?: boolean;
  }
}

export interface UserPreferences {
  notifications: {
    enabled: boolean;
    followups: boolean;
    team: boolean;
  };
  tabSettings: TabPreferences;
}
