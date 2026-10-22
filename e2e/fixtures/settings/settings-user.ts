import { AppUser } from '../app-user';
import { CreemCheckoutPage } from './creem-checkout-page';
import { SettingsDialog } from './settings-dialog';

/** A signed in user who also drives the settings and the checkout. */
export class SettingsUser extends AppUser {
  readonly settings = new SettingsDialog(this.page);
  readonly checkout = new CreemCheckoutPage(this.page);
}
