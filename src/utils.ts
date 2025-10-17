import { existsSync, promises as fsp } from 'fs'
import { dirname, join, resolve } from 'path'
import type { PluginContext } from './types.js'

export async function detectContext(cwd: string): Promise<PluginContext> {
    const pkgPath = join(cwd, 'package.json')

    if (!existsSync(pkgPath)) {
        const parent = dirname(cwd)
        if (parent === cwd) {
            return { root: cwd, isPlugin: false, isWorkspace: false }
        }
        return detectContext(parent)
    }

    const pkg = JSON.parse(await fsp.readFile(pkgPath, 'utf-8'))
    const isPlugin = pkg.name?.startsWith('koishi-plugin-') ?? false
    const isWorkspace = !!(pkg.workspaces || pkg.private)

    if (isPlugin) {
        return { root: cwd, isPlugin: true, isWorkspace: false }
    }

    if (isWorkspace) {
        return { root: cwd, isPlugin: false, isWorkspace: true }
    }

    const parent = dirname(cwd)
    if (parent === cwd) {
        return { root: cwd, isPlugin: false, isWorkspace: false }
    }

    return detectContext(parent)
}

export async function readPackageJson(path: string) {
    const content = await fsp.readFile(path, 'utf-8')
    return JSON.parse(content)
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function writePackageJson(path: string, data: any) {
    await fsp.writeFile(path, JSON.stringify(data, null, 2) + '\n')
}

export async function ensureDir(path: string) {
    await fsp.mkdir(path, { recursive: true })
}

export async function copyTemplate(src: string, dest: string) {
    const stat = await fsp.stat(src)

    if (stat.isDirectory()) {
        await ensureDir(dest)
        const entries = await fsp.readdir(src)
        await Promise.all(
            entries.map((entry) =>
                copyTemplate(join(src, entry), join(dest, entry))
            )
        )
    } else {
        await fsp.copyFile(src, dest)
    }
}

export async function replaceInFile(
    path: string,
    variables: Record<string, string>
) {
    let content = await fsp.readFile(path, 'utf8')
    for (const [key, value] of Object.entries(variables)) {
        content = content.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value)
    }
    await fsp.writeFile(path, content)
}

export async function replaceInDir(
    dir: string,
    variables: Record<string, string>
) {
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    await Promise.all(
        entries.map(async (entry) => {
            const path = join(dir, entry.name)
            if (entry.isDirectory()) {
                await replaceInDir(path, variables)
            } else {
                await replaceInFile(path, variables)
            }
        })
    )
}

export function showBanner() {
    const banner = `
   ██████╗██╗  ██╗ █████╗ ████████╗██╗     ██╗   ██╗███╗   ██╗ █████╗
  ██╔════╝██║  ██║██╔══██╗╚══██╔══╝██║     ██║   ██║████╗  ██║██╔══██╗
  ██║     ███████║███████║   ██║   ██║     ██║   ██║██╔██╗ ██║███████║
  ██║     ██╔══██║██╔══██║   ██║   ██║     ██║   ██║██║╚██╗██║██╔══██║
  ╚██████╗██║  ██║██║  ██║   ██║   ███████╗╚██████╔╝██║ ╚████║██║  ██║
   ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝  ╚═╝`

    const lines = banner.split('\n')
    const colors = [
        '\x1b[38;5;93m',
        '\x1b[38;5;99m',
        '\x1b[38;5;105m',
        '\x1b[38;5;111m',
        '\x1b[38;5;147m',
        '\x1b[38;5;183m',
        '\x1b[38;5;189m'
    ]
    const reset = '\x1b[0m'

    lines.forEach((line, i) => {
        const colorIndex = Math.floor((i / lines.length) * colors.length)
        console.log(colors[colorIndex] + line + reset)
    })
}
