//Action object

const SET_COLOR = 'color/SET' as const;

// Action creator
export const setColor = (diff: string) => ({
  type: SET_COLOR,
  payload: diff
});

// Action Types
type ColorAction =
  | ReturnType<typeof setColor>;

// Store
type ColorState = {
  color: string;
};

// Init Store
const initialState: ColorState = {
  color: "black"
};

// Reducer
function color(
  state: ColorState = initialState,
  action: ColorAction
): ColorState {
  switch (action.type) {
    case SET_COLOR:
      return { color: action.payload };
    default:
      return state;
  }
}

export default color;