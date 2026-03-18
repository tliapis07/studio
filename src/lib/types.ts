
export type LeadStatus = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';

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
  nextFollowUpAt?: Date;
  lastContactAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  customFields: Record<string, any>;
  notesCount: number;
  callsCount: number;
}

export interface Activity {
  id: string;
  leadId: string;
  type: 'note' | 'call' | 'status_change' | 'tag_added';
  content: string;
  createdAt: Date;
  oldStatus?: string;
  newStatus?: string;
}

export interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  qualifiedLeads: number;
  wonDeals: number;
  totalValue: number;
  conversionRate: number;
}
