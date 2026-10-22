import type { Page } from '@playwright/test';
import { DocumentPage } from './app/document-page';
import { SharePanel } from './app/share-panel';
import { Sidebar } from './app/sidebar';

/**
 * One signed in user driving one browser context, with a page object for
 * each part of the app they use, so a test with several users reads the
 * same as one with a single user.
 */
export class AppUser {
  readonly document: DocumentPage;
  readonly sidebar: Sidebar;
  readonly sharePanel: SharePanel;

  constructor(readonly page: Page, readonly email?: string) {
    this.document = new DocumentPage(page);
    this.sidebar = new Sidebar(page);
    this.sharePanel = new SharePanel(page);
  }
}
