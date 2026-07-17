/** Official Sichuan construction learning site (practice questions). */
export const OFFICIAL_BANK_URL =
  'https://xx.sjwrtvu.cn/member/index/view?main=member_questions&gid=1641&cid=641'

export const OFFICIAL_LOGIN_URL =
  'https://xx.sjwrtvu.cn/member/index/login?url=' +
  encodeURIComponent(OFFICIAL_BANK_URL)

const STORAGE_KEY = 'practice-app-official-login'

export interface OfficialLogin {
  idCard: string
  password: string
}

export function loadOfficialLogin(): OfficialLogin {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { idCard: '', password: '' }
    const parsed = JSON.parse(raw) as OfficialLogin
    return {
      idCard: parsed.idCard ?? '',
      password: parsed.password ?? '',
    }
  } catch {
    return { idCard: '', password: '' }
  }
}

export function saveOfficialLogin(login: OfficialLogin): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(login))
}
