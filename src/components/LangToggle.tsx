import { useI18n } from '../lib/i18n'

/** Two-state language switch. Each label is written in its own language. */
export function LangToggle() {
  const { lang, setLang } = useI18n()

  return (
    <div className="langtoggle" role="group" aria-label="Language">
      <button
        type="button"
        className={lang === 'en' ? 'is-on' : ''}
        aria-pressed={lang === 'en'}
        onClick={() => setLang('en')}
      >
        EN
      </button>
      <button
        type="button"
        className={lang === 'fa' ? 'is-on' : ''}
        aria-pressed={lang === 'fa'}
        onClick={() => setLang('fa')}
      >
        فا
      </button>
    </div>
  )
}
