import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Cuerda, Gallo, Torneo, PesoUnit, TipoGallo, TipoEdad } from '../types';
import { SettingsIcon, RoosterIcon, UsersIcon, PlusIcon, TrashIcon, PencilIcon, XIcon, PlayIcon, WarningIcon } from './Icons';
import Modal from './Modal';
import { CuerdaFormData } from '../App';

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

const formatWeight = (gallo: Gallo | Omit<Gallo, 'id' | 'tipoEdad'>, globalUnit: PesoUnit): string => {
    const unitAbbr = getWeightUnitAbbr(globalUnit);
    // The gallo object from the form might not have weightUnit yet, default to torneo unit
    const sourceUnit = 'weightUnit' in gallo ? gallo.weightUnit : globalUnit;
    const grams = convertToGrams(gallo.weight, sourceUnit);
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
  wrapperClassName?: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, type, wrapperClassName, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;

  return (
    <div className={wrapperClassName}>
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

const ExceptionsManager: React.FC<{ cuerdas: Cuerda[]; exceptions: string[][]; onUpdateExceptions: (exceptions: string[][]) => void; }> = ({ cuerdas, exceptions, onUpdateExceptions }) => {
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
    };
    
    const getCuerdaName = (id: string) => cuerdas.find(p => p.id === id)?.name || 'Desconocido';

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-end gap-2">
                <div className="flex-1 w-full">
                    <label className="text-xs text-gray-400">Cuerda 1</label>
                    <select value={cuerda1} onChange={e => setCuerda1(e.target.value)} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        <option value="">Seleccionar...</option>
                        {baseCuerdas.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
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

const CuerdaFormModal: React.FC<{ isOpen: boolean; onClose: () => void; onSave: (cuerda: CuerdaFormData, id: string | null) => void; cuerda: Cuerda | null; }> = ({ isOpen, onClose, onSave, cuerda }) => {
    const [name, setName] = useState('');
    const [owner, setOwner] = useState('');
    const [frontCount, setFrontCount] = useState(1);
    const isAdding = !cuerda;

    useEffect(() => {
        if (isOpen) {
            setName(cuerda?.name.replace(/\s\(F\d+\)$/, '') || '');
            setOwner(cuerda?.owner || '');
            setFrontCount(1);
        }
    }, [isOpen, cuerda]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, owner, frontCount: isAdding ? frontCount : undefined }, cuerda?.id || null);
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={isAdding ? 'Añadir Cuerda' : 'Editar Cuerda'}>
            <form onSubmit={handleSubmit} className="space-y-6">
                <InputField label="Nombre de la Cuerda" value={name} onChange={e => setName(e.target.value)} required />
                <InputField label="Dueño" value={owner} onChange={e => setOwner(e.target.value)} required />
                {isAdding && (
                    <InputField type="number" label="¿Cuantos frentes deseas inscribir?" value={frontCount} onChange={e => setFrontCount(Math.max(1, parseInt(e.target.value) || 1))} required min="1"/>
                )}
                
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

// New helper interface for the form state.
interface GalloBulkFormData {
    ringId: string;
    color: string;
    cuerdaId: string;
    weight: string;
    ageMonths: string;
    markingId: string;
    tipoGallo: TipoGallo;
    marca: string;
    weightUnit: PesoUnit;
}

const GalloFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSaveSingle: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void; 
    onSaveBulk: (gallos: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    gallo: Gallo | null; // null for bulk add, object for single edit
    cuerdas: Cuerda[];
    torneo: Torneo;
}> = ({ isOpen, onClose, onSaveSingle, onSaveBulk, gallo, cuerdas, torneo }) => {
    
    // --- State for Single Edit Mode ---
    const [ringId, setRingId] = useState('');
    const [color, setColor] = useState('');
    const [cuerdaId, setCuerdaId] = useState('');
    const [weight, setWeight] = useState(''); // Use string for form binding
    const [ageMonths, setAgeMonths] = useState(''); // Use string for form binding
    const [markingId, setMarkingId] = useState('');
    const [tipoGallo, setTipoGallo] = useState<TipoGallo>(TipoGallo.LISO);
    const [marca, setMarca] = useState<string>('');
    
    // --- State for Bulk Add Mode ---
    const [selectedCuerdaId, setSelectedCuerdaId] = useState('');
    const [activeTabCuerdaId, setActiveTabCuerdaId] = useState('');
    const [stagedGallos, setStagedGallos] = useState<Record<string, Omit<Gallo, 'id' | 'tipoEdad'>[]>>({});

    const initialGalloFormState: GalloBulkFormData = {
        ringId: '', color: '', cuerdaId: '', weight: '', ageMonths: '12', markingId: '', tipoGallo: TipoGallo.LISO, marca: '12', weightUnit: torneo.weightUnit,
    };
    const [currentGalloForm, setCurrentGalloForm] = useState<GalloBulkFormData>(initialGalloFormState);
    
    const { tipoEdad: singleEditTipoEdad } = useMemo(() => ({
        tipoEdad: Number(ageMonths) >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO
    }), [ageMonths]);
    
    const { tipoEdad: bulkAddTipoEdad } = useMemo(() => ({
        tipoEdad: Number(currentGalloForm.ageMonths) >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO
    }), [currentGalloForm.ageMonths]);

    // --- Effects to sync state with props ---
    useEffect(() => {
        if (isOpen) {
            if (gallo) { // Single Edit Mode
                setRingId(gallo.ringId || '');
                setColor(gallo.color || '');
                setCuerdaId(gallo.cuerdaId || '');
                setWeight(String(gallo.weight || ''));
                setAgeMonths(String(gallo.ageMonths || ''));
                setMarkingId(gallo.markingId || '');
                setTipoGallo(gallo.tipoGallo || TipoGallo.LISO);
                setMarca(gallo.marca?.toString() || (gallo.ageMonths >= 12 ? '12' : ''));
            } else { // Bulk Add Mode Reset
                setSelectedCuerdaId('');
                setActiveTabCuerdaId('');
                setStagedGallos({});
                setCurrentGalloForm(initialGalloFormState);
            }
        }
    }, [isOpen, gallo]);
    
    const handleSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!cuerdaId || !gallo) return;
        
        const finalMarca = singleEditTipoEdad === TipoEdad.GALLO ? 12 : parseInt(marca, 10);
        if (singleEditTipoEdad === TipoEdad.POLLO && (marca.trim() === '' || isNaN(finalMarca) || finalMarca < 1 || finalMarca > 11)) {
            alert("La Marca es obligatoria para pollos y debe ser un número entre 1 y 11.");
            return;
        }

        onSaveSingle({ ringId, color, cuerdaId, weight: Number(weight), weightUnit: torneo.weightUnit, ageMonths: Number(ageMonths), markingId, tipoGallo, marca: finalMarca }, gallo.id);
        onClose();
    };

    // --- Handlers for Bulk Add Mode ---
    const handleCuerdaSelectionChange = (baseCuerdaId: string) => {
        setSelectedCuerdaId(baseCuerdaId);
        setActiveTabCuerdaId(baseCuerdaId);
        setStagedGallos({});
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: baseCuerdaId });
    };

    const handleTabClick = (cuerdaId: string) => {
        setActiveTabCuerdaId(cuerdaId);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId });
    };

    const handleBulkFormChange = (field: keyof GalloBulkFormData, value: string) => {
        const newFormState = { ...currentGalloForm, [field]: value };
        if (field === 'ageMonths') {
            const newAge = Number(value);
            const oldAge = Number(currentGalloForm.ageMonths || 0);
            const isNowGallo = newAge >= 12;
            const wasGallo = oldAge >= 12;

            if (isNowGallo) {
                newFormState.marca = '12';
            } else if (wasGallo && !isNowGallo) { // Transitioned from Gallo to Pollo
                newFormState.marca = ''; // Clear for user input
            }
        }
        setCurrentGalloForm(newFormState);
    };
    
    const getGalloDataFromForm = (form: GalloBulkFormData, targetCuerdaId: string): Omit<Gallo, 'id'|'tipoEdad'> => {
        return {
            ...form,
            weight: Number(form.weight) || 0,
            ageMonths: Number(form.ageMonths) || 0,
            marca: Number(form.marca) || 0,
            cuerdaId: targetCuerdaId,
        };
    };

    const handleAddStagedGallo = () => {
        const finalMarca = bulkAddTipoEdad === TipoEdad.GALLO ? 12 : Number(currentGalloForm.marca);
        if (bulkAddTipoEdad === TipoEdad.POLLO && (currentGalloForm.marca.trim() === '' || isNaN(finalMarca) || finalMarca < 1 || finalMarca > 11)) {
            alert("La Marca es obligatoria para pollos y debe ser un número entre 1 y 11.");
            return;
        }

        const newGalloData = getGalloDataFromForm({ ...currentGalloForm, marca: String(finalMarca) }, activeTabCuerdaId);

        setStagedGallos(prev => {
            const currentList = prev[activeTabCuerdaId] || [];
            return {
                ...prev,
                [activeTabCuerdaId]: [...currentList, newGalloData]
            };
        });
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: activeTabCuerdaId });
    };

    const handleDeleteStagedGallo = (indexToDelete: number) => {
        setStagedGallos(prev => {
            const currentList = prev[activeTabCuerdaId] || [];
            const newList = currentList.filter((_, index) => index !== indexToDelete);
            return {
                ...prev,
                [activeTabCuerdaId]: newList
            };
        });
    };

    const handleBulkSubmit = () => {
        const allGallos = Object.values(stagedGallos).flat();
        onSaveBulk(allGallos);
        onClose();
    };

    const groupedBaseCuerdas = useMemo(() => {
        const groups = new Map<string, Cuerda[]>();
        cuerdas.forEach(c => {
            const baseName = c.name.replace(/\s\(F\d+\)$/, '').trim();
            if (!groups.has(baseName)) {
                groups.set(baseName, []);
            }
            groups.get(baseName)!.push(c);
        });
        
        const result = Array.from(groups.entries()).map(([baseName, fronts]) => {
            fronts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            const frontLabels = fronts.map(f => {
                const match = f.name.match(/\(F\d+\)/);
                return match ? match[0] : '';
            }).join(' ');
            return {
                id: fronts[0].id,
                displayText: `${baseName} ${frontLabels}`.trim(),
            };
        });
        return result.sort((a,b) => a.displayText.localeCompare(b.displayText));
    }, [cuerdas]);

    const frontsForSelectedCuerda = useMemo(() => {
        if (!selectedCuerdaId) return [];
        const selectedCuerda = cuerdas.find(c => c.id === selectedCuerdaId);
        if (!selectedCuerda) return [];
        
        const baseName = selectedCuerda.name.replace(/\s\(F\d+\)$/, '').trim();
        
        const allRelatedFronts = cuerdas.filter(c => 
            c.name.replace(/\s\(F\d+\)$/, '').trim() === baseName
        );
        
        return allRelatedFronts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [selectedCuerdaId, cuerdas]);

    const isCurrentFrontFull = (stagedGallos[activeTabCuerdaId]?.length || 0) >= torneo.roostersPerTeam;
    
    const areAllFrontsComplete = useMemo(() => {
        if (frontsForSelectedCuerda.length === 0) return false;
        return frontsForSelectedCuerda.every(front => (stagedGallos[front.id]?.length || 0) === torneo.roostersPerTeam);
    }, [stagedGallos, frontsForSelectedCuerda, torneo.roostersPerTeam]);

    // --- RENDER LOGIC ---
    const renderSingleEditForm = () => (
         <form onSubmit={handleSingleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="ID del Anillo" value={ringId} onChange={e => setRingId(e.target.value)} required />
                <InputField label="Color del Gallo" value={color} onChange={e => setColor(e.target.value)} required />
            </div>
             <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                <select value={cuerdaId} onChange={e => setCuerdaId(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                    <option value="" disabled>Seleccionar...</option>
                    {[...cuerdas].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField type="number" label={`Peso (${getWeightUnitAbbr(torneo.weightUnit)})`} value={weight} onChange={e => setWeight(e.target.value)} required step="any" min="0" />
                <InputField type="number" label="Meses" value={ageMonths} onChange={e => setAgeMonths(e.target.value)} required min="1" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                 <InputField type="number" label="Marca" value={singleEditTipoEdad === TipoEdad.GALLO ? '12' : marca} onChange={(e) => setMarca(e.target.value)} disabled={singleEditTipoEdad === TipoEdad.GALLO} required={singleEditTipoEdad !== TipoEdad.GALLO} min="1" max="11" />
                 <InputField label="Tipo (Pollo/Gallo)" value={singleEditTipoEdad} disabled />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Pluma</label>
                    <select value={tipoGallo} onChange={e => setTipoGallo(e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
                <InputField label="ID de Marcaje" value={markingId} onChange={e => setMarkingId(e.target.value)} required />
            </div>
            <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
            </div>
        </form>
    );

    const renderBulkAddForm = () => {
      return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                <select value={selectedCuerdaId} onChange={e => handleCuerdaSelectionChange(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                    <option value="" disabled>Seleccionar...</option>
                    {groupedBaseCuerdas.map(group => (
                        <option key={group.id} value={group.id}>
                            {group.displayText}
                        </option>
                    ))}
                </select>
            </div>

            {selectedCuerdaId && (
                <div>
                    <div className="flex border-b border-gray-600 mb-4 flex-wrap">
                        {frontsForSelectedCuerda.map((front, index) => (
                            <button
                                key={front.id}
                                onClick={() => handleTabClick(front.id)}
                                className={`py-2 px-4 text-sm font-medium transition-colors ${activeTabCuerdaId === front.id ? 'border-b-2 border-amber-500 text-amber-400' : 'text-gray-400 hover:text-white'}`}
                            >
                                {`F${index + 1} (${stagedGallos[front.id]?.length || 0}/${torneo.roostersPerTeam})`}
                            </button>
                        ))}
                    </div>
                    
                    <div className="mb-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                        {(stagedGallos[activeTabCuerdaId] || []).map((stagedGallo, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg text-sm">
                                <div className="flex-grow"><span className="font-bold">{stagedGallo.color}</span> ({stagedGallo.ringId})</div>
                                <div className="flex items-center space-x-2 flex-shrink-0">
                                    <span className="text-gray-400">{formatWeight(stagedGallo, torneo.weightUnit)} / {stagedGallo.ageMonths}m</span>
                                    <button onClick={() => handleDeleteStagedGallo(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                         {(stagedGallos[activeTabCuerdaId]?.length || 0) === 0 && <p className="text-gray-500 text-center text-sm py-2">Aún no hay gallos para este frente.</p>}
                    </div>

                    {!isCurrentFrontFull && (
                        <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                            <h4 className="font-bold text-amber-400">Añadir Gallo al Frente</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField label="ID del Anillo" value={currentGalloForm.ringId} onChange={e => handleBulkFormChange('ringId', e.target.value)} required />
                                <InputField label="Color del Gallo" value={currentGalloForm.color} onChange={e => handleBulkFormChange('color', e.target.value)} required />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField type="number" label={`Peso (${getWeightUnitAbbr(torneo.weightUnit)})`} value={currentGalloForm.weight} onChange={e => handleBulkFormChange('weight', e.target.value)} required step="any" min="0" />
                                <InputField type="number" label="Meses" value={currentGalloForm.ageMonths} onChange={e => handleBulkFormChange('ageMonths', e.target.value)} required min="1" />
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <InputField type="number" label="Marca" value={bulkAddTipoEdad === TipoEdad.GALLO ? '12' : currentGalloForm.marca} onChange={e => handleBulkFormChange('marca', e.target.value)} disabled={bulkAddTipoEdad === TipoEdad.GALLO} required={bulkAddTipoEdad !== TipoEdad.GALLO} min="1" max="11" />
                                <InputField label="Tipo (Pollo/Gallo)" value={bulkAddTipoEdad} disabled />
                            </div>
                             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Pluma</label>
                                    <select value={currentGalloForm.tipoGallo} onChange={e => handleBulkFormChange('tipoGallo', e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                                        {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                                <InputField label="ID de Marcaje" value={currentGalloForm.markingId} onChange={e => handleBulkFormChange('markingId', e.target.value)} required />
                            </div>
                            <button type="button" onClick={handleAddStagedGallo} disabled={!currentGalloForm.ringId || !currentGalloForm.color || !currentGalloForm.weight} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                Añadir Gallo a este Frente
                            </button>
                        </div>
                    )}
                     {isCurrentFrontFull && (
                        <div className="p-4 bg-green-900/50 text-center rounded-lg">
                            <p className="font-bold text-green-300">Este frente está completo.</p>
                        </div>
                    )}
                </div>
            )}
            
            <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="button" onClick={handleBulkSubmit} disabled={!areAllFrontsComplete} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">Guardar Todo y Cerrar</button>
            </div>
        </div>
      );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={gallo ? 'Editar Gallo' : 'Añadir Gallos'} size="wide">
            {gallo ? renderSingleEditForm() : renderBulkAddForm()}
        </Modal>
    );
};

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
    onSaveCuerda: (cuerdaData: CuerdaFormData, currentCuerdaId: string | null) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
    onSaveGallo: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onAddBulkGallos: (gallosData: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    onDeleteGallo: (galloId: string) => void;
    isMatchmaking: boolean;
}

const SetupScreen: React.FC<SetupScreenProps> = ({ cuerdas, gallos, torneo, onUpdateTorneo, onStartMatchmaking, onSaveCuerda, onDeleteCuerda, onSaveGallo, onAddBulkGallos, onDeleteGallo, isMatchmaking }) => {
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

    const handlePrintPlanilla = () => {
        const printableContainer = document.querySelector('.printable-planilla-container');
        if (printableContainer) {
            document.body.classList.add('printing-planilla');
            window.print();
            document.body.classList.remove('printing-planilla');
        } else {
            console.error('Error al encontrar la planilla para imprimir.');
        }
    };
    
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 space-y-6">
                    <SectionCard icon={<SettingsIcon />} title="Reglas Del Torneo">
                        <div className="space-y-4">
                            <h4 className="text-md font-semibold text-amber-300">Información del Torneo</h4>
                            <InputField label="Nombre del Torneo" value={torneo.name} onChange={e => onUpdateTorneo({ ...torneo, name: e.target.value })} />
                            <InputField type="date" label="Fecha" value={torneo.date} onChange={e => onUpdateTorneo({ ...torneo, date: e.target.value })} />
                            <div className="pt-2">
                                <button onClick={handlePrintPlanilla} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                                    Imprimir Planilla de Ingreso
                                </button>
                            </div>
                            
                            <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Pesos Permitidos</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                               <InputField type="number" label={`Mínimo (${getWeightUnitAbbr(torneo.weightUnit)})`} value={convertFromGrams(torneo.minWeight, torneo.weightUnit).toFixed(2)} onChange={e => onUpdateTorneo({ ...torneo, minWeight: convertToGrams(Number(e.target.value), torneo.weightUnit) })} step="0.01" />
                               <InputField type="number" label={`Máximo (${getWeightUnitAbbr(torneo.weightUnit)})`} value={convertFromGrams(torneo.maxWeight, torneo.weightUnit).toFixed(2)} onChange={e => onUpdateTorneo({ ...torneo, maxWeight: convertToGrams(Number(e.target.value), torneo.weightUnit) })} step="0.01" />
                           </div>
                           
                           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Tolerancias</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-1">Unidad de Peso</label>
                                    <select value={torneo.weightUnit} onChange={e => onUpdateTorneo({ ...torneo, weightUnit: e.target.value as PesoUnit })} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                                        {Object.values(PesoUnit).map(unit => <option key={unit} value={unit}>{unit.charAt(0).toUpperCase() + unit.slice(1)}</option>)}
                                    </select>
                                </div>
                                <InputField type="number" label={`Peso (g)`} value={torneo.weightTolerance} onChange={e => onUpdateTorneo({ ...torneo, weightTolerance: parseInt(e.target.value) || 0 })} min="0" />
                            </div>
                           <InputField type="number" label="Meses (±, solo pollos)" value={torneo.ageToleranceMonths} onChange={e => onUpdateTorneo({ ...torneo, ageToleranceMonths: parseInt(e.target.value) || 0 })} min="0"/>
                        
                           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Reglas del Torneo por Rondas</h4>
                           <div className="flex items-center justify-between">
                                <span className="font-medium">Habilitar Rondas por Puntos</span>
                                <ToggleSwitch id="rondas-enabled" checked={torneo.rondas.enabled} onChange={e => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, enabled: e.target.checked } })} />
                            </div>
                            {torneo.rondas.enabled && (
                                <div className="space-y-4 pt-4 border-t border-gray-700">
                                     <InputField type="number" label="Gallos por equipo" value={torneo.roostersPerTeam} onChange={e => onUpdateTorneo({ ...torneo, roostersPerTeam: parseInt(e.target.value) || 1 })} min="1"/>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InputField type="number" label="Puntos por Victoria" value={torneo.rondas.pointsForWin} onChange={e => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, pointsForWin: parseInt(e.target.value) || 0 } })} min="0"/>
                                        <InputField type="number" label="Puntos por Empate" value={torneo.rondas.pointsForDraw} onChange={e => onUpdateTorneo({ ...torneo, rondas: { ...torneo.rondas, pointsForDraw: parseInt(e.target.value) || 0 } })} min="0"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-2">Excepciones (equipos que no pelean entre sí)</label>
                                        <ExceptionsManager cuerdas={cuerdas} exceptions={torneo.exceptions} onUpdateExceptions={(newExceptions) => onUpdateTorneo({...torneo, exceptions: newExceptions})} />
                                    </div>
                                </div>
                            )}
                        </div>
                    </SectionCard>
                </div>
                
                {/* --- Columna Derecha: Cuerdas y Gallos --- */}
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
                                                const weightInGrams = convertToGrams(gallo.weight, gallo.weightUnit);
                                                const isUnderWeight = weightInGrams < torneo.minWeight;
                                                const isOverWeight = weightInGrams > torneo.maxWeight;

                                                return (
                                                        <div key={gallo.id} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg">
                                                            <div>
                                                                <p className="font-semibold text-white flex items-center">{gallo.color} 
                                                                {(isUnderWeight || isOverWeight) && <WarningIcon title={isUnderWeight ? 'Peso por debajo del mínimo' : 'Peso por encima del máximo'} className="w-4 h-4 ml-2 text-yellow-400" />}
                                                                </p>
                                                                <p className="text-xs font-mono text-gray-500">{formatWeight(gallo, torneo.weightUnit)} / {gallo.ageMonths}m / {gallo.tipoEdad}</p>
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
                                <PlayIcon className="w-6 h-6 mr-2"/> Iniciar Cotejo
                               </>
                           )}
                        </button>
                        {activeRoosterCount < 2 && <p className="text-xs text-gray-500 mt-2">Se necesitan al menos 2 gallos para empezar.</p>}
                    </div>
                </div>
            </div>

            {/* --- Modals --- */}
            <CuerdaFormModal 
                isOpen={isCuerdaModalOpen} 
                onClose={() => setCuerdaModalOpen(false)} 
                onSave={handleSaveCuerdaClick} 
                cuerda={currentCuerda}
            />
            
            <GalloFormModal 
                isOpen={isGalloModalOpen} 
                onClose={handleCloseGalloModal} 
                onSaveSingle={handleSaveSingleGallo}
                onSaveBulk={handleSaveBulkGallos}
                gallo={currentGallo} 
                cuerdas={cuerdas} 
                torneo={torneo}
            />

             <div className="printable-planilla-container">
                <PrintablePlanilla torneo={torneo} />
            </div>
        </div>
    );
};

export default SetupScreen;