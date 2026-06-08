import { createServerValidate, ServerValidateError } from '@tanstack/react-form-remix';
import { z } from 'zod';

export type ValidateFormResult<T extends z.ZodTypeAny> = {
  ok: true;
  data: z.infer<T>;
} | {
  ok: false;
  formState: unknown;
};

export async function validateForm<T extends z.ZodTypeAny>(
  request: Request,
  formSchema: T,
): Promise<ValidateFormResult<T>> {
  const formData = await request.formData();

  try {
    const serverValidate = createServerValidate({
      onServerValidate: formSchema,
    });
    const validatedData = await serverValidate(formData);

    return {
      ok: true,
      data: validatedData as z.infer<T>,
    };
  }
  catch (e) {
    if (e instanceof ServerValidateError) {
      return {
        ok: false,
        formState: e.formState,
      };
    }

    throw e;
  }
}

export function returnFormError<T extends Record<string, unknown>>(
  data: T,
  fields: Partial<Record<keyof T, { message: string }>>,
) {
  return {
    values: data,
    errors: [],
    errorMap: {
      onServer: {
        fields,
      },
    },
  };
};
