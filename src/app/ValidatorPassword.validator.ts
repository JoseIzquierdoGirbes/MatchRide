import { AbstractControl,ValidationErrors, ValidatorFn } from "@angular/forms"



export const checkPasswords: ValidatorFn = (
  control: AbstractControl
): ValidationErrors | null => {
  const password = control.get('contrasena');
  const confirmPassword = control.get('confcontrasena');

  return password && confirmPassword && password.value !== confirmPassword.value
    ? { noiguales: true }
    : null;
};
