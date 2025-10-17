import { Context, Schema } from 'koishi'
import * as chatluna from './chatluna'

export function apply(ctx: Context) {
    // load chatluna plugin
    ctx.plugin(chatluna)
    // your plugin code here
}

export const name = 'chatluna-example'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const inject = ['chatluna']
