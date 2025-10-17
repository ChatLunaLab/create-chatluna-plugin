import { existsSync } from 'fs'
import { join, resolve } from 'path'
import { fileURLToPath } from 'url'
import kleur from 'kleur'
import type { AddOptions } from './types.js'
import { copyTemplate, readPackageJson, writePackageJson } from './utils.js'
import { t } from './i18n.js'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

export async function addDependencies(options: AddOptions) {
    const { target, includeChatlunaFile } = options
    const pkgPath = join(target, 'package.json')

    if (!existsSync(pkgPath)) {
        console.error(kleur.red(t('messages.packageNotFound')))
        return
    }

    const pkg = await readPackageJson(pkgPath)

    pkg.peerDependencies = pkg.peerDependencies || {}
    pkg.peerDependencies['koishi-plugin-chatluna'] = '^1.3.0-alpha.67'

    pkg.devDependencies = pkg.devDependencies || {}
    pkg.devDependencies['koishi-plugin-chatluna'] = '^1.0.0'

    pkg.dependencies = pkg.dependencies || {}
    pkg.dependencies['@langchain/core'] = '0.3.62'

    pkg.resolutions = pkg.resolutions || {}
    pkg.resolutions['@langchain/core'] = '0.3.62'
    pkg.resolutions['js-tiktoken'] = 'npm:@dingyi222666/js-tiktoken@^1.0.21'

    pkg.overrides = pkg.overrides || {}
    pkg.overrides['@langchain/core'] = '0.3.62'
    pkg.overrides['js-tiktoken'] = 'npm:@dingyi222666/js-tiktoken@^1.0.21'

    pkg.pnpm = pkg.pnpm || {}
    pkg.pnpm.overrides = pkg.pnpm.overrides || {}
    pkg.pnpm.overrides['@langchain/core'] = '0.3.62'
    pkg.pnpm.overrides['js-tiktoken'] = 'npm:@dingyi222666/js-tiktoken@^1.0.21'

    await writePackageJson(pkgPath, pkg)

    if (includeChatlunaFile) {
        const chatlunaPath = join(target, 'src', 'chatluna.ts')
        const chatlunaTemplate = resolve(__dirname, '../resources/chatluna.ts')
        await copyTemplate(chatlunaTemplate, chatlunaPath)
    }

    console.log(kleur.green(`\n${t('messages.dependenciesAdded')}`))
}
