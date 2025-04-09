/**
 * Metrics collector for LLM interactions
 */

import type { LLMErrorType, LLMMetrics } from "./types"
import { createLogger } from "./logger"

const logger = createLogger("LLMMetrics")

export class MetricsCollector {
  private metrics: Map<string, LLMMetrics> = new Map()

  // Start tracking metrics for a request
  startRequest(requestId: string, model: string): void {
    this.metrics.set(requestId, {
      requestId,
      startTime: Date.now(),
      retries: 0,
      success: false,
      model,
    })
    logger.debug(`Started tracking request: ${requestId}`)
  }

  // Record a retry attempt
  recordRetry(requestId: string): void {
    const metric = this.metrics.get(requestId)
    if (metric) {
      metric.retries += 1
      logger.debug(`Recorded retry for request: ${requestId}, total retries: ${metric.retries}`)
    }
  }

  // Complete metrics for a successful request
  completeSuccess(requestId: string, promptTokens?: number, completionTokens?: number): void {
    const metric = this.metrics.get(requestId)
    if (metric) {
      metric.endTime = Date.now()
      metric.totalTime = metric.endTime - metric.startTime
      metric.success = true
      metric.promptTokens = promptTokens
      metric.completionTokens = completionTokens

      logger.info(`Request completed successfully: ${requestId}`, {
        requestId,
        duration: metric.totalTime,
        retries: metric.retries,
        model: metric.model,
        promptTokens,
        completionTokens,
      })
    }
  }

  // Complete metrics for a failed request
  completeError(requestId: string, errorType: LLMErrorType): void {
    const metric = this.metrics.get(requestId)
    if (metric) {
      metric.endTime = Date.now()
      metric.totalTime = metric.endTime - metric.startTime
      metric.success = false
      metric.errorType = errorType

      logger.warn(`Request failed: ${requestId}`, {
        requestId,
        duration: metric.totalTime,
        retries: metric.retries,
        model: metric.model,
        errorType,
      })
    }
  }

  // Get metrics for a specific request
  getMetrics(requestId: string): LLMMetrics | undefined {
    return this.metrics.get(requestId)
  }

  // Get all metrics
  getAllMetrics(): LLMMetrics[] {
    return Array.from(this.metrics.values())
  }

  // Clear old metrics (older than specified time in ms)
  clearOldMetrics(olderThan = 3600000): void {
    // Default: 1 hour
    const now = Date.now()
    let cleared = 0

    this.metrics.forEach((metric, id) => {
      if (metric.startTime < now - olderThan) {
        this.metrics.delete(id)
        cleared++
      }
    })

    if (cleared > 0) {
      logger.debug(`Cleared ${cleared} old metrics`)
    }
  }
}

// Create a singleton instance
export const metricsCollector = new MetricsCollector()

// Set up periodic cleanup
if (typeof window !== "undefined") {
  // Only in browser environment
  setInterval(() => {
    metricsCollector.clearOldMetrics()
  }, 3600000) // Clean up every hour
}
