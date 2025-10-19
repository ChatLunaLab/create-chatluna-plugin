export interface CliArgs {
    _: string[]
    force?: boolean
    yes?: boolean
    mode?: 'create' | 'add'
}

export interface PluginContext {
    root: string
    isPlugin: boolean
    isWorkspace: boolean
}

export type TemplateType = 'main' | 'dep' | 'adapter'

export interface CreateOptions {
    name: string
    target: string
    template: TemplateType
    variables?: Record<string, string>
}

export interface AddOptions {
    target: string
    includeChatlunaFile: boolean
}
