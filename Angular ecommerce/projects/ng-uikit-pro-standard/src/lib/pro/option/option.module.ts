import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionComponent } from './option.component';
import { OptionGroupComponent } from './option-group.component';
import { CheckboxModule } from './../../free/checkbox/checkbox.module';
import { SelectAllOptionComponent } from './select-all-option';

@NgModule({
  imports: [CommonModule, CheckboxModule],
  declarations: [OptionComponent, SelectAllOptionComponent, OptionGroupComponent],
  exports: [OptionComponent, OptionGroupComponent, SelectAllOptionComponent],
})
export class MdbOptionModule {}
