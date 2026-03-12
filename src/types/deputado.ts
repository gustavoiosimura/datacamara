
export interface Deputado {
  id: number
  nome: string
  siglaPartido: string
  siglaUf: string
  urlFoto: string
  uri?: string
  email?: string
}

export interface ApiResponse {
  dados: Deputado[]
  links: Array<{
    rel: string
    href: string
  }>
}

