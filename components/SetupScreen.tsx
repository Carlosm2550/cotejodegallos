import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Cuerda, Gallo, Torneo } from '../types';
import { SettingsIcon, RoosterIcon, UsersIcon, PlusIcon, TrashIcon, PencilIcon, PlayIcon, WarningIcon, RepeatIcon, TrophyIcon } from './Icons';
import Modal from './Modal';
import { CuerdaFormData } from '../App';
import GalloFormModal, { LbsOzInput, InputField } from './GalloFormModal';


// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => {
    return Math.round((lbs * OUNCES_PER_POUND) + oz);
};
// Fix: Corrected typo in function parameter name from totalOunences to totalOunces.
const formatWeightLbsOz = (totalOunces: number, withUnit = false): string => {
    const total = Math.round(totalOunces);
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    const unit = withUnit ? ' Lb.Oz' : '';
    return `${lbs}.${String(oz).padStart(2, '0')}${unit}`;
};

// --- VALIDATION CONSTANTS & FUNCTIONS ---
const MIN_TOURNAMENT_WEIGHT = fromLbsOz(2, 10);
const MAX_TOURNAMENT_WEIGHT = fromLbsOz(5, 0);


// --- HELPER & UI COMPONENTS ---
interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  buttonText?: string;
  onButtonClick?: () => void;
  children: React.ReactNode;
  className?: string;
}
const SectionCard: React.FC<SectionCardProps> = ({ icon, title, buttonText, onButtonClick, children, className }) => (
  <div className={`bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6 ${className}`}>
    <div className="flex justify-between items-center mb-4">
      <div className="flex items-center space-x-3">
        <div className="text-amber-400 w-6 h-6">{icon}</div>
        <h3 className="text-lg sm:text-xl font-bold text-white">{title}</h3>
      </div>
      {buttonText && onButtonClick && (
        <button
          onClick={onButtonClick}
          className="flex items-center space-x-2 bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-3 sm:px-4 rounded-lg transition-colors text-sm sm:text-base"
        >
          <PlusIcon className="w-5 h-5" />
          <span>{buttonText}</span>
        </button>
      )}
    </div>
    <div>{children}</div>
  </div>
);


const CuerdaFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSave: (cuerda: CuerdaFormData, id: string | null) => void; 
    cuerda: Cuerda | null;
    cuerdas: Cuerda[]; 
}> = ({ isOpen, onClose, onSave, cuerda, cuerdas }) => {
    const [name, setName] = useState('');
    const [owner, setOwner] = useState('');
    const [frontCount, setFrontCount] = useState(1);
    const isAdding = !cuerda;

    useEffect(() => {
        if (isOpen) {
            if (cuerda) { // Editing
                const baseName = cuerda.name.replace(/\s\(F\d+\)$/, '');
                setName(baseName);
                setOwner(cuerda.owner || '');
                const relatedCuerdas = cuerdas.filter(c => c.name.startsWith(baseName + " (F"));
                setFrontCount(relatedCuerdas.length || 1);
            } else { // Adding
                setName('');
                setOwner('');
                setFrontCount(1);
            }
        }
    }, [isOpen, cuerda, cuerdas]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, owner, frontCount }, cuerda?.id || null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isAdding ? 'Añadir Cuerda' : 'Editar Cuerda'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Nombre de la Cuerda" value={name} onChange={e => setName(e.target.value)} required />
                <InputField label="Dueño" value={owner} onChange={e => setOwner(e.target.value)} required />
                <InputField type="number" label={isAdding ? '¿Cuantos frentes deseas inscribir?' : 'Número total de Frentes'} value={frontCount} onChange={e => setFrontCount(Math.max(1, parseInt(e.target.value) || 1))} required min="1"/>
                
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

const PrintablePlanilla: React.FC<{ torneo: Torneo }> = ({ torneo }) => (
    <div id="printable-planilla" className="p-8 space-y-6 bg-white text-black text-lg">
        <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-4xl font-bold">{torneo.name}</h1>
            <p className="text-2xl mt-2">{torneo.tournamentManager ? `Responsable: ${torneo.tournamentManager}` : ''}</p>
            <p className="text-xl mt-1">{torneo.date}</p>
        </div>
        <div className="space-y-8 pt-4">
            {[
                "Nombre del Criadero:", "Dueño de los gallos:", "Frente:", "ID del Anillo (A):", "Número de Placa Marcaje (Pm):", "Placa del Criadero (Pc):", "Color del Gallo:",
                "Peso:", "Edad (meses):", "Tipo (Pollo/Gallo):", "Fenotipo (Liso/Pava):"
            ].map(label => (
                <div key={label} className="flex items-center space-x-4">
                    <label className="font-bold w-1/3">{label}</label>
                    <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
                </div>
            ))}
        </div>
    </div>
);

const TournamentRulesForm: React.FC<{
    torneo: Torneo;
    cuerdas: Cuerda[];
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    onPrintPlanilla: () => void;
}> = React.memo(({ torneo, cuerdas, onUpdateTorneo, onPrintPlanilla }) => {
    
    const [exceptionCuerda1, setExceptionCuerda1] = useState('');
    const [exceptionCuerda2, setExceptionCuerda2] = useState('');

    const handleUpdate = (field: keyof Torneo, value: any) => {
        let newTorneoData = { ...torneo, [field]: value };

        if (field === 'minWeight') {
            const clampedValue = Math.max(MIN_TOURNAMENT_WEIGHT, value);
            newTorneoData.minWeight = clampedValue > newTorneoData.maxWeight ? newTorneoData.maxWeight : clampedValue;
        }
        if (field === 'maxWeight') {
             const clampedValue = Math.min(MAX_TOURNAMENT_WEIGHT, value);
             newTorneoData.maxWeight = clampedValue < newTorneoData.minWeight ? newTorneoData.minWeight : clampedValue;
        }

        onUpdateTorneo(newTorneoData);
    };
    
    const handleAddException = () => {
        if (exceptionCuerda1 && exceptionCuerda2 && exceptionCuerda1 !== exceptionCuerda2) {
            const newException = { cuerda1Id: exceptionCuerda1, cuerda2Id: exceptionCuerda2 };
            const newExceptions = [...torneo.exceptions, newException];
            onUpdateTorneo({ ...torneo, exceptions: newExceptions });
            setExceptionCuerda1('');
            setExceptionCuerda2('');
        }
    };

    const handleRemoveException = (index: number) => {
        const newExceptions = torneo.exceptions.filter((_, i) => i !== index);
        onUpdateTorneo({ ...torneo, exceptions: newExceptions });
    };

    const baseCuerdas = useMemo(() =>
        cuerdas.filter(c => !c.baseCuerdaId)
            .map(c => ({ id: c.id, name: c.name.replace(/\s\(F\d+\)$/, '') }))
            .sort((a, b) => a.name.localeCompare(b.name)),
        [cuerdas]
    );

    const getBaseCuerdaNameById = (id: string) => baseCuerdas.find(bc => bc.id === id)?.name || 'Desconocido';
    
    return (
        <div className="space-y-4">
            <h4 className="text-md font-semibold text-amber-300">Información del Torneo</h4>
            <InputField label="Nombre del Torneo" value={torneo.name} onChange={e => handleUpdate('name', e.target.value)} />
            <InputField label="Responsable del Torneo" value={torneo.tournamentManager || ''} onChange={e => handleUpdate('tournamentManager', e.target.value)} />
            <InputField type="date" label="Fecha" value={torneo.date} onChange={e => handleUpdate('date', e.target.value)} />
            <div className="pt-2">
                <button onClick={onPrintPlanilla} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Imprimir Planilla de Ingreso
                </button>
            </div>
            
           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Tolerancias</h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LbsOzInput 
                label="Tolerancia de Peso (± Onza)" 
                value={torneo.weightTolerance} 
                onChange={v => handleUpdate('weightTolerance', v)} 
              />
              <InputField type="number" label="Tolerancia de Meses (±) (solo pollos)" value={torneo.ageToleranceMonths} onChange={e => handleUpdate('ageToleranceMonths', parseInt(e.target.value) || 0)} min="0"/>
           </div>
           
           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Pesos Permitidos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <LbsOzInput 
                    label="Mínimo (Lb.Oz)" 
                    value={torneo.minWeight} 
                    onChange={v => handleUpdate('minWeight', v)} 
                />
               <LbsOzInput 
                    label="Máximo (Lb.Oz)" 
                    value={torneo.maxWeight} 
                    onChange={v => handleUpdate('maxWeight', v)} 
                />
           </div>

           <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-md font-semibold text-amber-300">Reglas del Torneo por Frentes</h4>
                <div className="space-y-4 mt-2">
                    <InputField type="number" label="Gallos por Frente" value={torneo.roostersPerTeam} onChange={e => handleUpdate('roostersPerTeam', parseInt(e.target.value) || 0)} min="0"/>
                    <InputField type="number" label="Puntos por Victoria" value={torneo.pointsForWin} onChange={e => handleUpdate('pointsForWin', parseInt(e.target.value) || 0)} min="0"/>
                    <InputField type="number" label="Puntos por Empate" value={torneo.pointsForDraw} onChange={e => handleUpdate('pointsForDraw', parseInt(e.target.value) || 0)} min="0"/>
                
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Excepciones (Cuerdas que no pelean entre sí)</label>
                        <div className="space-y-2">
                           {torneo.exceptions.map((ex, index) => (
                                <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg text-sm">
                                    <span>{getBaseCuerdaNameById(ex.cuerda1Id)} vs {getBaseCuerdaNameById(ex.cuerda2Id)}</span>
                                    <button onClick={() => handleRemoveException(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                           ))}
                        </div>
                         <div className="flex items-center space-x-2 mt-2">
                            <select value={exceptionCuerda1} onChange={e => setExceptionCuerda1(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm">
                                <option value="">Seleccionar...</option>
                                {baseCuerdas.filter(c => c.id !== exceptionCuerda2).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                             <select value={exceptionCuerda2} onChange={e => setExceptionCuerda2(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-2 py-1 text-sm">
                                <option value="">Seleccionar...</option>
                                {baseCuerdas.filter(c => c.id !== exceptionCuerda1).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <button onClick={handleAddException} type="button" className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg"><PlusIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
});


// --- MAIN SCREEN COMPONENT ---
interface SetupScreenProps {
    cuerdas: Cuerda[]; 
    gallos: Gallo[]; 
    torneo: Torneo; 
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    onStartMatchmaking: () => void; 
    onSaveCuerda: (cuerdaData: CuerdaFormData, currentCuerdaId: string | null) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
    onSaveGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onAddBulkGallos: (gallosData: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    onDeleteGallo: (galloId: string) => void;
    isMatchmaking: boolean;
    onFullReset: () => void;
    isTournamentFinished: boolean;
    onGoToResults: () => void;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ cuerdas, gallos, torneo, onUpdateTorneo, onStartMatchmaking, onSaveCuerda, onDeleteCuerda, onSaveGallo, onAddBulkGallos, onDeleteGallo, isMatchmaking, onFullReset, isTournamentFinished, onGoToResults }) => {
    const [isCuerdaModalOpen, setCuerdaModalOpen] = useState(false);
    const [isGalloModalOpen, setGalloModalOpen] = useState(false);
    
    const [currentCuerda, setCurrentCuerda] = useState<Cuerda | null>(null);
    const [currentGallo, setCurrentGallo] = useState<Gallo | null>(null);

    const handleSaveCuerdaClick = (data: CuerdaFormData, currentCuerdaId: string | null) => {
        onSaveCuerda(data, currentCuerdaId);
        setCuerdaModalOpen(false);
    };

    const handleSaveSingleGallo = (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => {
        onSaveGallo(galloData, currentGalloId);
        setGalloModalOpen(false);
    };

    const handleSaveBulkGallos = (gallosData: Omit<Gallo, 'id' | 'tipoEdad'>[]) => {
        onAddBulkGallos(gallosData);
        setGalloModalOpen(false);
    }
    
    const handleOpenEditGalloModal = (gallo: Gallo) => {
        setCurrentGallo(gallo);
        setGalloModalOpen(true);
    };

    const handleOpenAddGalloModal = () => {
        if (cuerdas.filter(c=>!c.baseCuerdaId).length === 0) {
            alert('Debe crear una cuerda primero antes de añadir gallos.');
            return;
        }
        setCurrentGallo(null);
        setGalloModalOpen(true);
    };

    const handleCloseGalloModal = useCallback(() => {
        setGalloModalOpen(false);
        setCurrentGallo(null);
    }, []);

    const activeRoosterCount = useMemo(() => gallos.length, [gallos]);
    
    const gallosByCuerda = useMemo(() => {
        const grouped = new Map<string, Gallo[]>();
        gallos.forEach(gallo => {
            const list = grouped.get(gallo.cuerdaId) || [];
            list.push(gallo);
            grouped.set(gallo.cuerdaId, list);
        });
        return grouped;
    }, [gallos]);

    const handlePrintPlanilla = useCallback(() => {
        const printableContainer = document.querySelector('.printable-planilla-container');
        if (printableContainer) {
            document.body.classList.add('printing-planilla');
            window.print();
            document.body.classList.remove('printing-planilla');
        } else {
            console.error('Error al encontrar la planilla para imprimir.');
        }
    }, []);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 space-y-6">
                     <div className="bg-gray-800/50 rounded-2xl shadow-lg border border-gray-700 p-4 sm:p-6 relative">
                        <div className="flex justify-between items-center mb-4">
                            <div className="flex items-center space-x-3">
                                <div className="text-amber-400 w-6 h-6"><SettingsIcon /></div>
                                <h3 className="text-lg sm:text-xl font-bold text-white">Reglas Del Torneo</h3>
                            </div>
                            <button
                                onClick={onFullReset}
                                title="Reiniciar aplicación y borrar todos los datos"
                                className="text-gray-400 hover:text-red-500 transition-colors p-1"
                            >
                                <RepeatIcon className="w-5 h-5" />
                            </button>
                        </div>
                        <div>
                            <TournamentRulesForm
                                torneo={torneo}
                                cuerdas={cuerdas}
                                onUpdateTorneo={onUpdateTorneo}
                                onPrintPlanilla={handlePrintPlanilla}
                            />
                        </div>
                    </div>
                </div>
                
                <div className="lg:col-span-2 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                         <SectionCard 
                            icon={<UsersIcon />} 
                            title="Cuerdas" 
                            buttonText="Añadir Cuerda" 
                            onButtonClick={() => { setCurrentCuerda(null); setCuerdaModalOpen(true); }}
                        >
                            <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                                {cuerdas.length === 0 && <p className="text-gray-500 text-center py-4">No hay cuerdas registradas.</p>}
                                {[...cuerdas].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(cuerda => (
                                    <div key={cuerda.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg">
                                        <div>
                                            <p className="font-semibold text-white">{cuerda.name}</p>
                                            <p className="text-xs text-gray-400">{cuerda.owner}</p>
                                        </div>
                                        <div className="flex items-center space-x-1">
                                            <button onClick={() => { setCurrentCuerda(cuerda); setCuerdaModalOpen(true); }} className="p-1 text-gray-400 hover:text-amber-400"><PencilIcon className="w-5 h-5"/></button>
                                            <button onClick={() => onDeleteCuerda(cuerda.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </SectionCard>
                        <SectionCard 
                            icon={<RoosterIcon />} 
                            title="Gallos" 
                            buttonText="Añadir Gallo" 
                            onButtonClick={handleOpenAddGalloModal}
                        >
                           <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                               {gallos.length === 0 && <p className="text-gray-500 text-center py-4">No hay gallos registrados.</p>}
                               {[...cuerdas].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(cuerda => {
                                   const cuerdaGallos = gallosByCuerda.get(cuerda.id);
                                   if (!cuerdaGallos || cuerdaGallos.length === 0) return null;

                                   return (
                                       <div key={cuerda.id}>
                                           <h4 className="font-bold text-amber-400 mb-1 sticky top-0 bg-gray-800/80 backdrop-blur-sm py-1">{cuerda.name}</h4>
                                           <div className="space-y-2 pl-2 border-l-2 border-gray-700">
                                            {cuerdaGallos.map(gallo => {
                                                const isUnderWeight = gallo.weight < torneo.minWeight;
                                                const isOverWeight = gallo.weight > torneo.maxWeight;

                                                return (
                                                    <div key={gallo.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg">
                                                        <div>
                                                            <p className="font-semibold text-white flex items-center">{gallo.color} 
                                                            {(isUnderWeight || isOverWeight) && <WarningIcon title={isUnderWeight ? 'Peso por debajo del mínimo' : 'Peso por encima del máximo'} className="w-4 h-4 ml-2 text-yellow-400" />}
                                                            </p>
                                                            <p className="text-xs font-mono text-gray-500">{formatWeightLbsOz(gallo.weight, true)} / {gallo.ageMonths}m / {gallo.tipoEdad}</p>
                                                        </div>
                                                        <div className="flex items-center space-x-1">
                                                            <button onClick={() => handleOpenEditGalloModal(gallo)} className="p-1 text-gray-400 hover:text-amber-400"><PencilIcon className="w-5 h-5"/></button>
                                                            <button onClick={() => onDeleteGallo(gallo.id)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                           </div>
                                       </div>
                                   )
                               })}
                           </div>
                        </SectionCard>
                    </div>
                     <div className="pt-6 text-center">
                        {isTournamentFinished ? (
                            <button
                                onClick={onGoToResults}
                                className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg flex items-center justify-center mx-auto"
                            >
                                <TrophyIcon className="w-6 h-6 mr-2"/>
                                Clasificación General
                            </button>
                        ) : (
                            <button 
                                onClick={onStartMatchmaking} 
                                disabled={isMatchmaking || activeRoosterCount < 2}
                                className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                            >
                               {isMatchmaking ? (
                                    <>
                                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Cotejando...
                                    </>
                               ) : (
                                   <>
                                    <PlayIcon className="w-6 h-6 mr-2"/> Iniciar Baloteo
                                   </>
                               )}
                            </button>
                        )}
                        {!isTournamentFinished && activeRoosterCount < 2 && <p className="text-xs text-gray-500 mt-2">Se necesitan al menos 2 gallos para empezar.</p>}
                    </div>
                </div>
            </div>

            <CuerdaFormModal 
                isOpen={isCuerdaModalOpen} 
                onClose={() => setCuerdaModalOpen(false)} 
                onSave={handleSaveCuerdaClick} 
                cuerda={currentCuerda}
                cuerdas={cuerdas}
            />
            
            <GalloFormModal 
                isOpen={isGalloModalOpen} 
                onClose={handleCloseGalloModal} 
                onSaveSingle={handleSaveSingleGallo}
                onSaveBulk={handleSaveBulkGallos}
                gallo={currentGallo} 
                cuerdas={cuerdas}
                gallos={gallos}
                torneo={torneo}
                onDeleteGallo={onDeleteGallo}
                onEditGallo={handleOpenEditGalloModal}
            />
             <div className="printable-planilla-container">
                <PrintablePlanilla torneo={torneo} />
            </div>
        </div>
    );
};

export default SetupScreen;