import { href, Link } from 'react-router';
import { Button } from '~/ui';

export function meta() {
  return [{ title: 'pencil case' }];
}

export default function Home() {
  return (
    <div className="inline-flex gap-4 flex-col">
      <Link to={href('/new')}>
        Create new doc
      </Link>
      <Button>Button</Button>
    </div>
  );
}
