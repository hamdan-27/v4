import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes, css } from 'styled-components';
import { CSSTransition } from 'react-transition-group';
import { useOnClickOutside } from '@hooks';

// Animations

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const slideUp = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
`;

// Styled Components

const StyledChatWrapper = styled.div`
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 900;
  display: flex;
  flex-direction: column;
  align-items: flex-end;

  @media (max-width: 768px) {
    bottom: 20px;
    right: 20px;
  }
`;

const StyledToggleButton = styled.button`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background-color: var(--green);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(100, 255, 218, 0.3);
  transition: var(--transition);
  flex-shrink: 0;

  &:hover {
    background-color: var(--green);
    transform: scale(1.08);
    box-shadow: 0 6px 24px rgba(100, 255, 218, 0.45);
  }

  svg {
    width: 22px;
    height: 22px;
    color: var(--navy);
    transition: var(--transition);
  }
`;

const StyledChatWindow = styled.div`
  width: 360px;
  height: 500px;
  background-color: var(--light-navy);
  border: 1px solid var(--lightest-navy);
  border-radius: 12px;
  box-shadow: 0 20px 60px -15px var(--navy-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-bottom: 12px;

  @media (max-width: 768px) {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
    margin-bottom: 0;
  }

  &.chat-enter {
    opacity: 0;
    transform: translateY(14px) scale(0.97);
  }
  &.chat-enter-active {
    opacity: 1;
    transform: translateY(0) scale(1);
    transition: opacity 0.22s var(--easing), transform 0.22s var(--easing);
  }
  &.chat-exit {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  &.chat-exit-active {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
    transition: opacity 0.18s var(--easing), transform 0.18s var(--easing);
  }
`;

const StyledHeader = styled.div`
  padding: 14px 16px;
  background-color: var(--navy);
  border-bottom: 1px solid var(--lightest-navy);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;

  .header-left {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: var(--green);
    flex-shrink: 0;
  }

  h3 {
    margin: 0;
    color: var(--lightest-slate);
    font-size: var(--fz-sm);
    font-weight: 600;
    letter-spacing: 0.03em;
  }

  p {
    margin: 0;
    color: var(--slate);
    font-size: var(--fz-xxs);
    font-family: var(--font-mono);
  }
`;

const StyledCloseButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--slate);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  border-radius: var(--border-radius);
  transition: var(--transition);

  &:hover {
    color: var(--lightest-slate);
    background-color: var(--lightest-navy);
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const StyledMessageList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--lightest-navy);
    border-radius: 2px;
  }
`;

const StyledMessage = styled.div`
  display: flex;
  flex-direction: column;
  align-items: ${({ $role }) => ($role === 'user' ? 'flex-end' : 'flex-start')};
  animation: ${slideUp} 0.2s var(--easing) both;

  .bubble {
    max-width: 85%;
    padding: 10px 13px;
    border-radius: 12px;
    font-size: var(--fz-sm);
    line-height: 1.5;
    word-break: break-word;

    ${({ $role }) =>
    $role === 'user'
      ? css`
            background-color: var(--green-tint);
            border: 1px solid var(--green);
            color: var(--lightest-slate);
            border-bottom-right-radius: 3px;
          `
      : css`
            background-color: var(--lightest-navy);
            color: var(--light-slate);
            border-bottom-left-radius: 3px;
          `}
  }
`;

const StyledCursor = styled.span`
  display: inline-block;
  width: 2px;
  height: 1em;
  background-color: var(--green);
  margin-left: 2px;
  vertical-align: text-bottom;
  animation: ${blink} 0.8s step-end infinite;
`;

const StyledWelcome = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  height: 100%;
  padding: 24px;
  gap: 10px;
  color: var(--slate);

  .icon {
    width: 40px;
    height: 40px;
    color: var(--green);
    opacity: 0.7;
  }

  p {
    margin: 0;
    font-size: var(--fz-sm);
    line-height: 1.5;

    &.hint {
      font-size: var(--fz-xxs);
      font-family: var(--font-mono);
      color: var(--dark-slate);
    }
  }
`;

const StyledInputArea = styled.form`
  padding: 12px;
  border-top: 1px solid var(--lightest-navy);
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  background-color: var(--navy);
`;

const StyledTextarea = styled.textarea`
  flex: 1;
  background-color: var(--light-navy);
  border: 1px solid var(--lightest-navy);
  border-radius: var(--border-radius);
  color: var(--lightest-slate);
  font-family: var(--font-sans);
  font-size: var(--fz-sm);
  padding: 8px 12px;
  resize: none;
  outline: none;
  transition: border-color 0.2s ease;
  max-height: 100px;
  line-height: 1.4;

  &::placeholder {
    color: var(--dark-slate);
  }

  &:focus {
    border-color: var(--green);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const StyledSendButton = styled.button`
  background-color: var(--green);
  border: none;
  border-radius: var(--border-radius);
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  align-self: flex-end;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: var(--transition);

  &:hover:not(:disabled) {
    transform: scale(1.07);
    box-shadow: 0 0 12px rgba(100, 255, 218, 0.4);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  svg {
    width: 16px;
    height: 16px;
    color: var(--navy);
  }
`;

// Component

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [streamingText, setStreamingText] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const chatWindowRef = useRef(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Close on outside click (desktop only)
  const handleOutsideClick = useCallback(() => {
    if (typeof window !== 'undefined' && window.innerWidth > 768) {
      setIsOpen(false);
    }
  }, []);
  useOnClickOutside(chatWindowRef, handleOutsideClick);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingText]);

  // Focus textarea when chat opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      setTimeout(() => textareaRef.current?.focus(), 220);
    }
  }, [isOpen]);

  // Cancel in-flight request on unmount
  useEffect(() => () => abortControllerRef.current?.abort(), []);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) {
      return;
    }

    const userMessage = { role: 'user', content: text };
    const nextMessages = [...messages, userMessage];

    setMessages(nextMessages);
    setInputValue('');
    setIsLoading(true);
    setStreamingText('');

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nextMessages }),
        signal: abortControllerRef.current.signal,
      });

      if (!res.ok) {
        throw new Error(`Request failed: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      let chunk = await reader.read();
      while (!chunk.done) {
        buffer += decoder.decode(chunk.value, { stream: true });

        // Extract only complete lines from the buffer so split JSON never occurs
        let lineEnd = buffer.indexOf('\n');
        while (lineEnd !== -1) {
          const line = buffer.slice(0, lineEnd).trim();
          buffer = buffer.slice(lineEnd + 1);

          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                accumulated += delta;
                setStreamingText(accumulated);
              }
            } catch {
              // skip malformed JSON
            }
          }

          lineEnd = buffer.indexOf('\n');
        }

        chunk = await reader.read();
      }

      // Commit the completed message
      setMessages(prev => [...prev, { role: 'assistant', content: accumulated }]);
      setStreamingText('');
    } catch (err) {
      if (err.name === 'AbortError') {
        return;
      }
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: 'Sorry, I\'m having trouble connecting right now. Please try again.',
        },
      ]);
      setStreamingText('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = e => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleToggle = () => {
    if (isLoading) {
      abortControllerRef.current?.abort();
      setIsLoading(false);
      if (streamingText) {
        setMessages(prev => [...prev, { role: 'assistant', content: streamingText }]);
        setStreamingText('');
      }
    }
    setIsOpen(prev => !prev);
  };

  // SSR guard — don't render during Gatsby build
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <StyledChatWrapper ref={chatWindowRef}>
      <CSSTransition in={isOpen} timeout={220} classNames="chat" unmountOnExit>
        <StyledChatWindow>
          <StyledHeader>
            <div className="header-left">
              <span className="status-dot" />
              <div>
                <h3>Hamdan Mohammad</h3>
                <p>Ask me anything</p>
              </div>
            </div>
            <StyledCloseButton onClick={() => setIsOpen(false)} aria-label="Close chat">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </StyledCloseButton>
          </StyledHeader>

          <StyledMessageList>
            {messages.length === 0 && !streamingText && (
              <StyledWelcome>
                <svg
                  className="icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                <p>Hi there! I'm Hamdan. Ask me about my experience, projects, or skills.</p>
                <p className="hint">Shift+Enter for new line · Enter to send</p>
              </StyledWelcome>
            )}

            {messages.map((msg, i) => (
              <StyledMessage key={i} $role={msg.role}>
                <div className="bubble">{msg.content}</div>
              </StyledMessage>
            ))}

            {streamingText && (
              <StyledMessage $role="assistant">
                <div className="bubble">
                  {streamingText}
                  <StyledCursor />
                </div>
              </StyledMessage>
            )}

            {isLoading && !streamingText && (
              <StyledMessage $role="assistant">
                <div className="bubble">
                  <StyledCursor />
                </div>
              </StyledMessage>
            )}

            <div ref={messagesEndRef} />
          </StyledMessageList>

          <StyledInputArea
            onSubmit={e => {
              e.preventDefault();
              sendMessage();
            }}>
            <StyledTextarea
              ref={textareaRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isLoading}
            />
            <StyledSendButton type="submit" disabled={!inputValue.trim() || isLoading}>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </StyledSendButton>
          </StyledInputArea>
        </StyledChatWindow>
      </CSSTransition>

      <StyledToggleButton onClick={handleToggle} aria-label={isOpen ? 'Close chat' : 'Open chat'}>
        {isOpen ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        )}
      </StyledToggleButton>
    </StyledChatWrapper>
  );
};

export default Chatbot;
