// The kiosk layout scrolls inside <body>, so reset every possible scroller
export const scrollToTop = () => {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
};
