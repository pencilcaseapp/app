import { test as base } from '../test';
import { SettingsUser } from './settings-user';

/** The settings domain's test: `userA` carries the settings pages too. */
export const test = base.extend<{ userA: SettingsUser }>({
  userA: async ({ userA }, provide) => {
    await provide(new SettingsUser(userA.page, userA.email));
  },
});

export { expect } from '@playwright/test';
