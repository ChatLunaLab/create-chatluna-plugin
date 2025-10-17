import { Context, Schema } from 'koishi'

export function apply(ctx: Context) {
    // your plugin code here
}

export const name = 'chatluna-example'

export interface Config {}

export const Config: Schema<Config> = Schema.object({})

export const inject = ['chatluna']
