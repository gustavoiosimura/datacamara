
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import App from './App.tsx'
import DeputadoDetalhes from './pages/DeputadoDetalhes.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/deputado/:id" element={<DeputadoDetalhes />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)

