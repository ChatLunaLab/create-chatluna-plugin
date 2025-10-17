import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import kleur from 'kleur'
import prompts from 'prompts'
import type { CreateOptions } from './types.js'
import {
    copyTemplate,
    ensureDir,
    readPackageJson,
    writePackageJson
} from './utils.js'
import { t } from './i18n.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export async function createPlugin(options: CreateOptions) {
    const { name, target, template } = options

    if (existsSync(target)) {
        const files = await import('fs/promises').then((fs) =>
            fs.readdir(target)
        )
        if (files.length > 0) {
            const { confirm } = await prompts({
                type: 'confirm',
                name: 'confirm',
                message: t('prompts.targetNotEmpty'),
                initial: false
            })
            if (!confirm) return
        }
    }

    await ensureDir(target)

    const templateDir = resolve(__dirname, `../resources/template_${template}`)
    await copyTemplate(templateDir, target)

    const pkgPath = join(target, 'package.json')
    const pkg = await readPackageJson(pkgPath)
    pkg.name = name
    await writePackageJson(pkgPath, pkg)

    console.log(kleur.green(`\n${t('messages.pluginCreated')} ${target}`))
}
