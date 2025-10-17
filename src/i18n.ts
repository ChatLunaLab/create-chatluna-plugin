import { fileURLToPath } from 'url'
import { join } from 'path'
import { readFileSync } from 'fs'
import { osLocale } from 'os-locale'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Messages = Record<string, any>
const locales: Record<string, Messages> = {}
let messages: Messages

async function detectLocale(): Promise<string> {
    try {
        const locale = await osLocale()
        return locale.startsWith('zh') ? 'zh' : 'en'
    } catch {
        return 'en'
    }
}

function loadLocale(locale: string): Messages {
    if (locales[locale]) return locales[locale]

    try {
        const path = join(__dirname, 'locales', `${locale}.json`)
        locales[locale] = JSON.parse(readFileSync(path, 'utf-8'))
        return locales[locale]
    } catch {
        return locale === 'en' ? {} : loadLocale('en')
    }
}

export function t(key: string): string {
    const keys = key.split('.')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let value: any = messages

    for (const k of keys) {
        value = value?.[k]
        if (!value) return key
    }

    return typeof value === 'string' ? value : key
}

export async function initI18n() {
    const locale = await detectLocale()
    messages = loadLocale(locale)
}
