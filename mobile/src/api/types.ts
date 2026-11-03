export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  area: string;
};

export type Group = {
  id: number;
  name: string;
  description: string;
  isAnnouncementOnly: boolean;
  targetArea: string | null;
  canWrite: boolean;
  lastMessageContent: string | null;
  lastMessageAt: string | null;
};

export type Message = {
  id: number;
  groupId: number;
  senderId: number;
  senderName: string;
  senderRole: string;
  content: string;
  parentMessageId: number | null;
  createdAt: string;
};
