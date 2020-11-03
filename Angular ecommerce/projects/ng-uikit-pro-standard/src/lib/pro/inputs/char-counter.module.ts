import { NgModule, ModuleWithProviders } from '@angular/core';
import { CharCounterDirective } from './char-counter.directive';

@NgModule({
  declarations: [CharCounterDirective],
  exports: [CharCounterDirective],
})
export class CharCounterModule {
  public static forRoot(): ModuleWithProviders<CharCounterModule> {
    return { ngModule: CharCounterModule, providers: [] };
  }
}
