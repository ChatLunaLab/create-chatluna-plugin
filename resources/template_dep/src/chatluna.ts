import { Context } from 'koishi'
import type {} from 'koishi-plugin-chatluna/services/chat'

export function apply(ctx: Context) {
    // your plugin code here
    // default model
    // const model = ctx.chatluna.createChatModel(ctx.chatluna.config.defaultModel)
}

export const name = 'chatluna-entry-point'
export const inject = ['chatluna']
