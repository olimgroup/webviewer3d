import { LocalDataTrack } from 'twilio-video';
//Action object
const SET_CHANNEL = 'channel/SET' as const;

// Action creator
export const setChannel = (diff: LocalDataTrack) => ({
  type: SET_CHANNEL,
  payload: diff
});

// Action Types
type ChannelAction =
  | ReturnType<typeof setChannel>;

// Store
type ChannelState = {
  channel: LocalDataTrack | null
};

// Init Store
const initialState: ChannelState = {
  channel: null
};

// Reducer
function channel(
  state: ChannelState = initialState,
  action: ChannelAction
): ChannelState {
  switch (action.type) {
    case SET_CHANNEL:
      return {
        channel: action.payload,
      };
    default:
      return state;
  }
}

export default channel;