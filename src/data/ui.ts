import type { Localized } from '../lib/i18n'

/** Chrome strings. Lesson copy lives in `curriculum.ts`. */
export const ui = {
  appName: { en: 'Trigonometry 101', fa: 'مثلثات ۱۰۱' },
  presents: { en: 'Lucid Paper Studios presents', fa: 'لوسید پیپر استودیوز تقدیم می‌کند' },
  tagline: {
    en: 'Learn sine, cosine and tangent by dragging — not by reading.',
    fa: 'سینوس، کسینوس و تانژانت را با کشیدن یاد بگیرید، نه با خواندن.',
  },
  start: { en: 'Start the course', fa: 'شروع دوره' },
  resume: { en: 'Resume', fa: 'ادامه' },
  loading: { en: 'Loading…', fa: 'در حال بارگذاری…' },

  lessons: { en: 'Lessons', fa: 'درس‌ها' },
  lesson: { en: 'Lesson', fa: 'درس' },
  of: { en: 'of', fa: 'از' },
  chapter: { en: 'Chapter', fa: 'فصل' },
  done: { en: 'Done', fa: 'انجام شد' },
  complete: { en: 'complete', fa: 'تکمیل‌شده' },
  next: { en: 'Next lesson', fa: 'درس بعد' },
  finish: { en: 'Finish the course', fa: 'پایان دوره' },
  back: { en: 'Back', fa: 'بازگشت' },
  about: { en: 'About', fa: 'درباره' },
  reset: { en: 'Reset progress', fa: 'پاک کردن پیشرفت' },
  resetConfirm: {
    en: 'Clear every completed lesson?',
    fa: 'همهٔ درس‌های تکمیل‌شده پاک شوند؟',
  },

  tryIt: { en: 'Try this', fa: 'این را امتحان کنید' },
  solved: { en: 'Got it', fa: 'آفرین' },
  solvedNote: {
    en: 'Checkpoint cleared.',
    fa: 'ایستگاه رد شد.',
  },
  hint: { en: 'Hint', fa: 'راهنمایی' },
  readouts: { en: 'Live values', fa: 'مقادیر زنده' },
  readMore: { en: 'Read the lesson', fa: 'متن درس' },
  readLess: { en: 'Hide the lesson', fa: 'بستن متن' },
  dragHint: {
    en: 'Everything on the canvas is draggable.',
    fa: 'هر چیزی روی بوم قابل کشیدن است.',
  },

  courseDone: { en: 'Course complete', fa: 'دوره تمام شد' },
  courseDoneBody: {
    en: 'Ten lessons, one idea: a circle, measured honestly, is a wave.',
    fa: 'ده درس، یک ایده: دایره‌ای که صادقانه اندازه گرفته شود، یک موج است.',
  },
  reviewAny: { en: 'Review any lesson', fa: 'مرور درس‌ها' },

  desktopTitle: { en: 'Built for your phone', fa: 'ساخته‌شده برای گوشی شما' },
  desktopBody: {
    en: 'Every lesson here is something you drag with a thumb. The desktop build is not ready yet — open this page on a phone to take the course.',
    fa: 'هر درس اینجا چیزی است که با انگشت می‌کشید. نسخهٔ دسکتاپ هنوز آماده نیست — این صفحه را روی گوشی باز کنید.',
  },
  desktopScan: { en: 'Scan to open on your phone', fa: 'برای باز کردن روی گوشی، اسکن کنید' },
  desktopPreview: { en: 'Preview in a phone frame', fa: 'پیش‌نمایش در قاب گوشی' },
  desktopExit: { en: 'Close preview', fa: 'بستن پیش‌نمایش' },
  desktopSoon: { en: 'Desktop — coming soon', fa: 'دسکتاپ — به‌زودی' },

  aboutTitle: { en: 'About this app', fa: 'دربارهٔ این اپ' },
  aboutBody: {
    en: 'Ten interactive lessons that build one idea from the ground up: sine, cosine and tangent are not formulas to memorise, they are what you see when you watch a circle turn.',
    fa: 'ده درس تعاملی که یک ایده را از پایه می‌سازند: سینوس، کسینوس و تانژانت فرمول‌هایی برای حفظ کردن نیستند؛ چیزی هستند که وقتی چرخش یک دایره را تماشا می‌کنید، می‌بینید.',
  },
  aboutCredit: {
    en: 'Animation and artwork by Lucid Paper Studios, authored in Rive. This MVP wraps that file in a course shell.',
    fa: 'انیمیشن و طراحی از لوسید پیپر استودیوز، ساخته‌شده در Rive. این نسخهٔ اولیه، آن فایل را در قالب یک دوره ارائه می‌کند.',
  },
  language: { en: 'Language', fa: 'زبان' },
} satisfies Record<string, Localized>
