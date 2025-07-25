import React from 'react';
import { Button } from 'antd';
import { WechatOutlined } from '@ant-design/icons';
import { styled } from '@superset-ui/core';
import { theme } from 'src/preamble';

const IconWrapper = styled.div`
  position: fixed;
  bottom: ${theme.gridUnit * 4}px;
  right: ${theme.gridUnit * 4}px;
  z-index: 1000;
`;

const ChatIcon: React.FC = () => (
  <IconWrapper>
    <Button
      type="primary"
      shape="circle"
      icon={<WechatOutlined />}
      onClick={() => console.log('Chat icon clicked')}
    />
  </IconWrapper>
);

export default ChatIcon;