import { Button, Link, TextField, Typography } from '~/ui';

export default function () {
  return (
    <>
      <title>Sign In or Sign Up</title>
      <Typography variant="heading2" textColorLight="black" textColorDark="white" className="mb-3 text-center">
        Sign In or Sign Up
        <br />
        with Magic
      </Typography>
      <Typography variant="bodySmall" textColorLight="grey-900" textColorDark="white" className="mb-6 text-center">
        Please enter your e-mail address.
        <br />
        We’ll handle the magic (link) for you …
      </Typography>
      <TextField id="email" type="email" name="email" placeholder="e.g. your@example.com" label="E-Mail" className="mb-6" />
      <Button color="primary" className="mb-10 w-full">Continue</Button>
      <Typography variant="bodyTiny" textColorLight="grey-800" textColorDark="grey-300" className="text-center">
        By continuing, you acknowledge that you understand
        and agree to the
        {' '}
        <Link variant="bodyTiny" fontWeight="regular" textColorLight="grey-800" textColorDark="grey-300" href="https://example.com/terms" target="_blank">Terms & Conditions</Link>
        {' '}
        and
        {' '}
        <Link variant="bodyTiny" fontWeight="regular" textColorLight="grey-800" textColorDark="grey-300" href="https://example.com/privacy" target="_blank">Privacy Policy</Link>
        .
      </Typography>
    </>
  );
}
