import React, { ReactNode } from 'react';
import styled from 'styled-components';

interface ThreePanelLayoutProps {
  leftPanel: ReactNode;
  centerPanel: ReactNode;
  rightPanel: ReactNode;
}

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  width: 100%;
  overflow: hidden;
`;

const LeftPanel = styled.div`
  width: ${props => props.theme.layout.leftPanelWidth};
  background-color: ${props => props.theme.colors.leftPanelBg};
  overflow-y: auto;
  padding: 1.5rem;
  border-right: 1px solid #e0e0e0;
`;

const CenterPanel = styled.div`
  flex: 1;
  background-color: ${props => props.theme.colors.hospitalWhite};
  overflow-y: auto;
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
`;

const RightPanel = styled.div`
  width: ${props => props.theme.layout.rightPanelWidth};
  background-color: ${props => props.theme.colors.rightPanelBg};
  overflow-y: auto;
  padding: 1.5rem;
  border-left: 1px solid #e0e0e0;
`;

export const ThreePanelLayout: React.FC<ThreePanelLayoutProps> = ({
  leftPanel,
  centerPanel,
  rightPanel,
}) => {
  return (
    <LayoutContainer>
      <LeftPanel>{leftPanel}</LeftPanel>
      <CenterPanel>{centerPanel}</CenterPanel>
      <RightPanel>{rightPanel}</RightPanel>
    </LayoutContainer>
  );
};

export default ThreePanelLayout;