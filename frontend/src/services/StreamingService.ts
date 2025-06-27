// ABOUTME: Frontend SSE client service for medical diagnosis streaming
// ABOUTME: Manages EventSource connections, retry logic, and event parsing for real-time content delivery

import { StreamEvent, StreamEventType, StreamStatus } from '../types/streaming';
import { StreamingError, StreamingErrorCode, createStreamingError } from '../types/errors';
import { SSEConnectionManager, SSEEventParser } from '../utils/sse';

export interface StreamingServiceOptions {
  timeout?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
}

export interface StreamingServiceCallbacks {
  onEvent?: (event: StreamEvent) => void;
  onError?: (error: StreamingError) => void;
  onStatusChange?: (status: StreamStatus) => void;
  onStageComplete?: (stageId: string) => void;
}

/**
 * StreamingService manages SSE connections for medical diagnosis streaming
 */
export class StreamingService {
  private connectionManager: SSEConnectionManager | null = null;
  private eventParser: SSEEventParser;
  private status: StreamStatus = StreamStatus.IDLE;
  private eventListeners: Array<(event: StreamEvent) => void> = [];
  private errorListeners: Array<(error: StreamingError) => void> = [];
  private statusListeners: Array<(status: StreamStatus) => void> = [];
  private stageCompleteListeners: Array<(stageId: string) => void> = [];
  
  private defaultOptions: Required<StreamingServiceOptions> = {
    timeout: 30000,
    maxRetries: 3,
    initialRetryDelay: 1000,
    backoffMultiplier: 2,
    maxRetryDelay: 10000,
  };

  constructor() {
    this.eventParser = new SSEEventParser();
  }

  /**
   * Connect to a streaming endpoint for a specific case and stage
   */
  public connect(
    caseId: string,
    stageName: string,
    authToken: string,
    options: StreamingServiceOptions = {}
  ): void {
    // Disconnect any existing connection
    this.disconnect();

    const mergedOptions = { ...this.defaultOptions, ...options };
    const url = this.buildStreamingUrl(caseId, stageName, authToken);

    this.updateStatus(StreamStatus.CONNECTING);

    try {
      this.connectionManager = new SSEConnectionManager(url, {
        timeout: mergedOptions.timeout,
        maxRetries: mergedOptions.maxRetries,
        retryDelay: mergedOptions.initialRetryDelay,
        backoffMultiplier: mergedOptions.backoffMultiplier,
        maxRetryDelay: mergedOptions.maxRetryDelay,
        onEvent: this.handleRawEvent.bind(this),
        onError: this.handleConnectionError.bind(this),
        onStatusChange: this.handleConnectionStatusChange.bind(this),
      });

      this.connectionManager.connect();
    } catch (error) {
      this.handleConnectionError(
        createStreamingError(
          StreamingErrorCode.CONNECTION_ERROR,
          `Failed to initialize connection: ${error}`,
          true,
          'Check network connectivity and try again'
        )
      );
    }
  }

  /**
   * Disconnect from the streaming endpoint
   */
  public disconnect(): void {
    if (this.connectionManager) {
      this.connectionManager.disconnect();
      this.connectionManager = null;
    }
    this.updateStatus(StreamStatus.IDLE);
  }

  /**
   * Get current connection status
   */
  public getStatus(): StreamStatus {
    return this.status;
  }

  /**
   * Check if currently connected and streaming
   */
  public isConnected(): boolean {
    return this.status === StreamStatus.STREAMING;
  }

  /**
   * Add event listener
   */
  public onEvent(callback: (event: StreamEvent) => void): () => void {
    this.eventListeners.push(callback);
    
    // Return cleanup function
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add error listener
   */
  public onError(callback: (error: StreamingError) => void): () => void {
    this.errorListeners.push(callback);
    
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add status change listener
   */
  public onStatusChange(callback: (status: StreamStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index > -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  /**
   * Add stage completion listener
   */
  public onStageComplete(callback: (stageId: string) => void): () => void {
    this.stageCompleteListeners.push(callback);
    
    return () => {
      const index = this.stageCompleteListeners.indexOf(callback);
      if (index > -1) {
        this.stageCompleteListeners.splice(index, 1);
      }
    };
  }

  /**
   * Build the streaming URL with authentication
   */
  private buildStreamingUrl(caseId: string, stageName: string, authToken: string): string {
    const baseUrl = `/api/cases/${caseId}/workflow/stages/${stageName}/stream`;
    const authParam = `Authorization=${encodeURIComponent('Bearer ' + authToken)}`;
    return `${baseUrl}?${authParam}`;
  }

  /**
   * Handle raw SSE events from the connection manager
   */
  private handleRawEvent(rawEventData: string): void {
    try {
      const event = this.eventParser.parse(rawEventData);
      if (event) {
        this.emitEvent(event);
        
        // Handle special event types
        if (event.type === 'stage_complete' && event.data.stage_id) {
          this.emitStageComplete(event.data.stage_id);
        }
      }
    } catch (error) {
      this.handleParseError(error, rawEventData);
    }
  }

  /**
   * Handle connection errors
   */
  private handleConnectionError(error: StreamingError): void {
    this.updateStatus(StreamStatus.ERROR);
    this.emitError(error);
  }

  /**
   * Handle connection status changes
   */
  private handleConnectionStatusChange(connected: boolean): void {
    if (connected) {
      this.updateStatus(StreamStatus.STREAMING);
    } else if (this.status !== StreamStatus.ERROR) {
      this.updateStatus(StreamStatus.CONNECTING);
    }
  }

  /**
   * Handle event parsing errors
   */
  private handleParseError(error: any, rawData: string): void {
    const parseError = createStreamingError(
      StreamingErrorCode.PARSE_ERROR,
      `Failed to parse streaming event: ${error.message}`,
      true,
      'Event will be skipped, streaming will continue'
    );

    // Add raw data to error context for debugging
    parseError.context = { rawData: rawData.substring(0, 200) };
    
    this.emitError(parseError);
  }

  /**
   * Update internal status and notify listeners
   */
  private updateStatus(newStatus: StreamStatus): void {
    if (this.status !== newStatus) {
      this.status = newStatus;
      this.emitStatusChange(newStatus);
    }
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: StreamEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  /**
   * Emit error to all listeners
   */
  private emitError(error: StreamingError): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Emit status change to all listeners
   */
  private emitStatusChange(status: StreamStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }

  /**
   * Emit stage completion to all listeners
   */
  private emitStageComplete(stageId: string): void {
    this.stageCompleteListeners.forEach(listener => {
      try {
        listener(stageId);
      } catch (error) {
        console.error('Error in stage completion listener:', error);
      }
    });
  }
}

export default StreamingService;