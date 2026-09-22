import { expect, test } from './fixtures';

/**
 * The remote cursor of a collaborator, drawn into the container Lexical
 * portals next to the editor.
 */
const REMOTE_CURSOR = '.editor-collab-cursor';

test.describe('collaboration', () => {
  test('keeps a collaborator on an empty line out of the corner',
    async ({ userA, userB }) => {
      const url = await userA.createDocument();
      await userA.typeLines('Cursor', 'A line with words on it');
      await userA.shareDocument();
      await userB.openDocument(url);

      // A new, still empty line: the browser has nothing to measure there.
      await userA.editor.getByText('A line with words on it').click();
      await userA.page.keyboard.press('End');
      await userA.page.keyboard.press('Enter');

      const cursor = userB.page.locator(REMOTE_CURSOR).first();
      await expect(cursor).toBeVisible();

      const line = await userB.page
        .getByText('A line with words on it')
        .boundingBox();
      const box = await cursor.boundingBox();

      expect(line).not.toBeNull();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThan(line!.x - 1);
      expect(box!.y).toBeGreaterThan(line!.y);
    });
});
