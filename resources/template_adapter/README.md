# ChatLuna 模型适配器开发模板

这是一个用于创建 ChatLuna 模型适配器的模板项目。

此模板默认实现了 `OpenAI ChatCompletion` API 格式。

## 需要实现的部分

### 1. `src/client.ts`

在 `refreshModels()` 方法中：

- 替换示例模型列表为你的平台实际支持的模型
- 可以通过 API 动态获取模型列表，或者使用硬编码的模型列表
- 设置正确的 `maxTokens` 上下文长度

参考 wenxin 适配器的实现：

```typescript
async refreshModels(): Promise<ModelInfo[]> {
    const rawModels = [
        ['model-name', contextLength],
        // 添加更多模型...
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
```

### 2. `src/requester.ts`

需要实现的部分：

#### API 端点配置

在 `_post()` 方法中：

- 将 `https://api.example.com` 替换为你的平台的实际 API 基础 URL
- 根据需要修改 URL 路径（如 `chat/completions`）

#### 请求格式

在 `completionStreamInternal()` 方法中：

- 根据你的平台 API 文档调整请求体格式
- 修改参数映射（temperature, top_p 等）
- 如果平台不支持某些参数，删除它们

#### 响应处理

- 如果你的平台不使用 SSE 格式，需要修改响应处理逻辑
- 调整 chunk 解析逻辑以匹配你的平台响应格式
- 确保正确处理 `[DONE]` 或其他结束标记

#### 认证头

在 `_buildHeaders()` 方法中：

- 根据你的平台要求修改认证方式
- 可能需要使用 API Key, Bearer Token, 或其他认证方式

### 3. `src/types.ts`

根据你的平台 API 定义类型：

- 修改 `ChatCompletionRequest` 以匹配你的平台的请求格式
- 修改 `ChatCompletionResponse` 以匹配你的平台的响应格式
- 如果平台使用不同的消息格式，更新 `Message` 接口
- 添加任何平台特定的类型定义

### 4. `src/utils.ts`

根据需要调整工具函数：

- 如果你的平台使用不同的角色名称，修改 `messageTypeToRole()` 函数
- 如果消息格式不同，调整 `langchainMessageToMessage()` 函数
- 如果不支持工具调用，可以移除相关代码

### 5. `src/index.ts`

配置选项：

- 在 `Config` 接口中添加平台特定的配置项
- 更新 Schema 配置以添加新的配置字段
- 在 `parseConfig()` 中处理额外的配置

### 6. 本地化文件

更新 `src/locales/` 目录下的文件：

- `zh-CN.schema.yml` - 中文配置描述
- `en-US.schema.yml` - 英文配置描述

根据你添加的配置项更新描述文字。

## 可选功能

### Embeddings 支持

如果你的平台支持 embeddings（向量化），可以：

1. 将 `client.ts` 中的基类改为 `PlatformModelAndEmbeddingsClient`
2. 实现 `EmbeddingsRequester` 接口
3. 在 `refreshModels()` 中添加 embeddings 模型

参考 wenxin 适配器的 embeddings 实现。

### 工具调用（Tool Calling）

如果你的平台支持工具调用：

- 确保在 `requester.ts` 中正确处理 `tools` 参数
- 在 `utils.ts` 中正确格式化工具定义
- 处理工具调用的响应

如果不支持，可以在请求中忽略 `tools` 参数。

## 测试

在完成实现后：

1. 构建项目：`yarn build`
2. 在 Koishi 项目中测试适配器
3. 确保所有模型都能正常调用
4. 测试流式响应
5. 测试错误处理

## 参考资料

- [ChatLuna 文档](https://github.com/ChatLunaLab/chatluna)
- [Koishi 文档](https://koishi.chat/)
- 其他适配器实现：
    - `adapter-wenxin`
    - `adapter-openai`
    - 等等

## 发布

完成开发并测试后：

1. 更新 `package.json` 中的版本号和描述
2. 运行 `yarn pub` 发布到 npm
3. 在 ChatLuna 社区分享你的适配器
