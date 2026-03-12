
import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import './DeputadoDetalhes.css'

interface Despesa {
  ano: number
  mes: number
  tipoDespesa: string
  codDocumento: number
  tipoDocumento: string
  codTipoDocumento: string
  dataDocumento: string
  numDocumento: string
  valorDocumento: number
  urlDocumento: string
  nomeFornecedor: string
  cnpjCpfFornecedor: string
  valorLiquido: number
  valorGlosa: number
  numRessarcimento: string
  codLote: number
  parcela: number
}

interface TipoDespesa {
  cod: string
  nome: string
}

interface Deputado {
  id: number
  nome: string
  siglaPartido: string
  siglaUf: string
  urlFoto: string
}

interface Link {
  rel: string
  href: string
}

interface ResultadoPaginacao {
  ultimaPagina: number
}

interface Legislatura {
  id: number
  uri: string
  dataInicio: string
  dataFim: string
}

const ITENS_INICIAIS = 80
const ITENS_POR_CARREGAMENTO = 40

function DeputadoDetalhes() {
  const navigate = useNavigate()
  const location = useLocation()

  const deputadoFromState = location.state?.deputado as Deputado | undefined

  const [deputado, setDeputado] = useState<Deputado | null>(deputadoFromState || null)
  const [tiposDespesa, setTiposDespesa] = useState<TipoDespesa[]>([])
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('Todos')
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const [anoAtual, setAnoAtual] = useState<number>(new Date().getFullYear());
  const [despesas, setDespesas] = useState<Despesa[]>([])

  const [totalPaginas, setTotalPaginas] = useState<number>(0)
  const [paginaCarregando, setPaginaCarregando] = useState<number>(0)

  // Controla quantos itens da lista filtrada estão visíveis
  const [itensvisiveis, setItensVisiveis] = useState<number>(ITENS_INICIAIS)

  const [legislaturaAtual, setLegislaturaAtual] = useState<Legislatura | null>(null)

  // Reseta a paginação local ao trocar o tipo de despesa
  const handleTipoChange = (novoTipo: string) => {
    setTipoSelecionado(novoTipo)
    setItensVisiveis(ITENS_INICIAIS)
  }

  useEffect(() => {
    carregarLegislaturaAtual()
    if (deputado) {
      carregarDespesasDeputado(anoAtual, deputado.id)
    }
  }, [])

  const carregarLegislaturaAtual = async () => {
    try {
      const response = await fetch(
        `/api/v2/legislaturas?ordem=DESC&ordenarPor=id&pagina=1&itens=100`,
        { headers: { 'accept': 'application/json' } }
      )
      if (!response.ok) throw new Error('Erro ao buscar legislaturas')
      const data = await response.json()

      const hoje = new Date()
      const atual = (data.dados as Legislatura[]).find(leg => {
        const inicio = new Date(leg.dataInicio)
        const fim = new Date(leg.dataFim)
        return hoje >= inicio && hoje <= fim
      }) || null

      setLegislaturaAtual(atual)
    } catch (err) {
      console.error('Erro ao carregar legislatura atual:', err)
    }
  }

  useEffect(() => {
    if (deputado) {
      const ano = new Date().getFullYear();
      setAnoAtual(ano);
      carregarDespesasDeputado(anoAtual, deputado.id)
    }
  }, [])

  const carregarDespesasDeputado = async (ano: number, id: number) => {
    setLoading(true)
    try {
      if (!deputado) {
        const deputadoResponse = await fetch(`/api/v2/deputados/${id}`, {
          headers: { 'accept': 'application/json' }
        })
        if (!deputadoResponse.ok) throw new Error('Erro ao buscar deputado')
        const deputadoData = await deputadoResponse.json()
        setDeputado(deputadoData.dados)
      }

      if (tiposDespesa.length === 0) {
        const tiposResponse = await fetch('/api/v2/referencias/deputados/tipoDespesa', {
          headers: { 'accept': 'application/json' }
        })
        if (!tiposResponse.ok) throw new Error(`Erro ao buscar tipos de despesa: ${tiposResponse.status}`)
        const tiposData = await tiposResponse.json()
        const tiposFiltrados = tiposData.dados.filter((tipo: TipoDespesa) => tipo.cod && tipo.nome)
        setTiposDespesa(tiposFiltrados)
      }

      let todasDespesas: Despesa[] = []
      let paginaAtual = 0
      let ultimaPagina: number | null = null

      while (paginaAtual !== ultimaPagina) {
        paginaAtual += 1
        setPaginaCarregando(paginaAtual)

        const paginaDeDespesas = await fetchDespesas(ano, id, paginaAtual)
        if (!paginaDeDespesas) break

        todasDespesas = [...todasDespesas, ...paginaDeDespesas.dados]

        if (ultimaPagina === null) {
          const paginacao = verificaProximaPagina(paginaDeDespesas.links)
          ultimaPagina = paginacao.ultimaPagina
          setTotalPaginas(ultimaPagina)
        }
      }

      setDespesas(todasDespesas)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro:', err)
    } finally {
      setLoading(false)
    }
  }

  const verificaProximaPagina = (links: Link[] | null | undefined): ResultadoPaginacao => {
    const resultado: ResultadoPaginacao = { ultimaPagina: 1 }
    if (!links) return resultado

    const lastLink = links.find(link => link.rel === 'last')
    if (lastLink) {
      const queryString = lastLink.href.split('?')
      const urlParams = new URLSearchParams(queryString[1])
      resultado.ultimaPagina = parseInt(urlParams.get('pagina') || '1', 10)
    }

    return resultado
  }

  const fetchDespesas = async (ano: number, id: number, pagina: number) => {
    try {
      const response = await fetch(
        `/api/v2/deputados/${id}/despesas?ano=${ano}&ordem=ASC&ordenarPor=ano&pagina=${pagina}&itens=100`,
        { headers: { 'accept': 'application/json' } }
      )
      if (!response.ok) throw new Error('Erro ao buscar despesas')
      return await response.json()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      setError(errorMessage)
      console.error('Erro:', err)
      return null
    }
  }

  const formatarMoeda = (valor: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const gerarAnosDaLegislatura = (legislatura: Legislatura | null): number[] => {
    if (!legislatura) return [new Date().getFullYear()]

    const anoInicio = new Date(legislatura.dataInicio).getFullYear()
    const anoFim = new Date(legislatura.dataFim).getFullYear() - 1 // exclui o ano de encerramento
    const anos: number[] = []

    for (let ano = anoFim; ano >= anoInicio; ano--) {
      anos.push(ano)
    }

    return anos
  }


  // Lista filtrada completa
  const despesasFiltradas = tipoSelecionado === 'Todos'
    ? despesas
    : despesas.filter(d => d.tipoDespesa === tipoSelecionado)

  // Apenas os itens visíveis (paginação local)
  const despesasExibidas = despesasFiltradas.slice(0, itensvisiveis)

  const totalGasto = despesasFiltradas.reduce((acc, d) => acc + d.valorLiquido, 0)

  const temMais = itensvisiveis < despesasFiltradas.length

  const formatarDataCurta = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', { month: '2-digit', year: 'numeric' })
  }


  if (loading) {
    return (
      <div className="container">
        <div className="message">
          <div className="spinner"></div>
          <p>Carregando dados...</p>
          {totalPaginas > 0 && (
            <p>{paginaCarregando}/{totalPaginas} páginas</p>
          )}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <div className="message error">Erro: {error}</div>
        <button onClick={() => navigate('/')} className="btn-voltar">Voltar</button>
      </div>
    )
  }

  if (!deputado) {
    return (
      <div className="container">
        <div className="message">Deputado não encontrado</div>
        <center>
          <button onClick={() => navigate('/')} className="btn-voltar">Voltar</button>
        </center>
      </div>
    )
  }

  return (
    <div className="container">
      <button onClick={() => navigate('/')} className="btn-voltar">
        ← Voltar para lista
      </button>

      <div className="deputado-header">
        <div><h2>Despesas Parlamentares</h2></div>
        <div>
            {legislaturaAtual && (
              <span className="legislatura-badge">
                🏛️ {legislaturaAtual.id}ª Legislatura
                &nbsp;({formatarDataCurta(legislaturaAtual.dataInicio)} – {formatarDataCurta(legislaturaAtual.dataFim)})
              </span>
            )}
          </div>
        <div className='deputado-infos'> 
          <img src={deputado.urlFoto} alt={deputado.nome} className="deputado-foto-grande" />
          <div className="deputado-info">
            <h1>{deputado.nome}</h1>
            <p className="deputado-partido">{deputado.siglaPartido} - {deputado.siglaUf}</p>
          </div>
        </div>
      </div> 

      <div className="despesas-resumo">
        <div className="tipo-selector-container">
          <div className="tipo-selector-wrapper">
            <label htmlFor="tipo-despesa"><strong>Tipo de Despesa:</strong></label>
            <select
              id="tipo-despesa"
              className="tipo-dropdown"
              value={tipoSelecionado}
              onChange={(e) => handleTipoChange(e.target.value)}
            >
              <option value="Todos">Todos</option>
              {tiposDespesa.map(tipo => (
                <option key={tipo.cod} value={tipo.nome}>{tipo.nome}</option>
              ))}
            </select>
          </div>

          <div className="ano-selector-wrapper">
            <label><strong>Ano:</strong></label>
            <div className="ano-botoes">
              {gerarAnosDaLegislatura(legislaturaAtual).map(ano => (
                <button
                  key={ano}
                  className={`btn-ano ${anoAtual === ano ? 'btn-ano--ativo' : ''}`}
                  onClick={() => {
                    if (ano !== anoAtual) {
                      setAnoAtual(ano)
                      setDespesas([])
                      setItensVisiveis(ITENS_INICIAIS)
                      carregarDespesasDeputado(ano, deputado.id)
                    }
                  }}
                >
                  {ano}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p><strong>Total gasto nesta categoria:</strong> {formatarMoeda(totalGasto)}</p>
        <p>
          <strong>Exibindo:</strong> {despesasExibidas.length} de {despesasFiltradas.length} despesas
        </p>
      </div>
              
      <div className="despesas-lista">
        {despesasExibidas.length === 0 ? (
          <div><center><p className="message">Nenhuma despesa encontrada para este tipo.</p></center></div>
        ) : (
          despesasExibidas.map((despesa, index) => (
            <div key={index} className="despesa-card">
              <div className="despesa-header">
                <span className="despesa-data">{despesa.mes}/{despesa.ano}</span>
                <span className="despesa-valor">{formatarMoeda(despesa.valorLiquido)}</span>
              </div>
              <div className="despesa-body">
                <p><strong>Fornecedor:</strong> {despesa.nomeFornecedor}</p>
                <p><strong>CNPJ/CPF:</strong> {despesa.cnpjCpfFornecedor}</p>
                <p><strong>Documento:</strong> {despesa.tipoDocumento} - {despesa.numDocumento}</p>
                <p><strong>Data:</strong> {formatarData(despesa.dataDocumento)}</p>
                {despesa.valorGlosa > 0 && (
                  <p className="despesa-glosa">
                    <strong>Valor Glosa:</strong> {formatarMoeda(despesa.valorGlosa)}
                  </p>
                )}
                <div style={{ marginTop: '15px' }}>
                    <strong>Dados Completos:</strong>
                    <pre style={{
                      background: '#f5f5f5',
                      padding: '10px',
                      borderRadius: '4px',
                      overflow: 'auto',
                      fontSize: '12px',
                      marginTop: '5px'
                    }}>
                      {JSON.stringify(despesa, null, 2)}
                    </pre>
                  </div>
              </div>
              {despesa.urlDocumento && (
                <div className="despesa-footer">
                  <a
                    href={despesa.urlDocumento}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-documento"
                  >
                    Ver Documento
                  </a>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {temMais && (
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <button
            className="btn-carregar-mais"
            onClick={() => setItensVisiveis(prev => prev + ITENS_POR_CARREGAMENTO)}
          >
            Carregar mais ({Math.min(ITENS_POR_CARREGAMENTO, despesasFiltradas.length - itensvisiveis)} restantes de {despesasFiltradas.length - itensvisiveis})
          </button>
        </div>
      )}
    </div>
  )
}

export default DeputadoDetalhes


