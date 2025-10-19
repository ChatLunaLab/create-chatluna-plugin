export type ${template}MessageRole = 'assistant' | 'user' | 'system' | 'function' | 'tool'

export interface ${template}Message {
    role: ${template}MessageRole
    content?: string
    name?: string
    tool_calls?: ChatCompletionRequestMessageToolCall[]
    tool_call_id?: string
}

/**
 * Interface representing the usage of tokens in a chat completion.
 */
export interface TokenUsage {
    completionTokens?: number
    promptTokens?: number
    totalTokens?: number
}

/**
 * Interface representing a request for a chat completion.
 */
export interface ChatCompletionRequest {
    messages: ${template}Message[]
    stream?: boolean
    model?: string
    temperature?: number
    top_p?: number
    presence_penalty?: number
    frequency_penalty?: number
    tools?: ChatCompletionTool[]
}

export interface ChatCompletionTool {
    type: 'function'
    function: ChatCompletionFunction
}

export interface ChatCompletionFunction {
    name: string
    description?: string
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    parameters?: { [key: string]: any }
}

/**
 * Interface representing a response from a chat completion.
 */
export interface ChatCompletionResponse {
    id: string
    object: string
    created: number
    model: string
    choices: ChatCompletionChoice[]
    usage: TokenUsage
}

export interface ChatCompletionChoice {
    index: number
    message: ${template}Message
    finish_reason: string
}

export interface ChatCompletionRequestMessageToolCall {
    id: string
    type: 'function'
    function: {
        name: string
        arguments: string
    }
}
