import { useTranslation } from '../i18n/I18nContext'
import './ModeSelectScreen.css'

interface ModeSelectScreenProps {
  onSelectOffline: () => void
  onSelectOnline: () => void
}

export default function ModeSelectScreen({ onSelectOffline, onSelectOnline }: ModeSelectScreenProps) {
  const { t } = useTranslation()

  return (
    <div className="mode-select">
      <h1 className="mode-select__title">{t('appTitle')}</h1>
      <p className="mode-select__lead">{t('modeSelectLead')}</p>

      <button type="button" className="mode-select__option" onClick={onSelectOffline}>
        <span className="mode-select__option-title">{t('modeOfflineTitle')}</span>
        <span className="mode-select__option-desc">{t('modeOfflineDesc')}</span>
      </button>

      <button type="button" className="mode-select__option" onClick={onSelectOnline}>
        <span className="mode-select__option-title">{t('modeOnlineTitle')}</span>
        <span className="mode-select__option-desc">{t('modeOnlineDesc')}</span>
      </button>
    </div>
  )
}
