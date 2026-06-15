import { href, Link } from 'react-router';

export default function () {
  return (
    <div className="inline-flex gap-4 flex-col pl-90 pt-5">
      <Link to={href('/new')}>
        New doc
      </Link>
    </div>
  );
}
