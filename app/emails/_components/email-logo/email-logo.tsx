import { Img } from '@react-email/components';
import type React from 'react';
import { assetsUrl } from '../../theme';

/**
 * The `Logo` lockup from `app/ui/logo`, rasterised to a 2x PNG. Gmail drops
 * inline SVG entirely, so an email cannot reuse the component itself. The PNG
 * carries a white background rather than transparency, so the mark stays
 * readable in clients that force their own dark background on us.
 */
export const EmailLogo: React.FC = () => {
  return (
    <Img
      src={`${assetsUrl}/emails/pencil-case-logo.png`}
      alt="pencil case"
      width="138"
      height="31"
      style={{ display: 'block', margin: '0 auto' }}
    />
  );
};
