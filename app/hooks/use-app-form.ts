import { createFormHook, type FormAsyncValidateOrFn, type FormOptions, type FormValidateOrFn } from '@tanstack/react-form';
import { mergeForm, useTransform } from '@tanstack/react-form-remix';
import { useId, useRef } from 'react';
import { useActionData, useSubmit } from 'react-router';
import { ControlledCheckbox } from '~/components/controlled-checkbox/controlled-checkbox';
import { ControlledHiddenInput } from '~/components/controlled-hidden-input/controlled-hidden-input';
import { ControlledOneTimePasswordField } from '~/components/controlled-one-time-password-field/controlled-one-time-password-field';
import { ControlledSelect } from '~/components/controlled-select/controlled-select';
import { ControlledSubmitButton } from '~/components/controlled-submit-button/controlled-submit-button';
import { ControlledSwitch } from '~/components/controlled-switch/controlled-switch';
import { ControlledTextField } from '~/components/controlled-text-field/controlled-text-field';
import { fieldContext, formContext, type FormMeta } from '~/contexts/form';

export const formHook = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField: ControlledTextField,
    Checkbox: ControlledCheckbox,
    Switch: ControlledSwitch,
    OneTimePasswordField: ControlledOneTimePasswordField,
    HiddenInput: ControlledHiddenInput,
    Select: ControlledSelect,
  },
  formComponents: {
    SubmitButton: ControlledSubmitButton,
  },
});

export interface AppFormOptions {
  /**
   * Leave the action data that is already there when the form mounts
   * alone. A form that unmounts and comes back while its route stays, like
   * one inside a panel, would otherwise come back with the values and
   * errors of its last submission.
   */
  freshOnMount?: boolean;
}

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
  options: AppFormOptions = {},
) {
  const actionData = useActionData();
  const mountActionDataRef = useRef(actionData);
  const submit = useSubmit();
  const formId = useId();

  const mergedActionData
    = options.freshOnMount && actionData === mountActionDataRef.current
      ? undefined
      : actionData;

  return formHook.useAppForm({
    ...props,
    transform: useTransform(
      baseForm => mergeForm(baseForm, mergedActionData ?? {}),
      [mergedActionData],
    ),
    onSubmitMeta: {
      formId,
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
