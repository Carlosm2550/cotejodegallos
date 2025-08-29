import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Cuerda, Gallo, Torneo, TipoGallo, TipoEdad } from '../types';
import { TrashIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon } from './Icons';
import Modal from './Modal';
import { AGE_OPTIONS_BY_MARCA } from '../constants';

// --- Lbs.Oz Weight Conversion Utilities ---
const OUNCES_PER_POUND = 16;

const toLbsOz = (totalOunces: number) => {
    if (isNaN(totalOunces) || totalOunces < 0) return { lbs: 0, oz: 0 };
    const total = Math.round(totalOunces); // Work with integers to avoid floating point issues
    const lbs = Math.floor(total / OUNCES_PER_POUND);
    const oz = total % OUNCES_PER_POUND;
    return { lbs, oz };
};

const fromLbsOz = (lbs: number, oz: number) => {
    return Math.round((lbs * OUNCES_PER_POUND) + oz);
};

const formatWeightLbsOz = (totalOunces: number, withUnit = false): string => {
    const { lbs, oz } = toLbsOz(totalOunces);
    const unit = withUnit ? ' Lb.Oz' : '';
    return `${lbs}.${String(oz).padStart(2, '0')}${unit}`;
};

const parseWeightLbsOz = (value: string): number => {
    const cleanValue = value.replace(/[^0-9.]/g, '');
    const parts = cleanValue.split('.');
    let lbs = parseInt(parts[0], 10) || 0;
    let oz_input = parts[1] || '0';
    // Ensure oz part is treated as an integer, not octal, and handle partial input like "3."
    let oz = parseInt(oz_input, 10) || 0;

    if (oz >= OUNCES_PER_POUND) {
        lbs += Math.floor(oz / OUNCES_PER_POUND);
        oz = oz % OUNCES_PER_POUND;
    }
    
    return fromLbsOz(lbs, oz);
};


// --- HELPER & UI COMPONENTS ---
interface LbsOzInputProps {
  label: string;
  value: number; // Total ounces
  onChange: (newValue: number) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  validator?: (value: number) => boolean; // Optional validator function
}
export const LbsOzInput: React.FC<LbsOzInputProps> = ({ label, value, onChange, onBlur, disabled = false, validator }) => {
    const [displayValue, setDisplayValue] = useState(formatWeightLbsOz(value));
    const [isValid, setIsValid] = useState(true);

    useEffect(() => {
        // When the external value changes, reformat it and update validity.
        setDisplayValue(formatWeightLbsOz(value));
        setIsValid(validator ? validator(value) : true);
    }, [value, validator]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleBlurInternal = (e: React.FocusEvent<HTMLInputElement>) => {
        const totalOunces = parseWeightLbsOz(displayValue);
        const currentValidity = validator ? validator(totalOunces) : true;
        
        setIsValid(currentValidity);
        onChange(totalOunces); // Always update with the corrected/parsed value.
        
        if (onBlur) onBlur(e);
    };

    const handleStep = (amount: number) => {
        const newValue = Math.max(0, value + amount);
        onChange(newValue);
    };
    
    const inputId = `input-${label.replace(/\s+/g, '-')}`;
    const validityClasses = !isValid 
        ? 'border-red-500 text-red-400 focus:ring-red-500 focus:border-red-500' 
        : 'border-gray-600 focus:ring-amber-500 focus:border-amber-500';

    return (
        <div>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative flex items-center">
                <input
                    id={inputId}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlurInternal}
                    disabled={disabled}
                    className={`w-full bg-gray-700 border text-white rounded-lg px-10 py-2 focus:ring-2 outline-none transition text-center font-mono disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed ${validityClasses}`}
                    inputMode="decimal"
                />
                <div className="absolute right-2 flex flex-col space-y-1">
                    <button type="button" onClick={() => handleStep(1)} disabled={disabled} className="text-gray-400 hover:text-white h-4 flex items-center justify-center rounded-sm bg-gray-600/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronUpIcon className="w-4 h-4"/></button>
                    <button type="button" onClick={() => handleStep(-1)} disabled={disabled} className="text-gray-400 hover:text-white h-4 flex items-center justify-center rounded-sm bg-gray-600/50 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"><ChevronDownIcon className="w-4 h-4"/></button>
                </div>
            </div>
        </div>
    );
};

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  wrapperClassName?: string;
}
export const InputField: React.FC<InputFieldProps> = ({ label, id, type, wrapperClassName, ...props }) => {
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


interface GalloBulkFormData {
    ringId: string;
    color: string;
    cuerdaId: string;
    weight: number; // total ounces
    ageMonths: string;
    markingId: string;
    breederPlateId: string;
    tipoGallo: TipoGallo;
    marca: string;
}

const GalloFormModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSaveSingle: (gallo: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void; 
    onSaveBulk: (gallos: Omit<Gallo, 'id' | 'tipoEdad'>[]) => void;
    gallo: Gallo | null;
    cuerdas: Cuerda[];
    gallos: Gallo[];
    torneo: Torneo;
}> = ({ isOpen, onClose, onSaveSingle, onSaveBulk, gallo, cuerdas, gallos, torneo }) => {
    
    // --- State for Single Edit Mode ---
    const [singleForm, setSingleForm] = useState<Omit<Gallo, 'id' | 'tipoEdad'>>({} as any);
    
    // --- State for Bulk Add Mode ---
    const [selectedCuerdaId, setSelectedCuerdaId] = useState('');
    const [activeTabCuerdaId, setActiveTabCuerdaId] = useState('');
    const [stagedGallos, setStagedGallos] = useState<Record<string, Omit<Gallo, 'id' | 'tipoEdad'>[]>>({});
    const [editingStagedIndex, setEditingStagedIndex] = useState<number | null>(null);

    const initialGalloFormState: GalloBulkFormData = {
        ringId: '', color: '', cuerdaId: '', weight: 0, ageMonths: '', markingId: '', breederPlateId: '', tipoGallo: TipoGallo.LISO, marca: '',
    };
    const [currentGalloForm, setCurrentGalloForm] = useState<GalloBulkFormData>(initialGalloFormState);
    
    const singleEditTipoEdad = useMemo(() => (Number(singleForm.ageMonths) >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO), [singleForm.ageMonths]);
    const bulkAddTipoEdad = useMemo(() => (Number(currentGalloForm.ageMonths) >= 12 ? TipoEdad.GALLO : TipoEdad.POLLO), [currentGalloForm.ageMonths]);
    const gallosByCuerda = useMemo(() => {
        const grouped = new Map<string, Gallo[]>();
        (gallos || []).forEach(gallo => {
            const list = grouped.get(gallo.cuerdaId) || [];
            list.push(gallo);
            grouped.set(gallo.cuerdaId, list);
        });
        return grouped;
    }, [gallos]);

    const handleFormKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.target as HTMLElement).nodeName === 'INPUT') {
            e.preventDefault();
        }
    };

    const isWeightInTournamentRange = useCallback((weightInOunces: number) => {
        if (!torneo || weightInOunces === 0) return false;
        return weightInOunces >= torneo.minWeight && weightInOunces <= torneo.maxWeight;
    }, [torneo]);

    useEffect(() => {
        if (isOpen) {
            if (gallo) { // Single Edit Mode
                setSingleForm({ ...gallo });
            } else { // Bulk Add Mode Reset
                setSelectedCuerdaId('');
                setActiveTabCuerdaId('');
                setStagedGallos({});
                setCurrentGalloForm(initialGalloFormState);
                setEditingStagedIndex(null);
            }
        }
    }, [isOpen, gallo]);
    
    const handleSingleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!singleForm.cuerdaId || !gallo) return;

        if (!singleForm.marca || !singleForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }
        if (!isWeightInTournamentRange(singleForm.weight)) {
            alert(`El peso del gallo (${formatWeightLbsOz(singleForm.weight, true)}) debe estar entre ${formatWeightLbsOz(torneo.minWeight, true)} y ${formatWeightLbsOz(torneo.maxWeight, true)}.`);
            return;
        }

        const finalData = { ...singleForm, marca: Number(singleForm.marca), breederPlateId: singleForm.breederPlateId?.trim() || 'N/A' };
        onSaveSingle(finalData, gallo.id);
        onClose();
    };

    const handleCuerdaSelectionChange = (baseCuerdaId: string) => {
        setSelectedCuerdaId(baseCuerdaId);
        setActiveTabCuerdaId(baseCuerdaId);
        setStagedGallos({});
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: baseCuerdaId });
        setEditingStagedIndex(null);
    };

    const handleTabClick = (cuerdaId: string) => {
        setActiveTabCuerdaId(cuerdaId);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId });
        setEditingStagedIndex(null);
    };

    const handleBulkFormChange = (field: keyof GalloBulkFormData, value: string | number) => {
        const newFormState = { ...currentGalloForm, [field]: String(value) };
        if (field === 'marca') {
            const marcaValue = String(value);
            const ageOptions = AGE_OPTIONS_BY_MARCA[marcaValue] || [];
            if (ageOptions.length === 1) {
                newFormState.ageMonths = String(ageOptions[0].ageMonths);
            } else {
                newFormState.ageMonths = ''; 
            }
        }
        setCurrentGalloForm(newFormState);
    };
    
    const handleSaveOrAddStagedGallo = () => {
        const isEditing = editingStagedIndex !== null;
        if (!isEditing) {
            const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
            const stagedCount = (stagedGallos[activeTabCuerdaId] || []).length;
            const totalCount = existingCount + stagedCount;
            const limit = torneo.roostersPerTeam;

            if (limit > 0 && totalCount >= limit) {
                const cuerdaName = cuerdas.find(c => c.id === activeTabCuerdaId)?.name || 'Este frente';
                alert(`${cuerdaName} ha alcanzado el límite de ${limit} gallos.`);
                return;
            }
        }
        
        if (!currentGalloForm.marca || !currentGalloForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }
        if (!isWeightInTournamentRange(currentGalloForm.weight)) {
            alert(`El peso del gallo (${formatWeightLbsOz(currentGalloForm.weight, true)}) debe estar entre ${formatWeightLbsOz(torneo.minWeight, true)} y ${formatWeightLbsOz(torneo.maxWeight, true)}.`);
            return;
        }

        const newGalloData: Omit<Gallo, 'id' | 'tipoEdad'> = {
            ringId: currentGalloForm.ringId, color: currentGalloForm.color, cuerdaId: activeTabCuerdaId, weight: currentGalloForm.weight,
            markingId: currentGalloForm.markingId, breederPlateId: currentGalloForm.breederPlateId?.trim() || 'N/A', tipoGallo: currentGalloForm.tipoGallo,
            ageMonths: Number(currentGalloForm.ageMonths), marca: Number(currentGalloForm.marca),
        };

        if (isEditing) {
            const updatedStaged = [...(stagedGallos[activeTabCuerdaId] || [])];
            updatedStaged[editingStagedIndex] = newGalloData;
            setStagedGallos(prev => ({ ...prev, [activeTabCuerdaId]: updatedStaged }));
        } else {
            setStagedGallos(prev => ({ ...prev, [activeTabCuerdaId]: [...(prev[activeTabCuerdaId] || []), newGalloData] }));
        }
        setEditingStagedIndex(null);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: activeTabCuerdaId });
    };

    const handleEditStagedClick = (index: number) => {
        const roosterToEdit = stagedGallos[activeTabCuerdaId][index];
        setCurrentGalloForm({
            ...roosterToEdit, ageMonths: String(roosterToEdit.ageMonths), marca: String(roosterToEdit.marca),
        });
        setEditingStagedIndex(index);
    };

    const handleCancelEdit = () => {
        setEditingStagedIndex(null);
        setCurrentGalloForm({ ...initialGalloFormState, cuerdaId: activeTabCuerdaId });
    };

    const handleDeleteStagedGallo = (indexToDelete: number) => {
        setStagedGallos(prev => ({
            ...prev,
            [activeTabCuerdaId]: (prev[activeTabCuerdaId] || []).filter((_, index) => index !== indexToDelete)
        }));
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
            if (!groups.has(baseName)) { groups.set(baseName, []); }
            groups.get(baseName)!.push(c);
        });
        
        return Array.from(groups.entries()).map(([baseName, fronts]) => {
            fronts.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
            const frontLabels = fronts.map(f => f.name.match(/\(F\d+\)/)?.[0] || '').join(' ');
            return { id: fronts[0].id, displayText: `${baseName} ${frontLabels}`.trim() };
        }).sort((a,b) => a.displayText.localeCompare(b.displayText));
    }, [cuerdas]);

    const frontsForSelectedCuerda = useMemo(() => {
        if (!selectedCuerdaId) return [];
        const selected = cuerdas.find(c => c.id === selectedCuerdaId);
        if (!selected) return [];
        const baseName = selected.name.replace(/\s\(F\d+\)$/, '').trim();
        return cuerdas.filter(c => c.name.replace(/\s\(F\d+\)$/, '').trim() === baseName)
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    }, [selectedCuerdaId, cuerdas]);

    const ageOptions = useMemo(() => AGE_OPTIONS_BY_MARCA[String(singleForm.marca)] || [], [singleForm.marca]);
    
    const renderSingleEditForm = () => {
        return (
            <form onSubmit={handleSingleSubmit} onKeyDown={handleFormKeyDown} className="space-y-4">
                <h4 className="text-lg font-semibold text-amber-300 mb-2">Cuerda: {cuerdas.find(c => c.id === singleForm.cuerdaId)?.name || ''}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField label="ID del Anillo (A)" value={singleForm.ringId || ''} onChange={e => setSingleForm(p => ({...p, ringId: e.target.value}))} required />
                    <InputField label="Número de Placa Marcaje (Pm)" value={singleForm.markingId || ''} onChange={e => setSingleForm(p => ({...p, markingId: e.target.value}))} required />
                    <InputField label="Placa del Criadero (Pc)" value={singleForm.breederPlateId === 'N/A' ? '' : singleForm.breederPlateId || ''} onChange={e => setSingleForm(p => ({...p, breederPlateId: e.target.value}))} placeholder="N/A si se deja vacío" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <InputField label="Color del Gallo" value={singleForm.color || ''} onChange={e => setSingleForm(p => ({...p, color: e.target.value}))} required />
                    <LbsOzInput label="Peso (Lb.Oz)" value={singleForm.weight || 0} onChange={v => setSingleForm(p => ({...p, weight: v}))} validator={isWeightInTournamentRange} />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                        <select value={singleForm.marca || ''} onChange={e => {
                            const newMarca = e.target.value;
                            const options = AGE_OPTIONS_BY_MARCA[newMarca] || [];
                            setSingleForm(p => ({ ...p, marca: Number(newMarca), ageMonths: options.length > 0 ? options[0].ageMonths : 0 }));
                         }} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                            <option value="" disabled>Seleccionar...</option>
                            {Object.keys(AGE_OPTIONS_BY_MARCA).sort((a,b) => Number(a) - Number(b)).map(m => <option key={m} value={m}>Marca {m}</option>)}
                        </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                         <select value={singleForm.ageMonths || ''} onChange={e => setSingleForm(p => ({...p, ageMonths: Number(e.target.value)}))} required disabled={!singleForm.marca || ageOptions.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                             <option value="" disabled>Seleccionar...</option>
                             {ageOptions.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                         </select>
                    </div>
                    <InputField label="Tipo (Pollo/Gallo)" value={singleEditTipoEdad} disabled />
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                        <select value={singleForm.tipoGallo} onChange={e => setSingleForm(p => ({...p, tipoGallo: e.target.value as TipoGallo}))} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                            {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                    <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                    <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                </div>
            </form>
        )
    };

    const renderBulkAddForm = () => {
      const ageOptionsForBulk = AGE_OPTIONS_BY_MARCA[currentGalloForm.marca] || [];
      return (
        <div className="space-y-4" onKeyDown={handleFormKeyDown}>
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                <select value={selectedCuerdaId} onChange={e => handleCuerdaSelectionChange(e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                    <option value="" disabled>Seleccionar...</option>
                    {groupedBaseCuerdas.map(group => (<option key={group.id} value={group.id}>{group.displayText}</option>))}
                </select>
            </div>

            {selectedCuerdaId && (
                <div>
                    <div className="flex border-b border-gray-600 mb-4 flex-wrap">
                        {frontsForSelectedCuerda.map((front, index) => {
                            const existingCount = gallosByCuerda.get(front.id)?.length || 0;
                            const stagedCount = stagedGallos[front.id]?.length || 0;
                            const totalCount = existingCount + stagedCount;
                            const limit = torneo.roostersPerTeam;
                            const tabText = limit > 0 ? `F${index + 1} (${totalCount}/${limit})` : `F${index + 1} (${totalCount})`;
                            return (
                                <button key={front.id} onClick={() => handleTabClick(front.id)} className={`py-2 px-4 text-sm font-medium transition-colors ${activeTabCuerdaId === front.id ? 'border-b-2 border-amber-500 text-amber-400' : 'text-gray-400 hover:text-white'}`}>
                                    {tabText}
                                </button>
                            );
                        })}
                    </div>
                    
                    <div className="mb-4 space-y-2 max-h-20 overflow-y-auto pr-2">
                        {(stagedGallos[activeTabCuerdaId] || []).map((g, index) => {
                             const tipoEdad = g.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
                             const fullDescription = `${g.color}: A:${g.ringId} / Pm:${g.markingId} / Pc:${g.breederPlateId} / Marca:${g.marca} / ${tipoEdad} / ${g.tipoGallo}`;
                             return (
                                <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg text-sm">
                                    <p className="text-white truncate flex-grow text-xs" title={fullDescription}>
                                        <span className="font-bold text-amber-400">{g.color}</span>: A:{g.ringId} / Pm:{g.markingId} / Pc:{g.breederPlateId} / Marca:{g.marca} / {tipoEdad} / {g.tipoGallo}
                                    </p>
                                    <div className="flex items-center space-x-1 flex-shrink-0 ml-2">
                                        <button onClick={() => handleEditStagedClick(index)} className="p-1 text-gray-400 hover:text-amber-400"><PencilIcon className="w-4 h-4"/></button>
                                        <button onClick={() => handleDeleteStagedGallo(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                    </div>
                                </div>
                            )
                        })}
                         {(stagedGallos[activeTabCuerdaId]?.length || 0) === 0 && <p className="text-gray-500 text-center text-sm py-2">Aún no hay gallos para este frente.</p>}
                    </div>

                    {(() => {
                        const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
                        const stagedCount = (stagedGallos[activeTabCuerdaId] || []).length;
                        const isLimitReached = torneo.roostersPerTeam > 0 && (existingCount + stagedCount) >= torneo.roostersPerTeam;
                        const isEditing = editingStagedIndex !== null;
                        
                        return (
                            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                                <h4 className="font-bold text-amber-400">{isEditing ? `Editando Gallo: ${currentGalloForm.color}` : 'Añadir Gallo al Frente'}</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <InputField label="ID del Anillo (A)" value={currentGalloForm.ringId} onChange={e => handleBulkFormChange('ringId', e.target.value)} required disabled={isLimitReached && !isEditing}/>
                                    <InputField label="Número de Placa Marcaje (Pm)" value={currentGalloForm.markingId} onChange={e => handleBulkFormChange('markingId', e.target.value)} required disabled={isLimitReached && !isEditing}/>
                                    <InputField label="Placa del Criadero (Pc)" value={currentGalloForm.breederPlateId} onChange={e => handleBulkFormChange('breederPlateId', e.target.value)} placeholder="N/A si se deja vacío" disabled={isLimitReached && !isEditing}/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <InputField label="Color del Gallo" value={currentGalloForm.color} onChange={e => handleBulkFormChange('color', e.target.value)} required disabled={isLimitReached && !isEditing}/>
                                    <LbsOzInput label="Peso (Lb.Oz)" value={currentGalloForm.weight} onChange={v => handleBulkFormChange('weight', v)} disabled={isLimitReached && !isEditing} validator={isWeightInTournamentRange} />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                                        <select value={currentGalloForm.marca} onChange={e => handleBulkFormChange('marca', e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={isLimitReached && !isEditing}>
                                            <option value="" disabled>Seleccionar...</option>
                                            {Object.keys(AGE_OPTIONS_BY_MARCA).sort((a,b) => Number(a) - Number(b)).map(m => <option key={m} value={m}>Marca {m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                                        <select value={currentGalloForm.ageMonths} onChange={e => handleBulkFormChange('ageMonths', e.target.value)} required disabled={isLimitReached && !isEditing || !currentGalloForm.marca || ageOptionsForBulk.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                                            <option value="" disabled>Seleccionar...</option>
                                            {ageOptionsForBulk.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                                        </select>
                                    </div>
                                    <InputField label="Tipo (Pollo/Gallo)" value={bulkAddTipoEdad} disabled />
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                                        <select value={currentGalloForm.tipoGallo} onChange={e => handleBulkFormChange('tipoGallo', e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={isLimitReached && !isEditing}>
                                            {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center justify-end space-x-2">
                                    {isEditing && (
                                        <button type="button" onClick={handleCancelEdit} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">
                                            Cancelar
                                        </button>
                                    )}
                                    <button type="button" onClick={handleSaveOrAddStagedGallo} disabled={(isLimitReached && !isEditing) || !currentGalloForm.ringId || !currentGalloForm.color || currentGalloForm.weight === 0} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                        {isLimitReached && !isEditing ? 'Límite de gallos alcanzado' : isEditing ? 'Guardar Cambios' : 'Añadir Gallo a este Frente'}
                                    </button>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
            
            <div className="flex justify-end pt-4 space-x-2 border-t border-gray-700 mt-6">
                <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                <button type="button" onClick={handleBulkSubmit} className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Todo y Cerrar</button>
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

export default GalloFormModal;