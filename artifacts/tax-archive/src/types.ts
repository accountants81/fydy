export interface Customer {
  id: string;
  serial: number;
  fullName: string;
  mobile: string;
  nationalId: string;
  password: string;
  city?: string;
  detailedAddress?: string;
  buildingsCount?: number;
  notes?: string;
  gender?: 'ذكر' | 'أنثى';
  altNumbers?: string[];
  declarationLink?: string;
  color?: 'green' | 'blue' | 'red' | 'yellow' | 'gray';
  addedAt: string;
  lastEditedAt: string;
}

export interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;        // ISO date string YYYY-MM-DD
  priority: 'high' | 'medium' | 'low';
  done: boolean;
  createdAt: string;
}

export type AppTheme = 'light' | 'dark';

export type AppView = 'dashboard' | 'customers' | 'trash' | 'backup' | 'settings' | 'chatbot' | 'reminders';

export interface ChatMsg {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  actionExecuted?: {
    type: 'ADD' | 'EDIT' | 'DELETE';
    success: boolean;
    details?: string;
  };
}
