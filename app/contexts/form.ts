import { createFormHookContexts, type AnyFormApi } from '@tanstack/react-form';

export const { fieldContext, formContext, useFieldContext, useFormContext }
  = createFormHookContexts();

export interface FormMeta {
  formId: string;
}

/**
 * The id `useAppForm` gave the form. `ControlledForm` puts it on the form
 * element and `ControlledSubmitButton` on its `form` attribute, which is
 * what lets the button sit outside the form element.
 */
export function getFormId(form: AnyFormApi): string | undefined {
  return (form.options.onSubmitMeta as FormMeta | undefined)?.formId;
}
