
import React, { useState, useEffect } from 'react';
import { Pelea, Torneo, Cuerda, Gallo, PesoUnit } from '../types';
import { PlayIcon, PauseIcon, RepeatIcon } from './Icons';


// --- UTILITY FUNCTIONS ---
const getWeightUnitAbbr = (unit: PesoUnit): string => {
    switch (unit) {
        case PesoUnit.GRAMS: return 'g';
        case PesoUnit.OUNCES: return 'oz';
        case PesoUnit.POUNDS: return 'lb';
        default: return unit;
    }
};

const convertToGrams = (weight: number, unit: PesoUnit): number => {
    switch (unit) {
        case PesoUnit.POUNDS: return weight * 453.592;
        case PesoUnit.OUNCES: return weight * 28.3495;
        case PesoUnit.GRAMS:
        default: return weight;
    }
};

const formatWeight = (gallo: Gallo, globalUnit: PesoUnit): string => {
    const unitAbbr = getWeightUnitAbbr(globalUnit);
    const grams = convertToGrams(gallo.weight, gallo.weightUnit);
    let displayWeight: string;

    switch (globalUnit) {
        case PesoUnit.POUNDS:
            displayWeight = (grams / 453.592).toFixed(3);
            break;
        case PesoUnit.OUNCES:
            displayWeight = (grams / 28.3495).toFixed(2);
            break;
        case PesoUnit.GRAMS:
        default:
            displayWeight = grams.toFixed(0);
            break;
    }
    return `${displayWeight} ${unitAbbr}`;
};


// --- SCREEN ---
interface LiveFightScreenProps {
  peleas: Pelea[];
  onFinishFight: (fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => void;
  onFinishTournament: () => void;
}

const LiveFightScreen: React.FC<LiveFightScreenProps> = ({ peleas, onFinishFight, onFinishTournament }) => {
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const [currentFightIndex, setCurrentFightIndex] = useState(0);
  const currentFight = peleas[currentFightIndex];
  
  const [cuerdas, setCuerdas] = useState<Cuerda[]>([]);
  const [torneo, setTorneo] = useState<Torneo|null>(null);

  useEffect(() => {
    const savedCuerdas = localStorage.getItem('galleraPro_cuerdas');
    const savedTorneo = localStorage.getItem('galleraPro_torneo');
    if (savedCuerdas) setCuerdas(JSON.parse(savedCuerdas));
    if (savedTorneo) setTorneo(JSON.parse(savedTorneo));
  }, []);

  useEffect(() => {
    // Reset timer for new fight
    setMinutes(0);
    setSeconds(0);
  }, [currentFightIndex]);


  const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

  const handleFinishFight = (winner: 'A' | 'B' | 'DRAW') => {
    if (!currentFight) return;
    const duration = (minutes * 60) + seconds;
    onFinishFight(currentFight.id, winner, duration);
    
    // Move to next fight or finish
    if (currentFightIndex < peleas.length - 1) {
        setCurrentFightIndex(currentFightIndex + 1);
    } else {
        onFinishTournament();
    }
  };
  
  // This should not be rendered if peleas is empty, parent component handles this.
  // But as a safeguard:
  if (!currentFight || !torneo) {
    return (
        <div className="text-center">
             <h2 className="text-3xl font-bold text-white">Cargando siguiente pelea...</h2>
        </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-white">Pelea #{currentFight.fightNumber}</h2>
        <p className="text-gray-400 mt-1">Pelea {currentFightIndex + 1} de {peleas.length} en esta fase</p>
      </div>

      <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Rooster A */}
            <div className="text-center md:text-right">
                 <h3 className="text-2xl font-bold text-white">{currentFight.roosterA.color}</h3>
                 <p className="text-amber-400">{getCuerdaName(currentFight.roosterA.cuerdaId)}</p>
                 <p className="text-gray-400">{formatWeight(currentFight.roosterA, torneo.weightUnit)} / {currentFight.roosterA.ageMonths}m</p>
            </div>

            {/* Manual Time Input */}
            <div className="text-center space-y-4">
                <p className="text-lg font-semibold text-gray-300">Duración de la Pelea</p>
                <div className="flex justify-center items-center space-x-2">
                    <input 
                        type="number" 
                        value={minutes}
                        onChange={(e) => setMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-20 bg-gray-700 border border-gray-600 text-white text-3xl font-mono text-center rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                     <span className="text-3xl font-mono text-white">:</span>
                    <input 
                        type="number" 
                        value={seconds}
                        onChange={(e) => setSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                        className="w-20 bg-gray-700 border border-gray-600 text-white text-3xl font-mono text-center rounded-lg p-2 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                </div>
                <div className="flex justify-center space-x-8 text-xs text-gray-400">
                    <span>MIN</span>
                    <span>SEG</span>
                </div>
            </div>

            {/* Rooster B */}
            <div className="text-center md:text-left">
                 <h3 className="text-2xl font-bold text-white">{currentFight.roosterB.color}</h3>
                 <p className="text-amber-400">{getCuerdaName(currentFight.roosterB.cuerdaId)}</p>
                 <p className="text-gray-400">{formatWeight(currentFight.roosterB, torneo.weightUnit)} / {currentFight.roosterB.ageMonths}m</p>
            </div>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-700 flex flex-col sm:flex-row justify-center items-center gap-4">
           <button onClick={() => handleFinishFight('A')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto">Gana {currentFight.roosterA.color}</button>
           <button onClick={() => handleFinishFight('DRAW')} className="bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto">Empate</button>
           <button onClick={() => handleFinishFight('B')} className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto">Gana {currentFight.roosterB.color}</button>
        </div>
      </div>
       <div className="text-center print-hide">
            <button onClick={onFinishTournament} className="text-gray-400 hover:text-white underline">Terminar Torneo Anticipadamente</button>
        </div>
    </div>
  );
};

export default LiveFightScreen;