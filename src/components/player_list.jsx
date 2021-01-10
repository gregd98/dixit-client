import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { COLORS } from '../constants';

const PlayerList = () => {
  const gameInfo = useSelector((state) => state.game.game);
  const gameState = useSelector((state) => state.game.state);
  const [maxUserCardWidth, setMaxUserCardWidth] = useState(0);

  useEffect(() => {
    const setSizes = () => {
      const n = gameInfo.players.length;
      if (n > 0) {
        const w = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
        setMaxUserCardWidth((w - n * 16) / n);
      }
    };
    setSizes();
    window.addEventListener('resize', setSizes);
    return () => {
      window.removeEventListener('resize', setSizes);
    };
  }, [gameInfo.players.length]);

  return (
    <div style={{ height: '60px', maxHeight: '60px' }} className="d-flex justify-content-center flex-wrap">
      {gameInfo.players.map((player) => (
        <div key={player.id} className={`d-flex flex-row my-2 mx-1 px-1 card shadow darkBg${player.id === gameState.currentPlayer ? ' border-warning' : ''}`} style={{ maxWidth: `${maxUserCardWidth}px` }}>
          <div className="vote-circle-lg m-1 rounded-circle my-auto" style={{ backgroundColor: COLORS[player.color] }}/>
          <p className="text-light my-auto mx-1 user-name nowrap">{player.name}</p>
        </div>
      ))}
    </div>
  );
};

export default PlayerList;
