import { request } from './client';
import type { Group, Message, User } from './types';

export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: User }>('/auth/login', { method: 'POST', body: { email, password } }),
  me: () => request<{ user: User }>('/auth/me'),
};

export const groupsApi = {
  list: () => request<{ groups: Group[] }>('/groups'),
};

export const messagesApi = {
  list: (groupId: number, params: { after?: number; before?: number; limit?: number } = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]): [string, string] => [k, String(v)])
    ).toString();
    return request<{ messages: Message[] }>(`/messages/${groupId}${qs ? `?${qs}` : ''}`);
  },
  send: (groupId: number, content: string) =>
    request<{ message: Message }>('/messages', { method: 'POST', body: { groupId, content } }),
};
