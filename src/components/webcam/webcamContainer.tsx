import React, { useRef } from 'react';
import styled from 'styled-components';

const Wrapper = styled.div`
  position: absolute;
  top: 8px;
  border-radius: 5px;
  left: 8px;
`;

const WrapperInner = styled.div`
  float: left;
  padding-bottom: 1em;
  padding-right: 1em;
`;

function WebcamContainer() {
  const wrapperInner = useRef<HTMLDivElement>(null);

  const datas: any[] = []; 

  const Participants = () => {
    return datas.map(() => {
      return <video />;
    });
  };

  return (
    <Wrapper>
      <WrapperInner ref={wrapperInner}>
        {Participants()}
      </WrapperInner>
    </Wrapper>
  );
}
export default WebcamContainer;
