import { AccordionItem, AccordionContent, AccordionHeader, AccordionTrigger } from '@radix-ui/react-accordion';
import type { IconName } from '../icon/icons';
import type { FC, PropsWithChildren } from 'react';
import { Icon } from '../icon/icon';
import { Typography } from '../typography/typography';
import classNames from 'classnames';
import { useMedia } from 'react-use';

export type DocumentGroupProps = {
  title: string;
  icon: IconName;
  iconTitle?: string;
  value: string;
  actionArea?: React.ReactNode;
} & PropsWithChildren;

export const DocumentGroup: FC<DocumentGroupProps>
  = ({ title, value, children, icon, actionArea }) => {
    const isTouchDevice = useMedia('(pointer: coarse) and (hover: none)');

    return (
      <AccordionItem value={value}>
        <AccordionHeader asChild>
          <div className={classNames([
            'group flex items-center gap-2 rounded-xl transition-colors data-[state=open]:bg-pca-grey-100 dark:data-[state=open]:bg-pca-grey-800 hover:bg-pca-grey-100 dark:hover:bg-pca-grey-800 has-data-[state=open]:bg-pca-grey-100 dark:has-data-[state=open]:bg-pca-grey-800',
          ])}
          >
            <AccordionTrigger className={classNames([
              'flex items-center gap-2 min-w-0 h-9 flex-1 pl-2 pr-0.5 py-1 cursor-pointer focus-visible:outline-none rounded-xl',
              'focus-visible:bg-pca-grey-200 dark:focus-visible:ring-0 active:bg-pca-grey-200 dark:active:bg-pca-grey-800 dark:active:ring-0 dark:focus-visible:bg-pca-grey-800',
            ])}
            >
              <Icon icon={icon} />
              <Typography
                variant="bodySmall"
                as="span"
                className="block truncate min-w-0 flex-1 text-left"
                title={title}
              >
                {title}
              </Typography>
              {actionArea && (
                <div className={classNames(['shrink-0 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100 lg:has-data-[state=open]:opacity-100 transition-opacity', isTouchDevice && 'lg:opacity-100'])}>
                  {actionArea}
                </div>
              )}
            </AccordionTrigger>
          </div>
        </AccordionHeader>
        <AccordionContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
          <div className="flex flex-col gap-1.5 mt-1.5">
            {children}
          </div>
        </AccordionContent>
      </AccordionItem>
    );
  };
