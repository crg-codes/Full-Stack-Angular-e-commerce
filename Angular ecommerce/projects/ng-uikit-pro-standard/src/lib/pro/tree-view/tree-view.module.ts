import { NgModule } from '@angular/core';

import { CommonModule } from '@angular/common';

import { MdbTreeComponent } from './tree-view.component';

import { CheckboxModule } from '../../free/checkbox/checkbox.module';

@NgModule({
  imports: [CommonModule, CheckboxModule],
  declarations: [MdbTreeComponent],
  exports: [MdbTreeComponent],
})
export class MdbTreeModule {}
