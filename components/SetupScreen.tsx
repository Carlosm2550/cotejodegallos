



import React, { useState, useMemo, useEffect } from 'react';
import { Cuerda, Gallo, Torneo, Notification, PesoUnit } from '../types';
import { SettingsIcon, RoosterIcon, UsersIcon, PlusIcon, TrashIcon, PencilIcon, XIcon, PlayIcon } from './Icons';
import Modal from './Modal';

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


// --- HELPER & UI COMPONENTS ---
interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, type, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <div className="relative">
        <input
          id={inputId}
          type={type}
          {...props}
          className={`w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600 disabled:opacity-70`}
        />
      </div>
    </div>
  );
};

interface ToggleSwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
}
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ id, checked, onChange }) => (
  <label htmlFor={id} className="inline-flex items-center cursor-pointer">
    <span className="relative">
      <input type="checkbox" id={id} className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="w-11 h-6 bg-gray-600 rounded-full peer peer-focus:ring-2 peer-focus:ring-amber-500 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
    </span>
  </label>
);

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

const ExceptionsManager: React.FC<{ cuerdas: Cuerda[]; exceptions: string[][]; onUpdateExceptions: (exceptions: string[][]) => void; showNotification: (message: string, type: Notification['type']) => void; }> = ({ cuerdas, exceptions, onUpdateExceptions, showNotification }) => {
    const [cuerda1, setCuerda1] = useState('');
    const [cuerda2, setCuerda2] = useState('');
    
    const baseCuerdas = useMemo(() => cuerdas.filter(c => !c.baseCuerdaId), [cuerdas]);

    const handleAddException = () => {
        if (cuerda1 && cuerda2 && cuerda1 !== cuerda2) {
            const newException = [cuerda1, cuerda2].sort();
            if (!exceptions.some(ex => ex[0] === newException[0] && ex[1] === newException[1])) {
                onUpdateExceptions([...exceptions, newException]);
            }
            setCuerda1('');
            setCuerda2('');
        }
    };
    
    const handleRemoveException = (index: number) => {
        onUpdateExceptions(exceptions.filter((_, i) => i !== index));
        showNotification('Excepción eliminada.', 'success');
    };
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <div className="flex-1 w-full">
                    <label className="text-xs text-gray-400">Cuerda 1</label>
                    <select value={cuerda1} onChange={e => setCuerda1(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        <option value="">Seleccionar...</option>
                        {baseCuerdas.filter(p => p.id !== cuerda2).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="flex-1 w-full">
                    <label className="text-xs text-gray-400">Cuerda 2</label>
                    <select value={cuerda2} onChange={e => setCuerda2(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        <option value="">Seleccionar...</option>
                        {baseCuerdas.filter(p => p.id !== cuerda1).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <button onClick={handleAddException} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold p-2 rounded-lg transition-colors disabled:bg-gray-600 w-full sm:w-auto">
                    <PlusIcon className="w-5 h-5 mx-auto" />
                </button>
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {exceptions.length === 0 && <p className="text-gray-500 text-center text-sm py-2">No hay excepciones.</p>}
                {exceptions.map((pair, index) => (
                    <div key={index} className="flex justify-between items-center bg-gray-700/50 p-2 rounded-lg">
                        <span className="text-sm">{getCuerdaName(pair[0])} <XIcon className="w-4 h-4 inline-block mx-2 text-red-500" /> {getCuerdaName(pair[1])}</span>
                        <button onClick={() => handleRemoveException(index)} className="text-gray-400 hover:text-red-500 p-1">
                            <TrashIcon className="w-4 h-4"/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
const CuerdaFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (cuerda: Omit<Cuerda, 'id' | 'baseCuerdaId'>, id: string | null) => void; cuerda: Cuerda | null; baseCuerdas: Cuerda[] }> = ({ isOpen, onClose, onSave, cuerda, baseCuerdas }) => {
    const [name, setName] = useState('');
    const [owner, setOwner] = useState('');
    const [mode, setMode] = useState<'new' | 'front'>('new');
    const [selectedBaseCuerdaId, setSelectedBaseCuerdaId] = useState<string>('');
    const isAdding = !cuerda;

    useEffect(() => {
        if (isOpen) {
            setName(cuerda?.name || '');
            setOwner(cuerda?.owner || '');
            if (isAdding) {
                setMode('new');
                setSelectedBaseCuerdaId(baseCuerdas[0]?.id || '');
            }
        }
    }, [isOpen, cuerda, isAdding, baseCuerdas]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isAdding) {
            if (mode === 'front') {
                if (selectedBaseCuerdaId) {
                    onSave({ name: `__FRONT__${selectedBaseCuerdaId}`, owner: '' }, null);
                }
            } else {
                onSave({ name, owner }, null);
            }
        } else {
            onSave({ name, owner }, cuerda.id);
        }
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isAdding ? 'Añadir Cuerda o Frente' : 'Editar Cuerda'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                {isAdding && (
                    <div>
                        <fieldset className="flex gap-4">
                            <legend className="sr-only">Tipo de adición</legend>
                            <div className="flex items-center">
                                <input id="mode-new" type="radio" value="new" name="mode" checked={mode === 'new'} onChange={() => setMode('new')} className="w-4 h-4 text-amber-600 bg-gray-700 border-gray-600 focus:ring-amber-500" />
                                <label htmlFor="mode-new" className="ml-2 text-sm font-medium text-gray-300">Crear nueva cuerda</label>
                            </div>
                            <div className="flex items-center">
                                <input id="mode-front" type="radio" value="front" name="mode" checked={mode === 'front'} onChange={() => setMode('front')} className="w-4 h-4 text-amber-600 bg-gray-700 border-gray-600 focus:ring-amber-500" />
                                <label htmlFor="mode-front" className="ml-2 text-sm font-medium text-gray-300">Agregar otro frente</label>
                            </div>
                        </fieldset>
                        <p className="text-xs text-gray-400 mt-2">Un "frente" es una inscripción adicional para una cuerda existente.</p>
                    </div>
                )}
                
                {mode === 'new' || !isAdding ? (
                    <div className="space-y-4">
                        <InputField label="Nombre de la Cuerda" value={name} onChange={e => setName(e.target.value)} required />
                        <InputField label="Dueño" value={owner} onChange={e => setOwner(e.target.value)} required />
                    </div>
                ) : null}

                {isAdding && mode === 'front' && (
                     <div>
                        <label htmlFor="baseCuerdaSelect" className="block text-sm font-medium text-gray-400 mb-1">Seleccione la cuerda existente</label>
                        <select
                            id="baseCuerdaSelect"
                            value={selectedBaseCuerdaId}
                            onChange={e => setSelectedBaseCuerdaId(e.target.value)}
                            required
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                        >
                            {baseCuerdas.length === 0 ? (
                                <option disabled>No hay cuerdas base para seleccionar</option>
                            ) : (
                                baseCuerdas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                            )}
                        </select>
                     </div>
                )}
                
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
}
const GalloFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (gallo: Omit<Gallo, 'id'>) => void; gallo: Gallo | null; cuerdas: Cuerda[]; globalWeightUnit: PesoUnit; showNotification: (message: string, type: Notification['type']) => void; }> = ({ isOpen, onClose, onSave, gallo, cuerdas, globalWeightUnit, showNotification }) => {
    const [ringId, setRingId] = useState('');
    const [color, setColor] = useState('');
    const [cuerdaId, setCuerdaId] = useState('');
    const [weight, setWeight] = useState(0);
    const [ageMonths, setAgeMonths] = useState(1);
    const [markingId, setMarkingId] = useState('');

    useEffect(() => {
        if (isOpen) {
            setRingId(gallo?.ringId || '');
            setColor(gallo?.color || '');
            setCuerdaId(gallo?.cuerdaId || cuerdas[0]?.id || '');
            setWeight(gallo?.weight || 0);
            setAgeMonths(gallo?.ageMonths || 1);
            setMarkingId(gallo?.markingId || '');
        }
    }, [isOpen, gallo, cuerdas]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuerdaId) {
            showNotification("Por favor, seleccione una cuerda.", 'error');
            return;
        }
        onSave({ ringId, color, cuerdaId, weight, weightUnit: globalWeightUnit, ageMonths, markingId });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={gallo ? 'Editar Gallo' : 'Añadir Gallo'}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="ID del Anillo" value={ringId} onChange={e => setRingId(e.target.value)} required />
                    <InputField label="Color del Gallo" value={color} onChange={e => setColor(e.target.value)} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                    <select value={cuerdaId} onChange={e => setCuerdaId(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        <option value="" disabled>Seleccionar...</option>
                        {cuerdas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <InputField type="number" label={`Peso (${getWeightUnitAbbr(globalWeightUnit)})`} value={weight} onChange={e => setWeight(Number(e.target.value))} required step="any" />
                     <InputField type="number" label="Meses" value={ageMonths} onChange={e => setAgeMonths(Number(e.target.value))} required min="1" />
                     <InputField label="ID de Marcaje" value={markingId} onChange={e => setMarkingId(e.target.value)} />
                </div>
                <div className="flex justify-end pt-4 space-x-2">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
}

// --- SCREEN ---
interface SetupScreenProps {
    cuerdas: Cuerda[]; 
    gallos: Gallo[]; 
    torneo: Torneo; 
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    onStartMatchmaking: () => void; 
    showNotification: (message: string, type: Notification['type']) => void; 
    onSaveCuerda: (cuerdaData: Omit<Cuerda, 'id' | 'baseCuerdaId'>, currentCuerdaId: string | null) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
    onSaveGallo: (galloData: Omit<Gallo, 'id'>, currentGalloId: string | null) => void;
    onDeleteGallo: (galloId: string) => void;
    isMatchmaking: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ cuerdas, gallos, torneo, onUpdateTorneo, onStartMatchmaking, showNotification, onSaveCuerda, onDeleteCuerda, onSaveGallo, onDeleteGallo, isMatchmaking }) => {
    const [isCuerdaModalOpen, setCuerdaModalOpen] = useState(false);
    const [isGalloModalOpen, setGalloModalOpen] = useState(false);
    
    const [currentCuerda, setCurrentCuerda] = useState<Cuerda | null>(null);
    const [currentGallo, setCurrentGallo] = useState<Gallo | null>(null);

    const handleSaveCuerdaClick = (cuerdaData: Omit<Cuerda, 'id' | 'baseCuerdaId'>, currentCuerdaId: string | null) => {
        onSaveCuerda(cuerdaData, currentCuerdaId);
        setCuerdaModalOpen(false);
    };

    const handleSaveGalloClick = (galloData: Omit<Gallo, 'id'>) => {
        onSaveGallo(galloData, currentGallo?.id || null);
        setGalloModalOpen(false);
    };

    const activeRoostersCount = gallos.length;
    
    const baseCuerdas = useMemo(() => cuerdas.filter(c => !c.baseCuerdaId), [cuerdas]);
    
    const groupedGallos = useMemo(() => {
        const sortedCuerdas = [...cuerdas].sort((a,b) => a.name.localeCompare(b.name));
        const acc: Record<string, Gallo[]> = {};
        sortedCuerdas.forEach(c => {
            const cuerdaGallos = gallos.filter(gallo => gallo.cuerdaId === c.id);
            if (cuerdaGallos.length > 0) {
                 acc[c.name] = cuerdaGallos;
            }
        });
        return acc;
    }, [gallos, cuerdas]);


    return (
        <div className="space-y-8">
            <div className="text-center">
                <h2 className="text-2xl sm:text-3xl font-bold text-white">Configuración del Torneo</h2>
                <p className="text-gray-400 mt-2">Define las reglas y gestiona los participantes antes de iniciar.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="flex flex-col gap-8">
                    <SectionCard icon={<SettingsIcon/>} title="Información del Torneo">
                        <div className="space-y-4">
                            <InputField label="Nombre del Torneo" value={torneo.name} onChange={(e) => onUpdateTorneo({...torneo, name: e.target.value})} />
                            <InputField type="date" label="Fecha" value={torneo.date} onChange={(e) => onUpdateTorneo({...torneo, date: e.target.value})} />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Unidad de Peso</label>
                                    <select value={torneo.weightUnit} onChange={e => onUpdateTorneo({...torneo, weightUnit: e.target.value as PesoUnit})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                                        {Object.values(PesoUnit).map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                                    </select>
                                </div>
                                <InputField type="number" label="Tolerancia de peso (±)" value={torneo.weightTolerance} onChange={(e) => onUpdateTorneo({...torneo, weightTolerance: Number(e.target.value)})} />
                            </div>
                            <InputField type="number" label="Tolerancia de Meses (±)" value={torneo.ageToleranceMonths ?? ''} onChange={(e) => onUpdateTorneo({...torneo, ageToleranceMonths: Number(e.target.value)})} />
                            
                            <div className="border-t border-gray-700 my-4"></div>
                            <div className="flex items-center justify-between">
                                <label htmlFor="rondas-toggle" className="text-white font-medium text-sm sm:text-base">Cotejo por rondas</label>
                                <ToggleSwitch
                                    id="rondas-toggle"
                                    checked={torneo.rondas.enabled}
                                    onChange={e => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, enabled: e.target.checked } })}
                                />
                            </div>
                            {torneo.rondas.enabled && (
                                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                                    <InputField type="number" label="Puntos por Victoria" value={torneo.rondas.pointsForWin} onChange={(e) => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, pointsForWin: Number(e.target.value) } })} />
                                    <InputField type="number" label="Puntos por Empate" value={torneo.rondas.pointsForDraw} onChange={(e) => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, pointsForDraw: Number(e.target.value) } })} />
                                    <InputField 
                                        type="number" 
                                        label="Gallos por equipo"
                                        value={torneo.roostersPerTeam}
                                        min="1"
                                        onChange={(e) => {
                                            const value = Number(e.target.value);
                                            if (value > 0) {
                                                onUpdateTorneo({ ...torneo, roostersPerTeam: value });
                                            }
                                        }} 
                                    />
                                </div>
                            )}
                        </div>
                    </SectionCard>
                    <SectionCard icon={<UsersIcon/>} title="Cuerdas" buttonText="Añadir" onButtonClick={() => {setCurrentCuerda(null); setCuerdaModalOpen(true)}}>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {cuerdas.length === 0 && <p className="text-gray-400 text-center py-4">No hay cuerdas registradas.</p>}
                            {cuerdas.map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-white">{p.name}</p>
                                        <p className="text-sm text-gray-400">{p.owner}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => { setCurrentCuerda(p); setCuerdaModalOpen(true); }} className="text-gray-400 hover:text-amber-400 transition-colors p-1">
                                            <PencilIcon className="w-5 h-5"/>
                                        </button>
                                        <button onClick={() => onDeleteCuerda(p.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
                <div className="flex flex-col gap-8">
                     <SectionCard icon={<RoosterIcon/>} title="Gallos Registrados" buttonText="Añadir Gallo" onButtonClick={() => {setCurrentGallo(null); setGalloModalOpen(true)}}>
                        <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
                            {Object.keys(groupedGallos).length === 0 && <p className="text-gray-400 text-center py-4">No hay gallos registrados.</p>}
                            {Object.entries(groupedGallos).map(([cuerdaName, gallosInGroup]) => (
                                <div key={cuerdaName}>
                                    <h4 className="flex justify-between items-center font-bold text-amber-400 border-b border-gray-700 pb-1 mb-2">
                                        <span>{cuerdaName}</span>
                                        <span className="text-sm font-normal bg-gray-700 text-gray-300 px-2.5 py-0.5 rounded-full">{gallosInGroup.length}</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {gallosInGroup.map(g => (
                                            <div key={g.id} className="flex justify-between items-center bg-gray-700/50 p-2 sm:p-3 rounded-lg">
                                                <div>
                                                    <p className="font-semibold text-white text-sm sm:text-base">{g.color} <span className="text-xs text-gray-400 font-normal">({g.ringId})</span></p>
                                                </div>
                                                <div className="flex items-center space-x-1 sm:space-x-2">
                                                    {g.ageMonths > 0 && <span className="font-mono text-xs sm:text-sm bg-gray-600/80 px-2 py-1 rounded text-white">{g.ageMonths}m</span>}
                                                    <span className="font-mono text-xs sm:text-sm bg-gray-800 px-2 py-1 rounded">{formatWeight(g, torneo.weightUnit)}</span>
                                                    <button onClick={() => { setCurrentGallo(g); setGalloModalOpen(true); }} className="text-gray-400 hover:text-amber-400 transition-colors p-1">
                                                        <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                                    </button>
                                                    <button onClick={() => onDeleteGallo(g.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                        <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                    <SectionCard icon={<UsersIcon/>} title="Excepciones">
                        <p className="text-sm text-gray-400 mb-4">Define pares de equipos que no deben enfrentarse entre sí.</p>
                        <ExceptionsManager 
                            cuerdas={cuerdas} 
                            exceptions={torneo.exceptions} 
                            onUpdateExceptions={(newExceptions) => onUpdateTorneo({ ...torneo, exceptions: newExceptions })}
                            showNotification={showNotification}
                        />
                    </SectionCard>
                </div>
            </div>
            
            <div className="mt-8 text-center">
                <button
                    onClick={onStartMatchmaking}
                    disabled={activeRoostersCount < 2 || isMatchmaking}
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg text-lg transition-all duration-300 ease-in-out shadow-lg hover:shadow-xl disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center w-full sm:w-auto mx-auto"
                >
                    {isMatchmaking ? (
                        <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Cotejando...</span>
                        </>
                    ) : (
                        <>
                            <PlayIcon className="w-6 h-6 mr-2" />
                            <span>Iniciar Cotejo ({activeRoostersCount} Gallos)</span>
                        </>
                    )}
                </button>
            </div>
            
            <CuerdaFormModal isOpen={isCuerdaModalOpen} onClose={() => setCuerdaModalOpen(false)} onSave={handleSaveCuerdaClick} cuerda={currentCuerda} baseCuerdas={baseCuerdas} />
            <GalloFormModal isOpen={isGalloModalOpen} onClose={() => setGalloModalOpen(false)} onSave={handleSaveGalloClick} gallo={currentGallo} cuerdas={cuerdas} globalWeightUnit={torneo.weightUnit} showNotification={showNotification} />
        </div>
    );
};

export default SetupScreen;