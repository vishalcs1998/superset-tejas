// superset-frontend/src/views/Chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { List, Input, Typography, Table as AntTable } from 'antd';
import {
  SendOutlined,
  MessageOutlined,
  ExpandOutlined,
  CompressOutlined,
  CloseOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

////////////////////////////////////////////////////////////////////////////////
// 1) Types for the union response

interface BaseReply {
  type: 'text-string' | 'text-table' | 'deeplink';
  dashboardID?: number;
}

interface TextStringReply extends BaseReply {
  type: 'text-string';
  value: string;
  sql?: string;
}

interface TextTableReply extends BaseReply {
  type: 'text-table';
  value: string;  // markdown/pipe table
  sql?: string;
}

interface DeeplinkReply extends BaseReply {
  type: 'deeplink';
  filter_key: string;
  value: string;  // URL
}

type Reply = TextStringReply | TextTableReply | DeeplinkReply;

interface QueryRequest {
  dashboardID?: number;
  query: string;
}

////////////////////////////////////////////////////////////////////////////////
// 2) Props

interface ChatProps {
  /** Called to fully close/unmount the chat */
  onClose: () => void;
}

////////////////////////////////////////////////////////////////////////////////
// 3) Chat component

const Chat: React.FC<ChatProps> = ({ onClose }) => {
  // compressed vs. expanded size
  const defaultSize = { width: 400, height: 600 };
  const [expanded, setExpanded] = useState(false);
  const size = expanded
    ? { width: defaultSize.width * 2, height: defaultSize.height * 1.5 }
    : defaultSize;

  // chat state
  const [messages, setMessages] = useState<
    Array<{ from: 'me' | 'bot'; reply: Reply | { type: 'text'; text: string } }>
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
  const bottomRef = useRef<HTMLDivElement>(null);
  const dashboardID = 111;

  // auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // send logic
  const doSend = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // echo user's message
    setMessages(msgs => [
      ...msgs,
      { from: 'me', reply: { type: 'text', text: trimmed } },
    ]);

    try {
      const resp = await fetch('http://192.168.0.117:50000/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed, dashboardID } as QueryRequest),
      });
      if (!resp.ok) throw new Error(await resp.text());
      const data = (await resp.json()) as Reply;

      // handle deeplink
      if (data.type === 'deeplink') {
        setMessages(msgs => [
          ...msgs,
          { from: 'bot', reply: { type: 'text', text: 'Setting up your dashboard...' } },
        ]);
        window.location.href = data.value;
        return;
      }

      // append text-string or text-table
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

  const sendQuery = (value?: string) => {
    doSend(value ?? draft);
    setDraft('');
  };

  // container styling
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 24,
    right: 24,
    width: size.width,
    height: size.height,
    border: '1px solid #ddd',
    borderRadius: 8,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
  };

  return (
    <div style={containerStyle}>
      {/* header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          padding: 8,
          borderBottom: '1px solid #f0f0f0',
        }}
      >
        {expanded ? (
          <CompressOutlined
            onClick={() => setExpanded(false)}
            style={{ cursor: 'pointer', marginRight: 8 }}
          />
        ) : (
          <ExpandOutlined
            onClick={() => setExpanded(true)}
            style={{ cursor: 'pointer', marginRight: 8 }}
          />
        )}
        <CloseOutlined
          onClick={onClose}
          style={{ cursor: 'pointer' }}
        />
      </div>

      {/* messages */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <List
          dataSource={messages}
          renderItem={(m, idx) => {
            const isUser = m.from === 'me';
            const isTable = m.reply.type === 'text-table';
            const justify = isUser ? 'flex-end' : 'flex-start';
            const bg = isUser ? '#f5f5f5' : isTable ? 'transparent' : '#e6f7ff';
            const color = isUser ? '#000' : '#000d13';

            return (
              <div
                key={idx}
                style={{ display: 'flex', justifyContent: justify, marginBottom: 8 }}
              >
                <div
                  style={{
                    maxWidth: '80%',
                    background: bg,
                    color,
                    padding: '10px 14px',
                    borderRadius: 12,
                    boxShadow: isUser ? 'none' : '0 1px 3px rgba(0,0,0,0.1)',
                  }}
                >
                  {/* plain text */}
                  {'text' in m.reply && <Text>{m.reply.text}</Text>}

                  {/* text-string */}
                  {m.reply.type === 'text-string' && <Text>{m.reply.value}</Text>}

                  {/* text-table → parse & render */}
                  {m.reply.type === 'text-table' &&
                    (() => {
                      const lines = m.reply.value
                        .trim()
                        .split('\n')
                        .filter(l => l.trim());
                      const header = lines[0]
                        .split('|')
                        .map(c => c.trim())
                        .filter(Boolean);
                      const rows = lines.slice(2);
                      const columns = header.map(col => ({
                        title: col,
                        dataIndex: col,
                        key: col,
                      }));
                      const dataSource = rows.map((line, i) => {
                        const cells = line
                          .split('|')
                          .map(c => c.trim())
                          .filter(Boolean);
                        const rec: Record<string, any> = { key: i };
                        header.forEach((h, j) => {
                          rec[h] = cells[j];
                        });
                        return rec;
                      });
                      return (
                        <AntTable
                          size="small"
                          pagination={false}
                          columns={columns}
                          dataSource={dataSource}
                        />
                      );
                    })()}
                </div>
              </div>
            );
          }}
        />
        <div ref={bottomRef} />
      </div>

      {/* input */}
      <div style={{ borderTop: '1px solid #f0f0f0', padding: 12 }}>
        <Input.Search
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onSearch={sendQuery}
          placeholder="Ask me about this dashboard…"
          enterButton={<SendOutlined />}
          prefix={<MessageOutlined />}
          size="large"
          allowClear
          style={{ borderRadius: 8 }}
        />
      </div>
    </div>
  );
};

export default Chat;