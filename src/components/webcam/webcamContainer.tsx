import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import { LocalDataTrack, connect, createLocalTracks, LocalTrack, Room } from 'twilio-video';
import { CancelablePromise } from 'twilio-video/tsdef/types';
import { useDispatch } from 'react-redux';
import { setChannel } from '../../data/channel';

const Wrapper = styled.div`
  position: absolute;
  margin-right: auto;
  margin-left: auto;
  padding-right: 15px;
  padding-left: 15px;
  width: 100%;
`;

const WrapperInner = styled.div`
  box-sizing: inherit;
  display: flex;
`;

const Video = styled.div`
  border-radius: 50%;
  height: 100px;
  object-fit: cover;
  overflow: hidden;
  width: 100px;
`;

const Button = styled.div`
  color: #28a745;
  background-color: transparent;
  background-image: none;
  border-color: #28a745;
  display: inline-block;
  font-weight: 400;
  text-align: center;
  white-space: nowrap;
  vertical-align: middle;
`;


function WebcamContainer() {
  const wrapperInner = useRef<HTMLDivElement>(null);
  const dataTrack = setupLocalDataTrack();
  const dispatch = useDispatch();
  dispatch(setChannel(dataTrack));

  let audioAndVideoTrack: LocalTrack[];
  let tracks: LocalTrack[];
  let connectAttempt: CancelablePromise<Room>;
  let room: Room;

  window.addEventListener("beforeunload", function (event) {
    disconnectFromRoom();
  });

  useEffect(() => {
    (async () => {
      const videoElement = document.createElement('video');
      videoElement.style.borderRadius ='50%';
      videoElement.style.height = '100px';
      videoElement.style.width = '100px';
      videoElement.style.objectFit = 'cover';
      videoElement.style.display = 'flex';
      
      wrapperInner.current!.appendChild(videoElement);
      audioAndVideoTrack = await setupLocalAudioAndVideoTracks(videoElement);
      tracks = audioAndVideoTrack.concat(dataTrack);
      connectToRoom();
    })();
  }, []);


  async function connectToRoom() {
    //event.preventDefault();

    try {
      const identity = "user" + Math.random();
      const name = "room1";

      console.log('Getting Access Token...');
      const token = await getToken(identity);
      console.log(`Got Access Token "${token}"`);

      console.log('Attempting to connect...');
      connectAttempt = connect(token, {
        name,
        tracks
      });

      room = await connectAttempt;
      console.log(`Connected to Room "${room.name}"`);

      // NOTE(mroberts): Save a reference to `room` on `window` for debugging.
      (window as any).room = room;

      room.once('disconnected', didDisconnect);

      room.participants.forEach(participantConnected);
      room.on('participantConnected', participantConnected);
      room.on('participantDisconnected', participantDisconnected);
    } catch (error: any) {
      didDisconnect(error);
    }
  }

  function disconnectFromRoom() {
    if (connectAttempt) {
      connectAttempt.cancel();
    }

    if (room) {
      room.disconnect();
    }

    didDisconnect(null);
  }

  function setupLocalDataTrack(): LocalDataTrack {
    const dataTrack = new LocalDataTrack();

    let mouseDown: Boolean;
    let mouseCoordinates: { x: Number, y: Number};

    window.addEventListener('mousedown', () => {
      mouseDown = true;
    }, false);

    window.addEventListener('mouseup', () => {
      mouseDown = false;
    }, false);

    window.addEventListener('mousemove', event => {
      const { pageX: x, pageY: y } = event;
      mouseCoordinates = { x, y };

      if (mouseDown) {
        dataTrack.send(JSON.stringify({
          mouseDown,
          mouseCoordinates
        }));
      }
    }, false);

    return dataTrack;
  }

  async function setupLocalAudioAndVideoTracks(video: HTMLVideoElement) {
    const audioAndVideoTrack = await createLocalTracks();
    audioAndVideoTrack.forEach((track: LocalTrack) => (track as any).attach(video));
    return audioAndVideoTrack;
  }

  async function getToken(identity: string) {
    const response = await fetch(`http://localhost:9000/token?identity=${encodeURIComponent(identity)}`);
    if (!response.ok) {
      throw new Error('Unable to fetch Access Token');
    }
    return response.text();
  }

  function didDisconnect(error: Error | null) {
    if (room) {
      if (error) {
        console.error(error);
      }
      room.participants.forEach(participantDisconnected);
    }
  }

  function participantConnected(participant: any) {
    const participantDiv = document.createElement('div');
    participantDiv.className = 'participant';
    participantDiv.id = participant.sid;

    const videoElement = document.createElement('video');
    videoElement.style.borderRadius ='50%';
    videoElement.style.height = '100px';
    videoElement.style.width = '100px';
    videoElement.style.objectFit = 'cover';
    videoElement.style.display = 'flex';

    participantDiv.appendChild(videoElement);
    wrapperInner.current!.appendChild(participantDiv);

    participant.tracks.forEach((publication: any) => trackPublished(participant, publication));
    participant.on('trackPublished', (publication: any) => trackPublished(participant, publication));
    participant.on('trackUnpublished', (publication: any) => trackUnpublished(participant, publication));
  }

  function participantDisconnected(participant: any) {
    console.log(`RemoteParticipant "${participant.identity}" disconnected`);
    const participantDiv = document.getElementById(participant.sid);
    if (participantDiv) {
      participantDiv.remove();
    }
  }

  function trackPublished(participant: any, publication: any) {
    console.log(`RemoteParticipant "${participant.identity}" published ${publication.kind} Track ${publication.trackSid}`);
    if (publication.isSubscribed) {
      trackSubscribed(participant, publication.track);
    } else {
      publication.on('subscribed', (track: any) => trackSubscribed(participant, track));
    }
    publication.on('unsubscribed', (track: any) => trackUnsubscribed(participant, track));
  }

  function trackSubscribed(participant: any, track: any) {
    console.log(`LocalParticipant subscribed to RemoteParticipant "${participant.identity}"'s ${track.kind} Track ${track.sid}`);
    if (track.kind === 'audio' || track.kind === 'video') {
      track.attach(`#${participant.sid} > video`);
    } else if (track.kind === 'data') {
      // track.on('message', (data: string) => {
      //   const { mouseDown, mouseCoordinates: { x, y } } = JSON.parse(data);
      // });
    }
  }

  function trackUnpublished(participant: any, publication: any) {
    console.log(`RemoteParticipant "${participant.identity}" unpublished ${publication.kind} Track ${publication.trackSid}`);
  }

  function trackUnsubscribed(participant: any, track: any) {
    console.log(`LocalParticipant unsubscribed from RemoteParticipant "${participant.identity}"'s ${track.kind} Track ${track.sid}`);
    if (track.kind === 'audio' || track.kind === 'video') {
      track.detach();
    }
  }



  return (
    <Wrapper>
      <WrapperInner ref={wrapperInner}>
      </WrapperInner>
    </Wrapper>
  );
}

export default WebcamContainer;
