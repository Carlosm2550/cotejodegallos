import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Cuerda, Gallo, Torneo, Notification, PesoUnit, TipoGallo, TipoEdad } from '../types';
import { SettingsIcon, RoosterIcon, UsersIcon, PlusIcon, TrashIcon, PencilIcon, XIcon, PlayIcon, WarningIcon } from './Icons';
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

const convertFromGrams = (grams: number, unit: PesoUnit): number => {
    switch (unit) {
        case PesoUnit.POUNDS: return grams / 453.592;
        case PesoUnit.OUNCES: return grams / 28.3495;
        case PesoUnit.GRAMS:
        default: return grams;
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

const CuerdaFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (data: { name: string, owner: string, fronts: number }, id: string | null) => void; cuerda: Cuerda | null; allCuerdas: Cuerda[] }> = ({ isOpen, onClose, onSave, cuerda, allCuerdas }) => {
    const [name, setName] = useState('');
    const [owner, setOwner] = useState('');
    const [fronts, setFronts] = useState(1);

    const isEditing = !!cuerda;

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                const baseCuerda = cuerda.baseCuerdaId ? allCuerdas.find(c => c.id === cuerda.baseCuerdaId) : cuerda;
                if (baseCuerda) {
                    const totalFronts = 1 + allCuerdas.filter(c => c.baseCuerdaId === baseCuerda.id).length;
                    setName(baseCuerda.name);
                    setOwner(baseCuerda.owner);
                    setFronts(totalFronts);
                }
            } else {
                // Reset for new cuerda
                setName('');
                setOwner('');
                setFronts(1);
            }
        }
    }, [isOpen, cuerda, allCuerdas, isEditing]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const baseCuerdaId = isEditing ? (cuerda.baseCuerdaId || cuerda.id) : null;
        onSave({ name, owner, fronts: Number(fronts) }, baseCuerdaId);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Cuerda' : 'Añadir Cuerda'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <InputField label="Nombre de la Cuerda" value={name} onChange={e => setName(e.target.value)} required />
                    <InputField label="Dueño" value={owner} onChange={e => setOwner(e.target.value)} required />
                    <InputField type="number" label="Frentes en este Torneo" value={fronts} onChange={e => setFronts(Math.max(1, Number(e.target.value)))} required min="1" />
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

const GalloFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onUpdate: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void; 
    onSaveMultiple: (gallos: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    gallo: Gallo | null; 
    cuerdas: Cuerda[];
    torneo: Torneo;
    showNotification: (message: string, type: Notification['type']) => void; 
}> = ({ isOpen, onClose, onUpdate, onSaveMultiple, gallo, cuerdas, torneo, showNotification }) => {
    
    type StagedGallo = Omit<Gallo, 'id' | 'tipoEdad'> & { stagedId: number };
    
    const isEditing = !!gallo;
    
    // Form state
    const [ringId, setRingId] = useState('');
    const [color, setColor] = useState('');
    const [weight, setWeight] = useState(0);
    const [ageMonths, setAgeMonths] = useState(12);
    const [markingId, setMarkingId] = useState('');
    const [tipoGallo, setTipoGallo] = useState<TipoGallo>(TipoGallo.LISO);
    const [marca, setMarca] = useState<string>('');
    
    // Modal flow state
    const [selectedBaseCuerdaId, setSelectedBaseCuerdaId] = useState('');
    const [activeFrenteId, setActiveFrenteId] = useState('');
    const [stagedGallos, setStagedGallos] = useState<StagedGallo[]>([]);
    const [editingStagedId, setEditingStagedId] = useState<number | null>(null);

    const prevIsOpen = React.useRef(isOpen);

    const baseCuerdas = useMemo(() => cuerdas.filter(c => !c.baseCuerdaId).sort((a,b) => a.name.localeCompare(b.name)), [cuerdas]);
    
    const availableFronts = useMemo(() => {
        if (!selectedBaseCuerdaId) return [];
        const base = cuerdas.find(c => c.id === selectedBaseCuerdaId);
        if (!base) return [];
        const fronts = cuerdas.filter(c => c.baseCuerdaId === selectedBaseCuerdaId).sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        return [base, ...fronts];
    }, [selectedBaseCuerdaId, cuerdas]);

    const { isGallo, tipoEdad } = useMemo(() => {
        const isGalloDetected = ageMonths >= 12;
        return {
            isGallo: isGalloDetected,
            tipoEdad: isGalloDetected ? TipoEdad.GALLO : TipoEdad.POLLO,
        };
    }, [ageMonths]);

    const resetFormFields = useCallback(() => {
        setRingId('');
        setColor('');
        setWeight(0);
        setAgeMonths(12);
        setMarkingId('');
        setTipoGallo(TipoGallo.LISO);
        setMarca('12');
        setEditingStagedId(null);
    }, []);
    
    const resetFullModal = useCallback(() => {
        resetFormFields();
        setSelectedBaseCuerdaId('');
        setActiveFrenteId('');
        setStagedGallos([]);
    }, [resetFormFields]);
    
    // Initialize or reset state when modal opens
    useEffect(() => {
        if (isOpen && !prevIsOpen.current) {
            if (isEditing && gallo) {
                const galloCuerda = cuerdas.find(c => c.id === gallo.cuerdaId);
                const baseId = galloCuerda?.baseCuerdaId || galloCuerda?.id || '';
                setSelectedBaseCuerdaId(baseId);
                setActiveFrenteId(gallo.cuerdaId);
                setRingId(gallo.ringId);
                setColor(gallo.color);
                setWeight(gallo.weight);
                setAgeMonths(gallo.ageMonths);
                setMarkingId(gallo.markingId);
                setTipoGallo(gallo.tipoGallo);
                setMarca(gallo.marca.toString());
            } else {
                resetFullModal();
                if (baseCuerdas.length > 0) {
                    setSelectedBaseCuerdaId(baseCuerdas[0].id);
                }
            }
        }
        prevIsOpen.current = isOpen;
    }, [isOpen, isEditing, gallo, cuerdas, baseCuerdas, resetFullModal]);

    // Update active frente when base cuerda changes or staged gallos are updated
    useEffect(() => {
        if (!isEditing && availableFronts.length > 0) {
            const firstAvailableFrente = availableFronts.find(frente => {
                if (!torneo.rondas.enabled) return true;
                const roostersInFrente = stagedGallos.filter(g => g.cuerdaId === frente.id).length;
                return roostersInFrente < torneo.roostersPerTeam;
            });
            setActiveFrenteId(firstAvailableFrente?.id || availableFronts[0].id);
        }
    }, [selectedBaseCuerdaId, availableFronts, isEditing, stagedGallos, torneo]);


    const handleAgeChange = (newAge: number) => {
        setAgeMonths(newAge);
        const newIsGallo = newAge >= 12;
        if (newIsGallo) {
            setMarca('12');
        } else {
            if (ageMonths >= 12) {
                setMarca('');
            }
        }
    }

    const validateAndGetData = (): Omit<Gallo, 'id' | 'tipoEdad'> | null => {
        if (!activeFrenteId || !ringId || !color) {
            showNotification("Por favor, complete todos los campos requeridos.", 'error');
            return null;
        }

        const finalMarca = isGallo ? 12 : parseInt(marca, 10);
        if (!isGallo && (marca.trim() === '' || isNaN(finalMarca) || finalMarca < 1 || finalMarca > 11)) {
            showNotification("La Marca es obligatoria para pollos y debe ser un número entre 1 y 11.", 'error');
            return null;
        }

        return { ringId, color, cuerdaId: activeFrenteId, weight, weightUnit: torneo.weightUnit, ageMonths, markingId, tipoGallo, marca: finalMarca };
    };
    
    const handleStageGallo = () => {
        const galloData = validateAndGetData();
        if (!galloData) return;

        let updatedStagedGallos;
        if (editingStagedId !== null) {
            updatedStagedGallos = stagedGallos.map(g => g.stagedId === editingStagedId ? { ...galloData, stagedId: g.stagedId } : g);
            showNotification(`Gallo '${galloData.color}' actualizado.`, 'info');
        } else {
            updatedStagedGallos = [...stagedGallos, { ...galloData, stagedId: Date.now() }];
            showNotification(`Gallo '${galloData.color}' añadido.`, 'success');
        }

        setStagedGallos(updatedStagedGallos);
        resetFormFields();

        // Auto-advance logic, only on new add
        if (editingStagedId === null && torneo.rondas.enabled) {
            const roostersPerFrente = availableFronts.map(f => ({
                id: f.id,
                count: updatedStagedGallos.filter(g => g.cuerdaId === f.id).length
            }));
            const currentFrenteStatus = roostersPerFrente.find(f => f.id === activeFrenteId);

            if (currentFrenteStatus && currentFrenteStatus.count >= torneo.roostersPerTeam) {
                const nextAvailableFrente = availableFronts.find(f => {
                    const status = roostersPerFrente.find(s => s.id === f.id);
                    return !status || status.count < torneo.roostersPerTeam;
                });
                if (nextAvailableFrente) {
                    setActiveFrenteId(nextAvailableFrente.id);
                }
            }
        }
    };

    const handleEditStagedGallo = (stagedGallo: StagedGallo) => {
        setActiveFrenteId(stagedGallo.cuerdaId);
        setRingId(stagedGallo.ringId);
        setColor(stagedGallo.color);
        setWeight(stagedGallo.weight);
        setAgeMonths(stagedGallo.ageMonths);
        setMarkingId(stagedGallo.markingId);
        setTipoGallo(stagedGallo.tipoGallo);
        setMarca(stagedGallo.marca.toString());
        setEditingStagedId(stagedGallo.stagedId);
    };

    const handleRemoveStagedGallo = (stagedIdToRemove: number) => {
        setStagedGallos(stagedGallos.filter(g => g.stagedId !== stagedIdToRemove));
    };
    
    const handleTabClick = (frenteId: string) => {
        const roostersInFrente = stagedGallos.filter(g => g.cuerdaId === frenteId).length;
        if (torneo.rondas.enabled && roostersInFrente >= torneo.roostersPerTeam && editingStagedId === null) {
            if (window.confirm("Este frente ya está completo. ¿Deseas editar los gallos?")) {
                setActiveFrenteId(frenteId);
            }
        } else {
            setActiveFrenteId(frenteId);
        }
    };

    const handleSaveAllStaged = () => {
        if (stagedGallos.length > 0) {
            onSaveMultiple(stagedGallos.map(({stagedId, ...rest}) => rest));
            onClose();
        } else {
            showNotification("No hay gallos para guardar.", 'info');
        }
    };
    
    const areAllFrentesFull = useMemo(() => {
        if (!torneo.rondas.enabled || availableFronts.length === 0) return false;
        return availableFronts.every(frente => 
            stagedGallos.filter(g => g.cuerdaId === frente.id).length === torneo.roostersPerTeam
        );
    }, [stagedGallos, availableFronts, torneo]);

    const handleSaveEdit = (e: React.FormEvent) => {
        e.preventDefault();
        const galloData = validateAndGetData();
        if (galloData && gallo) {
            onUpdate(galloData, gallo.id);
            onClose();
        }
    };
    
    const renderFormContent = (isFormDisabled: boolean) => (
         <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="ID del Anillo" value={ringId} onChange={e => setRingId(e.target.value)} required disabled={isFormDisabled} />
                <InputField label="Color del Gallo" value={color} onChange={e => setColor(e.target.value)} required disabled={isFormDisabled} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField type="number" label={`Peso (${getWeightUnitAbbr(torneo.weightUnit)})`} value={weight} onChange={e => setWeight(Number(e.target.value))} required step="any" min="0" disabled={isFormDisabled}/>
                <InputField type="number" label="Meses" value={ageMonths} onChange={e => handleAgeChange(Number(e.target.value))} required min="1" disabled={isFormDisabled}/>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField 
                    type="number"
                    label="Marca" 
                    value={isGallo ? '12' : marca}
                    onChange={(e) => setMarca(e.target.value)}
                    disabled={isGallo || isFormDisabled}
                    required={!isGallo}
                    min="1"
                    max="11"
                 />
                 <InputField label="Tipo (Pollo/Gallo)" value={tipoEdad} disabled />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Pluma</label>
                    <select value={tipoGallo} onChange={e => setTipoGallo(e.target.value as TipoGallo)} required disabled={isFormDisabled} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600 disabled:opacity-70">
                        {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <InputField label="ID de Marcaje" value={markingId} onChange={e => setMarkingId(e.target.value)} required disabled={isFormDisabled}/>
            </div>
        </div>
    );
    
    const selectedCuerdaName = useMemo(() => baseCuerdas.find(c => c.id === selectedBaseCuerdaId)?.name || 'N/A', [selectedBaseCuerdaId, baseCuerdas]);

    return (
        <Modal size="wide" isOpen={isOpen} onClose={onClose} title={isEditing ? 'Editar Gallo' : `Añadir Gallos para ${selectedCuerdaName}`}>
            {isEditing ? (
                 <form onSubmit={handleSaveEdit} className="space-y-4">
                    {renderFormContent(false)}
                     <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                         <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                         <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                     </div>
                 </form>
            ) : (
                // --- BULK ADD UI ---
                <div>
                    {/* Cuerda Selector */}
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                        <select 
                            value={selectedBaseCuerdaId} 
                            onChange={e => {
                                setSelectedBaseCuerdaId(e.target.value);
                                setStagedGallos([]); // Reset staged gallos when cuerda changes
                            }} 
                            required 
                            className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition"
                        >
                            <option value="" disabled>Seleccionar una cuerda...</option>
                            {baseCuerdas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                    </div>

                    {selectedBaseCuerdaId && (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* --- Left Column: Form --- */}
                            <div>
                                {/* Tabs for Frentes */}
                                <div className="flex border-b border-gray-600 overflow-x-auto mb-4">
                                    {availableFronts.map((frente, index) => {
                                        const roostersInFrente = stagedGallos.filter(g => g.cuerdaId === frente.id).length;
                                        const isComplete = torneo.rondas.enabled && roostersInFrente >= torneo.roostersPerTeam;
                                        return (
                                        <button
                                            type="button"
                                            key={frente.id}
                                            onClick={() => handleTabClick(frente.id)}
                                            className={`py-2 px-3 text-sm font-medium transition-colors border-b-2 flex-shrink-0 ${
                                                activeFrenteId === frente.id 
                                                ? 'border-amber-500 text-amber-400' 
                                                : 'border-transparent text-gray-400 hover:border-gray-500 hover:text-gray-200'
                                            } ${isComplete ? 'text-green-400' : ''}`}
                                        >
                                            F{index + 1} {torneo.rondas.enabled ? `(${roostersInFrente}/${torneo.roostersPerTeam})` : ''}
                                        </button>
                                        )
                                    })}
                                </div>
                                
                                {/* Form Area */}
                                {(() => {
                                    const roostersInActiveFrente = stagedGallos.filter(g => g.cuerdaId === activeFrenteId).length;
                                    const isFrenteFull = torneo.rondas.enabled && roostersInActiveFrente >= torneo.roostersPerTeam;
                                    const isFormDisabled = isFrenteFull && editingStagedId === null;

                                    return (
                                        <>
                                            {renderFormContent(isFormDisabled)}
                                            {isFormDisabled && <p className="text-center text-green-400 font-semibold mt-4">Este frente está completo. Seleccione otro frente o edite un gallo existente.</p>}
                                            <div className="flex justify-end pt-4 mt-4">
                                                <button 
                                                    type="button"
                                                    onClick={handleStageGallo}
                                                    disabled={isFormDisabled}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed"
                                                >
                                                    {editingStagedId !== null ? 'Actualizar Gallo' : 'Siguiente'}
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                            
                            {/* --- Right Column: Summary --- */}
                            <div className="space-y-4 md:border-l md:border-gray-700 md:pl-8">
                                <h4 className="font-bold text-amber-400 mb-2">Gallos registrados</h4>
                                {stagedGallos.length === 0 ? (
                                    <p className="text-gray-500 text-center py-2">Aún no se han añadido gallos.</p>
                                ) : (
                                   <div className="space-y-3 max-h-[26rem] overflow-y-auto pr-2">
                                       {availableFronts.map((frente, index) => {
                                           const gallosForFrente = stagedGallos.filter(g => g.cuerdaId === frente.id);
                                           if (gallosForFrente.length === 0) return null;
                                           return (
                                               <div key={frente.id}>
                                                   <p className="font-semibold text-sm text-gray-300 mb-1">F{index + 1}:</p>
                                                   <div className="space-y-1">
                                                    {gallosForFrente.map(g => (
                                                        <div key={g.stagedId} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-md">
                                                            <span className="text-sm">{g.color} ({g.ringId})</span>
                                                            <div className="flex items-center space-x-2">
                                                                <button onClick={() => handleEditStagedGallo(g)} className="p-1 text-gray-400 hover:text-amber-400"><PencilIcon className="w-4 h-4"/></button>
                                                                <button onClick={() => handleRemoveStagedGallo(g.stagedId)} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4"/></button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                   </div>
                                               </div>
                                           );
                                       })}
                                   </div>
                                )}
                            </div>
                        </div>

                        {/* Final Actions */}
                        <div className="flex flex-col sm:flex-row justify-between items-center pt-4 space-y-2 sm:space-y-0 sm:space-x-2 border-t border-gray-700 mt-6">
                            <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg w-full sm:w-auto">Cancelar</button>
                            <button 
                                type="button" 
                                onClick={handleSaveAllStaged} 
                                disabled={torneo.rondas.enabled && !areAllFrentesFull}
                                className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg w-full sm:w-auto disabled:bg-gray-500 disabled:cursor-not-allowed disabled:text-gray-300"
                                title={torneo.rondas.enabled && !areAllFrentesFull ? "Debe completar todos los frentes con el número de gallos requerido" : "Guardar todos los gallos"}
                            >
                                Guardar y Cerrar
                            </button>
                        </div>
                    </>
                    )}
                </div>
            )}
        </Modal>
    );
}

const PrintablePlanilla: React.FC<{ torneo: Torneo }> = ({ torneo }) => (
    <div id="printable-planilla" className="p-8 space-y-6 bg-white text-black text-lg">
        <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-4xl font-bold">{torneo.name}</h1>
            <p className="text-2xl mt-2">{torneo.date}</p>
        </div>
        <div className="space-y-8 pt-4">
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Nombre del Criadero:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Dueño de los gallos:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
             <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Frente:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">ID del Anillo:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">ID de Marcaje:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Color del Gallo:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Peso:</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Edad (meses):</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Tipo (Pollo/Gallo):</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
            <div className="flex items-center space-x-4">
                <label className="font-bold w-1/4">Tipo de Pluma (Liso/Pava):</label>
                <div className="border-b-2 border-dotted border-black flex-grow h-8"></div>
            </div>
        </div>
    </div>
);


// --- SCREEN ---
interface SetupScreenProps {
    cuerdas: Cuerda[]; 
    gallos: Gallo[]; 
    torneo: Torneo; 
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    onStartMatchmaking: () => void; 
    showNotification: (message: string, type: Notification['type']) => void; 
    onSaveCuerda: (cuerdaData: { name: string, owner: string, fronts: number }, baseCuerdaId: string | null) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
    onUpdateGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onSaveMultipleGallos: (gallosData: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    onDeleteGallo: (galloId: string) => void;
    isMatchmaking: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ cuerdas, gallos, torneo, onUpdateTorneo, onStartMatchmaking, showNotification, onSaveCuerda, onDeleteCuerda, onUpdateGallo, onSaveMultipleGallos, onDeleteGallo, isMatchmaking }) => {
    const [isCuerdaModalOpen, setCuerdaModalOpen] = useState(false);
    const [isGalloModalOpen, setGalloModalOpen] = useState(false);
    
    const [currentCuerda, setCurrentCuerda] = useState<Cuerda | null>(null);
    const [currentGallo, setCurrentGallo] = useState<Gallo | null>(null);

    const handleSaveCuerdaClick = (data: { name: string; owner: string; fronts: number }, baseCuerdaId: string | null) => {
        onSaveCuerda(data, baseCuerdaId);
        setCuerdaModalOpen(false);
    };

    const handleUpdateGalloClick = (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => {
        onUpdateGallo(galloData, currentGalloId);
        setGalloModalOpen(false);
    };
    
    const handleCloseGalloModal = useCallback(() => {
        setGalloModalOpen(false);
        setCurrentGallo(null);
    }, []);

    const activeRoostersCount = gallos.length;
    
    const groupedGallos = useMemo(() => {
        const sortedCuerdas = [...cuerdas].sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
        const acc: Record<string, Gallo[]> = {};
        sortedCuerdas.forEach(c => {
            const cuerdaGallos = gallos.filter(gallo => gallo.cuerdaId === c.id);
            if (cuerdaGallos.length > 0) {
                 acc[c.name] = cuerdaGallos;
            }
        });
        return acc;
    }, [gallos, cuerdas]);

    const handlePrintPlanilla = () => {
        document.body.classList.add('printing-planilla');
        window.print();
        document.body.classList.remove('printing-planilla');
    };

    const handleOpenCuerdaModal = (cuerda: Cuerda | null) => {
        setCurrentCuerda(cuerda);
        setCuerdaModalOpen(true);
    };

    const handleOpenGalloModal = () => {
        if (cuerdas.filter(c => !c.baseCuerdaId).length === 0) {
            showNotification("Debe crear una cuerda primero antes de añadir gallos.", "error");
        } else {
            setCurrentGallo(null);
            setGalloModalOpen(true);
        }
    };

    return (
        <div className="space-y-8 print-target">
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
                             <button onClick={handlePrintPlanilla} className="w-full mt-2 text-sm bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Imprimir Planilla de Ingreso</button>
                            <div className="border-t border-gray-700 my-2"></div>
                             <h4 className="text-md font-semibold text-amber-400">Pesos Permitidos</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <InputField 
                                   type="number" 
                                   label={`Peso Mínimo (${getWeightUnitAbbr(torneo.weightUnit)})`}
                                   value={convertFromGrams(torneo.minWeight, torneo.weightUnit).toFixed(2)} 
                                   step="0.01"
                                   onChange={(e) => onUpdateTorneo({...torneo, minWeight: convertToGrams(Number(e.target.value), torneo.weightUnit)})} 
                                />
                                <InputField 
                                   type="number" 
                                   label={`Peso Máximo (${getWeightUnitAbbr(torneo.weightUnit)})`}
                                   value={convertFromGrams(torneo.maxWeight, torneo.weightUnit).toFixed(2)} 
                                   step="0.01"
                                   onChange={(e) => onUpdateTorneo({...torneo, maxWeight: convertToGrams(Number(e.target.value), torneo.weightUnit)})} 
                                />
                            </div>

                            <div className="border-t border-gray-700 my-2"></div>
                            <h4 className="text-md font-semibold text-amber-400">Tolerancias</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Unidad de Peso</label>
                                    <select value={torneo.weightUnit} onChange={e => onUpdateTorneo({...torneo, weightUnit: e.target.value as PesoUnit})} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                                        {Object.values(PesoUnit).map(u => <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>)}
                                    </select>
                                </div>
                                <InputField type="number" label="Tolerancia de peso (± g)" value={torneo.weightTolerance} onChange={(e) => onUpdateTorneo({...torneo, weightTolerance: Number(e.target.value)})} />
                            </div>
                            <InputField type="number" label="Tolerancia de Meses (±, solo pollos)" value={torneo.ageToleranceMonths ?? ''} onChange={(e) => onUpdateTorneo({...torneo, ageToleranceMonths: Number(e.target.value)})} />
                            
                            <div className="border-t border-gray-700 my-2"></div>
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
                    <SectionCard icon={<UsersIcon/>} title="Cuerdas" buttonText="Añadir" onButtonClick={() => handleOpenCuerdaModal(null)}>
                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                            {cuerdas.length === 0 && <p className="text-gray-400 text-center py-4">No hay cuerdas registradas.</p>}
                            {cuerdas.sort((a,b) => a.name.localeCompare(b.name, undefined, { numeric: true })).map(p => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-700/50 p-3 rounded-lg">
                                    <div>
                                        <p className="font-semibold text-white">{p.name}</p>
                                        <p className="text-sm text-gray-400">{p.owner}</p>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button onClick={() => handleOpenCuerdaModal(p)} className="text-gray-400 hover:text-amber-400 transition-colors p-1">
                                            <PencilIcon className="w-5 h-5"/>
                                        </button>
                                        <button 
                                            onClick={() => onDeleteCuerda(p.id)} 
                                            disabled={!!p.baseCuerdaId}
                                            className="text-gray-400 hover:text-red-500 transition-colors p-1 disabled:text-gray-600 disabled:hover:text-gray-600 disabled:cursor-not-allowed"
                                            title={p.baseCuerdaId ? "No se puede eliminar un frente directamente. Edite la cuerda base." : "Eliminar Cuerda"}
                                        >
                                            <TrashIcon className="w-5 h-5"/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </SectionCard>
                </div>
                <div className="flex flex-col gap-8">
                     <SectionCard icon={<RoosterIcon/>} title="Gallos Registrados" buttonText="Añadir Gallo" onButtonClick={handleOpenGalloModal}>
                        <div className="space-y-4 max-h-[30rem] overflow-y-auto pr-2">
                            {Object.keys(groupedGallos).length === 0 && <p className="text-gray-400 text-center py-4">No hay gallos registrados.</p>}
                            {Object.entries(groupedGallos).map(([cuerdaName, gallosInGroup]) => (
                                <div key={cuerdaName}>
                                    <h4 className="flex justify-between items-center font-bold text-amber-400 border-b border-gray-700 pb-1 mb-2">
                                        <span>{cuerdaName}</span>
                                        <span className="text-sm font-normal bg-gray-700 text-gray-300 px-2.5 py-0.5 rounded-full">{gallosInGroup.length}</span>
                                    </h4>
                                    <div className="space-y-2">
                                        {gallosInGroup.map(g => {
                                            const weightInGrams = convertToGrams(g.weight, g.weightUnit);
                                            const isOutOfWeightRange = weightInGrams < torneo.minWeight || weightInGrams > torneo.maxWeight;
                                            return (
                                                <div key={g.id} className="flex justify-between items-center bg-gray-700/50 p-2 sm:p-3 rounded-lg">
                                                    <div className="flex items-center space-x-2">
                                                        {isOutOfWeightRange && <WarningIcon className="w-5 h-5 text-yellow-400 flex-shrink-0" title="Peso fuera de rango del torneo"/>}
                                                        <p className="font-semibold text-white text-sm sm:text-base">{g.color} <span className="text-xs text-gray-400 font-normal">({g.ringId})</span></p>
                                                    </div>
                                                    <div className="flex items-center space-x-1 sm:space-x-2">
                                                        <span className="font-mono text-xs sm:text-sm bg-blue-900/60 px-2 py-1 rounded text-blue-200">{g.tipoGallo}</span>
                                                        <span className="font-mono text-xs sm:text-sm bg-gray-600/80 px-2 py-1 rounded text-white">{g.ageMonths}m</span>
                                                        <span className="font-mono text-xs sm:text-sm bg-gray-800 px-2 py-1 rounded">{formatWeight(g, torneo.weightUnit)}</span>
                                                        <button onClick={() => { setCurrentGallo(g); setGalloModalOpen(true); }} className="text-gray-400 hover:text-amber-400 transition-colors p-1">
                                                            <PencilIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                                        </button>
                                                        <button onClick={() => onDeleteGallo(g.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
                                                            <TrashIcon className="w-4 h-4 sm:w-5 sm:h-5"/>
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
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
            
            <CuerdaFormModal isOpen={isCuerdaModalOpen} onClose={() => setCuerdaModalOpen(false)} onSave={handleSaveCuerdaClick} cuerda={currentCuerda} allCuerdas={cuerdas} />
            <GalloFormModal 
                isOpen={isGalloModalOpen} 
                onClose={handleCloseGalloModal} 
                onUpdate={handleUpdateGalloClick} 
                onSaveMultiple={onSaveMultipleGallos}
                gallo={currentGallo} 
                cuerdas={cuerdas} 
                torneo={torneo}
                showNotification={showNotification} 
            />
            <div className="printable-planilla-container">
              <PrintablePlanilla torneo={torneo} />
            </div>
        </div>
    );
};

export default SetupScreen;