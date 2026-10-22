import { expect, type Locator, type Page } from '@playwright/test';

/** `/doc/:id`: the editor and what it shows of the document. */
export class DocumentPage {
  constructor(readonly page: Page) {}

  get editor(): Locator {
    return this.page.locator('[contenteditable="true"]');
  }

  /**
   * The document's content in the editor, whether or not the viewer may
   * change it — not the preview the server drew, which it replaces.
   */
  get content(): Locator {
    return this.page.locator('[data-lexical-editor]');
  }

  /** The notice a deleted document shows above its read-only content. */
  get deletedNotice(): Locator {
    return this.page.getByText('This document is deleted');
  }

  /**
   * Creates a document through /new and returns its URL, which doubles as
   * the share link.
   */
  async create(): Promise<string> {
    await this.page.goto('/new');
    await this.page.waitForURL('**/doc/**');
    await this.waitForSynced();

    return this.page.url();
  }

  async open(url: string): Promise<void> {
    await this.page.goto(url);
    await this.waitForSynced();
  }

  /**
   * Every document starts as an empty `h1` seeded on the server, and the
   * editor only renders it once the websocket has delivered the initial
   * state — typing before that races the sync, and the first line would
   * not reliably end up in the heading the title is extracted from.
   */
  async waitForSynced(): Promise<void> {
    await expect(this.content.locator('h1')).toBeVisible();
  }

  /** Types into the editor, one block per line. */
  async typeLines(...lines: string[]): Promise<void> {
    await this.editor.click();

    for (const [index, line] of lines.entries()) {
      if (index > 0) {
        await this.page.keyboard.press('Enter');
      }
      await this.page.keyboard.type(line);
    }

    await expect(this.editor).toContainText(lines[lines.length - 1]);
  }

  /** Appends new blocks after the block containing `text`. */
  async appendLinesAfter(text: string, ...lines: string[]): Promise<void> {
    await this.editor.getByText(text).click();
    await this.page.keyboard.press('End');

    for (const line of lines) {
      await this.page.keyboard.press('Enter');
      await this.page.keyboard.type(line);
    }

    await expect(this.editor).toContainText(lines[lines.length - 1]);
  }
}
