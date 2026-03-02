import type {
  ElementType,
  PropsWithChildren,
  ComponentPropsWithoutRef,
  ComponentPropsWithRef,
} from 'react';

type AsProp<C extends ElementType> = {
  as?: C;
};

export type PropsToOmit<C extends ElementType, P> = keyof (AsProp<C> & P);

// A polymorphic component prop that can be used to override the default element type.
export type PolymorphicComponentProp<
  C extends ElementType,
  Props = {},
> = PropsWithChildren<Props & AsProp<C>> &
  Omit<ComponentPropsWithoutRef<C>, PropsToOmit<C, Props>>;

// Same as above, but with a "ref" prop
export type PolymorphicComponentPropWithRef<
  C extends ElementType,
  Props = {},
> = PolymorphicComponentProp<C, Props> & { ref?: PolymorphicRef<C> };

export type PolymorphicRef<C extends ElementType> =
  ComponentPropsWithRef<C>['ref'];
