
import React, { useState, useCallback, useEffect } from 'react';
import { 
  Trophy, 
  Gamepad2, 
  ChevronRight, 
  Dice5,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  Zap,
  RefreshCw,
  Home
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Cell {
  id: number;
  type: 'normal' | 'snake' | 'ladder';
  target?: number;
  message?: string;
}

const BOARD_SIZE = 100;
const GRID_SIZE = 10;

const SNAKES: Record<number, { target: number; message: string }> = {
  99: { target: 7, message: "Black Swan Event! Massive market correction hits your portfolio." },
  87: { target: 24, message: "No Health Insurance! A medical emergency drains your life savings." },
  62: { target: 19, message: "Debt Trap! Using credit cards for luxury items wipes out your gains." },
  54: { target: 34, message: "Bad Real Estate Bet! Illiquid asset causes a major cash flow crisis." },
  46: { target: 25, message: "Tax Non-compliance! Heavy penalties and interest from the IT department." },
  31: { target: 9, message: "Lifestyle Inflation! Your expenses grew faster than your income." }
};

const LADDERS: Record<number, { target: number; message: string }> = {
  2: { target: 38, message: "Power of Compounding! Started a SIP in your early 20s." },
  15: { target: 44, message: "Strategic Asset Allocation! Rebalancing saved you during volatility." },
  22: { target: 58, message: "Tax Efficient Planning! Maximized 80C, 80D, and NPS deductions." },
  51: { target: 91, message: "Legacy Planning! A well-structured HUF optimized your family's tax." },
  71: { target: 94, message: "Smart Diversification! International equity provided the perfect hedge." },
  40: { target: 68, message: "Emergency Fund! A job loss didn't affect your long-term goals." }
};

interface SnakeAndLadderGameProps {
  onBack: () => void;
}

const SnakeAndLadderGame: React.FC<SnakeAndLadderGameProps> = ({ onBack }) => {
  const [playerPosition, setPlayerPosition] = useState(0);
  const [diceRoll, setDiceRoll] = useState(0);
  const [isRolling, setIsRolling] = useState(false);
  const [message, setMessage] = useState("Roll the dice to start your wealth journey!");
  const [isGameOver, setIsGameOver] = useState(false);
  const [moveHistory, setMoveHistory] = useState<{from: number, to: number, type: 'move' | 'snake' | 'ladder', msg: string}[]>([]);

  const rollDice = useCallback(() => {
    if (isRolling || isGameOver) return;

    setIsRolling(true);
    // Dramatic dice roll animation
    const finalValue = Math.floor(Math.random() * 6) + 1;
    
    setTimeout(() => {
      setDiceRoll(finalValue);
      setIsRolling(false);
      movePlayer(finalValue);
    }, 600);
  }, [isRolling, isGameOver, playerPosition]);

  const movePlayer = (steps: number) => {
    let nextPos = playerPosition + steps;
    
    if (nextPos > BOARD_SIZE) {
      setMessage(`You need exactly ${BOARD_SIZE - playerPosition} to win!`);
      return;
    }

    if (nextPos === BOARD_SIZE) {
      setPlayerPosition(BOARD_SIZE);
      setIsGameOver(true);
      setMessage("CONGRATULATIONS! You have achieved Financial Independence!");
      setMoveHistory(prev => [{ from: playerPosition, to: BOARD_SIZE, type: 'move', msg: "Wealth Legacy Secured!" }, ...prev]);
      return;
    }

    setPlayerPosition(nextPos);
    
    // Check for snakes or ladders
    setTimeout(() => {
      if (SNAKES[nextPos]) {
        const snake = SNAKES[nextPos];
        setMoveHistory(prev => [{ from: nextPos, to: snake.target, type: 'snake', msg: snake.message }, ...prev]);
        setPlayerPosition(snake.target);
        setMessage(snake.message);
      } else if (LADDERS[nextPos]) {
        const ladder = LADDERS[nextPos];
        setMoveHistory(prev => [{ from: nextPos, to: ladder.target, type: 'ladder', msg: ladder.message }, ...prev]);
        setPlayerPosition(ladder.target);
        setMessage(ladder.message);
      } else {
        setMessage(`Moved to cell ${nextPos}. Keep going!`);
      }
    }, 500);
  };

  const resetGame = () => {
    setPlayerPosition(0);
    setDiceRoll(0);
    setIsGameOver(false);
    setMessage("Roll the dice to start your wealth journey!");
    setMoveHistory([]);
  };

  const getCellCoordinates = (pos: number) => {
    if (pos === 0) return { x: -40, y: 0 }; // Outside board
    const zeroBased = pos - 1;
    let row = Math.floor(zeroBased / 10);
    let col = zeroBased % 10;
    
    // Serpent layout (boustrophedon)
    if (row % 2 !== 0) {
      col = 9 - col;
    }
    
    return {
      x: col * 10,
      y: (9 - row) * 10
    };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-2"
        >
          <ChevronRight className="rotate-180" size={16} />
          Exit Game
        </button>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Position</p>
            <p className="text-xl font-black text-slate-900">{playerPosition} / 100</p>
          </div>
          <div className="h-10 w-px bg-slate-200" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-wealth-navy flex items-center justify-center text-wealth-gold shadow-lg shadow-slate-200">
              <Dice5 size={24} className={isRolling ? 'animate-spin' : ''} />
            </div>
            <button
              onClick={rollDice}
              disabled={isRolling || isGameOver}
              className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all ${
                isGameOver 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-wealth-gold text-wealth-navy hover:scale-105 active:scale-95 shadow-md shadow-amber-200'
              }`}
            >
              {isRolling ? 'Rolling...' : isGameOver ? 'Goal Reached' : 'Roll Dice'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Game Board */}
        <div className="lg:col-span-8 premium-card p-4 relative aspect-square bg-white border-2 border-slate-100 overflow-hidden">
          <div className="absolute inset-0 grid grid-cols-10 grid-rows-10">
            {Array.from({ length: 100 }, (_, i) => {
              const cellNum = 100 - i;
              // Calculate correct number for boustrophedon
              const row = Math.floor(i / 10);
              const col = i % 10;
              const actualCellNum = (9 - row) * 10 + (row % 2 === 0 ? 10 - col : col + 1);
              
              const isSnake = SNAKES[actualCellNum];
              const isLadder = LADDERS[actualCellNum];

              return (
                <div 
                  key={actualCellNum} 
                  className={`border-[0.5px] border-slate-50 flex flex-col items-center justify-center relative ${
                    (Math.floor((actualCellNum-1)/10) + ((actualCellNum-1)%10)) % 2 === 0 ? 'bg-slate-50/30' : 'bg-white'
                  }`}
                >
                  <span className="text-[8px] font-bold text-slate-300 absolute top-1 left-1">{actualCellNum}</span>
                  {isSnake && (
                    <div className="text-rose-400 opacity-40">
                      <TrendingDown size={24} />
                    </div>
                  )}
                  {isLadder && (
                    <div className="text-emerald-400 opacity-40">
                      <TrendingUp size={24} />
                    </div>
                  )}
                  {actualCellNum === 100 && (
                    <Trophy className="text-wealth-gold animate-bounce" size={24} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Visual Indicators for Snakes and Ladders (Simplified as Lines for now) */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
            {Object.entries(SNAKES).map(([start, { target }]) => {
              const s = getCellCoordinates(parseInt(start));
              const t = getCellCoordinates(target);
              return (
                <line 
                  key={`snake-${start}`}
                  x1={`${s.x + 5}%`} y1={`${s.y + 5}%`}
                  x2={`${t.x + 5}%`} y2={`${t.y + 5}%`}
                  stroke="#ef4444" strokeWidth="4" strokeLinecap="round"
                  strokeDasharray="8 4"
                />
              );
            })}
            {Object.entries(LADDERS).map(([start, { target }]) => {
              const s = getCellCoordinates(parseInt(start));
              const t = getCellCoordinates(target);
              return (
                <line 
                  key={`ladder-${start}`}
                  x1={`${s.x + 5}%`} y1={`${s.y + 5}%`}
                  x2={`${t.x + 5}%`} y2={`${t.y + 5}%`}
                  stroke="#10b981" strokeWidth="4" strokeLinecap="round"
                />
              );
            })}
          </svg>

          {/* Player Token */}
          <motion.div
            className="absolute w-[8%] h-[8%] bg-wealth-navy rounded-full border-4 border-wealth-gold shadow-lg z-10 flex items-center justify-center text-white font-bold text-[10px]"
            animate={getCellCoordinates(playerPosition)}
            initial={getCellCoordinates(0)}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ 
              left: '1%', 
              top: '1%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            YOU
          </motion.div>
        </div>

        {/* Game Info & History */}
        <div className="lg:col-span-4 space-y-6">
          <div className="premium-card p-6 space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Insights & Guidance</h3>
            <AnimatePresence mode="wait">
              <motion.div
                key={message}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 rounded-2xl border text-sm font-bold leading-relaxed ${
                  SNAKES[playerPosition] ? 'bg-rose-50 border-rose-100 text-rose-800' :
                  LADDERS[playerPosition] ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                  isGameOver ? 'bg-wealth-gold/10 border-wealth-gold/20 text-wealth-navy' :
                  'bg-slate-50 border-slate-100 text-slate-600'
                }`}
              >
                {message}
              </motion.div>
            </AnimatePresence>
            
            <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
              <AlertTriangle className="text-amber-600 shrink-0" size={16} />
              <p className="text-[10px] text-amber-800 font-medium italic">
                Red lines (Snakes) represent financial setbacks. Green lines (Ladders) represent smart wealth decisions.
              </p>
            </div>
            
            {diceRoll > 0 && !isRolling && (
              <div className="text-center py-4">
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-2">You Rolled</p>
                <div className="text-4xl font-black text-wealth-navy">{diceRoll}</div>
              </div>
            )}
            
            {isGameOver && (
              <button
                onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 py-4 bg-wealth-navy text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
              >
                <RefreshCw size={16} />
                Restart Journey
              </button>
            )}
          </div>

          <div className="premium-card p-6 flex flex-col h-[400px]">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Milestone History</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {moveHistory.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale p-8">
                  <RefreshCw className="mb-4 animate-spin-slow" size={32} />
                  <p className="text-xs font-bold uppercase tracking-widest">No history yet.<br/>Start rolling!</p>
                </div>
              ) : (
                moveHistory.map((entry, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={idx} 
                    className={`p-3 rounded-xl border ${
                      entry.type === 'snake' ? 'bg-rose-50 border-rose-100' : 
                      entry.type === 'ladder' ? 'bg-emerald-50 border-emerald-100' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        {entry.type === 'snake' && <TrendingDown size={14} className="text-rose-600" />}
                        {entry.type === 'ladder' && <TrendingUp size={14} className="text-emerald-600" />}
                        {entry.type === 'move' && <Zap size={14} className="text-amber-500" />}
                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                          entry.type === 'snake' ? 'text-rose-600' : 
                          entry.type === 'ladder' ? 'text-emerald-600' : 'text-slate-600'
                        }`}>
                          {entry.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400">{entry.from} → {entry.to}</span>
                    </div>
                    <p className="text-[10px] leading-tight text-slate-700 font-medium">{entry.msg}</p>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SnakeAndLadderGame;
