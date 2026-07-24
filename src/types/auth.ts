/** 認證相關型別 */

export interface AuthUser {
  id: string
  email: string | null
}

export interface AuthCredentials {
  email: string
  password: string
}
