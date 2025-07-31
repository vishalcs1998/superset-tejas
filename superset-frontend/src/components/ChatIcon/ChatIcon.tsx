// superset-frontend/src/components/ChatIcon.tsx
import React, { useState } from 'react';
import { Button } from 'antd';
import { WechatOutlined, CloseOutlined } from '@ant-design/icons';
import ChatLauncher from 'src/views/ChatLauncher';
import { styled } from '@superset-ui/core';
import { theme } from 'src/preamble';

const Wrapper = styled.div`
  position: fixed;
  bottom: ${theme.gridUnit * 6}px;
  right: ${theme.gridUnit * 6}px;
  z-index: 1000;
`;

const ToggleBtn = styled(Button)`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  .anticon {
    font-size: 24px;
  }
`;

const Popup = styled.div`
  position: absolute;
  bottom: ${theme.gridUnit * 2}px;
  right: 0;
  width: 300px;
  height: 400px;
  background: ${theme.colors.grayscale.light5};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border-radius: ${theme.borderRadius}px;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${theme.gridUnit * 1}px ${theme.gridUnit * 2}px;
  border-bottom: 1px solid ${theme.colors.grayscale.light2};
`;

const Body = styled.div`
  flex: 1;
  overflow: hidden;
`;

const ChatIcon: React.FC = () => {
  // SINGLE source of truth for “open/closed”
  const [open, setOpen] = useState(false);
  const toggle = () => setOpen(o => !o);

  return (
    <Wrapper>
      {open ? (
        <Popup>
          <Header>
            <span>Chat</span>
            {/* this X now closes the entire thing */}
            <Button type="text" icon={<CloseOutlined />} onClick={toggle} />
          </Header>
          <Body>
            {/* pass toggle down so Chat’s X also calls back up */}
            <ChatLauncher onClose={toggle} />
          </Body>
        </Popup>
      ) : (
        <ToggleBtn
          type="primary"
          shape="circle"
          icon={<WechatOutlined />}
          onClick={toggle}
        />
      )}
    </Wrapper>
  );
};

export default ChatIcon;