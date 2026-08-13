import { createServerValidate, ServerValidateError } from '@tanstack/react-form-remix';
import type { FormDataInfo } from 'decode-formdata';
import { z } from 'zod';
import { csrf } from './csrf';
import { CSRFError } from 'remix-utils/csrf/server';

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
    await csrf.validate(formData, request.headers);

    const serverValidate = createServerValidate({
      onServerValidate: formSchema,
    });
    const info = deriveFormDataInfo(formSchema);
    const validatedData = await serverValidate(formData, info);

    return {
      ok: true,
      data: validatedData as z.infer<T>,
    };
  }
  catch (e) {
    if (e instanceof CSRFError) {
      throw new Response(`Invalid CSRF token: ${e.message}`, { status: 403 });
    }

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

type ZodDef = {
  type: string;
  innerType?: { def: ZodDef };
  in?: { def: ZodDef };
  out?: { def: ZodDef };
};

function unwrapZodDef(def: ZodDef): ZodDef {
  switch (def.type) {
    case 'optional':
    case 'nullable':
    case 'default':
    case 'prefault':
    case 'catch':
    case 'nonoptional':
    case 'readonly':
      return def.innerType ? unwrapZodDef(def.innerType.def) : def;
    case 'pipe':
      return def.out ? unwrapZodDef(def.out.def) : def;
    default:
      return def;
  }
}

function deriveFormDataInfo(schema: z.ZodTypeAny): FormDataInfo {
  const info: FormDataInfo = {};
  const rootDef = unwrapZodDef((schema as unknown as { def: ZodDef }).def);
  const shape = (rootDef as unknown as {
    shape?: Record<string, { def: ZodDef }>;
  }).shape;

  if (!shape) {
    return info;
  }

  for (const [key, field] of Object.entries(shape)) {
    const fieldDef = unwrapZodDef(field.def);
    let bucket: keyof FormDataInfo | undefined;

    switch (fieldDef.type) {
      case 'boolean':
        bucket = 'booleans';
        break;
      case 'number':
      case 'int':
      case 'bigint':
        bucket = 'numbers';
        break;
      case 'date':
        bucket = 'dates';
        break;
      case 'file':
        bucket = 'files';
        break;
      case 'array':
        bucket = 'arrays';
        break;
    }

    if (bucket) {
      (info[bucket] ??= []).push(key);
    }
  }

  return info;
}
