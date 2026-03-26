import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

const THEME_KEY = 'atmos-theme'
type ThemeMode = 'dark' | 'light'

const applyTheme = (theme: ThemeMode) => {
  document.documentElement.dataset.theme = theme
}

if (typeof window !== 'undefined') {
  const stored = window.localStorage.getItem(THEME_KEY)
  if (stored === 'dark' || stored === 'light') {
    applyTheme(stored)
  }
}

createRoot(document.getElementById('root')!).render(<App />)
