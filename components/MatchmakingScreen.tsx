

import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo } from '../types';
import GalloFormModal from './GalloFormModal';
import { PencilIcon } from './Icons';

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
interface MatchmakingScreenProps {
    results: MatchmakingResults;
    torneo: Torneo;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    onStartTournament: () => void;
    onBack: () => void;
    onCreateManualFight: (roosterAId: string, roosterBId: string) => void;
    onUpdateGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    isTournamentInProgress: boolean;
    onResumeTournament: () => void;
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ results, torneo, cuerdas, gallos, onStartTournament, onBack, onCreateManualFight, onUpdateGallo, isTournamentInProgress, onResumeTournament }) => {
    
    const [selectedRoosters, setSelectedRoosters] = useState<string[]>([]);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [editingGallo, setEditingGallo] = useState<Gallo | null>(null);
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    const handleSelectRooster = (roosterId: string) => {
        setSelectedRoosters(prev => {
            if (prev.includes(roosterId)) {
                return prev.filter(id => id !== roosterId);
            }
            if (prev.length < 2) {
                return [...prev, roosterId];
            }
            return prev;
        });
    };

    const handleCreateManualFightClick = () => {
        if (selectedRoosters.length === 2) {
            onCreateManualFight(selectedRoosters[0], selectedRoosters[1]);
            setSelectedRoosters([]);
        }
    };
    
    const handleOpenEditModal = (gallo: Gallo) => {
        setEditingGallo(gallo);
        setEditModalOpen(true);
    };

    const handleUpdateGalloClick = (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => {
        onUpdateGallo(galloData, currentGalloId);
        setEditModalOpen(false); // Close modal on save
    };
    
    const handlePrint = () => {
        document.body.classList.add('printing-cartelera');
        window.print();
        document.body.classList.remove('printing-cartelera');
    };

    const renderPelea = (pelea: Pelea, index: number) => (
        <div key={pelea.id} className="bg-gray-700/50 rounded-lg p-6 flex items-center justify-between fight-card">
            <div className="w-1/12 text-center text-gray-400 font-bold text-3xl">{index + 1}</div>
            
            {/* Rooster A */}
            <div className="w-5/12 text-right pr-4 space-y-2">
                <p className="font-bold text-4xl text-amber-400 truncate">{getCuerdaName(pelea.roosterA.cuerdaId)}</p>
                <p className="font-semibold text-white text-2xl">{pelea.roosterA.color}</p>
                <p className="text-lg font-mono text-gray-300">{formatWeightLbsOz(pelea.roosterA.weight)} / {pelea.roosterA.ageMonths || 'N/A'}m / {pelea.roosterA.tipoGallo}</p>
                <p className="text-base text-gray-500 font-mono">A:{pelea.roosterA.ringId} M:{pelea.roosterA.markingId}</p>
            </div>

            <div className="w-1/12 text-center text-red-500 font-extrabold text-5xl">VS</div>
            
            {/* Rooster B */}
            <div className="w-5/12 text-left pl-4 space-y-2">
                <p className="font-bold text-4xl text-amber-400 truncate">{getCuerdaName(pelea.roosterB.cuerdaId)}</p>
                <p className="font-semibold text-white text-2xl">{pelea.roosterB.color}</p>
                <p className="text-lg font-mono text-gray-300">{formatWeightLbsOz(pelea.roosterB.weight)} / {pelea.roosterB.ageMonths || 'N/A'}m / {pelea.roosterB.tipoGallo}</p>
                <p className="text-base text-gray-500 font-mono">A:{pelea.roosterB.ringId} M:{pelea.roosterB.markingId}</p>
            </div>
        </div>
    );
    
    const totalRoostersForIndividualRound = results.unpairedRoosters.length + (results.individualFights.length * 2);
    const totalFights = results.mainFights.length;

    return (
        <div className="space-y-6 print-target">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Cartelera de Peleas</h2>
                <p className="text-gray-400 mt-2">Este es el resultado del cotejo. Revisa las peleas y comienza el torneo.</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4">
                <h3 className="text-xl font-bold text-amber-400 mb-3">Estadísticas de la Contienda</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 text-center">
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{totalFights}</p>
                        <p className="text-sm text-gray-400">Peleas Principales</p>
                    </div>
                     <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.individualFights.length}</p>
                        <p className="text-sm text-gray-400">Peleas Individuales</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.stats.mainTournamentRoostersCount}</p>
                        <p className="text-sm text-gray-400">Gallos Aptos</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.unpairedRoosters.length}</p>
                        <p className="text-sm text-gray-400">Gallos sin Pelea</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 printable-card">
                <h3 className="text-xl font-bold text-amber-400">Peleas Principales</h3>
                {results.mainFights.length > 0 ? (
                    <div className="space-y-2">
                        {results.mainFights.map(renderPelea)}
                    </div>
                ) : (
                    <p className="text-center text-gray-400 py-6">No se generaron peleas para el torneo principal.</p>
                )}
            </div>

            {totalRoostersForIndividualRound > 0 && (
                <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 mt-8">
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Contiendas Manuales</h3>
                    
                    {results.individualFights.length > 0 && (
                        <div className="space-y-2 mb-6 printable-card">
                            <h4 className="text-amber-400 mb-2 text-base">Peleas Individuales Creadas:</h4>
                            {results.individualFights.map((pelea, index) => renderPelea(pelea, results.mainFights.length + index))}
                        </div>
                    )}

                    {results.unpairedRoosters.length > 0 && (
                        <div>
                             <h4 className="text-amber-400 mb-2 text-base">Gallos Esperando Contienda</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.unpairedRoosters.map(gallo => {
                                    const isSelected = selectedRoosters.includes(gallo.id);
                                    let isDisabled = false;
                                    const selectedGallo = selectedRoosters.length === 1 ? results.unpairedRoosters.find(g => g.id === selectedRoosters[0]) : null;

                                    if (selectedRoosters.length >= 2 && !isSelected) {
                                        isDisabled = true;
                                    } else if (selectedGallo && !isSelected) {
                                        const cuerdaOfSelected = cuerdas.find(c => c.id === selectedGallo.cuerdaId);
                                        const cuerdaOfCurrent = cuerdas.find(c => c.id === gallo.cuerdaId);

                                        const baseIdOfSelected = cuerdaOfSelected?.baseCuerdaId || cuerdaOfSelected?.id;
                                        const baseIdOfCurrent = cuerdaOfCurrent?.baseCuerdaId || cuerdaOfCurrent?.id;
                                        
                                        if (baseIdOfSelected && baseIdOfSelected === baseIdOfCurrent) {
                                            isDisabled = true;
                                        }
                                    }
                                    
                                    const isUnderWeight = gallo.weight < torneo.minWeight;
                                    const isOverWeight = gallo.weight > torneo.maxWeight;


                                    return (
                                        <div 
                                            key={gallo.id} 
                                            onClick={() => !isDisabled && handleSelectRooster(gallo.id)}
                                            className={`flex items-center p-3 rounded-lg border-2 transition-all duration-200 ${isSelected ? 'bg-amber-900/50 border-amber-500 shadow-md' : 'bg-gray-700/50 border-gray-600'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-amber-600'}`}
                                        >
                                            <input 
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={isDisabled}
                                                readOnly
                                                className="w-5 h-5 rounded text-amber-600 bg-gray-900 border-gray-500 focus:ring-amber-500 focus:ring-offset-gray-800"
                                            />
                                            <div className="ml-3 flex-grow overflow-hidden">
                                                <p className="font-bold text-amber-400 truncate">{getCuerdaName(gallo.cuerdaId)}</p>
                                                <p className="text-white truncate">{gallo.color} <span className="text-xs text-gray-400 font-normal">({gallo.ringId})</span></p>
                                                {isUnderWeight && <span className="text-xs font-bold text-yellow-400 block">Peso Bajo</span>}
                                                {isOverWeight && <span className="text-xs font-bold text-red-400 block">Peso Alto</span>}
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2 flex items-center">
                                                <div>
                                                    <p className="font-mono text-sm">{formatWeightLbsOz(gallo.weight)}</p>
                                                    <p className="font-mono text-xs text-gray-400">{gallo.ageMonths}m / {gallo.tipoGallo}</p>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleOpenEditModal(gallo);
                                                    }}
                                                    className="text-gray-400 hover:text-amber-400 transition-colors p-1 ml-1"
                                                    aria-label={`Editar ${gallo.color}`}
                                                >
                                                    <PencilIcon className="w-5 h-5"/>
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedRoosters.length === 2 && (
                                <div className="mt-4 text-center">
                                    <button onClick={handleCreateManualFightClick} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-all transform hover:scale-105 shadow-lg">
                                        Crear Pelea Seleccionada
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                    
                    {totalRoostersForIndividualRound > 0 && results.unpairedRoosters.length === 0 && results.individualFights.length > 0 && (
                        <p className="text-gray-400 text-center py-4">Todos los gallos sobrantes han sido emparejados.</p>
                    )}

                    {totalRoostersForIndividualRound === 0 && (
                        <p className="text-center text-gray-400 py-6">No hay gallos sobrantes.</p>
                    )}
                </div>
            )}
            <div className="flex justify-between items-center mt-8 print-hide">
                <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-6 rounded-lg">Atrás</button>
                <div>
                     <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg mr-4">
                        Imprimir PDF
                    </button>
                    {isTournamentInProgress ? (
                        <button onClick={onResumeTournament} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                            Volver a la Contienda
                        </button>
                    ) : (
                        <button onClick={onStartTournament} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg">
                            Comenzar Torneo
                        </button>
                    )}
                </div>
            </div>
            
            {isEditModalOpen && (
                <GalloFormModal 
                    isOpen={isEditModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    onSaveSingle={handleUpdateGalloClick}
                    onSaveBulk={() => {}} // Not used in this context
                    gallo={editingGallo}
                    cuerdas={cuerdas}
                    gallos={gallos}
                    torneo={torneo}
                />
            )}
        </div>
    );
};

export default MatchmakingScreen;