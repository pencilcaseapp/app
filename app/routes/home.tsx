import { href, Link } from 'react-router';

export default function () {
  return (
    <div className="inline-flex gap-4 flex-col">
      <Link to={href('/new')}>
        New doc
      </Link>
    </div>
  );
}
