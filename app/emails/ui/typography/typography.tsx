import classNames from 'classnames';
import { Heading, Text } from 'react-email';

type Color
  = | 'blue-300'
    | 'blue-500'
    | 'blue-700'
    | 'blue-900'
    | 'green-300'
    | 'green-500'
    | 'green-700'
    | 'green-900'
    | 'orange-300'
    | 'orange-500'
    | 'orange-700'
    | 'orange-900'
    | 'yellow-300'
    | 'yellow-500'
    | 'yellow-700'
    | 'yellow-900'
    | 'pink-300'
    | 'pink-500'
    | 'pink-700'
    | 'pink-900'
    | 'red-300'
    | 'red-500'
    | 'red-700'
    | 'red-900'
    | 'grey-100'
    | 'grey-200'
    | 'grey-300'
    | 'grey-400'
    | 'grey-500'
    | 'grey-600'
    | 'grey-700'
    | 'grey-800'
    | 'grey-900'
    | 'white'
    | 'black';

type Variant
  = | 'title'
    | 'heading1'
    | 'heading2'
    | 'heading3'
    | 'body'
    | 'bodySmall'
    | 'bodyTiny';

type Level = 'h1' | 'h2' | 'h3' | 'p';

export interface TypographyProps {
  children: React.ReactNode;
  variant?: Variant;
  as?: Level;
  textColor?: Color;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
  textTransform?: 'uppercase' | 'capitalize' | 'lowercase';
  className?: string;
}

const variantClasses: { [index in Variant]: string } = {
  title: 'text-5xl',
  heading1: 'text-4xl',
  heading2: 'text-2xl leading-[29px]',
  heading3: 'text-lg leading-[22px]',
  body: 'text-base leading-6',
  bodySmall: 'text-sm leading-5',
  bodyTiny: 'text-xs leading-4',
};

const variantWeights: { [index in Variant]: string } = {
  title: 'font-bold',
  heading1: 'font-bold',
  heading2: 'font-bold',
  heading3: 'font-semibold',
  body: 'font-normal',
  bodySmall: 'font-normal',
  bodyTiny: 'font-normal',
};

const variantLevels: { [index in Variant]: Level } = {
  title: 'h1',
  heading1: 'h1',
  heading2: 'h2',
  heading3: 'h3',
  body: 'p',
  bodySmall: 'p',
  bodyTiny: 'p',
};

const fontWeightClasses = {
  regular: 'font-normal',
  medium: 'font-medium',
  semibold: 'font-semibold',
  bold: 'font-bold',
};

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'body',
  as,
  textColor = 'grey-900',
  textAlign,
  fontWeight,
  textTransform,
  className,
}) => {
  const isBaseColor = textColor === 'white' || textColor === 'black';

  const classes = classNames([
    'font-inter m-0',
    variantClasses[variant],
    fontWeight ? fontWeightClasses[fontWeight] : variantWeights[variant],
    isBaseColor ? `text-${textColor}` : `text-pca-${textColor}`,
    textAlign && `text-${textAlign}`,
    textTransform,
    className,
  ]);

  const level = as ?? variantLevels[variant];

  if (level === 'p') {
    return <Text className={classes}>{children}</Text>;
  }

  return <Heading as={level} className={classes}>{children}</Heading>;
};
