import { useTranslation } from '../i18n/I18nContext'
import { LOCALES, LOCALE_LABELS, type Locale } from '../i18n/translations'
import './LanguageSwitcher.css'

export default function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation()

  return (
    <div className="language-switcher">
      {LOCALES.map((loc) => (
        <button
          key={loc}
          type="button"
          className={`language-switcher__option ${locale === loc ? 'language-switcher__option--active' : ''}`}
          onClick={() => setLocale(loc as Locale)}
          aria-pressed={locale === loc}
        >
          {LOCALE_LABELS[loc]}
        </button>
      ))}
    </div>
  )
}
