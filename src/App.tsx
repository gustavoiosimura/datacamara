
import { useState, useEffect, useMemo } from 'react'
import DeputadosGrid from './components/DeputadosGrid'
import type { Deputado, ApiResponse } from './types/deputado'
import './App.css' 


function App() {
  const [deputados, setDeputados] = useState<Deputado[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 24

  // Estados dos filtros
  const [busca, setBusca] = useState<string>('')
  const [partidoSelecionado, setPartidoSelecionado] = useState<string>('')
  const [ufSelecionada, setUfSelecionada] = useState<string>('')

  useEffect(() => {
    fetchDeputados()
  }, [])

  const fetchDeputados = async (): Promise<void> => {
    try {
      setLoading(true)
      const response = await fetch('/api/api/v2/deputados?ordem=ASC&ordenarPor=nome', {
        method: 'GET',
        headers: {
          'accept': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      setDeputados(data.dados)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  // Listas dinâmicas de partidos e UFs geradas a partir dos dados
  const partidos = useMemo(() => {
    const set = new Set(deputados.map((d) => d.siglaPartido).filter(Boolean))
    return Array.from(set).sort()
  }, [deputados])

  const ufs = useMemo(() => {
    const set = new Set(deputados.map((d) => d.siglaUf).filter(Boolean))
    return Array.from(set).sort()
  }, [deputados])

  // Deputados filtrados
  const deputadosFiltrados = useMemo(() => {
    return deputados.filter((d) => {
      const nomeMatch = d.nome.toLowerCase().includes(busca.toLowerCase())
      const partidoMatch = partidoSelecionado ? d.siglaPartido === partidoSelecionado : true
      const ufMatch = ufSelecionada ? d.siglaUf === ufSelecionada : true
      return nomeMatch && partidoMatch && ufMatch
    })
  }, [deputados, busca, partidoSelecionado, ufSelecionada])

  // Resetar para página 1 ao filtrar
  useEffect(() => {
    setCurrentPage(1)
  }, [busca, partidoSelecionado, ufSelecionada])

  // Cálculos de paginação sobre os dados filtrados
  const totalPages = Math.ceil(deputadosFiltrados.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentDeputados = deputadosFiltrados.slice(startIndex, endIndex)

  // Funções de navegação
  const goToPage = (page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const goToPrevious = () => {
    if (currentPage > 1) goToPage(currentPage - 1)
  }

  const goToNext = () => {
    if (currentPage < totalPages) goToPage(currentPage + 1)
  }

  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i)
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i)
        pages.push('...')
        pages.push(totalPages)
      } else if (currentPage >= totalPages - 2) {
        pages.push(1)
        pages.push('...')
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('...')
        pages.push(currentPage - 1)
        pages.push(currentPage)
        pages.push(currentPage + 1)
        pages.push('...')
        pages.push(totalPages)
      }
    }

    return pages
  }

  if (loading) {
    return (
      <div className="container">
        <div className="message">Carregando deputados...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="message error">Erro: {error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <header className="header"> 
          <div className="header-text">
            <h1>Data Câmara</h1>
            <p className="subtitle">Baseie seus dados em votos, não em promessas</p>
            <p className="subtitle">- Data Is The New Oil</p>
          </div>
          <span className="header-badge">{deputadosFiltrados.length} deputados</span>
        </header>


      {/* Barra de filtros */}
      <div className="filtros">
        <input
          type="text"
          className="filtro-busca"
          placeholder="Buscar por nome..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />

        <select
          className="filtro-select"
          value={partidoSelecionado}
          onChange={(e) => setPartidoSelecionado(e.target.value)}
        >
          <option value="">Todos os partidos</option>
          {partidos.map((partido) => (
            <option key={partido} value={partido}>
              {partido}
            </option>
          ))}
        </select>

        <select
          className="filtro-select"
          value={ufSelecionada}
          onChange={(e) => setUfSelecionada(e.target.value)}
        >
          <option value="">Todos os estados</option>
          {ufs.map((uf) => (
            <option key={uf} value={uf}>
              {uf}
            </option>
          ))}
        </select>

        {(busca || partidoSelecionado || ufSelecionada) && (
          <button
            className="filtro-limpar"
            onClick={() => {
              setBusca('')
              setPartidoSelecionado('')
              setUfSelecionada('')
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      {deputadosFiltrados.length === 0 ? (
        <div className="message">Nenhum deputado encontrado para os filtros selecionados.</div>
      ) : (
        <>
          <DeputadosGrid deputados={currentDeputados} />

          <div className="pagination">
            <button
              className="pagination-btn"
              onClick={goToPrevious}
              disabled={currentPage === 1}
            >
              ← Anterior
            </button>

            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) =>
                typeof page === 'number' ? (
                  <button
                    key={index}
                    className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                    onClick={() => goToPage(page)}
                  >
                    {page}
                  </button>
                ) : (
                  <span key={index} className="pagination-ellipsis">
                    {page}
                  </span>
                )
              )}
            </div>

            <button
              className="pagination-btn"
              onClick={goToNext}
              disabled={currentPage === totalPages}
            >
              Próxima →
            </button>
          </div>

          <div className="pagination-info">
            Página {currentPage} de {totalPages} | Exibindo {startIndex + 1}–{Math.min(endIndex, deputadosFiltrados.length)} de {deputadosFiltrados.length} deputados
          </div>
        </>
      )}
    </div>
  )
}

export default App


