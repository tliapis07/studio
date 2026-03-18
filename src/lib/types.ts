
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiated' | 'won' | 'lost';

export interface Lead {
  id: string;
  ownerUid: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  tags: string[];
  leadScore: number;
  dealValue: number;
  source: string;
  nextFollowUpAt?: any; // Firestore Timestamp or Date
  lastContactAt?: any;   // Firestore Timestamp or Date
  createdAt: any;
  updatedAt: any;
  customFields: Record<string, any>;
  notesCount: number;
  callsCount: number;
  location?: {
    lat: number;
    lng: number;
    address?: string;
  };
}

export interface Activity {
  id: string;
  leadId: string;
  ownerUid: string;
  type: 'note' | 'call' | 'status_change' | 'tag_added' | 'event_created';
  content: string;
  createdAt: any;
  oldStatus?: string;
  newStatus?: string;
}

export interface CalendarEvent {
  id: string;
  ownerUid: string;
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

export interface DashboardStats {
  totalLeads: number;
  qualifiedLeads: number;
  closedDeals: number;
  totalRevenue: number;
  revenueChange: number;
  leadsChange: number;
  qualifiedChange: number;
  dealsChange: number;
}
