import {
    AIMessageChunk,
    BaseMessage,
    ChatMessageChunk,
    FunctionMessageChunk,
    HumanMessageChunk,
    MessageType,
    SystemMessageChunk,
    ToolMessage,
    ToolMessageChunk
} from '@langchain/core/messages'
import {
    ChatCompletionTool,
    ${template}Message,
    ${template}MessageRole
} from './types'
import { StructuredTool } from '@langchain/core/tools'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { removeAdditionalProperties } from '@chatluna/v1-shared-adapter'
import { isZodSchemaV3 } from '@langchain/core/utils/types'

export function langchainMessageTo${template}Message(
    messages: BaseMessage[]
): ${template}Message[] {
    const mappedMessage = messages.map((rawMessage) => {
        const role = messageTypeTo${template}Role(rawMessage.getType())

        const msg = {
            content: (rawMessage.content as string) || null,
            name:
                role === 'assistant' || role === 'tool'
                    ? rawMessage.name
                    : undefined,
            role,
            tool_calls: rawMessage.additional_kwargs.tool_calls,
            tool_call_id: (rawMessage as ToolMessage).tool_call_id
        }

        if (msg.tool_calls == null) {
            delete msg.tool_calls
        }

        if (msg.tool_call_id == null) {
            delete msg.tool_call_id
        }

        if (msg.tool_calls) {
            for (const toolCall of msg.tool_calls) {
                const tool = toolCall.function

                if (!tool.arguments) {
                    continue
                }
                // Remove spaces, new line characters etc.
                tool.arguments = JSON.stringify(JSON.parse(tool.arguments))
            }
        }

        return msg
    })

    return mappedMessage
}

export function messageTypeTo${template}Role(type: MessageType): ${template}MessageRole {
    switch (type) {
        case 'system':
            return 'system'
        case 'ai':
            return 'assistant'
        case 'human':
            return 'user'
        case 'function':
            return 'function'
        case 'tool':
            return 'tool'
        default:
            throw new Error(`Unknown message type: ${type}`)
    }
}

export function formatToolsTo${template}Tools(
    tools: StructuredTool[]
): ChatCompletionTool[] {
    if (tools.length < 1) {
        return undefined
    }
    return tools.map(formatToolTo${template}Tool)
}

export function formatToolTo${template}Tool(tool: StructuredTool): ChatCompletionTool {
    const parameters = removeAdditionalProperties(
        isZodSchemaV3(tool.schema)
            ? zodToJsonSchema(tool.schema as never, {
                  allowedAdditionalProperties: undefined
              })
            : tool.schema
    )

    return {
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            parameters
        }
    }
}

export function convertDeltaToMessageChunk(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delta: Record<string, any>,
    defaultRole?: ${template}MessageRole
) {
    const role = (
        (delta.role?.length ?? 0) > 0 ? delta.role : defaultRole
    ).toLowerCase()
    const content = delta.content ?? ''

    let additionalKwargs: {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
        function_call?: any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/naming-convention
        tool_calls?: any
    }
    if (delta.function_call) {
        additionalKwargs = {
            function_call: delta.function_call
        }
    } else if (delta.tool_calls) {
        additionalKwargs = {
            tool_calls: delta.tool_calls
        }
    } else {
        additionalKwargs = {}
    }

    if (role === 'user') {
        return new HumanMessageChunk({ content })
    } else if (role === 'assistant') {
        const toolCallChunks = []
        if (Array.isArray(delta.tool_calls)) {
            for (const rawToolCall of delta.tool_calls) {
                toolCallChunks.push({
                    name: rawToolCall.function?.name,
                    args: rawToolCall.function?.arguments,
                    id: rawToolCall.id,
                    index: rawToolCall.index
                })
            }
        }
        return new AIMessageChunk({
            content,
            tool_call_chunks: toolCallChunks,
            additional_kwargs: additionalKwargs
        })
    } else if (role === 'system') {
        return new SystemMessageChunk({ content })
    } else if (role === 'function') {
        return new FunctionMessageChunk({
            content,
            additional_kwargs: additionalKwargs,
            name: delta.name
        })
    } else if (role === 'tool') {
        return new ToolMessageChunk({
            content,
            additional_kwargs: additionalKwargs,
            tool_call_id: delta.tool_call_id
        })
    } else {
        return new ChatMessageChunk({ content, role })
    }
}
