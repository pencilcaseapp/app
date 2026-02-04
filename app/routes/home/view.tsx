import { href, Link } from 'react-router';
import { Button } from '~/ui';

export default function View() {
  return (
    <div className="inline-flex gap-4 flex-col">
      <Link to={href('/new')}>
        Create new doc
      </Link>
      <Button>Button</Button>
    </div>
  );
}
