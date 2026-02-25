export interface StaticUser {
  userName: string;
  password: string;
  roles: string[];
  active: boolean;
  displayName?: string;
  // Optional customer/company related fields
  company?: string;
  contactName?: string;
  contactTitle?: string;
  address?: string;
  // representative userName (a sales user, role: Sales)
  representative?: string;
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
  'Customers.Manage',
  'Sales.View',
  'Complaints.View',
  'Complaints.Manage',
  'Orders.Create',
  'Orders.Approve',
  'Orders.View',
  'Orders.Delete' // allows deletion of customer orders
];

export const ROLES: StaticRole[] = [
  { name: 'Admin', displayName: 'Administrator', permissions: PERMISSIONS.slice() },
  { name: 'Customer', displayName: 'Customer', permissions: ['Samples.Create', 'Samples.View', 'Complaints.View', 'Orders.Create'] },
  { name: 'Sales', displayName: 'Sales', permissions: ['Samples.Manage', 'Samples.Notes', 'Customer.View', 'Customers.Manage', 'Sales.View', 'Orders.Approve', 'Orders.Delete'] },
  { name: 'Quality', displayName: 'Quality', permissions: ['Fis.View', 'Fis.Edit', 'Kalite.View', 'Complaints.Manage', 'Orders.View'] },
];

export const USERS: StaticUser[] = [
  { userName: 'admin', password: 'admin123', roles: ['Admin'], active: true, displayName: 'Administrator' },

  // Sales / representatives
  { userName: 'sales', password: 'sales123', roles: ['Sales'], active: true, displayName: 'Sales Team' },

  // Quality
  { userName: 'quality', password: 'quality123', roles: ['Quality'], active: true, displayName: 'Quality' },

  // Customers with enriched sample data
  {
    userName: 'customer1',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'ACME Batteries',
    company: 'ACME Battery Co.',
    contactName: 'Ahmet Yılmaz',
    contactTitle: 'Purchasing Manager',
    address: 'Atatürk Cd. No:12, İstanbul, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer2',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'TeknoParts',
    company: 'TeknoParts Ltd.',
    contactName: 'Mehmet Demir',
    contactTitle: 'Procurement Lead',
    address: 'İnönü Blv. 45, Ankara, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer3',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'PowerSolutions',
    company: 'PowerSolutions A.Ş.',
    contactName: 'Ayşe Kaya',
    contactTitle: 'Supply Chain Manager',
    address: 'İzmir Yolu 78, İzmir, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer4',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'GreenElectro',
    company: 'GreenElectro Industries',
    contactName: 'Cem Akın',
    contactTitle: 'Buyer',
    address: 'Bursa Sanayi Bölgesi, Bursa, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer5',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'Orbit Components',
    company: 'Orbit Components Co.',
    contactName: 'Fatma Öztürk',
    contactTitle: 'Head of Procurement',
    address: 'Adana Serbest Bölge, Adana, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer6',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'NovaTech',
    company: 'NovaTech Elektronik',
    contactName: 'Kemal Arslan',
    contactTitle: 'Operations Manager',
    address: 'Konya Organize Sanayi, Konya, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer7',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'QuickParts',
    company: 'QuickParts Manufacturing',
    contactName: 'Elif Sarı',
    contactTitle: 'Logistics Coordinator',
    address: 'Antalya Endüstri Bölgesi, Antalya, Türkiye',
    representative: 'sales'
  },
  {
    userName: 'customer8',
    password: 'customer123',
    roles: ['Customer'],
    active: true,
    displayName: 'PrimeCasings',
    company: 'Prime Casings Ltd.',
    contactName: 'Veli Kara',
    contactTitle: 'Materials Manager',
    address: 'Samsun Sanayi Sitesi, Samsun, Türkiye',
    representative: 'sales'
  }
];

