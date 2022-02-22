import { combineReducers } from 'redux';
import color from './color';
import channel from './channel';
import { createStore } from 'redux';

const rootReducer = combineReducers({
  color,
  channel
});
export const store = createStore(rootReducer);

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;