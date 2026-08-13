import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Two languages, one dictionary.
 *
 * Every string the learner reads lives either here (app chrome) or in
 * `src/data/curriculum.ts` (course copy) as an `L10n` pair. Switching flips
 * `lang`, and the provider mirrors it onto <html> so the whole document
 * direction follows — Persian is RTL.
 */

export type Lang = 'en' | 'fa'

/** One piece of copy in both languages. */
export interface L10n {
  en: string
  fa: string
}

const STORAGE_KEY = 'trig101:lang'

/** App-chrome strings. Course copy lives next to the lessons themselves. */
const ui = {
  appName: { en: 'Trigonometry 101', fa: 'مثلثات ۱۰۱' },
  back: { en: 'Back', fa: 'بازگشت' },

  // Splash
  tagline: {
    en: 'Learn sine, cosine and tangent by dragging — not by reading.',
    fa: 'سینوس، کسینوس و تانژانت را با کشیدن یاد بگیر — نه با خواندن.',
  },
  startCourse: { en: 'Start the course', fa: 'شروع دوره' },
  resume: { en: 'Resume', fa: 'ادامه' },
  lessonLink: { en: 'Lesson {n} — {title}', fa: 'درس {n} — {title}' },

  // Home
  lessons: { en: 'Lessons', fa: 'درس‌ها' },
  lessonsComplete: { en: 'lessons complete', fa: 'درس کامل شده' },
  builtSoFar: {
    en: '{ready} of {total} built so far',
    fa: 'تاکنون {ready} درس از {total} ساخته شده',
  },
  chapterNo: { en: 'Chapter {n}', fa: 'فصل {n}' },
  chapterReview: { en: 'Chapter review', fa: 'مرور فصل' },
  reviewTag: {
    en: '{n} questions on everything above.',
    fa: '{n} پرسش دربارهٔ همهٔ آنچه در بالا آمد.',
  },
  soon: { en: 'Soon', fa: 'به‌زودی' },
  aboutApp: { en: 'About this app', fa: 'دربارهٔ این اپ' },

  // Lesson
  lessonOf: { en: 'Lesson {n} of {total}', fa: 'درس {n} از {total}' },
  done: { en: 'Done', fa: 'انجام شد' },
  lessonSteps: { en: 'Lesson steps', fa: 'مراحل درس' },
  stepN: { en: 'Step {n}', fa: 'مرحلهٔ {n}' },
  stepFind: { en: 'Find it', fa: 'پیدایش کن' },
  stepTry: { en: 'Try it', fa: 'امتحانش کن' },
  stepWhy: { en: 'Why it works', fa: 'چرا کار می‌کند' },
  giveTask: { en: 'Got it — give me a task', fa: 'فهمیدم — یک تمرین بده' },
  needHint: { en: 'Need a hint?', fa: 'راهنمایی می‌خواهی؟' },
  skip: { en: 'Skip', fa: 'رد شو' },
  nice: { en: 'Nice — that is the idea.', fa: 'آفرین — نکته همین بود.' },
  nextLesson: { en: 'Next lesson', fa: 'درس بعدی' },
  finishCourse: { en: 'Finish the course', fa: 'پایان دوره' },

  // Review
  noReview: {
    en: 'This chapter has no review yet.',
    fa: 'این فصل هنوز مروری ندارد.',
  },
  backToLessons: { en: 'Back to the lessons', fa: 'بازگشت به درس‌ها' },
  reviewComplete: { en: 'Review complete', fa: 'مرور کامل شد' },
  chapterNReview: { en: 'Chapter {n} review', fa: 'مرور فصل {n}' },
  allRight: { en: 'Every one right.', fa: 'همه درست.' },
  anotherLook: { en: 'Worth another look.', fa: 'ارزش یک نگاه دوباره را دارد.' },
  perfectMsg: {
    en: 'You can explain this chapter, not just operate it. That is the difference.',
    fa: 'این فصل را می‌توانی توضیح بدهی، نه فقط با آن کار کنی. تفاوت واقعی همین است.',
  },
  imperfectMsg: {
    en: 'Re-read the lesson for anything that felt shaky — the explanations are at the end of each one.',
    fa: 'هر جا احساس تردید داشتی درس را دوباره بخوان — توضیح‌ها در پایان هر درس آمده‌اند.',
  },
  startNextChapter: { en: 'Start the next chapter', fa: 'شروع فصل بعدی' },
  nextQuestion: { en: 'Next question', fa: 'پرسش بعدی' },
  seeResults: { en: 'See how you did', fa: 'نتیجه‌ات را ببین' },

  // Upcoming
  notBuilt: { en: 'Not built yet', fa: 'هنوز ساخته نشده' },

  // About
  studio: { en: 'Lucid Paper', fa: 'Lucid Paper' },
  aboutP1: {
    en: 'Fifteen interactive lessons that build one idea from the ground up: sine, cosine and tangent are not formulas to memorise, they are what you see when you watch a circle turn.',
    fa: 'پانزده درس تعاملی که یک ایده را از پایه می‌سازند: سینوس، کسینوس و تانژانت فرمول‌هایی برای حفظ کردن نیستند؛ همان چیزی‌اند که هنگام تماشای چرخش یک دایره می‌بینی.',
  },
  aboutP2: {
    en: "Animation and artwork by Lucid Paper, authored in Rive. Every slider, toggle and button you touch lives inside that file; this app is the course built around it, reading the artwork's own values back out as live readouts.",
    fa: 'انیمیشن و آثار هنری از Lucid Paper است و در Rive ساخته شده. هر اسلایدر، کلید و دکمه‌ای که لمس می‌کنی درون همان فایل زندگی می‌کند؛ این اپ دوره‌ای است که دور آن ساخته شده و مقادیر خودِ اثر را به‌صورت زنده بازمی‌خواند.',
  },
  aboutStat: {
    en: '{done} of {ready} lessons complete · {ready} of {total} built',
    fa: '{done} از {ready} درس کامل شده · {ready} از {total} ساخته شده',
  },
  confirmReset: {
    en: 'Clear every completed lesson?',
    fa: 'همهٔ درس‌های کامل‌شده پاک شوند؟',
  },
  resetProgress: { en: 'Reset progress', fa: 'بازنشانی پیشرفت' },

  // Desktop gate + phone frame
  presents: { en: 'Lucid Paper presents', fa: 'Lucid Paper تقدیم می‌کند' },
  desktopSoon: { en: 'Desktop — coming soon', fa: 'نسخهٔ دسکتاپ — به‌زودی' },
  builtForPhone: { en: 'Built for your phone', fa: 'ساخته‌شده برای گوشی تو' },
  gateBody: {
    en: 'Every lesson here is something you drag with a thumb. The desktop build is not ready yet — open this page on a phone to take the course.',
    fa: 'هر درس این دوره چیزی است که با انگشت شست می‌کشی. نسخهٔ دسکتاپ هنوز آماده نیست — این صفحه را روی گوشی باز کن تا دوره را بگذرانی.',
  },
  previewPhone: { en: 'Preview in a phone frame', fa: 'پیش‌نمایش در قاب گوشی' },
  scanQr: { en: 'Scan to open on your phone', fa: 'برای باز کردن روی گوشی اسکن کن' },
  closePreview: { en: 'Close preview', fa: 'بستن پیش‌نمایش' },
} satisfies Record<string, L10n>

export type UiKey = keyof typeof ui

function format(text: string, vars?: Record<string, string | number>): string {
  if (!vars) return text
  return text.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  )
}

interface I18nValue {
  lang: Lang
  setLang: (lang: Lang) => void
  /** App-chrome string by key, with `{name}` interpolation. */
  t: (key: UiKey, vars?: Record<string, string | number>) => string
  /** Course copy: pick the current language out of an `L10n` pair. */
  tr: (text: L10n) => string
}

const I18nContext = createContext<I18nValue | null>(null)

function storedLang(): Lang {
  try {
    const v = window.localStorage.getItem(STORAGE_KEY)
    if (v === 'en' || v === 'fa') return v
  } catch {
    // Private mode: fall through to the default.
  }
  return 'en'
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(storedLang)

  // The direction lives on <html>, so CSS and native widgets follow along.
  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = lang === 'fa' ? 'rtl' : 'ltr'
    try {
      window.localStorage.setItem(STORAGE_KEY, lang)
    } catch {
      // Not persisting is fine; the session still switches.
    }
  }, [lang])

  const value = useMemo<I18nValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => format(ui[key][lang], vars),
      tr: (text) => text[lang],
    }),
    [lang],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside <I18nProvider>')
  return ctx
}
