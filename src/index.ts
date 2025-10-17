import { join } from 'path'
import kleur from 'kleur'
import prompts from 'prompts'
import whichPMRuns from 'which-pm-runs'
import { exec } from 'child_process'
import { promisify } from 'util'
import type { TemplateType } from './types.js'
import { detectContext, showBanner } from './utils.js'
import { createPlugin } from './create.js'
import { addDependencies } from './add.js'
import { initI18n, t } from './i18n.js'
import fs from 'fs'

const execAsync = promisify(exec)

async function handleInstall(workspaceRoot: string) {
    const { install } = await prompts({
        type: 'confirm',
        name: 'install',
        message: t('prompts.installNow'),
        initial: false
    })

    if (!install) {
        const pm = whichPMRuns()
        const agent = pm?.name || 'npm'
        const cmd =
            agent === 'yarn'
                ? 'yarn'
                : agent === 'pnpm'
                  ? 'pnpm install'
                  : 'npm install'

        console.log(kleur.cyan(`\n${t('messages.nextSteps')}`))
        console.log(`  cd ${workspaceRoot}`)
        console.log(`  ${cmd}`)
        return
    }

    const pm = whichPMRuns()
    const agent = pm?.name || 'npm'
    const cmd =
        agent === 'yarn' ? 'yarn' : agent === 'pnpm' ? 'pnpm install' : 'npm install'

    console.log(kleur.cyan(`\n${t('messages.installing')}`))
    try {
        await execAsync(cmd, { cwd: workspaceRoot })
        console.log(kleur.green(t('messages.installSuccess')))
    } catch (error) {
        console.error(kleur.red(t('messages.installFailed')))
        throw error
    }
}

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
