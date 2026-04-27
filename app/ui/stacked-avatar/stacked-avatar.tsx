import { Avatar, type AvatarProps } from '../avatar/avatar';
import { Typography } from '../typography/typography';
import { DropdownMenuPortal } from '../dropdown-menu/dropdown-menu-portal';
import { DropdownMenu } from '../dropdown-menu/dropdown-menu';
import { DropdownMenuTrigger } from '../dropdown-menu/dropdown-menu-trigger';
import { DropdownMenuContent } from '../dropdown-menu/dropdown-menu-content';
import { DropdownMenuItem } from '../dropdown-menu/dropdown-menu-item';

export interface StackedAvatarsProps {
  avatars: AvatarProps<'button'>[];
  maxVisible?: number;
}

export const StackedAvatars: React.FC<StackedAvatarsProps> = ({
  avatars,
  maxVisible = 5,
}) => {
  const visibleAvatars = avatars.slice(0, maxVisible);
  const overflowCount = avatars.length - maxVisible;

  return (
    <>
      {overflowCount > 0
        ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <button type="button" className="flex h-8 items-center justify-end -space-x-1 transition-all duration-300 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-pca-grey-300 rounded-3xl px-1">
                  {visibleAvatars.map(avatar => (
                    <Avatar
                      as="div"
                      key={avatar.name}
                      className="pointer-events-none focus:outline-none"
                      tabIndex={-1}
                      name={avatar.name}
                      color={avatar.color}
                    />
                  ))}
                  {overflowCount > 0 && (
                    <div
                      className="w-7 h-7 rounded-full bg-pca-yellow-500 text-pca-grey-900 text-xs font-medium flex items-center justify-center ring-1 ring-pca-white dark:ring-pca-grey-900 transition-transform duration-300 z-50"
                    >
                      {`${overflowCount}`}
                      <span className="text-[9px]">+</span>
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuPortal>
                <DropdownMenuContent align="end" className="flex gap-2">
                  {avatars.map(avatar => (
                    <DropdownMenuItem key={avatar.name} as="div" className="cursor-default pointer-events-none">
                      <div className="flex justify-start items-center gap-0.5">
                        <Avatar name={avatar.name} color={avatar.color} size="small" />
                        <Typography variant="bodyTiny" className="ml-2">
                          {avatar.name}
                        </Typography>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenuPortal>
            </DropdownMenu>
          )
        : (
            <div className="inline-flex h-8 items-center justify-end -space-x-1 transition-all duration-300 ease-in-out">
              {avatars.map(avatar => (
                <Avatar
                  key={avatar.name}
                  name={avatar.name}
                  color={avatar.color}
                  size="small"
                />
              ))}
            </div>
          )}
    </>
  );
};
