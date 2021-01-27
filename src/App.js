import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { restGet, restPut } from './utils/communication';
import * as Constants from './constants';
import { loadGameData, loadGameType, resetGame } from './actions/gameActions';
import Lobby from './components/lobby.jsx';
import Join from './components/join.jsx';
import Game from './components/game.jsx';
import Host from './components/host.jsx';

function App() {
  const gameType = useSelector((state) => state.game.game.type);
  const code = useSelector((state) => state.game.game.code);
  const isStarted = useSelector((state) => state.game.state.isStarted);
  const dispatch = useDispatch();

  useEffect(() => {
    restGet(`${Constants.SERVER_PATH}api/games`).then((result) => {
      if (result.game) {
        dispatch(loadGameData(result));
      } else {
        dispatch(resetGame());
      }
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  }, [dispatch]);

  const hostClicked = () => {
    restPut(`${Constants.SERVER_PATH}api/games`).then((result) => {
      if (result.game) {
        dispatch(loadGameData(result));
      } else {
        dispatch(resetGame());
      }
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const joinClicked = () => {
    dispatch(loadGameType('player'));
  };

  if (gameType) {
    if (gameType === 'host') {
      if (isStarted) {
        return <Host />;
      }
      return <Lobby />;
    }
    if (code) {
      return <Game />;
    }
    return <Join />;
  }

  return (
    <div>
      <p className="dixit-title text-light text-center">DiXit</p>
      <div className="d-flex justify-content-center">
        <button onClick={hostClicked} className="btn btn-lg btn-outline-light mt-2 mr-2">Host game</button>
        <button onClick={joinClicked} className="btn btn-lg btn-outline-light mt-2 ml-2">Join game</button>
      </div>
    </div>
  );
}

export default App;
