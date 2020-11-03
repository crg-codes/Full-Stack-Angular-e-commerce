import { NgModule, ModuleWithProviders } from '@angular/core';

export { BarComponent } from './bar.component';
export { ProgressDirective } from './progress.directive';
export { ProgressbarComponent } from './progressbar.component';
export { ProgressbarModule } from './progressbar.module';
export { ProgressbarConfigComponent } from './progressbar.config.component';
export { ProgressSpinnerComponent } from './progress-spinner.component';
import { ProgressbarModule } from './progressbar.module';

import { MdProgressSpinnerModule } from './progress-spinner-module/index';
import { MdProgressBarModule } from './progress-bars-module/index';

const MATERIAL_MODULES = [MdProgressBarModule, MdProgressSpinnerModule, ProgressbarModule];

@NgModule({
  imports: [
    MdProgressBarModule.forRoot(),
    MdProgressSpinnerModule.forRoot(),
    ProgressbarModule.forRoot(),
  ],
  exports: MATERIAL_MODULES,
})
export class PreloadersModule {}

@NgModule({
  imports: MATERIAL_MODULES,
  exports: MATERIAL_MODULES,
})
export class ProgressBars {
  static forRoot(): ModuleWithProviders<PreloadersModule> {
    return { ngModule: PreloadersModule };
  }
}
