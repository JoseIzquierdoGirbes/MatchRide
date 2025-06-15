import { ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';

export class DateTimeValidator {

  static minHoursAhead(hoursAhead: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value as string;
      if (!value) {
        // no validamos aquí el requerido
        return null;
      }
      const selectedTs = new Date(value).getTime();
      const minTs = Date.now() + hoursAhead * 60 * 60 * 1000;
      return selectedTs >= minTs
        ? null
        : {
            minHoursAhead: {
              requiredTimestamp: minTs,
              actualTimestamp: selectedTs,
              hoursAhead
            }
          };
    };
  }
}