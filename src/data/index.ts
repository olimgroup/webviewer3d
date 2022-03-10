import { combineReducers } from 'redux';
import color from './color';
import { createStore } from 'redux';

const rootReducer = combineReducers({
  color
});
export const store = createStore(rootReducer);

export default rootReducer;
export type RootState = ReturnType<typeof rootReducer>;