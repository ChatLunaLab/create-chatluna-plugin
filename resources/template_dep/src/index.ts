import { Context, Schema } from 'koishi'
import * as chatluna from './chatluna'

export function apply(ctx: Context) {
    // load chatluna plugin
    ctx.plugin(chatluna)
    // your origin plugin code here
}

export const name = '${template}'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const inject = ['chatluna']
