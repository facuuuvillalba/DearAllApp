export type Role = {
  id: number;
  name: string;
  description: string;
};

export type User = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  roleId: number;
  role: string;
  area: string;
};

export type SessionUser = {
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
  targetRoleId: number | null;
  targetArea: string | null;
};
