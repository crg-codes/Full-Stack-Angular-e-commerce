import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { ButtonsModule } from '../../free/buttons/buttons.module';
import { WavesModule } from '../../free/waves/waves.module';
import { MdbTimepickerToggleComponent } from './timepicker-toggle.component';
import { MdbTimePickerDirective } from './timepicker.directive';
import { MdbTimePickerComponent } from './timepicker.component';
import { MdbTimePickerContentComponent } from './timepicker.content';

@NgModule({
  imports: [
    CommonModule,
    OverlayModule,
    A11yModule,
    ButtonsModule.forRoot(),
    WavesModule.forRoot(),
  ],
  declarations: [
    MdbTimePickerComponent,
    MdbTimepickerToggleComponent,
    MdbTimePickerDirective,
    MdbTimePickerContentComponent,
  ],
  exports: [MdbTimePickerComponent, MdbTimepickerToggleComponent, MdbTimePickerDirective],
  bootstrap: [MdbTimePickerContentComponent],
  entryComponents: [MdbTimePickerContentComponent],
})
export class MdbTimePickerModule {}
