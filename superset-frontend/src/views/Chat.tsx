// superset-frontend/src/views/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Input, Button, Alert } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { styled } from '@superset-ui/core';
import { theme } from 'src/preamble';

////////////////////////////////////////////////////////////////////////////////
// 1) Types for the union response

interface BaseReply {
  type: 'text' | 'deeplink' | 'table';
  dashboardID?: number;
}

interface TextReply extends BaseReply {
  type: 'text';
  text: string;
}

interface SupersetFilterReply extends BaseReply {
  type: 'deeplink';
  filter_key: string;
  url: string;
}

interface TableReply extends BaseReply {
  type: 'table';
  table: string;   // e.g. CSV or HTML table string
  sql: string;
}

type Reply = TextReply | SupersetFilterReply | TableReply;

interface QueryRequest {
  dashboardID?: number;
  query: string;
}

////////////////////////////////////////////////////////////////////////////////
// 2) Styled containers

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`;

const Messages = styled.div`
  flex: 1;
  display: flex;              /* ← make this a flex container */
  flex-direction: column;     /* ← stack bubbles vertically */
  overflow-y: auto;
  padding: ${theme.gridUnit}px;
`;

const ControlsWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-top: 1px solid ${theme.colors.grayscale.light2};
`;

const SampleButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: ${theme.gridUnit}px;
  padding: ${theme.gridUnit}px;
`;

const SampleButton = styled(Button)`
  border-radius: ${theme.gridUnit * 2}px;
  background: ${({ theme }) => `${theme.colors.primary.base}20`};
  color: ${({ theme }) => theme.colors.primary.base};
  border: none;
  &:hover {
    background: ${({ theme }) => `${theme.colors.primary.base}30`};
  }
`;

const Composer = styled.div`
  display: flex;
  padding: ${theme.gridUnit}px;
`;

/**
 * Bot (fromMe=false) will be flex-start (left),
 * User (fromMe=true) will be flex-end (right)
 */
const MessageBubble = styled.div<{ fromMe: boolean }>`
  max-width: 80%;
  margin-bottom: ${theme.gridUnit}px;
  align-self: ${({ fromMe }) => (fromMe ? 'flex-end' : 'flex-start')};
  background: ${({ fromMe, theme }) =>
    fromMe ? theme.colors.grayscale.light3 : theme.colors.primary.base};
  color: ${({ fromMe }) => (fromMe ? '#000' : '#fff')};
  padding: ${theme.gridUnit}px ${theme.gridUnit * 1.5}px;
  border-radius: ${theme.gridUnit}px;
`;

////////////////////////////////////////////////////////////////////////////////
// 3) The Chat component

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<
    { from: 'me' | 'bot'; reply: Reply }[]
  >([
    {
      from: 'bot',
      reply: {
        type: 'text',
        text:
          "Hello there, I'm your virtual network assistant. Please type in your questions and I can then help further.",
      },
    },
  ]);
  const [draft, setDraft] = useState('');
  const [showSamples, setShowSamples] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dashboardID = 111;

  // scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // unified send logic
  const doSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setShowSamples(false);
    setMessages(msgs => [
      ...msgs,
      { from: 'me', reply: { type: 'text', text: trimmed } },
    ]);
    try {
      const payload: QueryRequest = { query: trimmed, dashboardID };
      const resp = await fetch('http://192.168.0.117:50000/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = (await resp.json()) as Reply;
      setMessages(msgs => [...msgs, { from: 'bot', reply: data }]);
    } catch (err: any) {
      setMessages(msgs => [
        ...msgs,
        {
          from: 'bot',
          reply: { type: 'text', text: `Error: ${err.message}` },
        },
      ]);
    }
  };

  const sendQuery = () => {
    doSend(draft);
    setDraft('');
  };

  const sendSample = (text: string) => {
    doSend(text);
    setDraft('');
  };

  return (
    <Container>
      <Messages>
        {messages.map((m, idx) => {
          const { reply, from } = m;
          if (reply.type === 'text') {
            return (
              <MessageBubble key={idx} fromMe={from === 'me'}>
                {reply.text}
              </MessageBubble>
            );
          }
          if (reply.type === 'deeplink') {
            return (
              <MessageBubble key={idx} fromMe={false}>
                <Alert
                  message={`Filter suggestion: ${reply.filter_key}`}
                  description={
                    <a
                      href={reply.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Open Filter
                    </a>
                  }
                  type="info"
                  showIcon
                />
              </MessageBubble>
            );
          }
          if (reply.type === 'table') {
            return (
              <MessageBubble key={idx} fromMe={false}>
                <pre style={{ fontSize: 12, margin: 0 }}>{reply.table}</pre>
              </MessageBubble>
            );
          }
          return null;
        })}
        <div ref={bottomRef} />
      </Messages>

      <ControlsWrapper>
        {showSamples && (
          <SampleButtons>
            <SampleButton onClick={() => sendSample('Show all KPIs')}>
              Show all KPIs
            </SampleButton>
            <SampleButton onClick={() => sendSample('Set up my dashboard')}>
              Set up my dashboard
            </SampleButton>
          </SampleButtons>
        )}
        <Composer>
          <Input
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onPressEnter={sendQuery}
            placeholder="Ask me about this dashboard…"
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={sendQuery}
            style={{ marginLeft: theme.gridUnit }}
          />
        </Composer>
      </ControlsWrapper>
    </Container>
  );
};

export default Chat;