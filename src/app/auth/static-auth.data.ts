export interface StaticUser {
  userName: string;
  password: string;
  roles: string[];
}

export interface StaticRole {
  name: string;
  displayName?: string;
  permissions: string[];
}

export const PERMISSIONS: string[] = [
  'Admin',
  'Fis.View',
  'Fis.Edit',
  'Users.View',
  'Users.Create',
  'Roles.View',
  'Roles.Create',
  'Customer.View',
  'Kalite.View'
];

export const ROLES: StaticRole[] = [
  { name: 'Admin', displayName: 'Administrator', permissions: PERMISSIONS.slice() },
  { name: 'Customer', displayName: 'Customer', permissions: [] },
  { name: 'Muhasebe', displayName: 'Muhasebe', permissions: [] },
  { name: 'Kalite', displayName: 'Kalite', permissions: ['Fis.View', 'Fis.Edit'] },
];

export const USERS: StaticUser[] = [
  { userName: 'admin', password: 'admin123', roles: ['Admin'] },
  { userName: 'customer1', password: 'customer123', roles: ['Customer'] },
  { userName: 'customer2', password: 'customer123', roles: ['Customer'] },
  { userName: 'muhasebe', password: 'muhasebe123', roles: ['Muhasebe'] },
  { userName: 'kalite', password: 'kalite123', roles: ['Kalite'] }
];

