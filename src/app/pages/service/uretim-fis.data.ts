import products from '@/assets/products.json';

import type { UretimFisDto } from './fis.service';

export const URETIM_FIS: UretimFisDto[] = (products as any).Uretim_Fisleri ?? [];

export default URETIM_FIS;

