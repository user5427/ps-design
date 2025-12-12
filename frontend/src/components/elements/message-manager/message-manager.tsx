import { Alert, Snackbar, Box } from "@mui/material";
import type React from "react";
import { useState, useCallback, useRef, useImperativeHandle, forwardRef } from "react";

export type MessageSeverity = "error" | "warning" | "info" | "success";

export interface Message {
  id: string;
  text: string | React.ReactNode;
  severity: MessageSeverity;
  duration?: number; // Auto-hide duration in ms (0 = manual close)
}

export interface MessageManagerHandle {
  messages: Message[];
  clearMessages: () => void;
  // Convenience methods for specific message types
  error: (text: string | React.ReactNode, duration?: number) => string;
  warning: (text: string | React.ReactNode, duration?: number) => string;
  success: (text: string | React.ReactNode, duration?: number) => string;
  info: (text: string | React.ReactNode, duration?: number) => string;
}

export interface MessageManagerContextValue extends MessageManagerHandle {}

/**
 * MessageManager Component (internal)
 * 
 * Manages global and form-level messages (errors, alerts, warnings, info, success).
 * Supports multiple concurrent messages with auto-dismiss capability.
 * 
 * Do not use directly - use createMessageManager() factory instead.
 */
export const MessageManager = forwardRef<MessageManagerHandle, { children?: React.ReactNode }>(
  ({ children }, ref) => {
    const [messages, setMessages] = useState<Message[]>([]);

    const addMessage = useCallback(
      (text: string | React.ReactNode, severity: MessageSeverity, duration: number = 0) => {
        const id = `${Date.now()}-${Math.random()}`;
        const message: Message = { id, text, severity, duration };

        setMessages((prev) => [...prev, message]);

        if (duration > 0) {
          setTimeout(() => removeMessage(id), duration);
        }

        return id;
      },
      []
    );

    const removeMessage = useCallback((id: string) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    }, []);

    const clearMessages = useCallback(() => {
      setMessages([]);
    }, []);

    // Convenience methods for specific message types
    const error = useCallback(
      (text: string | React.ReactNode, duration: number = 0) => addMessage(text, "error", duration),
      [addMessage]
    );

    const warning = useCallback(
      (text: string | React.ReactNode, duration: number = 0) => addMessage(text, "warning", duration),
      [addMessage]
    );

    const success = useCallback(
      (text: string | React.ReactNode, duration: number = 0) => addMessage(text, "success", duration),
      [addMessage]
    );

    const info = useCallback(
      (text: string | React.ReactNode, duration: number = 0) => addMessage(text, "info", duration),
      [addMessage]
    );

    // Expose handle for external control
    useImperativeHandle(
      ref,
      () => ({
        messages,
        clearMessages,
        error,
        warning,
        success,
        info,
      }),
      [messages, clearMessages, error, warning, success, info]
    );

    return (
      <>
        {/* Messages container - for inline display */}
        {messages.length > 0 && (
          <Box sx={{ mb: 2 }}>
            {messages
              .filter((m) => m.duration === 0) // Only inline messages that don't auto-dismiss
              .map((message) => (
                <Alert
                  key={message.id}
                  severity={message.severity}
                  onClose={() => removeMessage(message.id)}
                  sx={{ mb: 1 }}
                >
                  {message.text}
                </Alert>
              ))}
          </Box>
        )}
        {children}

        {/* Snackbar for auto-dismiss messages */}
        {messages
          .filter((m) => m.duration && m.duration > 0)
          .slice(0, 1) // Show only one snackbar at a time
          .map((message) => (
            <Snackbar
              key={message.id}
              open={true}
              autoHideDuration={message.duration}
              onClose={() => removeMessage(message.id)}
            >
              <Alert
                severity={message.severity}
                onClose={() => removeMessage(message.id)}
                sx={{ width: "100%" }}
              >
                {message.text}
              </Alert>
            </Snackbar>
          ))}
      </>
    );
  }
);

/**
 * Factory function to create a MessageManager with an exposed handle and component.
 * Returns an object with:
 * - ref: A ref to control the message manager (addMessage, removeMessage, clearMessages)
 * - Component: The actual MessageManager component to render
 * 
 * @example
 * ```tsx
 * const { ref: messageHandle, Component: MessageDisplay } = createMessageManager();
 * 
 * // Use the handle to add messages
 * messageHandle.current?.addMessage("Success!", "success", 3000);
 * 
 * // Render the component
 * <MessageDisplay />
 * ```
 */
export function createMessageManager() {
  // Initialize with empty handle that will be replaced by forwardRef
  const messageManagerRef = useRef<MessageManagerHandle>({
    messages: [],
    clearMessages: () => {},
    error: () => "",
    warning: () => "",
    success: () => "",
    info: () => "",
  });

  const Component: React.FC = () => (
    <MessageManager ref={messageManagerRef} />
  );

  return {
    ref: messageManagerRef,
    Component,
  };
}

/**
 * Hook to use the MessageManager context
 * @deprecated Use createMessageManager() factory function instead
 */
export const useMessageManager = (): MessageManagerContextValue => {
  // This will be provided by a context in a full implementation
  // For now, return a basic implementation that will be enhanced
  return {
    messages: [],
    clearMessages: () => {},
    error: () => "",
    warning: () => "",
    success: () => "",
    info: () => "",
  };
};

