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
                type: 'select',
                name: 'template',
                message: t('prompts.selectTemplate'),
                choices: [
                    { title: t('prompts.templateMainDesc'), value: 'main' },
                    { title: t('prompts.templateDepDesc'), value: 'dep' },
                    {
                        title: t('prompts.templateAdapterDesc'),
                        value: 'adapter'
                    }
                ]
            },
            {
                type: (prev) => (prev === 'adapter' ? 'text' : null),
                name: 'adapterName',
                message: t('prompts.adapterName'),
                initial: 'example',
                validate: (v: string) =>
                    /^[a-z0-9-]+$/.test(v) || t('prompts.adapterNameValidation')
            },
            {
                type: (prev, values) =>
                    values.template !== 'adapter' ? 'text' : null,
                name: 'name',
                message: t('prompts.pluginName'),
                initial: 'koishi-plugin-chatluna-example',
                validate: (v: string) =>
                    v.startsWith('koishi-plugin-') ||
                    t('prompts.pluginNameValidation')
            }
        ])

        // Construct the full plugin name
        let pluginName: string
        if (result.template === 'adapter') {
            pluginName = `koishi-plugin-chatluna-adapter-${result.adapterName}`
        } else {
            pluginName = result.name
        }

        const isExternal = fs.existsSync(join(ctx.root, 'external'))

        const target = join(
            ctx.root,
            isExternal ? 'external' : 'packages',
            pluginName.replace('koishi-plugin-', '')
        )

        await createPlugin({
            name: pluginName,
            target,
            template: result.template as TemplateType
        })

        await handleInstall(ctx.root)
    }
}
