//Action object

import { ColorResult } from "react-color";
const SET_COLOR = 'color/SET' as const;

// Action creator
export const setColor = (diff: ColorResult) => ({
  type: SET_COLOR,
  payload: diff
});

// Action Types
type ColorAction =
  | ReturnType<typeof setColor>;

// Store
type ColorState = {
  r: number;
  g: number;
  b: number;
};

// Init Store
const initialState: ColorState = {
  r: 1,
  g: 1,
  b: 1
};

// Reducer
function color(
  state: ColorState = initialState,
  action: ColorAction
): ColorState {
  switch (action.type) {
    case SET_COLOR:
      return {
        r: action.payload.rgb.r / 255,
        g: action.payload.rgb.g / 255,
        b: action.payload.rgb.b / 255,
      };
    default:
      return state;
  }
}

export default color;