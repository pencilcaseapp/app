import { NATIVE_APP_USER_AGENT } from '~/constants/native-app';

export const isNativeAppRequest = (request: Request) =>
  request.headers.get('user-agent')?.includes(NATIVE_APP_USER_AGENT) ?? false;
