import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import kleur from 'kleur'
import prompts from 'prompts'
import type { CreateOptions } from './types'
import {
    copyTemplate,
    ensureDir,
    readPackageJson,
    replaceInDir,
    writePackageJson
} from './utils'
import { t } from './i18n'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export async function createPlugin(options: CreateOptions) {
    const { name, target, template, variables = {} } = options

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

    // Extract plugin name for template variable replacement
    let pluginName: string
    if (template === 'adapter') {
        // For adapter template, extract the adapter name
        // koishi-plugin-chatluna-adapter-xxx -> xxx
        pluginName = name.replace('koishi-plugin-chatluna-adapter-', '')
    } else {
        // For other templates, remove koishi-plugin- prefix
        pluginName = name.replace('koishi-plugin-', '')
    }

    const allVariables = { template: pluginName, ...variables }
    await replaceInDir(target, allVariables)

    console.log(kleur.green(`\n${t('messages.pluginCreated')} ${target}`))
}
