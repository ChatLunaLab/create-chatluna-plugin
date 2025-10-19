import { PlatformModelClient } from 'koishi-plugin-chatluna/llm-core/platform/client'
import { ClientConfig } from 'koishi-plugin-chatluna/llm-core/platform/config'
import {
    ChatLunaChatModel
} from 'koishi-plugin-chatluna/llm-core/platform/model'
import {
    ModelInfo,
    ModelType
} from 'koishi-plugin-chatluna/llm-core/platform/types'
import { Context } from 'koishi'
import { Config } from '.'
import {
    ChatLunaError,
    ChatLunaErrorCode
} from 'koishi-plugin-chatluna/utils/error'
import { ${template}Requester } from './requester'
import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'

export class ${template}Client extends PlatformModelClient<ClientConfig> {
    platform = '${template}'

    private _requester: ${template}Requester

    constructor(
        ctx: Context,
        private _config: Config,
        public plugin: ChatLunaPlugin
    ) {
        super(ctx, plugin.platformConfigPool)

        this._requester = new ${template}Requester(
            ctx,
            plugin.platformConfigPool,
            _config,
            plugin
        )
    }

    async refreshModels(): Promise<ModelInfo[]> {
        // TODO: Replace with actual models from your platform
        const rawModels = [
            ['model-1', 4096],
            ['model-2', 8192]
        ] as [string, number][]

        return rawModels.map(([model, maxTokens]) => {
            return {
                name: model,
                type: ModelType.llm,
                capabilities: [],
                supportMode: ['all'],
                maxTokens
            } as ModelInfo
        })
    }

    protected _createModel(model: string): ChatLunaChatModel {
        const info = this._modelInfos[model]

        if (info == null) {
            throw new ChatLunaError(ChatLunaErrorCode.MODEL_NOT_FOUND)
        }

        return new ChatLunaChatModel({
            modelInfo: info,
            requester: this._requester,
            model,
            modelMaxContextSize: info.maxTokens,
            maxTokenLimit: Math.floor(
                (info.maxTokens || 100_000) * this._config.maxContextRatio
            ),
            frequencyPenalty: this._config.frequencyPenalty,
            presencePenalty: this._config.presencePenalty,
            timeout: this._config.timeout,
            temperature: this._config.temperature,
            maxRetries: this._config.maxRetries,
            llmType: '${template}'
        })
    }
}
