
import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-lead-activity.ts';
import '@/ai/flows/suggest-lead-next-action.ts';
import '@/ai/flows/process-crm-task.ts';
