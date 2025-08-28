import React, { useMemo, useState } from 'react';
import { Pelea, Torneo, Cuerda, CuerdaStats, Gallo, SortConfig, SortKey } from '../types';
import { ChevronUpIcon, ChevronDownIcon } from './Icons';


// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;

const toLbsOz = (totalOunces: number) => {
    if (isNaN(totalOunces) || totalOunces < 0) return { lbs: 0, oz: 0 };
    const lbs = Math.floor(totalOunces / OUNCES_PER_POUND);
    const oz = totalOunces % OUNCES_PER_POUND;
    return { lbs, oz };
};

const formatWeightLbsOz = (totalOunces: number): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    return `${lbs}.${String(oz).padStart(2, '0')} Lb.Oz`;
};


// --- SCREEN ---
interface ResultsScreenProps { 
    peleas: Pelea[]; 
    torneo: Torneo;
    cuerdas: Cuerda[];
    onReset: () => void;
    onBack: () => void;
    tournamentPhase: 'individual' | 'finished';
    onStartIndividualFights: () => void;
    hasIndividualFights: boolean;
}

const ResultsScreen: React.FC<ResultsScreenProps> = ({ peleas, torneo, cuerdas, onReset, onBack, tournamentPhase, onStartIndividualFights, hasIndividualFights }) => {
    
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
        const statsMap: { [key: string]: Omit<CuerdaStats, 'cuerdaName' | 'cuerdaId' | 'fronts' | 'points'> } = {};

        cuerdas.forEach(c => {
             statsMap[c.id] = {
                wins: 0,
                draws: 0,
                losses: 0,
                totalDurationSeconds: 0,
            };
        });

        peleas.forEach(pelea => {
            if (!pelea.winner) return;

            const idA = pelea.roosterA.cuerdaId;
            const idB = pelea.roosterB.cuerdaId;
            const duration = pelea.duration || 0;

            if (pelea.winner === 'A') {
                statsMap[idA].wins++;
                statsMap[idA].totalDurationSeconds += duration;
                statsMap[idB].losses++;

            } else if (pelea.winner === 'B') {
                statsMap[idB].wins++;
                statsMap[idB].totalDurationSeconds += duration;
                statsMap[idA].losses++;

            } else if (pelea.winner === 'DRAW') {
                statsMap[idA].draws++;
                statsMap[idB].draws++;
            }
        });
        
        return cuerdas.map(c => {
            const frontMatch = c.name.match(/\(F(\d+)\)$/);
            const frontNumber = frontMatch ? parseInt(frontMatch[1], 10) : 1;
            const cuerdaStats = statsMap[c.id];
            const points = (cuerdaStats.wins * torneo.pointsForWin) + (cuerdaStats.draws * torneo.pointsForDraw);

            return {
                cuerdaId: c.id,
                cuerdaName: c.name,
                fronts: frontNumber,
                ...cuerdaStats,
                points,
            };
        }).filter(s => (s.wins + s.draws + s.losses) > 0);

    }, [peleas, cuerdas, torneo]);

    const sortedStats = useMemo(() => {
        const { key, direction } = sortConfig;
        const sortableItems = [...stats];

        sortableItems.sort((a, b) => {
            // Main comparison logic based on the clicked header
            let comparison = 0;
            switch (key) {
                case 'name':
                    comparison = a.cuerdaName.localeCompare(b.cuerdaName);
                    break;
                case 'wins':
                    comparison = a.wins - b.wins;
                    break;
                case 'time':
                    comparison = a.totalDurationSeconds - b.totalDurationSeconds;
                    break;
                case 'points':
                default:
                    comparison = a.points - b.points;
                    break;
            }

            // Apply direction for the primary sort key
            if (comparison !== 0) {
                return direction === 'asc' ? comparison : -comparison;
            }

            // If the primary sort is a tie, apply the fixed tie-breaking rules.
            // Rule 1: More points is better.
            if (a.points !== b.points) {
                return b.points - a.points;
            }

            // Rule 2: Less time is better.
            if (a.totalDurationSeconds !== b.totalDurationSeconds) {
                return a.totalDurationSeconds - b.totalDurationSeconds;
            }
            
            return 0; // Truly equal
        });

        return sortableItems;
    }, [stats, sortConfig]);

    const requestSort = (key: SortKey) => {
        let direction: 'asc' | 'desc' = 'desc';
        if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = 'asc';
        }
        if (key === 'name' || key === 'time') {
            if (sortConfig.key !== key || sortConfig.direction === 'desc') direction = 'asc';
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
                                <th scope="col" className="px-3 py-3 text-center cursor-pointer" onClick={() => requestSort('points')}>
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
                                       <td className="px-3 py-3 text-center font-bold text-white">{stat.points}</td>
                                       <td className="px-3 py-3 text-center text-green-400 font-bold">{stat.wins}</td>
                                       <td className="px-3 py-3 text-center text-yellow-400">{stat.draws}</td>
                                       <td className="px-3 py-3 text-center text-red-400">{stat.losses}</td>
                                       <td className="px-2 py-3 text-right font-mono">{String(minutes).padStart(2, '0')}</td>
                                       <td className="px-2 py-3 text-left font-mono">: {String(seconds).padStart(2, '0')}</td>
                                   </tr>
                                   <tr className={`results-details-row ${isExpanded ? '' : 'hidden print:table-row'}`}>
                                      <td colSpan={8} className="p-4 results-details-cell bg-gray-700/10">
                                        <div className="space-y-2">
                                            <h4 className="font-bold text-amber-300">Detalles de Peleas para {stat.cuerdaName}:</h4>
                                            {teamFights.length > 0 ? teamFights.map(fight => {
                                                const thisTeamRooster = fight.roosterA.cuerdaId === stat.cuerdaId ? fight.roosterA : fight.roosterB;
                                                const opponentRooster = thisTeamRooster === fight.roosterA ? fight.roosterB : fight.roosterA;
                                                const fightTime = formatTime(fight.duration || 0);
                                                
                                                let result = 'Empate';
                                                if ((fight.winner === 'A' && thisTeamRooster === fight.roosterA) || (fight.winner === 'B' && thisTeamRooster === fight.roosterB)) {
                                                    result = 'Victoria';
                                                } else if (fight.winner !== 'DRAW') {
                                                    result = 'Derrota';
                                                }

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

            <div className="flex justify-center items-center space-x-4 mt-8 print-hide">
                 <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-8 rounded-lg text-lg">Atrás</button>
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