
import React, { useState } from 'react';
import { MatchmakingResults, Torneo, Cuerda, Pelea, Gallo, PesoUnit } from '../types';
import EditLeftoverGalloModal from './ConflictModal';
import { PencilIcon, WarningIcon } from './Icons';

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
interface MatchmakingScreenProps {
    results: MatchmakingResults;
    torneo: Torneo;
    cuerdas: Cuerda[];
    onStartTournament: () => void;
    onBack: () => void;
    onCreateManualFight: (roosterAId: string, roosterBId: string) => void;
    onUpdateGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
}

const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({ results, torneo, cuerdas, onStartTournament, onBack, onCreateManualFight, onUpdateGallo, onDeleteCuerda }) => {
    
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
    };

    const handleDeleteCuerdaClick = (cuerdaId: string) => {
        onDeleteCuerda(cuerdaId);
    };


    const handlePrint = () => {
        document.body.classList.add('printing-cartelera');
        window.print();
        document.body.classList.remove('printing-cartelera');
    };

    const renderPelea = (pelea: Pelea, index: number) => (
        <div key={pelea.id} className="bg-gray-700/50 rounded-lg p-3 flex items-center justify-between text-sm fight-card">
            <div className="w-1/12 text-center text-gray-400 font-bold">{index + 1}</div>
            <div className="w-5/12 text-right pr-2">
                <p className="font-bold text-white">{pelea.roosterA.color}</p>
                <p className="text-xs text-gray-400">{getCuerdaName(pelea.roosterA.cuerdaId)}</p>
                 <p className="text-xs font-mono">{formatWeight(pelea.roosterA, torneo.weightUnit)} / {pelea.roosterA.ageMonths || 'N/A'}m / {pelea.roosterA.tipoGallo}</p>
                <p className="text-xs text-gray-500 font-mono">A:{pelea.roosterA.ringId} M:{pelea.roosterA.markingId}</p>
            </div>
            <div className="w-1/12 text-center text-red-500 font-extrabold">VS</div>
            <div className="w-5/12 text-left pl-2">
                <p className="font-bold text-white">{pelea.roosterB.color}</p>
                <p className="text-xs text-gray-400">{getCuerdaName(pelea.roosterB.cuerdaId)}</p>
                 <p className="text-xs font-mono">{formatWeight(pelea.roosterB, torneo.weightUnit)} / {pelea.roosterB.ageMonths || 'N/A'}m / {pelea.roosterB.tipoGallo}</p>
                <p className="text-xs text-gray-500 font-mono">A:{pelea.roosterB.ringId} M:{pelea.roosterB.markingId}</p>
            </div>
        </div>
    );
    
    const totalRoostersForIndividualRound = results.unpairedRoosters.length + (results.individualFights.length * 2);

    return (
        <div className="space-y-6 print-target">
            <div className="text-center">
                <h2 className="text-3xl font-bold text-white">Cartelera de Peleas</h2>
                <p className="text-gray-400 mt-2">Este es el resultado del cotejo. Revisa las peleas y comienza el torneo.</p>
            </div>
            
            <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4">
                <h3 className="text-xl font-bold text-amber-400 mb-3">Estadísticas del Cotejo</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 text-center">
                    {torneo.rondas.enabled && (
                        <>
                           <div className="bg-gray-700/50 p-3 rounded-lg">
                               <p className="text-2xl font-bold text-white">{results.stats.contribution}</p>
                               <p className="text-sm text-gray-400">Gallos por equipo</p>
                           </div>
                           <div className="bg-gray-700/50 p-3 rounded-lg">
                               <p className="text-2xl font-bold text-white">{results.individualFights.length}</p>
                               <p className="text-sm text-gray-400">Peleas Individuales</p>
                           </div>
                        </>
                    )}
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.mainFights.length}</p>
                        <p className="text-sm text-gray-400">Peleas por Rondas</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.stats.mainTournamentRoostersCount}</p>
                        <p className="text-sm text-gray-400">Gallos aptos</p>
                    </div>
                    <div className="bg-gray-700/50 p-3 rounded-lg">
                        <p className="text-2xl font-bold text-white">{results.unpairedRoosters.length}</p>
                        <p className="text-sm text-gray-400">Gallos sin Pelea</p>
                    </div>
                </div>
            </div>

            <div className="space-y-4 printable-card">
                <h3 className="text-xl font-bold text-amber-400">Peleas por Rondas</h3>
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
                    <h3 className="text-xl font-bold text-amber-400 mb-4">Cotejo Manual de Sobrantes</h3>
                    
                    {results.individualFights.length > 0 && (
                        <div className="space-y-2 mb-6 printable-card">
                            <h4 className="text-amber-400 mb-2 text-base">Peleas Individuales Creadas:</h4>
                            {results.individualFights.map((pelea, index) => renderPelea(pelea, results.mainFights.length + index))}
                        </div>
                    )}

                    {results.unpairedRoosters.length > 0 && (
                        <div>
                             <h4 className="text-amber-400 mb-2 text-base">Gallos esperando cotejo:</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {results.unpairedRoosters.map(gallo => {
                                    const isSelected = selectedRoosters.includes(gallo.id);
                                    let isDisabled = false;
                                    const selectedGallo = selectedRoosters.length === 1 ? results.unpairedRoosters.find(g => g.id === selectedRoosters[0]) : null;

                                    if (selectedRoosters.length >= 2 && !isSelected) {
                                        isDisabled = true;
                                    } else if (selectedGallo && (selectedGallo.cuerdaId === gallo.cuerdaId || selectedGallo.tipoGallo !== gallo.tipoGallo || selectedGallo.tipoEdad !== gallo.tipoEdad) && !isSelected) {
                                        isDisabled = true;
                                    }
                                    
                                    const weightInGrams = convertToGrams(gallo.weight, gallo.weightUnit);
                                    const isUnderWeight = weightInGrams < torneo.minWeight;
                                    const isOverWeight = weightInGrams > torneo.maxWeight;


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
                                                <p className="font-bold text-white truncate">{gallo.color} <span className="text-xs text-gray-400 font-normal">({gallo.ringId})</span></p>
                                                <p className="text-sm text-gray-300 truncate">{getCuerdaName(gallo.cuerdaId)}</p>
                                                {isUnderWeight && <span className="text-xs font-bold text-yellow-400 block">Peso Bajo</span>}
                                                {isOverWeight && <span className="text-xs font-bold text-red-400 block">Peso Alto</span>}
                                            </div>
                                            <div className="text-right flex-shrink-0 ml-2 flex items-center">
                                                <div>
                                                    <p className="font-mono text-sm">{formatWeight(gallo, torneo.weightUnit)}</p>
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


            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 pt-4">
                <button onClick={onBack} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto">Volver a Configuración</button>
                <button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto">Imprimir PDF</button>
                <button onClick={onStartTournament} disabled={results.mainFights.length === 0 && results.individualFights.length === 0} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg w-full sm:w-auto disabled:bg-gray-500 disabled:cursor-not-allowed">
                    Iniciar Torneo en Vivo
                </button>
            </div>

            {editingGallo && (
                 <EditLeftoverGalloModal
                    isOpen={isEditModalOpen}
                    onClose={() => setEditModalOpen(false)}
                    gallo={editingGallo}
                    cuerdas={cuerdas}
                    globalWeightUnit={torneo.weightUnit}
                    onUpdate={handleUpdateGalloClick}
                    onDeleteCuerda={handleDeleteCuerdaClick}
                />
            )}
        </div>
    );
};

export default MatchmakingScreen;
