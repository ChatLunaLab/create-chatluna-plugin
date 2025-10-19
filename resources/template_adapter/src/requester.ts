import {
    ModelRequester,
    ModelRequestParams
} from 'koishi-plugin-chatluna/llm-core/platform/api'
import {
    ClientConfig,
    ClientConfigPool
} from 'koishi-plugin-chatluna/llm-core/platform/config'
import * as fetchType from 'undici/types/fetch'
import { ChatGenerationChunk } from '@langchain/core/outputs'
import { ${template}Message, ${template}MessageRole } from './types'
import {
    ChatLunaError,
    ChatLunaErrorCode
} from 'koishi-plugin-chatluna/utils/error'
import { sseIterable } from 'koishi-plugin-chatluna/utils/sse'
import {
    convertDeltaToMessageChunk,
    formatToolsTo${template}Tools,
    langchainMessageTo${template}Message
} from './utils'
import { Config, logger } from '.'
import { ChatLunaPlugin } from 'koishi-plugin-chatluna/services/chat'
import { Context } from 'koishi'

export class ${template}Requester extends ModelRequester {
    constructor(
        ctx: Context,
        _configPool: ClientConfigPool<ClientConfig>,
        public _pluginConfig: Config,
        _plugin: ChatLunaPlugin
    ) {
        super(ctx, _configPool, _pluginConfig, _plugin)
    }

    async *completionStreamInternal(
        params: ModelRequestParams
    ): AsyncGenerator<ChatGenerationChunk> {
        await this.init()

        const messagesMapped: ${template}Message[] = langchainMessageTo${template}Message(
            params.input
        )

        try {
            // TODO: Replace with your actual API endpoint
            const response = await this._post(
                'chat/completions',
                {
                    messages: messagesMapped,
                    stream: true,
                    temperature: params.temperature,
                    top_p: params.topP,
                    presence_penalty: params.presencePenalty,
                    frequency_penalty: params.frequencyPenalty,
                    model: params.model,
                    tools:
                        params.tools != null
                            ? formatToolsTo${template}Tools(params.tools)
                            : undefined
                },
                {
                    signal: params.signal
                }
            )

            const iterator = sseIterable(response)

            let defaultRole: ${template}MessageRole = 'assistant'

            let errorCount = 0

            for await (const event of iterator) {
                const chunk = event.data
                if (chunk === '[DONE]') {
                    break
                }

                try {
                    const data = JSON.parse(chunk)

                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    if ((data as any).error) {
                        throw new ChatLunaError(
                            ChatLunaErrorCode.API_REQUEST_FAILED,
                            new Error(
                                'error when calling ${template} completion, Result: ' +
                                    chunk
                            )
                        )
                    }

                    const choice = data.choices?.[0]
                    if (!choice) {
                        continue
                    }

                    const { delta } = choice
                    const messageChunk = convertDeltaToMessageChunk(
                        delta,
                        defaultRole
                    )

                    defaultRole = (
                        (delta.role?.length ?? 0) > 0 ? delta.role : defaultRole
                    ) as ${template}MessageRole

                    const generationChunk = new ChatGenerationChunk({
                        message: messageChunk,
                        text: messageChunk.content as string
                    })

                    yield generationChunk
                } catch (e) {
                    if (errorCount > 5) {
                        logger.error('error with chunk', chunk)
                        throw new ChatLunaError(
                            ChatLunaErrorCode.API_REQUEST_FAILED,
                            e
                        )
                    } else {
                        errorCount++
                        continue
                    }
                }
            }
        } catch (e) {
            if (e instanceof ChatLunaError) {
                throw e
            } else {
                throw new ChatLunaError(ChatLunaErrorCode.API_REQUEST_FAILED, e)
            }
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private _post(url: string, data: any, params: fetchType.RequestInit = {}) {
        const body = JSON.stringify(data)

        // TODO: Replace with your actual API base URL
        const apiEndpoint = this._config.value.apiEndpoint || 'https://api.example.com'

        return this._plugin.fetch(`${apiEndpoint}/${url}`, {
            body,
            headers: this._buildHeaders(),
            method: 'POST',
            ...params
        })
    }

    private _buildHeaders() {
        return {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this._config.value.apiKey}`
        }
    }

    get logger() {
        return logger
    }
}
