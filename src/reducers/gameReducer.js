import produce from 'immer';
import {
  actionLoadGameData, actionLoadGameType, actionResetGame, actionUpdatePlayers, actionUpdateState,
} from '../actions/actionTypes';

const defaultState = {
  game: {
    type: '',
    code: '',
    players: [],
  },
  state: {},
};

const gameReducer = (state = defaultState, action) => {
  switch (action.type) {
    case actionLoadGameData:
      return produce(state, (draft) => {
        draft.game = action.payload.game;
        draft.state = action.payload.state;
      });
    case actionLoadGameType:
      return produce(state, (draft) => {
        draft.game.type = action.payload;
      });
    case actionUpdatePlayers:
      return produce(state, (draft) => {
        draft.game.players = action.payload;
      });
    case actionUpdateState:
      return produce(state, (draft) => {
        draft.state = action.payload;
      });
    case actionResetGame:
      return defaultState;
    default:
      return state;
  }
};

export default gameReducer;
