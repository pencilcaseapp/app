export type IconName
  = | 'h1'
    | 'h2'
    | 'h3'
    | 'bold'
    | 'italic'
    | 'underline'
    | 'listUl'
    | 'listOl'
    | 'listCheck'
    | 'share'
    | 'sidebar'
    | 'close'
    | 'horizontalDots'
    | 'folder';

export const icons: {
  [index in IconName]: React.ReactElement<SVGPathElement>;
} = {
  h1: (
    <path
      d="M17.0399 7.92603L20.0399 6.92603V17M4 6.5V12.0001M4 12.0001V17.0001M4 12.0001H12M12 6.5V12.0001M12 12.0001V17.0001"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  h2: (
    <path
      d="M15 10.4998V9.99976C15 8.3429 16.3431 6.99976 18 6.99976H18.1716C19.7337 6.99976 20.9996 8.26627 20.9996 9.82837C20.9996 10.5785 20.702 11.2979 20.1716 11.8284L15 16.9999L21.5 17M3 6.99988V11.9999M3 11.9999V16.9999M3 11.9999H11M11 6.99988V11.9999M11 11.9999V16.9999"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  h3: (
    <path
      d="M15 7H21L17 11H18C19.6569 11 21 12.3431 21 14C21 15.6569 19.6569 17 18 17C17.3793 17 16.7738 16.8077 16.2671 16.4492C15.7604 16.0907 15.3775 15.5838 15.1709 14.9985M3 7V12M3 12V17M3 12H11M11 7V12M11 12V17"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  italic: (
    <path
      d="M8 17H10M10 17H12M10 17L14 6M12 6H14M14 6H16"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  bold: (
    <path
      d="M8 11.5H12.5M8 11.5V6H12.5C14.433 6 16 7.23122 16 8.75C16 10.2688 14.433 11.5 12.5 11.5M8 11.5V17H13.5C15.433 17 17 15.7688 17 14.25C17 12.7312 15.433 11.5 13.5 11.5H12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  underline: (
    <path
      d="M6 18H18M8 6V11C8 13.2091 9.79086 15 12 15C14.2091 15 16 13.2091 16 11V6"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  listCheck: (
    <path
      d="M12 17H20M8 15L5.5 18L4 17M12 7H20M8 5L5.5 8L4 7"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  listOl: (
    <path
      d="M11 17H19M4 15.6853V15.5C4 14.6716 4.67157 14 5.5 14H5.54054C6.34658 14 7.00021 14.6534 7.00021 15.4595C7.00021 15.8103 6.8862 16.1519 6.67568 16.4326L4 20.0002L7 20M11 7H19M4 5L6 4V10"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  listUl: (
    <path
      d="M6 17C6 17.5523 5.55228 18 5 18C4.44772 18 4 17.5523 4 17C4 16.4477 4.44772 16 5 16C5.55228 16 6 16.4477 6 17Z M6 7C6 7.55228 5.55228 8 5 8C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6C5.55228 6 6 6.44772 6 7Z M11 17H19M11 7H19M6 17C6 17.5523 5.55228 18 5 18C4.44772 18 4 17.5523 4 17C4 16.4477 4.44772 16 5 16C5.55228 16 6 16.4477 6 17ZM6 7C6 7.55228 5.55228 8 5 8C4.44772 8 4 7.55228 4 7C4 6.44772 4.44772 6 5 6C5.55228 6 6 6.44772 6 7Z"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  share: (
    <path
      d="M21 12V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V12M16 7L12 3M12 3L8 7M12 3V15"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  sidebar: (
    <path
      d="M9 3V21M7.8 3H16.2C17.8802 3 18.7202 3 19.362 3.32698C19.9265 3.6146 20.3854 4.07354 20.673 4.63803C21 5.27976 21 6.11984 21 7.8V16.2C21 17.8802 21 18.7202 20.673 19.362C20.3854 19.9265 19.9265 20.3854 19.362 20.673C18.7202 21 17.8802 21 16.2 21H7.8C6.11984 21 5.27976 21 4.63803 20.673C4.07354 20.3854 3.6146 19.9265 3.32698 19.362C3 18.7202 3 17.8802 3 16.2V7.8C3 6.11984 3 5.27976 3.32698 4.63803C3.6146 4.07354 4.07354 3.6146 4.63803 3.32698C5.27976 3 6.11984 3 7.8 3Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  close: (
    <path
      d="M6 18L18 6M6 6L18 18"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  horizontalDots: (
    <>
      <path
        d="M17 12C17 12.5523 17.4477 13 18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12Z"
        fill="currentColor"
      />
      <path
        d="M11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z"
        fill="currentColor"
      />
      <path
        d="M5 12C5 12.5523 5.44772 13 6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12Z"
        fill="currentColor"
      />
      <path
        d="M17 12C17 12.5523 17.4477 13 18 13C18.5523 13 19 12.5523 19 12C19 11.4477 18.5523 11 18 11C17.4477 11 17 11.4477 17 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M11 12C11 12.5523 11.4477 13 12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M5 12C5 12.5523 5.44772 13 6 13C6.55228 13 7 12.5523 7 12C7 11.4477 6.55228 11 6 11C5.44772 11 5 11.4477 5 12Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  ),
  folder: (
    <path
      d="M12.3086 2.53125L13.584 4.125H21.5137V18.75H19.0957L19.2158 20.127L3.77441 21.4775L2.42383 6.03711L6.01367 5.72168V2.25H12.083L12.3086 2.53125ZM4.04883 7.40039L5.1377 19.8525L17.5908 18.7627L16.6533 8.05371L9.54492 8.67578L7.89844 7.06348L4.04883 7.40039ZM7.51367 5.59082L8.4541 5.50879L10.1006 7.12207L18.0166 6.42871L18.9639 17.25H20.0137V5.625H12.8623L12.6367 5.34375L11.3613 3.75H7.51367V5.59082Z"
      fill="currentColor"
    />
  ),
};
