import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketIOClient from 'socket.io-client';
import {restDelete, restGet, restPut} from '../utils/communication';
import { SERVER_PATH } from '../constants';
import {resetGame, updatePlayers, updateState} from '../actions/gameActions';
import ErrorPage from './error_page.jsx';

const Lobby = () => {
  const gameInfo = useSelector((state) => state.game.game);
  const [editions, setEditions] = useState([]);
  const [checkedEditions, setCheckedEditions] = useState(new Set());
  const [cardCount, setCardCount] = useState({ value: 0, min: 0, max: 0 });
  const [selectEditionText, setSelectEditionText] = useState('');
  const [gameLength, setGameLength] = useState({ rounds: 0, turns: 0 });
  const [socket, setSocket] = useState(null);
  const [hoverPlayer, setHoverPlayer] = useState(undefined);
  const [pageDisabled, setPageDisabled] = useState(false);

  const [startError, setStartError] = useState('');
  const [pageError, setPageError] = useState({});
  const [isLoading, setLoading] = useState(true);

  const dispatch = useDispatch();

  useEffect(() => {
    setLoading(true);
    restGet(`${SERVER_PATH}api/editions`).then((result) => {
      setEditions(result);
      setLoading(false);
    }).catch((error) => {
      setPageError(error);
      setLoading(false);
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

  useEffect(() => {
    const playerCount = gameInfo.players.length;
    const maxCardCount = editions
      .reduce((acc, value) => (checkedEditions.has(value.id) ? acc + value.cards : acc), 0);
    const minCardCount = playerCount !== 3 ? 5 * playerCount + playerCount ** 2 : 31;
    if (playerCount === 0 || maxCardCount === 0 || maxCardCount < minCardCount) {
      setCardCount((current) => ({
        ...current, value: 0, min: 0, max: 0,
      }));
      if (maxCardCount < minCardCount) {
        if (checkedEditions.size === 0) {
          setSelectEditionText('Select editions!');
        } else {
          setSelectEditionText('Not enough cards, select more editions!');
        }
      }
    } else {
      setCardCount((current) => ({
        ...current, value: minCardCount, min: minCardCount, max: maxCardCount,
      }));
      setSelectEditionText('');
    }
  }, [editions, checkedEditions, gameInfo.players.length]);

  useEffect(() => {
    const cards = cardCount.value;
    const playerCount = gameInfo.players.length;
    const handSize = playerCount === 3 ? 7 : 6;
    const divider = playerCount === 3 ? 5 : playerCount;
    const rounds = Math.floor((cards - playerCount * handSize) / divider + 1);
    setGameLength({ rounds, turns: Math.floor(rounds / playerCount) });
  }, [cardCount.value, gameInfo.players.length]);

  const toggleEdition = (edition) => {
    const tmp = new Set(checkedEditions);
    const { id } = edition;
    if (tmp.has(id)) {
      tmp.delete(id);
    } else {
      tmp.add(id);
    }
    setCheckedEditions(tmp);
  };

  const startGame = () => {
    setPageDisabled(true);
    setStartError('');
    restPut(`${SERVER_PATH}api/games/start`, {
      editions: Array.from(checkedEditions),
      cardCount: Number.parseInt(cardCount.value, 10),
    }).then(() => {
      setPageDisabled(false);
    })
      .catch((error) => {
        setPageDisabled(false);
        setStartError(`Error: ${error.message}`);
      });
  };

  const cancelClicked = () => {
    setPageDisabled(true);
    setStartError('');
    restDelete(`${SERVER_PATH}api/games`).then(() => {
      dispatch(resetGame());
      setPageDisabled(false);
    }).catch((error) => {
      setPageDisabled(false);
      setStartError(`Error: ${error.message}`);
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

  const renderInputCardRange = () => {
    const handleInputChange = (event) => {
      const { value } = event.target;
      setCardCount((rest) => ({ ...rest, value }));
    };
    return (
      <React.Fragment>
        <input
          onChange={handleInputChange}
          min={cardCount.min}
          max={cardCount.max}
          type="range"
          className="form-control-range custom-range"
          id="inputCardCount"
          value={cardCount.value}
          disabled={pageDisabled}/>
      </React.Fragment>
    );
  };

  if (pageError.message) {
    return <ErrorPage status={pageError.status} message={pageError.message} />;
  }

  if (isLoading) {
    return <React.Fragment />;
  }

  return (
    <React.Fragment>
      <p className="text-center text-light dixit-title">Host</p>
      <div className="d-flex justify-content-center mt-4">
        <div className="list-group edition-list shadow mx-4 darkBg">
          {editions
            .map(
              (edition) => (
                <div onClick={() => toggleEdition(edition)} key={edition.id} className="list-group-item d-flex justify-content-between align-items-center clickable darkBg" >
                  <p className="m-0 p-0 text-light edition-text">{edition.name}</p>
                  <input onChange={() => toggleEdition(edition)} className="form-check-input-lg" type="checkbox"
                         id={`ch-${edition.id}`} checked={checkedEditions.has(edition.id)} disabled={pageDisabled}/>
                </div>
              ),
            )}
        </div>
        <div className="mx-4">
          <p className="text-light lobby-text">URL: <b>{gameInfo.ip ? `http://${gameInfo.ip}/` : 'N/A'}</b></p>
          <p className="text-light lobby-text mb-4">Code: <b className="code-spacing">{gameInfo.code}</b></p>
          {gameInfo.players.length >= 3 ? (
            <React.Fragment>
              {selectEditionText ? (
                  <p className="text-light small-text">{selectEditionText}</p>
              ) : (
                <React.Fragment>
                  {renderInputCardRange()}
                  <p className="text-light small-roboto mt-4">Cards: <b>{cardCount.value}</b></p>
                  <p className="text-light small-roboto">Rounds: <b>{gameLength.rounds}</b></p>
                  <p className="text-light small-roboto">Each player turns: <b>{gameLength.turns}</b></p>
                  <button onClick={startGame} className="btn btn-lg btn-block btn-outline-light mt-4" disabled={pageDisabled}>
                    Start game
                    {pageDisabled && <span className="spinner-border spinner-border-sm ml-2" role="status" aria-hidden="true" />}
                  </button>
                </React.Fragment>
              )}
            </React.Fragment>
          ) : (
            <p className="text-light small-text">Waiting players to join.</p>
          )}
          <button onClick={cancelClicked} className="btn btn-lg btn-block btn-outline-danger mt-2" disabled={pageDisabled}>
            Cancel
            {pageDisabled && <span className="spinner-border spinner-border-sm ml-2" role="status" aria-hidden="true" />}
          </button>
          {startError && (<div className="alert alert-danger mt-4" role="alert">{startError}</div>)}
        </div>
        <div className="list-group edition-list shadow mx-4 darkBg">
          {gameInfo.players.map((player, i) => (
            <div key={player.id} onMouseEnter={() => playerMouseEnter(i)} onMouseLeave={() => playerMouseLeave(i)} className="list-group-item d-flex justify-content-between align-items-center darkBg" >
              <div className="d-flex flex-row">
                <p className="m-0 p-0 text-light edition-text">{player.name}</p>
                {player.isAdmin && <span className="badge bg-light rounded-pill text-dark ml-2 align-self-baseline" style={{ fontSize: '3mm' }}>admin</span>}
              </div>
              {hoverPlayer === i && (
                <div>
                  <button onClick={() => adminPlayer(player.id)} className="btn btn-sm btn-outline-secondary mr-2"
                          type="button" disabled={pageDisabled}>A</button>
                  <button onClick={() => kickPlayer(player.id)} className="btn btn-sm btn-outline-danger"
                          type="button" disabled={pageDisabled}>X</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </React.Fragment>
  );
};

export default Lobby;
