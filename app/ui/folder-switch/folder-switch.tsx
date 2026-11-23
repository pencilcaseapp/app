import { Select as BaseSelect } from '@base-ui/react/select';
import classNames from 'classnames';
import { Fragment, useState } from 'react';
import type { ComponentPropsWithoutRef, ReactNode, Ref } from 'react';
import { useIsMobile } from '~/hooks/use-is-mobile';
import { Icon } from '../icon/icon';
import type { IconName } from '../icon/icons';
import { menuItemClasses } from '../menu-surface/menu-surface';
import {
  ResponsiveDialog,
  ResponsiveDialogTrigger,
} from '../responsive-dialog/responsive-dialog';
import { DrawerContent } from '../drawer/drawer-content';
import { DrawerContentInner } from '../drawer/drawer-content-inner';
import { ResponsiveDialogTopbar } from '../responsive-dialog/responsive-dialog-topbar';
import { Separator } from '../separator/separator';
import { SIDEBAR_DRAWER_MAX_HEIGHT } from '../sidebar/sidebar';

export type FolderSwitchItem<Value extends string> = {
  value: Value;
  label: string;
  icon: IconName;
  /** How many documents the folder holds. */
  count: number;
};

export type FolderSwitchProps<Value extends string> = {
  /** The folders, a separator drawn between each group. */
  groups: FolderSwitchItem<Value>[][];
  value: Value;
  onValueChange: (value: Value) => void;
  /** The heading of the sheet on mobile. */
  title?: string;
};

const rowClasses = [
  'flex w-full min-w-0 items-center gap-2 h-12 lg:h-10 pl-3 lg:pl-2 pr-2',
  'rounded-xl cursor-pointer text-left text-sm',
  'text-pca-grey-900 dark:text-pca-white',
  'transition-[background-color,scale] duration-150 ease-out',
  'motion-reduce:transition-none active:scale-[0.98]',
  'hover:bg-pca-grey-100 dark:hover:bg-pca-grey-800',
  'focus-visible:outline-none focus-visible:bg-pca-grey-200',
  'dark:focus-visible:bg-pca-grey-800',
];

const FolderCount = ({ count, className }: {
  count: number;
  className?: string;
}) => (
  <span
    className={classNames(
      'shrink-0 text-xs tabular-nums text-pca-grey-500',
      className,
    )}
  >
    {count}
  </span>
);

type FolderSwitchTriggerProps = ComponentPropsWithoutRef<'button'> & {
  item: FolderSwitchItem<string>;
  ref?: Ref<HTMLButtonElement>;
};

/** The open folder with its count, the same button on every screen. */
const FolderSwitchTrigger = ({
  item,
  className,
  ref,
  ...props
}: FolderSwitchTriggerProps) => (
  <button
    ref={ref}
    type="button"
    title={item.label}
    className={classNames(
      rowClasses,
      'bg-pca-grey-100 dark:bg-pca-grey-800',
      'active:bg-pca-grey-200 data-popup-open:bg-pca-grey-200',
      'dark:active:bg-pca-grey-700 dark:data-popup-open:bg-pca-grey-700',
      className,
    )}
    {...props}
  >
    <Icon icon={item.icon} className="shrink-0" />
    <span className="min-w-0 flex-1 truncate">{item.label}</span>
    <FolderCount count={item.count} />
    <Icon icon="chevronUpDown" className="size-5 shrink-0 text-pca-grey-500" />
  </button>
);

/**
 * The marker after a folder in the list: a check on the open one, the
 * count on the others.
 */
const FolderMarker = ({ isCurrent, count }: {
  isCurrent: boolean;
  count: number;
}) => isCurrent
  ? <Icon icon="check" className="size-5 shrink-0" title="Current folder" />
  : <FolderCount count={count} />;

function withSeparators<Value extends string>(
  groups: FolderSwitchItem<Value>[][],
  renderItem: (item: FolderSwitchItem<Value>) => ReactNode,
  separator: ReactNode,
) {
  return groups.map((group, index) => (
    <Fragment key={group.map(item => item.value).join()}>
      {index > 0 && separator}
      {group.map(renderItem)}
    </Fragment>
  ));
}

/**
 * Switches the folder the navigation lists: a select on larger screens
 * and a sheet stacked on the sidebar's own on mobile.
 */
export const FolderSwitch = <Value extends string>(
  props: FolderSwitchProps<Value>,
) => {
  const isMobile = useIsMobile();

  return isMobile
    ? <FolderSwitchSheet {...props} />
    : <FolderSwitchSelect {...props} />;
};

const FolderSwitchSelect = <Value extends string>({
  groups,
  value,
  onValueChange,
}: FolderSwitchProps<Value>) => {
  const current = groups.flat().find(item => item.value === value);

  return (
    <BaseSelect.Root
      value={value}
      onValueChange={next => next !== null && onValueChange(next)}
    >
      <BaseSelect.Trigger
        render={current && <FolderSwitchTrigger item={current} />}
      />
      <BaseSelect.Portal>
        <BaseSelect.Positioner
          alignItemWithTrigger={false}
          align="start"
          sideOffset={4}
          className="z-50"
        >
          <BaseSelect.Popup
            className={classNames(
              'flex w-(--anchor-width) flex-col gap-0.5 rounded-2xl p-1.5 outline-0',
              'border border-pca-grey-200 bg-pca-white shadow-glass',
              'dark:border-pca-grey-700 dark:bg-pca-grey-800 dark:shadow-glass-dark',
              'transition-[scale,opacity] duration-150 ease-out motion-reduce:transition-none',
              'data-ending-style:scale-[0.96] data-ending-style:opacity-0',
              'data-starting-style:scale-[0.96] data-starting-style:opacity-0',
            )}
          >
            <BaseSelect.List>
              {withSeparators(
                groups,
                item => (
                  <BaseSelect.Item
                    key={item.value}
                    value={item.value}
                    className={classNames(
                      menuItemClasses,
                      'cursor-pointer select-none gap-2 text-sm',
                      'text-pca-grey-900 dark:text-pca-white',
                      'data-highlighted:bg-pca-grey-200',
                      'dark:data-highlighted:bg-pca-grey-700',
                    )}
                  >
                    <Icon icon={item.icon} className="size-5 shrink-0" />
                    <BaseSelect.ItemText className="min-w-0 flex-1 truncate">
                      {item.label}
                    </BaseSelect.ItemText>
                    <FolderMarker
                      isCurrent={item.value === value}
                      count={item.count}
                    />
                  </BaseSelect.Item>
                ),
                <BaseSelect.Separator className="my-1 h-px shrink-0 bg-pca-grey-200 dark:bg-pca-grey-700" />,
              )}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};

const FolderSwitchSheet = <Value extends string>({
  groups,
  value,
  onValueChange,
  title = 'Folders',
}: FolderSwitchProps<Value>) => {
  const [isOpen, setIsOpen] = useState(false);
  const current = groups.flat().find(item => item.value === value);

  return (
    <ResponsiveDialog open={isOpen} onOpenChange={setIsOpen}>
      <ResponsiveDialogTrigger
        render={current && <FolderSwitchTrigger item={current} />}
      />
      {/* Only rendered on mobile, where the dialog is a drawer. */}
      <DrawerContent isFullHeight maxHeight={SIDEBAR_DRAWER_MAX_HEIGHT}>
        <DrawerContentInner
          gutterClassName="px-3"
          contentClassName="px-3 pt-2 pb-6"
          topArea={(
            <ResponsiveDialogTopbar title={title} className="h-12 pb-0!" />
          )}
        >
          <div className="flex flex-col gap-1.5">
            {withSeparators(
              groups,
              item => (
                <button
                  key={item.value}
                  type="button"
                  aria-current={item.value === value ? 'true' : undefined}
                  onClick={() => {
                    onValueChange(item.value);
                    setIsOpen(false);
                  }}
                  className={classNames(
                    rowClasses,
                    'pr-4!',
                    'aria-[current]:bg-pca-grey-100',
                    'dark:aria-[current]:bg-pca-grey-800',
                  )}
                >
                  <Icon icon={item.icon} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <FolderMarker
                    isCurrent={item.value === value}
                    count={item.count}
                  />
                </button>
              ),
              <Separator className="my-1" />,
            )}
          </div>
        </DrawerContentInner>
      </DrawerContent>
    </ResponsiveDialog>
  );
};
