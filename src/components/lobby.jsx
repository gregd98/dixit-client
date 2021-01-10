import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketIOClient from 'socket.io-client';
import { restGet, restPut } from '../utils/communication';
import { SERVER_PATH } from '../constants';
import {updatePlayers, updateState} from '../actions/gameActions';

const Lobby = () => {
  const game = useSelector((state) => state.game.game);
  const [editions, setEditions] = useState([]);
  const [checkedEditions, setCheckedEditions] = useState(new Set());
  const [socket, setSocket] = useState(null);
  const [hoverPlayer, setHoverPlayer] = useState(undefined);

  const dispatch = useDispatch();

  useEffect(() => {
    restGet(`${SERVER_PATH}api/editions`).then((result) => {
      setEditions(result);
    }).catch((error) => {
      console.log(error.message);
    });
  }, []);

  useEffect(() => {
    const so = socketIOClient(`${window.location.hostname}/host`);
    setSocket(so);
    return () => {
      so.disconnect();
      setSocket(null);
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('state update', (payload) => {
        dispatch(updateState(payload));
      });
      socket.on('player update', (payload) => {
        dispatch(updatePlayers(payload));
      });
    }
  }, [dispatch, socket]);

  const toggleEdition = (edition) => {
    const tmp = new Set(checkedEditions);
    const { id } = edition;
    if (tmp.has(id)) {
      tmp.delete(id);
    } else {
      tmp.add(id);
    }
    setCheckedEditions(tmp);
    console.log(tmp);
  };

  const getMaxCardNumber = () => {
    let result = 0;
    editions.forEach((edition) => {
      if (checkedEditions.has(edition.id)) {
        result += edition.cards;
      }
    });
    return result;
  };

  const startGame = () => {
    restPut(`${SERVER_PATH}api/games/start`, { editions: Array.from(checkedEditions) }).then(() => {
      console.log('Game started!');
    });
  };

  const kickPlayer = (playerId) => {
    restPut(`${SERVER_PATH}api/games/kick`, { playerId }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const adminPlayer = (playerId) => {
    restPut(`${SERVER_PATH}api/games/admin`, { playerId }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const playerMouseEnter = (index) => {
    setHoverPlayer(index);
  };

  const playerMouseLeave = (index) => {
    if (hoverPlayer === index) {
      setHoverPlayer(undefined);
    }
  };

  return (
    <React.Fragment>
      <p className="text-center text-light dixit-title">Host</p>
      <div className="d-flex justify-content-center mt-4">
        <div className="list-group edition-list shadow mx-4">
          {editions
            .map(
              (edition) => (
                <div onClick={() => toggleEdition(edition)} key={edition.id} className="list-group-item d-flex justify-content-between align-items-center clickable darkBg" >
                  <p className="m-0 p-0 text-light edition-text">{edition.name}</p>
                  <input onChange={() => toggleEdition(edition)} className="form-check-input-lg" type="checkbox" id={`ch-${edition.id}`} checked={checkedEditions.has(edition.id)}/>
                </div>
              ),
            )}
        </div>
        <div className="mx-4">
          <p className="text-light lobby-text">URL: <b>{game.ip ? `http://${game.ip}/` : 'N/A'}</b></p>
          <p className="text-light lobby-text">Code: <b>{game.code}</b></p>
        </div>
        <div className="list-group edition-list shadow mx-4 darkBg">
          {game.players.map((player, i) => (
            <div key={player.id} onMouseEnter={() => playerMouseEnter(i)} onMouseLeave={() => playerMouseLeave(i)} className="list-group-item d-flex justify-content-between align-items-center darkBg" >
              <div className="d-flex flex-row">
                <p className="m-0 p-0 text-light edition-text">{player.name}</p>
                {player.isAdmin && <span className="badge bg-light rounded-pill text-dark ml-2 align-self-baseline" style={{ fontSize: '3mm' }}>admin</span>}
              </div>
              {hoverPlayer === i && (
                <div>
                  <button onClick={() => adminPlayer(player.id)} className="btn btn-sm btn-outline-secondary mr-2" type="button">A</button>
                  <button onClick={() => kickPlayer(player.id)} className="btn btn-sm btn-outline-danger" type="button">X</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <h4>{getMaxCardNumber()}</h4>
      <button onClick={startGame} className="btn btn-primary">Start game</button>
    </React.Fragment>
  );
};

export default Lobby;
