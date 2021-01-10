import {
  actionLoadGameData, actionLoadGameType, actionResetGame, actionUpdatePlayers, actionUpdateState,
} from './actionTypes';

export const loadGameData = (gameData) => ({ type: actionLoadGameData, payload: gameData });
export const loadGameType = (gameType) => ({ type: actionLoadGameType, payload: gameType });
export const updatePlayers = (players) => ({ type: actionUpdatePlayers, payload: players });
export const updateState = (state) => ({ type: actionUpdateState, payload: state });
export const resetGame = () => ({ type: actionResetGame });
