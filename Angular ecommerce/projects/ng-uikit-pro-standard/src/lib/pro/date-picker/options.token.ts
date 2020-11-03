import { InjectionToken } from '@angular/core';

import { IMyOptions } from './interfaces/options.interface';

export const MDB_DATE_OPTIONS = new InjectionToken<IMyOptions>('mdb-date-options');
