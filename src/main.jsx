import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

const fontLink = document.createElement('link')
fontLink.rel = 'stylesheet'
fontLink.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;500;600;700;800&display=swap'
document.head.appendChild(fontLink)

document.documentElement.style.fontFamily = '"Nunito Sans", sans-serif'
document.body.style.fontFamily = '"Nunito Sans", sans-serif'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
