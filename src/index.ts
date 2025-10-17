import { join } from 'path'
import kleur from 'kleur'
import prompts from 'prompts'
import type { TemplateType } from './types'
import { detectContext, handleInstall, showBanner } from './utils'
import { createPlugin } from './create'
import { addDependencies } from './add'
import { initI18n, t } from './i18n'
import fs from 'fs'

export async function start() {
    await initI18n()
    showBanner()

    process.on('SIGINT', () => {
        console.log(kleur.red(`\n${t('errors.cancelled')}`))
        process.exit(0)
    })

    const cwd = process.cwd()
    const ctx = await detectContext(cwd)

    if (ctx.isPlugin) {
        console.log(kleur.yellow(`${t('messages.detectedPlugin')} ${ctx.root}`))

        const { includeChatlunaFile } = await prompts({
            type: 'confirm',
            name: 'includeChatlunaFile',
            message: t('prompts.includeChatlunaFile'),
            initial: false
        })

        await addDependencies({
            target: ctx.root,
            includeChatlunaFile
        })

        await handleInstall(ctx.root)
    } else {
        console.log(
            kleur.yellow(`${t('messages.detectedWorkspace')} ${ctx.root}`)
        )

        const result = await prompts([
            {
                type: 'text',
                name: 'name',
                message: t('prompts.pluginName'),
                initial: 'koishi-plugin-chatluna-example',
                validate: (v: string) =>
                    v.startsWith('koishi-plugin-') ||
                    t('prompts.pluginNameValidation')
            },
            {
                type: 'select',
                name: 'template',
                message: t('prompts.selectTemplate'),
                choices: [
                    { title: t('prompts.templateMainDesc'), value: 'main' },
                    { title: t('prompts.templateDepDesc'), value: 'dep' }
                ]
            }
        ])

        const isExternal = fs.existsSync(join(ctx.root, 'external'))

        const target = join(
            ctx.root,
            isExternal ? 'external' : 'packages',
            result.name.replace('koishi-plugin-', '')
        )

        await createPlugin({
            name: result.name,
            target,
            template: result.template as TemplateType
        })

        await handleInstall(ctx.root)
    }
}
