import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import socketIOClient from 'socket.io-client';
import { loadGameData, updatePlayers, updateState } from '../actions/gameActions';
import PlayerList from './player_list.jsx';
import { COLORS, SERVER_PATH } from '../constants';
import { restGet } from '../utils/communication';
import * as Constants from '../constants';

const Host = () => {
  const gameInfo = useSelector((state) => state.game.game);
  const gameState = useSelector((state) => state.game.state);
  const [socket, setSocket] = useState(null);
  const [scores, setScores] = useState([]);
  const [maxCardHeight, setMaxCardHeight] = useState(0);
  const [maxCardWidth, setMaxCardWidth] = useState(0);
  const [circles, setCircles] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    restGet(`${Constants.SERVER_PATH}api/games`).then((result) => {
      if (result.game) {
        dispatch(loadGameData(result));
      }
    }).catch((error) => {
      console.log(error.message);
    });
  }, [dispatch]);

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
        console.log('Players:');
        console.log(payload);
        dispatch(updatePlayers(payload));
      });
    }
  }, [dispatch, socket]);

  useEffect(() => {
    if (gameState) {
      const s = [];
      for (let i = 0; i < gameInfo.players.length; i += 1) {
        const player = gameInfo.players[i];
        s.push({
          name: player.name,
          score: gameState.scores.find((item) => item.playerId === player.id).score,
        });
      }
      setScores(s.sort((a, b) => {
        if (a.score.total > b.score.total) {
          return -1;
        }
        if (a.score.total < b.score.total) {
          return 1;
        }
        if (a.name < b.name) {
          return -1;
        }
        return 1;
      }));
    }
  }, [gameInfo.players, gameState]);

  useEffect(() => {
    const setSizes = () => {
      const n = gameInfo.players.length;
      if (n > 0) {
        const h = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);
        const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        let mh = Math.ceil(h - 16 - 60);
        let mw = Math.ceil((w - n * 16) / n);
        if (mw < 320) {
          mw = Math.ceil(((w - n * 8) / (n + (n % 2 === 0 ? 0 : 1))) * 2);
          mh = Math.ceil((h - 16 - 60) * 0.5);
        }
        setMaxCardWidth(mw);
        setMaxCardHeight(mh);
      }
    };
    setSizes();
    window.addEventListener('resize', setSizes);
    return () => {
      window.removeEventListener('resize', setSizes);
    };
  }, [gameInfo.players.length]);

  useEffect(() => {
    const otherPlayers = gameInfo.players
      .filter((player) => player.id !== gameState.currentPlayer);
    switch (gameState.state) {
      case 0:
        setCircles([{
          color: gameInfo.players.find((player) => player.id === gameState.currentPlayer).color,
          active: false,
        }]);
        break;
      case 1:
        setCircles(otherPlayers.map((player) => ({
          color: player.color,
          active: gameState.playersPicked.includes(player.id),
        })));
        break;
      default: break;
    }
  }, [gameInfo.players, gameState]);

  useEffect(() => {
    console.log(circles);
  }, [circles]);

  const getPlayerNameById = (playerId) => {
    const p = gameInfo.players.find((player) => player.id === playerId);
    if (p) {
      return p.name;
    }
    return 'God';
  };

  const renderVoteCircles = (cardIndex) => {
    const v = gameState.votes.filter((vote) => vote.vote === cardIndex);
    return (
      <React.Fragment>
        {v.length > 0 && (
          <div id="btn_pick" className="bottom-votes d-flex flex-wrap m-0 px-2 py-2">
            {v.map((vote) => gameInfo.players.find((player) => player.id === vote.playerId).color)
              .map((color) => (
                <div key={color} className="vote-circle m-1 rounded-circle" style={{ backgroundColor: COLORS[color] }}/>
              ))}
          </div>
        )}
      </React.Fragment>
    );
  };

  const getPlayerNameByCardId = (cardId) => {
    if (cardId === gameState.originalCardId) {
      return gameInfo.players.find((player) => player.id === gameState.currentPlayer).name;
    }
    return gameInfo.players.find((player) => player.id === gameState.playersPicked
      .find((item) => cardId === item.card.id).playerId).name;
  };

  const renderTable = () => (
    <React.Fragment>
      <PlayerList />
      <div className="d-flex justify-content-center flex-wrap m-0">
        {gameState.table.map((card, i) => (
          <div key={card.id} className="card m-1 p-0 shadow rounded-lg darkBg border-0">
            <img src={`${SERVER_PATH}cards/${card.fileName}`} className="card-img-top table-card rounded-lg" alt="faszom"
                 style={{ maxHeight: `${maxCardHeight}px`, maxWidth: `${maxCardWidth}px` }}/>
            <p id="btn_pick" className={`pick vote-num${gameState.state === 3 ? ' vote-num-left' : ''}`}>{i + 1}</p>
            {gameState.state === 3 && (
              <React.Fragment>
                <p id="btn_pick" className={`pick vote-name${card.id === gameState.originalCardId ? ' vote-name-original' : ''}`}>
                  {getPlayerNameByCardId(card.id)}
                </p>
                {renderVoteCircles(i + 1)}
              </React.Fragment>
            )}
          </div>
        ))}
      </div>
    </React.Fragment>
  );

  const getScores = () => {
    const s = gameInfo.players.map((player) => ({
      name: player.name,
      score: gameState.scores.find((score) => score.playerId === player.id).score.total,
    }));
    const sorter = (a, b) => {
      if (a.score > b.score) {
        return -1;
      }
      if (a.score < b.score) {
        return 1;
      }
      if (a.name < b.name) {
        return -1;
      }
      return 1;
    };
    return s.sort(sorter);
  };

  switch (gameState.state) {
    case 0:
    case 1:
      return (
        <React.Fragment>
          <PlayerList className="mb-3"/>
          <div className="d-flex justify-content-around mt-5">
            <div className="mx-4">
              {gameState.state < 2 && (
                <React.Fragment>
                {gameState.state === 0 ? (
                  <p className="text-light big-text">{'Waiting for '}<b>{getPlayerNameById(gameState.currentPlayer)}</b>{', to pick a card.'}</p>
                ) : (
                  <p className="text-light big-text">Pick a card to <b>{getPlayerNameById(gameState.currentPlayer)}</b>{'\'s sentence'}</p>
                )}
                <div className="d-flex justify-content-center mt-4">
                  {circles.map((circle, i) => (
                      <div key={i} className={`vote-circle-lg m-1 moving-circle rounded-circle mx-2 shadow${circle.active ? ' move-circle' : ''}`} style={{ backgroundColor: COLORS[circle.color] }}/>
                  ))}
                </div>
                </React.Fragment>
              )}
            </div>
            <div className="card darkBg mx-4 shadow" style={{ width: '280px', maxWidth: '280px', minWidth: '280px' }}>
              <div className="card-body">
              <div className="d-flex justify-content-center mb-4 mt-2">
                <img src={`${SERVER_PATH}coup.png`} alt="coup" style={{ maxWidth: '80px' }} />
              </div>
              {scores.map((score) => (
                <div key={score.name} className="d-flex flex-row p-0 m-0 mr-2">
                  <div className="col-10 p-0 m-0">
                    <p key={score.name} className="text-light score-text nowrap" >{score.name}</p>
                  </div>
                  <div className="d-flex justify-content-start col-2 p-0 m-0 ml-2">
                    <p key={score.name} className="text-light score-text"><b>{score.score.total}</b></p>
                  </div>
                </div>
              ))}
              </div>
            </div>
          </div>
        </React.Fragment>
      );
    case 2:
      return renderTable();
    case 3:
      return renderTable();
      // return (
      //   <div>
      //     {scores.map((score) => (
      //       <p key={score.name}>{score.name} {score.score.total} {score.score.lastRound}</p>
      //     ))}
      //   </div>
      // );
    default:
      return <h1>Error</h1>;
  }
};

export default Host;
