/**
 * LLM Client for interacting with language models
 */

import {
  type LLMConfig,
  type LLMRequest,
  type LLMChunkHandler,
  LLMError,
  LLMErrorType,
  type LLMResponseChunk,
} from "./types"
import { type Logger, createLogger } from "./logger"
import { generateRequestId } from "./request-id"
import { metricsCollector } from "./metrics"

// Default configuration
const DEFAULT_CONFIG: LLMConfig = {
  apiBase: process.env.LLM_API_BASE || "http://localhost:3000",
  apiKey: process.env.LLM_API_KEY || "YOUR_API_KEY",
  defaultModel: process.env.LLM_MODEL || "llama3.1",
  defaultOptions: {
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    timeout: 30000, // 30 seconds
    retries: 2,
  },
}

export class LLMClient {
  private config: LLMConfig
  private logger: Logger

  constructor(config: Partial<LLMConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.logger = createLogger("LLMClient")
    this.logger.debug("LLM client initialized with config", this.config)
  }

  /**
   * Generate a completion from the LLM with streaming
   * @param messages Array of messages to send to the LLM
   * @param onChunk Callback function for each chunk of text
   * @param options Additional options for the request
   * @returns Promise that resolves when the stream is complete
   */
  async generateCompletion(
    messages: { role: string; content: string }[],
    onChunk: LLMChunkHandler,
    options: Partial<LLMRequest> = {},
  ): Promise<void> {
    const requestId = generateRequestId()
    const requestLogger = this.logger.child(requestId)

    // Start tracking metrics
    metricsCollector.startRequest(requestId, options.model || this.config.defaultModel)

    // Prepare request
    const request: LLMRequest = {
      model: options.model || this.config.defaultModel,
      messages,
      stream: true,
      options: { ...this.config.defaultOptions, ...options.options },
    }

    requestLogger.debug("Preparing LLM request", {
      requestId,
      model: request.model,
      messageCount: request.messages.length,
      options: request.options,
    })

    // Validate request
    this.validateRequest(request, requestLogger)

    // Set up retry logic
    const maxRetries = request.options?.retries || this.config.defaultOptions.retries || 0
    let retries = 0
    let lastError: Error | null = null

    // Try the request with retries
    while (retries <= maxRetries) {
      try {
        if (retries > 0) {
          requestLogger.info(`Retry attempt ${retries}/${maxRetries}`)
          metricsCollector.recordRetry(requestId)
          // Add exponential backoff
          await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 500))
        }

        await this.executeRequest(request, onChunk, requestId, requestLogger)

        // If we get here, the request was successful
        metricsCollector.completeSuccess(requestId)
        return
      } catch (error) {
        lastError = error as Error

        // Check if we should retry based on error type
        if (
          error instanceof LLMError &&
          (error.type === LLMErrorType.NETWORK || error.type === LLMErrorType.TIMEOUT) &&
          retries < maxRetries
        ) {
          requestLogger.warn(`Request failed with ${error.type}, will retry`, error)
          retries++
        } else {
          // Don't retry other types of errors or if we've exhausted retries
          break
        }
      }
    }

    // If we get here, all retries failed
    const errorType = lastError instanceof LLMError ? lastError.type : LLMErrorType.UNKNOWN
    metricsCollector.completeError(requestId, errorType)

    requestLogger.error("All request attempts failed", lastError)
    throw lastError
  }

  /**
   * Check if the LLM API is available
   * @returns Promise that resolves to true if the API is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      const requestId = generateRequestId()
      const requestLogger = this.logger.child(requestId)

      // Check if API key is set
      if (!this.config.apiKey || this.config.apiKey === "YOUR_API_KEY") {
        requestLogger.warn("API key not set, cannot check availability")
        return false
      }

      requestLogger.debug("Checking LLM API availability")

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${this.config.apiBase}/api/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const available = response.ok
      requestLogger.info(`LLM API availability check: ${available ? "available" : "unavailable"}`)
      return available
    } catch (error) {
      this.logger.warn("LLM API availability check failed", error)
      return false
    }
  }

  /**
   * Update the client configuration
   * @param config Partial configuration to update
   */
  updateConfig(config: Partial<LLMConfig>): void {
    this.config = { ...this.config, ...config }
    this.logger.debug("LLM client configuration updated", this.config)
  }

  /**
   * Execute a single request to the LLM API
   */
  private async executeRequest(
    request: LLMRequest,
    onChunk: LLMChunkHandler,
    requestId: string,
    logger: Logger,
  ): Promise<void> {
    const startTime = Date.now()
    logger.debug("Executing LLM request", { requestId, url: `${this.config.apiBase}/api/chat/completions` })

    // Create abort controller for timeout
    const controller = new AbortController()
    const timeoutMs = request.options?.timeout || this.config.defaultOptions.timeout || 30000
    const timeoutId = setTimeout(() => {
      controller.abort()
      logger.warn(`Request timed out after ${timeoutMs}ms`)
    }, timeoutMs)

    try {
      // Prepare the request body according to the API documentation
      const requestBody = {
        model: request.model,
        messages: request.messages,
        stream: request.stream,
        temperature: request.options?.temperature,
        top_p: request.options?.top_p,
        max_tokens: request.options?.max_tokens,
      }

      // Make the request
      const response = await fetch(`${this.config.apiBase}/api/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
          "X-Request-ID": requestId,
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      })

      // Clear the timeout since we got a response
      clearTimeout(timeoutId)

      // Log response metadata
      logger.debug("Received LLM response", {
        requestId,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        duration: Date.now() - startTime,
      })

      // Handle error responses
      if (!response.ok) {
        let errorBody = ""
        try {
          errorBody = await response.text()
          logger.error("LLM API error response", { status: response.status, body: errorBody })
        } catch (e) {
          logger.error("Failed to read error response body", e)
        }

        throw new LLMError(
          `LLM API error: ${response.status} ${response.statusText}`,
          LLMErrorType.API,
          response.status,
          errorBody,
          requestId,
        )
      }

      // Handle missing response body
      if (!response.body) {
        throw new LLMError("No response body from LLM API", LLMErrorType.API, response.status, undefined, requestId)
      }

      // Process the streaming response
      await this.processResponseStream(response.body, onChunk, requestId, logger)
    } catch (error) {
      // Clear the timeout if there was an error
      clearTimeout(timeoutId)

      // Handle abort/timeout errors
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new LLMError(
          `Request timed out after ${timeoutMs}ms`,
          LLMErrorType.TIMEOUT,
          undefined,
          undefined,
          requestId,
        )
      }

      // Handle fetch errors
      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new LLMError(`Network error: ${error.message}`, LLMErrorType.NETWORK, undefined, undefined, requestId)
      }

      // Re-throw LLMErrors
      if (error instanceof LLMError) {
        throw error
      }

      // Handle other errors
      throw new LLMError(
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
        LLMErrorType.UNKNOWN,
        undefined,
        undefined,
        requestId,
      )
    }
  }

  /**
   * Process a streaming response from the LLM API
   */
  private async processResponseStream(
    body: ReadableStream<Uint8Array>,
    onChunk: LLMChunkHandler,
    requestId: string,
    logger: Logger,
  ): Promise<void> {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ""
    let isDone = false

    try {
      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Process any remaining data in the buffer
          if (buffer.trim()) {
            logger.debug("Processing final buffer content", { bufferLength: buffer.length })
            this.processBuffer(buffer, onChunk, logger)
          }

          // Signal completion to the handler
          onChunk("", true)
          isDone = true
          break
        }

        // Decode and append to buffer
        buffer += decoder.decode(value, { stream: true })

        // Process complete lines in the buffer
        const lines = buffer.split("\n")
        buffer = lines.pop() || "" // Keep the last incomplete line in the buffer

        for (const line of lines) {
          if (line.trim()) {
            this.processLine(line.trim(), onChunk, logger)
          }
        }
      }

      logger.debug("Finished processing response stream", { requestId })
    } catch (error) {
      logger.error("Error processing response stream", error)

      // If we haven't signaled completion yet, do so now
      if (!isDone) {
        onChunk("", true)
      }

      throw new LLMError(
        `Error processing response stream: ${error instanceof Error ? error.message : String(error)}`,
        LLMErrorType.PARSING,
        undefined,
        undefined,
        requestId,
      )
    } finally {
      // Ensure the reader is released
      try {
        await reader.cancel()
      } catch (e) {
        logger.warn("Error canceling stream reader", e)
      }
    }
  }

  /**
   * Process a single line from the response stream
   */
  private processLine(line: string, onChunk: LLMChunkHandler, logger: Logger): void {
    try {
      // Handle SSE format (data: {...})
      if (line.startsWith("data: ")) {
        const data = line.substring(6)

        // Check for the end marker
        if (data === "[DONE]") {
          logger.debug("Received [DONE] marker")
          return
        }

        // Parse the JSON data
        try {
          const parsed = JSON.parse(data) as LLMResponseChunk
          this.processChunk(parsed, onChunk, logger)
        } catch (e) {
          logger.warn("Failed to parse SSE data as JSON", { data, error: e })
        }
      } else {
        // Try parsing as direct JSON
        try {
          const parsed = JSON.parse(line) as LLMResponseChunk
          this.processChunk(parsed, onChunk, logger)
        } catch (e) {
          logger.warn("Failed to parse line as JSON", { line, error: e })
        }
      }
    } catch (error) {
      logger.warn("Error processing line", { line, error })
    }
  }

  /**
   * Process the entire buffer content
   */
  private processBuffer(buffer: string, onChunk: LLMChunkHandler, logger: Logger): void {
    // Try to process as JSON first
    try {
      const parsed = JSON.parse(buffer) as LLMResponseChunk
      this.processChunk(parsed, onChunk, logger)
      return
    } catch (e) {
      // Not valid JSON, try line by line
      logger.debug("Buffer is not valid JSON, processing line by line")
    }

    // Process line by line
    const lines = buffer.split("\n")
    for (const line of lines) {
      if (line.trim()) {
        this.processLine(line.trim(), onChunk, logger)
      }
    }
  }

  /**
   * Process a parsed chunk from the response
   */
  private processChunk(chunk: LLMResponseChunk, onChunk: LLMChunkHandler, logger: Logger): void {
    // Extract content from the chunk
    if (chunk.choices && chunk.choices.length > 0) {
      const choice = chunk.choices[0]

      if (choice.delta && choice.delta.content) {
        const content = choice.delta.content
        logger.debug("Extracted content from chunk", {
          contentLength: content.length,
          finishReason: choice.finish_reason,
        })

        // Pass the content to the handler
        onChunk(content, false)
      }

      // Check if this is the final chunk
      if (choice.finish_reason) {
        logger.debug("Received chunk with finish reason", { finishReason: choice.finish_reason })
      }
    }
  }

  /**
   * Validate the request before sending
   */
  private validateRequest(request: LLMRequest, logger: Logger): void {
    // Check for required fields
    if (!request.model) {
      logger.error("Missing required field: model")
      throw new LLMError("Missing required field: model", LLMErrorType.VALIDATION)
    }

    if (!request.messages || request.messages.length === 0) {
      logger.error("Missing required field: messages")
      throw new LLMError("Missing required field: messages", LLMErrorType.VALIDATION)
    }

    // Validate messages
    for (let i = 0; i < request.messages.length; i++) {
      const message = request.messages[i]

      if (!message.role) {
        logger.error(`Missing role in message at index ${i}`)
        throw new LLMError(`Missing role in message at index ${i}`, LLMErrorType.VALIDATION)
      }

      if (!message.content && message.content !== "") {
        logger.error(`Missing content in message at index ${i}`)
        throw new LLMError(`Missing content in message at index ${i}`, LLMErrorType.VALIDATION)
      }
    }

    logger.debug("Request validation passed")
  }
}

// Create a singleton instance with default config
export const llmClient = new LLMClient()
