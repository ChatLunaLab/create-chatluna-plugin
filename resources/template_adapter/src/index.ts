import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'
import { Context, Logger, Schema } from 'koishi'
import { ${template}Client } from './client'
import { createLogger } from 'koishi-plugin-chatluna/utils/logger'

export let logger: Logger
export function apply(ctx: Context, config: Config) {
    logger = createLogger(ctx, 'chatluna-${template}-adapter')

    ctx.on('ready', async () => {
        const plugin = new ChatLunaPlugin(ctx, config, '${template}')

        plugin.parseConfig((config) => {
            return config.apiKeys
                .filter(([apiKey, enabled]) => {
                    return apiKey.length > 0 && enabled
                })
                .map(([apiKey]) => {
                    return {
                        apiKey,
                        apiEndpoint: config.apiEndpoint || '',
                        platform: '${template}',
                        chatLimit: config.chatTimeLimit,
                        timeout: config.timeout,
                        maxRetries: config.maxRetries,
                        concurrentMaxSize: config.chatConcurrentMaxSize
                    }
                })
        })

        plugin.registerClient(() => new ${template}Client(ctx, config, plugin))

        await plugin.initClient()
    })
}

export interface Config extends ChatLunaPlugin.Config {
    apiKeys: [string, boolean][]
    apiEndpoint: string
    maxContextRatio: number
    temperature: number
    presencePenalty: number
    frequencyPenalty: number
}

export const Config: Schema<Config> = Schema.intersect([
    ChatLunaPlugin.Config,
    Schema.object({
        apiKeys: Schema.array(
            Schema.tuple([
                Schema.string().role('secret').default(''),
                Schema.boolean().default(true)
            ])
        )
            .default([[]])
            .role('table'),
        apiEndpoint: Schema.string()
            .default('')
            .role('link')
    }),
    Schema.object({
        maxContextRatio: Schema.number()
            .min(0)
            .max(1)
            .step(0.0001)
            .role('slider')
            .default(0.35),
        temperature: Schema.percent().min(0).max(2).step(0.1).default(1),
        presencePenalty: Schema.number().min(0).max(2.0).step(0.1).default(0),
        frequencyPenalty: Schema.number().min(0).max(2.0).step(0.1).default(0)
    })
]).i18n({
    'zh-CN': require('./locales/zh-CN.schema.yml'),
    'en-US': require('./locales/en-US.schema.yml')
}) as Schema<Config>

export const inject = ['chatluna']

export const name = 'chatluna-${template}-adapter'
