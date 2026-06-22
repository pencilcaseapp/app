import classNames from 'classnames';
import type { PolymorphicComponentProp } from '~/ui/polymorphic-types/polymorphic-types';

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

type Level = 'h1' | 'h2' | 'h3' | 'p' | 'span';

export type TypographyProps = {
  variant?: Variant;
  textColorLight?: Color;
  textColorDark?: Color;
  textAlign?: 'left' | 'center' | 'right';
  fontWeight?: 'regular' | 'medium' | 'semibold' | 'bold';
  textTransform?: 'uppercase' | 'capitalize' | 'lowercase';
  className?: string;
};

export const Typography = <C extends React.ElementType = 'p'>({
  children,
  as,
  variant = 'body',
  textAlign,
  textColorLight = 'grey-900',
  textColorDark = 'white',
  fontWeight,
  textTransform,
  className,
  ...props
}: PolymorphicComponentProp<C, TypographyProps>) => {
  const titleClasses = classNames(['text-5xl', !fontWeight && 'font-bold']);
  const heading1Classes = classNames(['text-[28px] sm:text-4xl', !fontWeight && 'font-bold']);
  const heading2Classes = classNames(['text-xl sm:text-2xl', !fontWeight && 'font-bold']);
  const heading3Classes = classNames([
    'text-base sm:text-lg',
    !fontWeight && 'font-semibold',
  ]);
  const bodyClasses = classNames(['text-base', !fontWeight && 'font-normal']);
  const bodySmallClasses = classNames([
    'text-sm',
    !fontWeight && 'font-normal',
  ]);
  const bodyTinyClasses = classNames(['text-xs', !fontWeight && 'font-normal']);

  const textColorLightClasses = classNames([
    textColorLight === 'blue-300' && `text-pca-blue-300`,
    textColorLight === 'blue-500' && `text-pca-blue-500`,
    textColorLight === 'blue-700' && `text-pca-blue-700`,
    textColorLight === 'blue-900' && `text-pca-blue-900`,
    textColorLight === 'green-300' && `text-pca-green-300`,
    textColorLight === 'green-500' && `text-pca-green-500`,
    textColorLight === 'green-700' && `text-pca-green-700`,
    textColorLight === 'green-900' && `text-pca-green-900`,
    textColorLight === 'orange-300' && `text-pca-orange-300`,
    textColorLight === 'orange-500' && `text-pca-orange-500`,
    textColorLight === 'orange-700' && `text-pca-orange-700`,
    textColorLight === 'orange-900' && `text-pca-orange-900`,
    textColorLight === 'yellow-300' && `text-pca-yellow-300`,
    textColorLight === 'yellow-500' && `text-pca-yellow-500`,
    textColorLight === 'yellow-700' && `text-pca-yellow-700`,
    textColorLight === 'yellow-900' && `text-pca-yellow-900`,
    textColorLight === 'pink-300' && `text-pca-pink-300`,
    textColorLight === 'pink-500' && `text-pca-pink-500`,
    textColorLight === 'pink-700' && `text-pca-pink-700`,
    textColorLight === 'pink-900' && `text-pca-pink-900`,
    textColorLight === 'red-300' && `text-pca-red-300`,
    textColorLight === 'red-500' && `text-pca-red-500`,
    textColorLight === 'red-700' && `text-pca-red-700`,
    textColorLight === 'red-900' && `text-pca-red-900`,
    textColorLight === 'grey-100' && `text-pca-grey-100`,
    textColorLight === 'grey-200' && `text-pca-grey-200`,
    textColorLight === 'grey-300' && `text-pca-grey-300`,
    textColorLight === 'grey-400' && `text-pca-grey-400`,
    textColorLight === 'grey-500' && `text-pca-grey-500`,
    textColorLight === 'grey-600' && `text-pca-grey-600`,
    textColorLight === 'grey-700' && `text-pca-grey-700`,
    textColorLight === 'grey-800' && `text-pca-grey-800`,
    textColorLight === 'grey-900' && `text-pca-grey-900`,
    textColorLight === 'white' && 'text-white',
    textColorLight === 'black' && 'text-black',
  ]);

  const textColorDarkClasses = classNames([
    textColorDark === 'blue-300' && `dark:text-pca-blue-300`,
    textColorDark === 'blue-500' && `dark:text-pca-blue-500`,
    textColorDark === 'blue-700' && `dark:text-pca-blue-700`,
    textColorDark === 'blue-900' && `dark:text-pca-blue-900`,
    textColorDark === 'green-300' && `dark:text-pca-green-300`,
    textColorDark === 'green-500' && `dark:text-pca-green-500`,
    textColorDark === 'green-700' && `dark:text-pca-green-700`,
    textColorDark === 'green-900' && `dark:text-pca-green-900`,
    textColorDark === 'orange-300' && `dark:text-pca-orange-300`,
    textColorDark === 'orange-500' && `dark:text-pca-orange-500`,
    textColorDark === 'orange-700' && `dark:text-pca-orange-700`,
    textColorDark === 'orange-900' && `dark:text-pca-orange-900`,
    textColorDark === 'yellow-300' && `dark:text-pca-yellow-300`,
    textColorDark === 'yellow-500' && `dark:text-pca-yellow-500`,
    textColorDark === 'yellow-700' && `dark:text-pca-yellow-700`,
    textColorDark === 'yellow-900' && `dark:text-pca-yellow-900`,
    textColorDark === 'pink-300' && `dark:text-pca-pink-300`,
    textColorDark === 'pink-500' && `dark:text-pca-pink-500`,
    textColorDark === 'pink-700' && `dark:text-pca-pink-700`,
    textColorDark === 'pink-900' && `dark:text-pca-pink-900`,
    textColorDark === 'red-300' && `dark:text-pca-red-300`,
    textColorDark === 'red-500' && `dark:text-pca-red-500`,
    textColorDark === 'red-700' && `dark:text-pca-red-700`,
    textColorDark === 'red-900' && `dark:text-pca-red-900`,
    textColorDark === 'grey-100' && `dark:text-pca-grey-100`,
    textColorDark === 'grey-200' && `dark:text-pca-grey-200`,
    textColorDark === 'grey-300' && `dark:text-pca-grey-300`,
    textColorDark === 'grey-400' && `dark:text-pca-grey-400`,
    textColorDark === 'grey-500' && `dark:text-pca-grey-500`,
    textColorDark === 'grey-600' && `dark:text-pca-grey-600`,
    textColorDark === 'grey-700' && `dark:text-pca-grey-700`,
    textColorDark === 'grey-800' && `dark:text-pca-grey-800`,
    textColorDark === 'grey-900' && `dark:text-pca-grey-900`,
    textColorDark === 'white' && 'dark:text-white',
    textColorDark === 'black' && 'dark:text-black',
  ]);

  const alignmentClasses = classNames([
    textAlign === 'left' && 'text-left',
    textAlign === 'center' && 'text-center',
    textAlign === 'right' && 'text-right',
  ]);

  const fontWeightClasses = classNames([
    fontWeight === 'regular' && 'font-normal',
    fontWeight === 'semibold' && 'font-semibold',
    fontWeight === 'medium' && 'font-medium',
    fontWeight === 'bold' && 'font-bold',
  ]);

  const textTransformClasses = classNames([
    textTransform === 'uppercase' && 'uppercase',
    textTransform === 'capitalize' && 'capitalize',
    textTransform === 'lowercase' && 'lowercase',
  ]);

  const classes = classNames([
    'antialiased font-inter',
    variant === 'title' && titleClasses,
    variant === 'heading1' && heading1Classes,
    variant === 'heading2' && heading2Classes,
    variant === 'heading3' && heading3Classes,
    variant === 'body' && bodyClasses,
    variant === 'bodySmall' && bodySmallClasses,
    variant === 'bodyTiny' && bodyTinyClasses,
    textColorLightClasses,
    textColorDarkClasses,
    alignmentClasses,
    fontWeightClasses,
    textTransformClasses,
    className,
  ]);

  const variantsMapping: { [index in Variant]: Level } = {
    title: 'h1',
    heading1: 'h1',
    heading2: 'h2',
    heading3: 'h3',
    body: 'p',
    bodySmall: 'p',
    bodyTiny: 'p',
  };

  const Component = as ?? variantsMapping[variant];
  return (
    <Component className={classes} {...props}>
      {children}
    </Component>
  );
};
