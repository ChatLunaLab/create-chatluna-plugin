import { join } from 'path'
import kleur from 'kleur'
import prompts from 'prompts'
import whichPMRuns from 'which-pm-runs'
import parser from 'yargs-parser'
import type { CliArgs, TemplateType } from './types.js'
import { detectContext, showBanner } from './utils.js'
import { createPlugin } from './create.js'
import { addDependencies } from './add.js'
import { initI18n, t } from './i18n.js'

function showInstallHelp(target: string) {
    const pm = whichPMRuns()
    const agent = pm?.name || 'npm'
    const cmd =
        agent === 'yarn'
            ? 'yarn'
            : agent === 'pnpm'
              ? 'pnpm install'
              : 'npm install'

    console.log(kleur.cyan(`\n${t('messages.nextSteps')}`))
    console.log(`  cd ${target}`)
    console.log(`  ${cmd}`)
}

export async function start() {
    await initI18n()
    showBanner()

    const args = parser(process.argv.slice(2), {
        alias: { force: ['f'], yes: ['y'] },
        boolean: ['force', 'yes']
    }) as CliArgs

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

        showInstallHelp(ctx.root)
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

        const target = join(
            ctx.root,
            'plugins',
            result.name.replace('koishi-plugin-', '')
        )

        await createPlugin({
            name: result.name,
            target,
            template: result.template as TemplateType
        })

        showInstallHelp(target)
    }
}
