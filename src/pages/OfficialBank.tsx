import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Browser } from '@capacitor/browser'
import { Clipboard } from '@capacitor/clipboard'
import { Capacitor } from '@capacitor/core'
import {
  OFFICIAL_BANK_URL,
  OFFICIAL_LOGIN_URL,
  loadOfficialLogin,
  saveOfficialLogin,
} from '../config/officialSite'
import './OfficialBank.css'

export function OfficialBankPage() {
  const [idCard, setIdCard] = useState('')
  const [password, setPassword] = useState('')
  const [saved, setSaved] = useState(false)
  const [hint, setHint] = useState('')

  useEffect(() => {
    const login = loadOfficialLogin()
    setIdCard(login.idCard)
    setPassword(login.password)
  }, [])

  const showHint = (msg: string) => {
    setHint(msg)
    window.setTimeout(() => setHint(''), 2500)
  }

  const handleSave = () => {
    saveOfficialLogin({ idCard: idCard.trim(), password })
    setSaved(true)
    showHint('已保存到本机（不会上传到云端）')
    window.setTimeout(() => setSaved(false), 2000)
  }

  const copyText = async (text: string, label: string) => {
    if (!text) {
      showHint(`请先填写${label}`)
      return false
    }
    try {
      if (Capacitor.isNativePlatform()) {
        await Clipboard.write({ string: text })
      } else {
        await navigator.clipboard.writeText(text)
      }
      showHint(`已复制${label}`)
      return true
    } catch {
      showHint(`复制${label}失败，请手动复制`)
      return false
    }
  }

  const openSite = async () => {
    const url = OFFICIAL_LOGIN_URL
    // Copy ID first so user can paste immediately
    if (idCard.trim()) {
      await copyText(idCard.trim(), '账号')
    }
    try {
      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url })
      } else {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
      showHint('已打开官网，账号已复制，粘贴后点「复制密码」')
    } catch {
      window.open(url, '_blank')
    }
  }

  return (
    <div className="official-page">
      <header className="official-header">
        <Link to="/" className="official-back">
          ←
        </Link>
        <h1>官方练习题库</h1>
      </header>

      <p className="official-desc">
        四川建设学习网在线题库。因安全限制无法替你自动登录，但可一键打开，并自动复制账号/密码方便粘贴。
      </p>

      <div className="official-card">
        <label className="official-label">
          学员身份证号
          <input
            type="text"
            value={idCard}
            onChange={(e) => setIdCard(e.target.value)}
            placeholder="请输入身份证号"
            autoComplete="username"
          />
        </label>
        <label className="official-label">
          密码
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </label>

        <button type="button" className="official-btn secondary" onClick={handleSave}>
          {saved ? '已保存' : '保存到本机'}
        </button>
      </div>

      <div className="official-actions">
        <button type="button" className="official-btn primary" onClick={openSite}>
          打开官方题库（先复制账号）
        </button>
        <button
          type="button"
          className="official-btn outline"
          onClick={() => copyText(idCard.trim(), '账号')}
        >
          复制账号
        </button>
        <button
          type="button"
          className="official-btn outline"
          onClick={() => copyText(password, '密码')}
        >
          复制密码
        </button>
      </div>

      <ol className="official-steps">
        <li>点「打开官方题库」→ 系统浏览器打开登录页</li>
        <li>账号输入框长按粘贴（账号已自动复制）</li>
        <li>回到 App 点「复制密码」，再粘贴到密码框</li>
        <li>登录后会进入练习题页面</li>
      </ol>

      <p className="official-url">目标页：{OFFICIAL_BANK_URL}</p>

      {hint && <div className="official-toast">{hint}</div>}
    </div>
  )
}
