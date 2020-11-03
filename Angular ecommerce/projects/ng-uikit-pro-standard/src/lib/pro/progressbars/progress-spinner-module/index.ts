import { NgModule, ModuleWithProviders } from '@angular/core';
import {
  MdProgressSpinnerComponent,
  MdSpinnerComponent,
  MdProgressSpinnerCssMatStylerDirective,
} from './progress-spinner.component';

import { ProgressSpinnerComponent } from '../progress-spinner.component';

@NgModule({
  exports: [
    MdProgressSpinnerComponent,
    MdSpinnerComponent,
    MdProgressSpinnerCssMatStylerDirective,
    ProgressSpinnerComponent,
  ],
  declarations: [
    MdProgressSpinnerComponent,
    MdSpinnerComponent,
    MdProgressSpinnerCssMatStylerDirective,
    ProgressSpinnerComponent,
  ],
})
class MdProgressSpinnerModule {
  static forRoot(): ModuleWithProviders<MdProgressSpinnerModule> {
    return {
      ngModule: MdProgressSpinnerModule,
      providers: [],
    };
  }
}

export { MdProgressSpinnerModule };
export {
  ProgressSpinnerMode,
  MdProgressSpinnerCssMatStylerDirective,
  MdProgressSpinnerComponent,
  MdSpinnerComponent,
} from './progress-spinner.component';
