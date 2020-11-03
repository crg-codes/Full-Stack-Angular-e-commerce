import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MdbSelectComponent } from './select.component';
import { MdbOptionModule } from './../option/option.module';
import { OverlayModule } from '@angular/cdk/overlay';
import { MdbSelectFilterComponent } from './select-filter.component';

@NgModule({
  declarations: [MdbSelectComponent, MdbSelectFilterComponent],
  imports: [CommonModule, MdbOptionModule, OverlayModule],
  exports: [MdbSelectComponent, MdbSelectFilterComponent, MdbOptionModule],
})
export class MdbSelectModule {}
