import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { resetGame, updatePlayers, updateState } from '../actions/gameActions';
import { COLORS, SERVER_PATH } from '../constants';
import { restPut } from '../utils/communication';

const classNames = require('classnames');

const Game = () => {
  const gameInfo = useSelector((state) => state.game.game);
  const gameState = useSelector((state) => state.game.state);
  const [socket, setSocket] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [votes, setVotes] = useState([]);
  const [scores, setScores] = useState([]);
  const [circles, setCircles] = useState([]);
  const dispatch = useDispatch();

  useEffect(() => {
    const so = socketIOClient(`${window.location.hostname}/player`);
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
    if (!gameInfo.players.find((player) => player.id === gameInfo.playerId)) {
      dispatch(resetGame());
    }
  }, [gameInfo.players, gameInfo.playerId, dispatch]);

  useEffect(() => {
    if (gameState && gameState.state === 2) {
      const v = [];
      for (let i = 1; i <= gameInfo.players.length; i += 1) {
        if (i !== gameState.ownCardIndex) {
          v.push(i);
        }
      }
      setVotes(v);
    }
  }, [gameInfo.players.length, gameState]);

  useEffect(() => {
    if (gameState && gameState.state === 3) {
      const s = [];
      for (let i = 0; i < gameInfo.players.length; i += 1) {
        const player = gameInfo.players[i];
        s.push({
          name: player.name,
          score: gameState.scores.find((item) => item.playerId === player.id).score,
        });
      }
      // const n = 12 - gameInfo.players.length;
      // for (let i = 0; i < n; i += 1) {
      //   s.push({
      //     name: `${i}`,
      //     score: 88,
      //   });
      // }
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
    window.$(document).on('slid.bs.carousel', '#carouselExampleIndicators', (e) => {
      console.log(e.to);
      setSelectedIndex(e.to);
    });
    return () => {
      window.$('#carouselExampleIndicators').unbind();
    };
  }, []);

  useEffect(() => {
    const otherPlayers = gameInfo.players
      .filter((player) => player.id !== gameState.currentPlayer);
    switch (gameState.state) {
      case 2:
        setCircles(otherPlayers.map((player) => ({
          color: player.color,
          active: gameState.playersVoted.includes(player.id),
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

  useEffect(() => {
    if (gameState.state === 0) {
      setSelectedIndex(0);
    }
  }, [gameState.state]);

  const pickCard = () => {
    // console.log(gameState.hand);
    console.log(selectedIndex);
    restPut(`${SERVER_PATH}api/games/pick`, { pickedCard: gameState.hand[selectedIndex].id }).then(() => {
      console.log('SUCCESS');
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const voteClicked = (vote) => {
    restPut(`${SERVER_PATH}api/games/vote`, { vote }).then(() => {
      console.log('SUCCESS');
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const nextClicked = () => {
    restPut(`${SERVER_PATH}api/games/next`, {}).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const exitGame = () => {
    restPut(`${SERVER_PATH}api/games/kick`, {}).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  if (gameState.isStarted && !gameState.isOver) {
    const ownTurn = gameInfo.playerId === gameState.currentPlayer;
    switch (gameState.state) {
      case 0:
        if (ownTurn) {
          return <Cards hand={gameState.hand}
                        withBtn={true}
                        header="Your turn!"
                        pickFunc={pickCard}
                  />;
        }
        return <Cards hand={gameState.hand}
                      withBtn={false}
                      header={`Waiting for ${getPlayerNameById(gameState.currentPlayer)}.`}
                      pickFunc={pickCard}
                />;
      case 1:
        if (ownTurn) {
          return <Cards hand={gameState.hand}
                        withBtn={false}
                        header={'Waiting for other players.'}
                        pickFunc={pickCard}
          />;
        }
        if (gameState.playersPicked.includes(gameInfo.playerId)) {
          return <Cards hand={gameState.hand}
                        withBtn={false}
                        header={'Waiting for other players.'}
                        pickFunc={pickCard}
          />;
        }
        return <Cards hand={gameState.hand}
                      withBtn={true}
                      header={`Pick a card to ${getPlayerNameById(gameState.currentPlayer)}'s sentence.`}
                      pickFunc={pickCard}
        />;
      case 2:
        if (ownTurn || gameState.playersVoted.includes(gameInfo.playerId)) {
          return (
            <React.Fragment>
              <p className="text-light text-center small-text p-0 my-2">Other players voting.</p>
              <div className="d-flex justify-content-center mt-4">
                {circles.map((circle, i) => (
                  <div key={i} className={`vote-circle-lg m-1 moving-circle rounded-circle mx-2 shadow${circle.active ? ' move-circle' : ''}`} style={{ backgroundColor: COLORS[circle.color] }}/>
                ))}
              </div>
            </React.Fragment>
          );
        }
        return (
          <React.Fragment>
            <p className="text-light text-center small-text p-0 mt-2">Voting</p>
            <div className="d-grid gap-2 mx-2 mt-2">
              {votes.map((vote) => (
                <button key={vote} onClick={() => voteClicked(vote)} className="btn btn-lg btn-outline-light btn-block" type="button">{vote}</button>
              ))}
            </div>
          </React.Fragment>
        );
      case 3:
        return (
          <React.Fragment>
            {gameInfo.players
              .find((player) => player.id === gameInfo.playerId && player.isAdmin) && (
              <div className="d-flex justify-content-center my-4">
                <button className="btn btn-outline-light" onClick={nextClicked}>Next</button>
              </div>
            )}
            <div className="d-flex justify-content-center my-4">
            <div className="card darkBg mx-4 shadow" style={{ width: '280px', maxWidth: '280px', minWidth: '280px' }}>
              <div className="card-body">
                <div className="d-flex justify-content-center mb-4 mt-2">
                  <img src={`${SERVER_PATH}coup.png`} alt="coup" style={{ maxWidth: '80px' }} />
                </div>
                {scores.map((score) => (
                  <div key={score.name} className="d-flex flex-row p-0 m-0 mr-2">
                    <div className="col-7 p-0 m-0">
                      <p className="text-light score-text nowrap" >{score.name}</p>
                    </div>
                    <div className="d-flex justify-content-start col-5 p-0 m-0 ml-2">
                      <p className="text-light score-text"><b>{score.score.total}</b></p>
                      {score.score.lastRound > 0 && (
                        <p className="text-light score-small-text ml-2">+{score.score.lastRound}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            </div>
          </React.Fragment>
        );
      default:
        return <h1>Error</h1>;
    }
  }
  if (gameState.isOver) {
    return (
      <React.Fragment>
        <p className="text-light text-center small-text p-0 mt-2">Game Over</p>
        <div className="d-flex justify-content-center my-4">
          <div className="card darkBg mx-4 shadow" style={{ width: '280px', maxWidth: '280px', minWidth: '280px' }}>
            <div className="card-body">
              <div className="d-flex justify-content-center mb-4 mt-2">
                <img src={`${SERVER_PATH}coup.png`} alt="coup" style={{ maxWidth: '80px' }} />
              </div>
              {scores.map((score) => (
                <div key={score.name} className="d-flex flex-row p-0 m-0 mr-2">
                  <div className="col-10 p-0 m-0">
                    <p className="text-light score-text nowrap" >{score.name}</p>
                  </div>
                  <div className="d-flex justify-content-start col-2 p-0 m-0 ml-2">
                    <p className="text-light score-text"><b>{score.score.total}</b></p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </React.Fragment>
    );
  }

  return (
    <React.Fragment>
      <p className="text-light text-center medium-text p-0 mt-4">Waiting to start</p>
      <div className="d-flex justify-content-center mt-4">
        <button onClick={exitGame} className="btn btn-lg btn-outline-danger">Exit</button>
      </div>
    </React.Fragment>
  );
};

const Cards = (input) => {
  const {
    withBtn, header, hand, pickFunc,
  } = input;
  return (
    <React.Fragment>
      <p className="text-light text-center small-text p-0 my-2">{header}</p>
      <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel" data-bs-interval={false}>
        <ol className="carousel-indicators">
          {hand.map((_, i) => (
            <CardIndicator key={i} index={i}/>
          ))}
        </ol>
        <div className="carousel-inner">
          {hand.map((card, i) => (
            <CardImage key={i} fileName={card.fileName} index={i} />
          ))}
        </div>
        <a className="carousel-control-prev" href="#carouselExampleIndicators" role="button" data-bs-slide="prev">
          <span className="carousel-control-prev-icon" aria-hidden="true" />
          <span className="sr-only">Previous</span>
        </a>
        <a className="carousel-control-next" href="#carouselExampleIndicators" role="button" data-bs-slide="next">
          <span className="carousel-control-next-icon" aria-hidden="true" />
          <span className="sr-only">Next</span>
        </a>
        {withBtn && <a id="btn_pick" className="pick" onClick={pickFunc}>Pick this card</a>}
      </div>
    </React.Fragment>
  );
};

const CardImage = (input) => {
  const { fileName, index } = input;
  const classes = classNames({
    'carousel-item': true,
    active: index === 0,
  });
  return (
    <div className={classes}>
      <img src={`${SERVER_PATH}cards/${fileName}`} className="d-block w-100" alt={fileName} />
    </div>
  );
};

const CardIndicator = (input) => {
  const { index } = input;
  return (
    <React.Fragment>
      {index === 0 ? (
        <li data-bs-target="#carouselExampleIndicators" className="active" data-bs-slide-to={index} />
      ) : (
        <li data-bs-target="#carouselExampleIndicators" data-bs-slide-to={index} />
      )}
    </React.Fragment>
  );
};

export default Game;
