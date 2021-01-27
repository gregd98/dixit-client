import React, { useState, useEffect } from 'react';
import socketIOClient from 'socket.io-client';
import { useDispatch, useSelector } from 'react-redux';
import { resetGame, updatePlayers, updateState } from '../actions/gameActions';
import { COLORS, SERVER_PATH } from '../constants';
import { restDelete, restPut } from '../utils/communication';

const Game = () => {
  const gameInfo = useSelector((state) => state.game.game);
  const gameState = useSelector((state) => state.game.state);
  const [socket, setSocket] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [votes, setVotes] = useState([]);
  const [scores, setScores] = useState([]);
  const [circles, setCircles] = useState([]);
  const dispatch = useDispatch();

  const [pageDisabled, setPageDisabled] = useState(false);

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
      socket.on('game deleted', () => {
        dispatch(resetGame());
      });
    }
  }, [dispatch, socket]);

  useEffect(() => {
    if (!gameInfo.players.find((player) => player.id === gameInfo.playerId)) {
      dispatch(resetGame());
    }
  }, [gameInfo.players, gameInfo.playerId, dispatch]);

  useEffect(() => {
    if (gameState && gameState.state === 2 && gameState.ownCardIndex) {
      const v = [];
      const n = gameInfo.players.length !== 3 ? gameInfo.players.length : 5;
      for (let i = 1; i <= n; i += 1) {
        if (gameInfo.players.length === 3 || gameInfo.players.length >= 7) {
          if (!gameState.ownCardIndex.includes(i)) {
            v.push(i);
          }
        } else if (i !== gameState.ownCardIndex) {
          v.push(i);
        }
      }
      setVotes(v);
    }
  }, [gameInfo.players.length, gameState]);

  useEffect(() => {
    if (gameState && (gameState.state === 3 || gameState.isOver)) {
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
    window.$(document).on('slid.bs.carousel', '#carouselExampleIndicators', (e) => {
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
          active: (() => {
            if (gameInfo.players.length < 7) {
              return gameState.playersVoted.includes(player.id);
            }
            const playersVote = gameState.playersVoted.find((vote) => vote.playerId === player.id);
            return !!(playersVote && playersVote.done);
          })(),
        })));
        break;
      default: break;
    }
  }, [gameInfo.players, gameState]);

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

  useEffect(() => {
    let xDown = null;
    let yDown = null;
    const getTouches = (e) => e.touches || e.originalEvent.touches;

    const handleTouchStart = (e) => {
      const firstTouch = getTouches(e)[0];
      xDown = firstTouch.clientX;
      yDown = firstTouch.clientY;
    };

    const handleTouchMove = (e) => {
      if (xDown && yDown) {
        const xUp = e.touches[0].clientX;
        const yUp = e.touches[0].clientY;
        const xDiff = xDown - xUp;
        const yDiff = yDown - yUp;
        if (Math.abs(xDiff) > Math.abs(yDiff)) {
          if (xDiff > 0) {
            window.$('#carouselExampleIndicators').carousel('next');
          } else {
            window.$('#carouselExampleIndicators').carousel('prev');
          }
        }
        xDown = null;
        yDown = null;
      }
    };
    if (gameState.isStarted) {
      document.addEventListener('touchstart', handleTouchStart, false);
      document.addEventListener('touchmove', handleTouchMove, false);
    }
    return () => {
      document.removeEventListener('touchstart', handleTouchStart, false);
      document.removeEventListener('touchmove', handleTouchMove, false);
    };
  }, [gameState.isStarted]);

  const pickCard = () => {
    setPageDisabled(true);
    restPut(`${SERVER_PATH}api/games/pick`, { pickedCard: gameState.hand[selectedIndex].id }).then((payload) => {
      dispatch(updateState(payload));
      setPageDisabled(false);
    }).catch((error) => {
      setPageDisabled(false);
      console.log(`Error: ${error.message}`);
    });
  };

  const voteClicked = (vote) => {
    setPageDisabled(true);
    restPut(`${SERVER_PATH}api/games/vote`, { vote }).then((payload) => {
      dispatch(updateState(payload));
      setPageDisabled(false);
    }).catch((error) => {
      setPageDisabled(false);
      console.log(`Error: ${error.message}`);
    });
  };

  const voteDone = () => {
    setPageDisabled(true);
    restPut(`${SERVER_PATH}api/games/vote`, { vote: 'done' }).then((payload) => {
      dispatch(updateState(payload));
      setPageDisabled(false);
    }).catch((error) => {
      setPageDisabled(false);
      console.log(`Error: ${error.message}`);
    });
  };

  const nextClicked = () => {
    setPageDisabled(true);
    restPut(`${SERVER_PATH}api/games/next`, {}).then((payload) => {
      dispatch(updateState(payload));
      setPageDisabled(false);
    }).catch((error) => {
      setPageDisabled(false);
      console.log(`Error: ${error.message}`);
    });
  };

  const exitGame = () => {
    restPut(`${SERVER_PATH}api/games/kick`, {}).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const returnToLobby = () => {
    restPut(`${SERVER_PATH}api/games/reset`, {}).then((payload) => {
      dispatch(updateState(payload));
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const terminateGame = () => {
    restDelete(`${SERVER_PATH}api/games`).then(() => {
      dispatch(resetGame());
    }).catch((error) => {
      console.log(`Error: ${error.message}`);
    });
  };

  const isSecondVote = () => {
    if (gameState.state === 2) {
      if (gameInfo.players.length >= 7) {
        const playersVote = gameState.playersVoted
          .find((vote) => vote.playerId === gameInfo.playerId);
        return playersVote && !playersVote.done;
      }
    }
    return false;
  };

  const renderVoteCircles = () => (
      <React.Fragment>
        <p className="text-light text-center small-text p-0 my-2">Other players voting.</p>
        <div className="d-flex justify-content-center mt-4">
          {circles.map((circle, i) => (
            <div key={i} className={`vote-circle-lg m-1 moving-circle rounded-circle mx-2 shadow${circle.active ? ' move-circle' : ''}`} style={{ backgroundColor: COLORS[circle.color] }}/>
          ))}
        </div>
      </React.Fragment>
  );

  const renderVotes = () => (
    <React.Fragment>
      <p className="text-light text-center small-text p-0 mt-2">Voting</p>
      <div className="d-grid gap-2 mx-2 mt-2">
        {votes.map((vote) => (
          <button key={vote} onClick={() => voteClicked(vote)} className="btn btn-lg btn-outline-light btn-block" type="button" disabled={pageDisabled}>{vote}</button>
        ))}
        {isSecondVote() && (
          <button onClick={voteDone} className="btn btn-lg btn-outline-light btn-block mt-4" disabled={pageDisabled}>Done</button>
        )}
      </div>
    </React.Fragment>
  );

  const renderCardIndicator = (index) => (
      <React.Fragment key={index}>
        {index === selectedIndex ? (
          <li data-bs-target="#carouselExampleIndicators" className="active" data-bs-slide-to={index} />
        ) : (
          <li data-bs-target="#carouselExampleIndicators" data-bs-slide-to={index} />
        )}
      </React.Fragment>
  );

  const renderCardImage = (fileName, index) => (
    <div className={`carousel-item${index === selectedIndex ? ' active' : ''}`} key={index}>
      <img src={`${SERVER_PATH}cards/${fileName}`} className="d-block w-100" alt={fileName} />
    </div>
  );

  const renderCards = (withBtn, header) => (
      <React.Fragment>
        <p className="text-light text-center small-text p-0 my-2">{header}</p>
        <div id="carouselExampleIndicators" className="carousel slide" data-bs-ride="carousel" data-bs-interval={false} data-bs-touch={false}>
          <ol className="carousel-indicators">
            {gameState.hand.map((_, i) => renderCardIndicator(i))}
          </ol>
          <div className="carousel-inner">
            {gameState.hand.map((card, i) => renderCardImage(card.fileName, i))}
          </div>
          <a className="carousel-control-prev" href="#carouselExampleIndicators" role="button" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"/><span className="sr-only">Previous</span>
          </a>
          <a className="carousel-control-next" href="#carouselExampleIndicators" role="button" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"/><span className="sr-only">Next</span>
          </a>
          {withBtn && <button id="btn_pick" className="pick" onClick={pickCard} disabled={pageDisabled}>Pick this card</button>}
        </div>
      </React.Fragment>
  );

  if (gameState.isStarted && !gameState.isOver) {
    const ownTurn = gameInfo.playerId === gameState.currentPlayer;
    switch (gameState.state) {
      case 0:
        if (ownTurn) {
          return renderCards(true, 'Your turn!');
        }
        return renderCards(false, `Waiting for ${getPlayerNameById(gameState.currentPlayer)}.`);
      case 1:
        if (ownTurn) {
          return renderCards(false, 'Waiting for other players.');
        }
        if (gameInfo.players.length !== 3) {
          if (gameState.playersPicked.includes(gameInfo.playerId)) {
            return renderCards(false, 'Waiting for other players.');
          }
        } else {
          const playersPick = gameState.playersPicked
            .find((item) => item.playerId === gameInfo.playerId);
          if (playersPick) {
            if (playersPick.both) {
              return renderCards(false, 'Waiting for other players.');
            }
            return renderCards(true, `Pick another card to ${getPlayerNameById(gameState.currentPlayer)}'s sentence.`);
          }
        }
        return renderCards(true, `Pick a card to ${getPlayerNameById(gameState.currentPlayer)}'s sentence.`);
      case 2:
        if (gameInfo.players.length >= 7) {
          const playersVote = gameState.playersVoted
            .find((vote) => vote.playerId === gameInfo.playerId);
          if (ownTurn || (playersVote && playersVote.done)) {
            return renderVoteCircles();
          }
        } else if (ownTurn || gameState.playersVoted.includes(gameInfo.playerId)) {
          return renderVoteCircles();
        }
        return renderVotes();
      case 3:
        return (
          <React.Fragment>
            {gameInfo.players
              .find((player) => player.id === gameInfo.playerId && player.isAdmin) && (
                <div className="mx-2 mt-4">
                  <button className="btn btn-block btn-lg btn-outline-light" onClick={nextClicked} disabled={pageDisabled}>
                    Next
                  </button>
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
        {gameInfo.players
          .find((player) => player.id === gameInfo.playerId && player.isAdmin) && (
          <div className="mx-2 mt-4">
            <button className="btn btn-block btn-lg btn-outline-light" onClick={returnToLobby} disabled={pageDisabled}>
              Return to lobby
            </button>
            <button className="btn btn-block btn-lg btn-outline-danger" onClick={terminateGame} disabled={pageDisabled}>
              Exit
            </button>
          </div>
        )}
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

export default Game;
