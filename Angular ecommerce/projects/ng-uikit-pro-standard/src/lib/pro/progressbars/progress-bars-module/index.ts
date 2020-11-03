import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProgressBarComponent } from './progressbar.component';

export { ProgressBarComponent } from './progressbar.component';

@NgModule({
  imports: [CommonModule],
  exports: [ProgressBarComponent],
  declarations: [ProgressBarComponent],
})
export class MdProgressBarModule {
  static forRoot(): ModuleWithProviders<MdProgressBarModule> {
    return {
      ngModule: MdProgressBarModule,
      providers: [],
    };
  }
}
