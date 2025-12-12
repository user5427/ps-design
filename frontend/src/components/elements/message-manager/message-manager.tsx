import { Alert, Snackbar, Box } from "@mui/material";
import type React from "react";
import { useState, useCallback, useRef } from "react";

export type MessageSeverity = "error" | "warning" | "info" | "success";

export interface Message {
  id: string;
  text: string | React.ReactNode;
  severity: MessageSeverity;
  duration?: number; // Auto-hide duration in ms (0 = manual close)
}

export interface MessageManagerContextValue {
  messages: Message[];
  addMessage: (text: string | React.ReactNode, severity: MessageSeverity, duration?: number) => string;
  removeMessage: (id: string) => void;
  clearMessages: () => void;
}

/**
 * MessageManager Component
 * 
 * Manages global and form-level messages (errors, alerts, warnings, info, success).
 * Supports multiple concurrent messages with auto-dismiss capability.
 * 
 * @example
 * ```tsx
 * const messageManager = useMessageManager();
 * messageManager.addMessage("Operation successful", "success", 3000);
 * messageManager.addMessage("An error occurred", "error");
 * ```
 */
export const MessageManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const removeMessage = useCallback((id: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Expose functions through a ref (used by hook)
  const messageManagerFunctions = useRef({ addMessage, removeMessage, clearMessages });
  messageManagerFunctions.current = { addMessage, removeMessage, clearMessages };

  return (
    <Box sx={{ position: "relative" }}>
      {children}
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
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
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
    </Box>
  );
};

/**
 * Hook to use the MessageManager context
 */
export const useMessageManager = (): MessageManagerContextValue => {
  // This will be provided by a context in a full implementation
  // For now, return a basic implementation that will be enhanced
  return {
    messages: [],
    addMessage: () => "",
    removeMessage: () => {},
    clearMessages: () => {},
  };
};
