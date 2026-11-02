import { Img } from 'react-email';
import { assetsUrl } from '../../theme';

export const Logo: React.FC = () => {
  return (
    <Img
      src={`${assetsUrl}/emails/pencil-case-logo.png`}
      alt="pencil case"
      width="140"
      height="28"
      className="block mx-auto"
    />
  );
};
