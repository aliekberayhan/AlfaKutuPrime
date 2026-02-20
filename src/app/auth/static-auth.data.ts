export interface StaticUser {
  userName: string;
  password: string;
  roles: string[];
  active: boolean;
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
  'Kalite.View',
  'Samples.Create',
  'Samples.View',
  'Samples.Manage',
  'Samples.Notes',
  'Customers.Manage'
];

export const ROLES: StaticRole[] = [
  { name: 'Admin', displayName: 'Administrator', permissions: PERMISSIONS.slice() },
  { name: 'Customer', displayName: 'Customer', permissions: ['Samples.Create','Samples.View'] },
  { name: 'Muhasebe', displayName: 'Muhasebe', permissions: ['Samples.Manage','Samples.Notes','Customer.View','Customers.Manage'] },
  { name: 'Kalite', displayName: 'Kalite', permissions: ['Fis.View','Fis.Edit','Kalite.View'] },
];

export const USERS: StaticUser[] = [
  { userName: 'admin', password: 'admin123', roles: ['Admin'], active: true },
  { userName: 'customer1', password: 'customer123', roles: ['Customer'], active: true },
  { userName: 'customer2', password: 'customer123', roles: ['Customer'], active: true },
  { userName: 'muhasebe', password: 'muhasebe123', roles: ['Muhasebe'], active: true },
  { userName: 'kalite', password: 'kalite123', roles: ['Kalite'], active: true }
];

