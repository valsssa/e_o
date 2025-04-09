/**
 * Type definitions for LLM interactions
 */

// LLM Request Types
export interface LLMMessage {
  role: "system" | "user" | "assistant"
  content: string
}

export interface LLMRequestOptions {
  temperature?: number
  top_p?: number
  max_tokens?: number
  timeout?: number
  retries?: number
}

export interface LLMRequest {
  model: string
  messages: LLMMessage[]
  stream: boolean
  options?: LLMRequestOptions
}

// LLM Response Types
export interface LLMResponseChunk {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    delta: {
      content?: string
      role?: string
    }
    finish_reason: string | null
  }[]
}

// LLM Error Types
export enum LLMErrorType {
  NETWORK = "NETWORK_ERROR",
  TIMEOUT = "TIMEOUT_ERROR",
  API = "API_ERROR",
  PARSING = "PARSING_ERROR",
  VALIDATION = "VALIDATION_ERROR",
  UNKNOWN = "UNKNOWN_ERROR",
}

export class LLMError extends Error {
  type: LLMErrorType
  statusCode?: number
  responseBody?: string
  requestId?: string

  constructor(
    message: string,
    type: LLMErrorType = LLMErrorType.UNKNOWN,
    statusCode?: number,
    responseBody?: string,
    requestId?: string,
  ) {
    super(message)
    this.name = "LLMError"
    this.type = type
    this.statusCode = statusCode
    this.responseBody = responseBody
    this.requestId = requestId
  }
}

// LLM Configuration
export interface LLMConfig {
  apiBase: string
  apiKey: string
  defaultModel: string
  defaultOptions: LLMRequestOptions
}

// LLM Response Handler
export type LLMChunkHandler = (chunk: string, done: boolean) => void

// LLM Metrics
export interface LLMMetrics {
  requestId: string
  startTime: number
  endTime?: number
  totalTime?: number
  retries: number
  success: boolean
  errorType?: LLMErrorType
  model: string
  promptTokens?: number
  completionTokens?: number
}
