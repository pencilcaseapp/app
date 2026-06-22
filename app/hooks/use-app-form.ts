import { createFormHook, type FormAsyncValidateOrFn, type FormOptions, type FormValidateOrFn } from '@tanstack/react-form';
import { mergeForm, useTransform } from '@tanstack/react-form-remix';
import { useActionData, useSubmit } from 'react-router';
import { ControlledCheckbox } from '~/components/controlled-checkbox/controlled-checkbox';
import { ControlledHiddenInput } from '~/components/controlled-hidden-input/controlled-hidden-input';
import { ControlledOneTimePasswordField } from '~/components/controlled-one-time-password-field/controlled-one-time-password-field';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import { ControlledTextField } from '~/components/controlled-text-field/controlled-text-field';
import { fieldContext, formContext } from '~/contexts/form';

export interface FormMeta {
  formId: string;
}

export const formHook = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: ControlledTextField,
    Checkbox: ControlledCheckbox,
    OneTimePasswordField: ControlledOneTimePasswordField,
    HiddenInput: ControlledHiddenInput,
  },
  formComponents: {
    SubmitButton: ControlledSubmitButton,
  },
});

export function useAppForm<
  TFormData,
  TOnMount extends undefined | FormValidateOrFn<TFormData>,
  TOnChange extends undefined | FormValidateOrFn<TFormData>,
  TOnChangeAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnBlur extends undefined | FormValidateOrFn<TFormData>,
  TOnBlurAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnSubmit extends undefined | FormValidateOrFn<TFormData>,
  TOnSubmitAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnDynamic extends undefined | FormValidateOrFn<TFormData>,
  TOnDynamicAsync extends undefined | FormAsyncValidateOrFn<TFormData>,
  TOnServer extends undefined | FormAsyncValidateOrFn<TFormData>,
>(
  props: FormOptions<
    TFormData,
    TOnMount,
    TOnChange,
    TOnChangeAsync,
    TOnBlur,
    TOnBlurAsync,
    TOnSubmit,
    TOnSubmitAsync,
    TOnDynamic,
    TOnDynamicAsync,
    TOnServer,
    FormMeta
  >,
) {
  const actionData = useActionData();
  const submit = useSubmit();

  return formHook.useAppForm({
    ...props,
    transform: useTransform(
      baseForm => mergeForm(baseForm, actionData ?? {}),
      [actionData],
    ),
    onSubmitMeta: {
      formId: '',
    },
    onSubmitInvalid() {
      const InvalidInput = document.querySelector(
        '[aria-invalid="true"]',
      ) as HTMLInputElement;

      InvalidInput?.focus();
    },
    async onSubmit({ meta }) {
      await submit(document.getElementById(meta.formId) as HTMLFormElement);
    },
  });
}

export const withForm = formHook.withForm;
