

import React, { useMemo, useState } from 'react';
import { Pelea, Torneo, Cuerda, CuerdaStats, Gallo, SortConfig, SortKey, PesoUnit } from '../types';
import { ChevronUpIcon, ChevronDownIcon } from './Icons';


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
interface ResultsScreenProps { 
    peleas: Pelea[]; 
    torneo: Torneo;
    cuerdas: Cuerda[];
    onReset: () => void;
    tournamentPhase: 'individual' | 'finished';
    onStartIndividualFights: () => void;
    hasIndividualFights: boolean;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ peleas, torneo, cuerdas, onReset, tournamentPhase, onStartIndividualFights, hasIndividualFights }) => {
    
    const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'points', direction: 'desc' });
    const [expandedCuerdas, setExpandedCuerdas] = useState<string[]>([]);

    const toggleCuerdaExpansion = (cuerdaId: string) => {
        setExpandedCuerdas(prev => 
            prev.includes(cuerdaId) 
                ? prev.filter(id => id !== cuerdaId)
                : [...prev, cuerdaId]
        );
    };

    const stats: CuerdaStats[] = useMemo(() => {
        const statsMap: { [key: string]: Omit<CuerdaStats, 'cuerdaName' | 'cuerdaId' | 'fronts'> } = {};

        cuerdas.forEach(c => {
             statsMap[c.id] = {
                wins: 0,
                draws: 0,
                losses: 0,
                points: 0,
                totalDurationSeconds: 0,
            };
        });

        peleas.forEach(pelea => {
            if (!pelea.winner) return;

            const idA = pelea.roosterA.cuerdaId;
            const idB = pelea.roosterB.cuerdaId;
            const isRoundFight = torneo.rondas.enabled && pelea.isRoundFight;
            const duration = pelea.duration || 0;

            if (pelea.winner === 'A') {
                statsMap[idA].wins++;
                statsMap[idA].totalDurationSeconds += duration; // Only winner gets time
                if (isRoundFight) statsMap[idA].points += torneo.rondas.pointsForWin;
                statsMap[idB].losses++;

            } else if (pelea.winner === 'B') {
                statsMap[idB].wins++;
                statsMap[idB].totalDurationSeconds += duration; // Only winner gets time
                if (isRoundFight) statsMap[idB].points += torneo.rondas.pointsForWin;
                statsMap[idA].losses++;

            } else if (pelea.winner === 'DRAW') {
                // In a draw, neither participant is a "winner," so neither gets time.
                statsMap[idA].draws++;
                if (isRoundFight) statsMap[idA].points += torneo.rondas.pointsForDraw;
                
                statsMap[idB].draws++;
                if (isRoundFight) statsMap[idB].points += torneo.rondas.pointsForDraw;
            }
        });
        
        return cuerdas.map(c => {
            const frontMatch = c.name.match(/\(F(\d+)\)$/);
            const frontNumber = frontMatch ? parseInt(frontMatch[1], 10) : 1;
            return {
                cuerdaId: c.id,
                cuerdaName: c.name,
                fronts: frontNumber,
                ...statsMap[c.id],
            };
        }).filter(s => (s.wins + s.draws + s.losses) > 0);

    }, [peleas, cuerdas, torneo]);

    const sortedStats = useMemo(() => {
        let sortableItems = [...stats];
        if (sortConfig.key !== null) {
            sortableItems.sort((a, b) => {
                let comparison = 0;
                switch(sortConfig.key) {
                    case 'name':
                        comparison = a.cuerdaName.localeCompare(b.cuerdaName);
                        break;
                    case 'points':
                        comparison = b.points - a.points;
                        break;
                    case 'wins':
                        comparison = b.wins - a.wins;
                        break;
                    case 'time':
                        comparison = a.totalDurationSeconds - b.totalDurationSeconds;
                        break;
                }
                 // If primary sort is equal, use points as secondary sort criteria
                if (comparison === 0 && sortConfig.key !== 'points') {
                    comparison = b.points - a.points;
                }
                // If still equal, use wins as tertiary
                if (comparison === 0 && sortConfig.key !== 'wins') {
                    comparison = b.wins - a.wins;
                }

                return sortConfig.direction === 'asc' ? comparison : -comparison;
            });
        }
        return sortableItems;
    }, [stats, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc';
        // if clicking the same key, toggle direction
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        // default to ascending for name and time
        if (key === 'name') {
            if (sortConfig.key !== 'name' || sortConfig.direction === 'desc') direction = 'asc';
            else direction = 'desc';
        }
        if (key === 'time') {
            if (sortConfig.key !== 'time' || sortConfig.direction === 'desc') direction = 'asc';
            else direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: SortKey) => {
        if (sortConfig.key !== key) return null;
        if (sortConfig.direction === 'asc') return <ChevronUpIcon className="w-4 h-4 inline-block ml-1" />;
        return <ChevronDownIcon className="w-4 h-4 inline-block ml-1" />;
    };

    const formatTime = (totalSeconds: number) => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return { minutes, seconds };
    };

    const handlePrint = () => {
        document.body.classList.add('printing-results');
        setExpandedCuerdas(stats.map(s => s.cuerdaId)); // Expand all for printing
        
        setTimeout(() => {
            window.print();
            document.body.classList.remove('printing-results');
            setExpandedCuerdas([]); // Collapse back after printing
        }, 100);
    };

    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Clasificación General</h2>
                <p className="text-gray-400 mt-2">{torneo.name} - {torneo.date}</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6 print-target">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 print-hide">
                    <h3 className="text-xl font-bold text-amber-400">Tabla de Posiciones</h3>
                     <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mt-3 sm:mt-0">
                        Imprimir PDF
                    </button>
                </div>
                <p className="text-xs text-gray-400 mb-4 print-hide">
                    Haz clic en una fila para ver los detalles de los gallos. Todos los detalles se incluirán al imprimir.
                </p>

                 <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-300">
                        <thead className="text-xs text-amber-400 uppercase bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-center">#</th>
                                <th scope="col" className="px-6 py-3 cursor-pointer" onClick={() => requestSort('name')}>
                                    CUERDA {getSortIcon('name')}
                                </th>
                                <th scope="col" className="px-4 py-3 text-center">FRENTE</th>
                                <th scope="col" className="px-4 py-3 text-center cursor-pointer" onClick={() => requestSort('points')}>
                                    PUNTOS {getSortIcon('points')}
                                </th>
                                <th scope="col" className="px-3 py-3 text-center cursor-pointer" onClick={() => requestSort('wins')}>
                                    PG {getSortIcon('wins')}
                                </th>
                                <th scope="col" className="px-3 py-3 text-center">PE</th>
                                <th scope="col" className="px-3 py-3 text-center">PP</th>
                                <th scope="col" className="px-4 py-3 text-center cursor-pointer" colSpan={2} onClick={() => requestSort('time')}>
                                    TIEMPO {getSortIcon('time')}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                           {sortedStats.map((stat, index) => {
                               const { minutes, seconds } = formatTime(stat.totalDurationSeconds);
                               const isExpanded = expandedCuerdas.includes(stat.cuerdaId);
                               const teamFights = peleas.filter(p => p.roosterA.cuerdaId === stat.cuerdaId || p.roosterB.cuerdaId === stat.cuerdaId);
                               
                               return (
                                <React.Fragment key={stat.cuerdaId}>
                                   <tr className="border-b border-gray-700 hover:bg-gray-700/30 cursor-pointer" onClick={() => toggleCuerdaExpansion(stat.cuerdaId)}>
                                       <td className="px-4 py-3 font-bold text-center">{index + 1}</td>
                                       <td className="px-6 py-3 font-semibold text-white">{stat.cuerdaName}</td>
                                       <td className="px-4 py-3 text-center">{stat.fronts}</td>
                                       <td className="px-4 py-3 text-center font-bold text-white">{stat.points}</td>
                                       <td className="px-3 py-3 text-center text-green-400">{stat.wins}</td>
                                       <td className="px-3 py-3 text-center text-yellow-400">{stat.draws}</td>
                                       <td className="px-3 py-3 text-center text-red-400">{stat.losses}</td>
                                       <td className="px-2 py-3 text-right font-mono">{String(minutes).padStart(2, '0')}</td>
                                       <td className="px-2 py-3 text-left font-mono">: {String(seconds).padStart(2, '0')}</td>
                                   </tr>
                                   <tr className={`results-details-row ${isExpanded ? '' : 'hidden print:table-row'}`}>
                                      <td colSpan={9} className="p-4 results-details-cell bg-gray-700/10">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-amber-300">Detalles de Peleas para {stat.cuerdaName}:</h4>
                                            {teamFights.length > 0 ? teamFights.map(fight => {
                                                const thisTeamRooster = fight.roosterA.cuerdaId === stat.cuerdaId ? fight.roosterA : fight.roosterB;
                                                const opponentRooster = thisTeamRooster === fight.roosterA ? fight.roosterB : fight.roosterA;
                                                const fightTime = formatTime(fight.duration || 0);
                                                
                                                let result = 'Empate';
                                                if (fight.winner === 'A' && thisTeamRooster === fight.roosterA) result = 'Victoria';
                                                if (fight.winner === 'B' && thisTeamRooster === fight.roosterB) result = 'Victoria';
                                                if (fight.winner === 'A' && thisTeamRooster === fight.roosterB) result = 'Derrota';
                                                if (fight.winner === 'B' && thisTeamRooster === fight.roosterA) result = 'Derrota';

                                                return (
                                                     <div key={fight.id} className="text-xs grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-1 p-2 border-b border-gray-600 last:border-b-0">
                                                        <div><span className="font-semibold text-gray-400">Gallo:</span> <span className="font-normal">{thisTeamRooster.color}</span></div>
                                                        <div><span className="font-semibold text-gray-400">Oponente:</span> <span className="font-normal">{opponentRooster.color} ({getCuerdaName(opponentRooster.cuerdaId)})</span></div>
                                                        <div><span className="font-semibold text-gray-400">Resultado:</span> <span className={`font-bold ${result === 'Victoria' ? 'text-green-400' : result === 'Derrota' ? 'text-red-400' : 'text-yellow-400'}`}>{result}</span></div>
                                                        <div><span className="font-semibold text-gray-400">Tiempo:</span> <span className="font-normal">{fightTime.minutes}:{String(fightTime.seconds).padStart(2, '0')}</span></div>
                                                    </div>
                                                )
                                            }) : <p className="text-xs text-gray-500">No hay detalles de peleas para esta cuerda.</p>}
                                        </div>
                                      </td>
                                   </tr>
                                </React.Fragment>
                           )})}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="text-center mt-8 print-hide">
                 {tournamentPhase === 'individual' && hasIndividualFights ? (
                    <button onClick={onStartIndividualFights} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                        Iniciar Peleas Individuales
                    </button>
                 ) : (
                    <button onClick={onReset} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-3 px-8 rounded-lg text-lg">
                        Crear Nuevo Torneo
                    </button>
                 )}
            </div>
        </div>
    );
};

export default ResultsScreen;