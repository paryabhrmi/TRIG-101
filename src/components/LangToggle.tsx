import { useI18n } from '../lib/i18n'

interface Props {
  className?: string
}

/** One-tap language switch. Shows the language it switches *to*. */
export function LangToggle({ className }: Props) {
  const { lang, setLang } = useI18n()
  const next = lang === 'en' ? 'fa' : 'en'

  return (
    <button
      type="button"
      className={`langbtn ${className ?? ''}`.trim()}
      lang={next}
      onClick={() => setLang(next)}
    >
      {next === 'fa' ? 'فارسی' : 'English'}
    </button>
  )
}
