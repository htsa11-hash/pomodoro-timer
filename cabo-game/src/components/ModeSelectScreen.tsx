import './ModeSelectScreen.css'

interface ModeSelectScreenProps {
  onSelectOffline: () => void
  onSelectOnline: () => void
}

export default function ModeSelectScreen({ onSelectOffline, onSelectOnline }: ModeSelectScreenProps) {
  return (
    <div className="mode-select">
      <h1 className="mode-select__title">🃏 Cabo（カボ）</h1>
      <p className="mode-select__lead">遊び方を選んでください。</p>

      <button type="button" className="mode-select__option" onClick={onSelectOffline}>
        <span className="mode-select__option-title">📱 オフライン（パス＆プレイ）</span>
        <span className="mode-select__option-desc">1台の端末をみんなで回して遊びます。</span>
      </button>

      <button type="button" className="mode-select__option" onClick={onSelectOnline}>
        <span className="mode-select__option-title">🌐 オンライン対戦</span>
        <span className="mode-select__option-desc">それぞれの端末からルームに参加して遊びます。</span>
      </button>
    </div>
  )
}
