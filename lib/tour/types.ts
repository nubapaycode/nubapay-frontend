export type TourStep = {
  id: string
  /** CSS selector — querySelectorAll is used so both desktop/mobile variants are found. */
  target: string
  title: string
  content: string
  placement: 'top' | 'bottom' | 'left' | 'right'
  /** Shown in a floating hint when the target is not visible on the current page. */
  hint: string
  /** Returns true when this step belongs to the current pathname. */
  matchPath: (pathname: string) => boolean
}
