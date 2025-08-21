import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Cuerda, Gallo, Torneo, TipoGallo, TipoEdad } from '../types';
import { SettingsIcon, RoosterIcon, UsersIcon, PlusIcon, TrashIcon, PencilIcon, XIcon, PlayIcon, WarningIcon, ChevronDownIcon, ChevronUpIcon } from './Icons';
import Modal from './Modal';
import { CuerdaFormData } from '../App';
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
  onBlur?: () => void;
  disabled?: boolean;
}
const LbsOzInput: React.FC<LbsOzInputProps> = ({ label, value, onChange, onBlur, disabled = false }) => {
    const [displayValue, setDisplayValue] = useState(formatWeightLbsOz(value));

    useEffect(() => {
        setDisplayValue(formatWeightLbsOz(value));
    }, [value]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setDisplayValue(e.target.value);
    };

    const handleBlur = () => {
        const totalOunces = parseWeightLbsOz(displayValue);
        onChange(totalOunces);
        if (onBlur) onBlur();
    };

    const handleStep = (amount: number) => {
        const newValue = Math.max(0, value + amount);
        onChange(newValue);
    };
    
    const inputId = `input-${label.replace(/\s+/g, '-')}`;

    return (
        <div>
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
            <div className="relative flex items-center">
                <input
                    id={inputId}
                    type="text"
                    value={displayValue}
                    onChange={handleInputChange}
                    onBlur={handleBlur}
                    disabled={disabled}
                    className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-10 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition text-center font-mono disabled:bg-gray-800 disabled:opacity-70 disabled:cursor-not-allowed"
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

interface GalloBulkFormData {
    ringId: string;
    color: string;
    cuerdaId: string;
    weight: number; // total ounces
    ageMonths: string;
    markingId: string;
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

    const initialGalloFormState: GalloBulkFormData = {
        ringId: '', color: '', cuerdaId: '', weight: 0, ageMonths: '', markingId: '', tipoGallo: TipoGallo.LISO, marca: '',
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

    useEffect(() => {
        if (isOpen) {
            if (gallo) { // Single Edit Mode
                setSingleForm({
                    ...gallo
                });
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
        if (!singleForm.cuerdaId || !gallo) return;

        if (!singleForm.marca || !singleForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }

        onSaveSingle({ ...singleForm, marca: Number(singleForm.marca) }, gallo.id);
        onClose();
    };

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
    
    const handleAddStagedGallo = () => {
        const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
        const stagedCount = (stagedGallos[activeTabCuerdaId] || []).length;
        const totalCount = existingCount + stagedCount;
        const limit = torneo.roostersPerTeam;

        if (limit > 0 && totalCount >= limit) {
            const cuerdaName = cuerdas.find(c => c.id === activeTabCuerdaId)?.name || 'Este frente';
            alert(`${cuerdaName} ha alcanzado el límite de ${limit} gallos.`);
            return;
        }
        
        if (!currentGalloForm.marca || !currentGalloForm.ageMonths) {
            alert("Debe seleccionar una Marca y una Edad para el gallo.");
            return;
        }

        const newGalloData: Omit<Gallo, 'id' | 'tipoEdad'> = {
            ringId: currentGalloForm.ringId,
            color: currentGalloForm.color,
            cuerdaId: activeTabCuerdaId,
            weight: currentGalloForm.weight,
            markingId: currentGalloForm.markingId,
            tipoGallo: currentGalloForm.tipoGallo,
            ageMonths: Number(currentGalloForm.ageMonths),
            marca: Number(currentGalloForm.marca),
        };

        setStagedGallos(prev => ({
            ...prev,
            [activeTabCuerdaId]: [...(prev[activeTabCuerdaId] || []), newGalloData]
        }));
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
            if (!groups.has(baseName)) {
                groups.set(baseName, []);
            }
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

    // Moved hook out of renderSingleEditForm to fix conditional hook rendering error
    const ageOptions = useMemo(() => AGE_OPTIONS_BY_MARCA[String(singleForm.marca)] || [], [singleForm.marca]);

    const renderSingleEditForm = () => {
        return (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="ID del Anillo" value={singleForm.ringId || ''} onChange={e => setSingleForm(p => ({...p, ringId: e.target.value}))} required />
                    <InputField label="Color del Gallo" value={singleForm.color || ''} onChange={e => setSingleForm(p => ({...p, color: e.target.value}))} required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1">Cuerda</label>
                    <select value={singleForm.cuerdaId} onChange={e => setSingleForm(p => ({...p, cuerdaId: e.target.value}))} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                        <option value="" disabled>Seleccionar...</option>
                        {[...cuerdas].sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true})).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <LbsOzInput label="Peso (Lb.Oz)" value={singleForm.weight || 0} onChange={v => setSingleForm(p => ({...p, weight: v}))} />
                     <InputField label="Tipo (Pollo/Gallo)" value={singleEditTipoEdad} disabled />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    <div>
                         <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                         <select value={singleForm.ageMonths || ''} onChange={e => setSingleForm(p => ({...p, ageMonths: Number(e.target.value)}))} required disabled={!singleForm.marca || ageOptions.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                             <option value="" disabled>Seleccionar...</option>
                             {ageOptions.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                         </select>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                        <select value={singleForm.tipoGallo} onChange={e => setSingleForm(p => ({...p, tipoGallo: e.target.value as TipoGallo}))} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                            {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <InputField label="Número de Placa (Marcaje)" value={singleForm.markingId} onChange={e => setSingleForm(p => ({...p, markingId: e.target.value}))} required />
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
        <div className="space-y-4">
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
                    
                    <div className="mb-4 space-y-2 max-h-40 overflow-y-auto pr-2">
                        {(stagedGallos[activeTabCuerdaId] || []).map((g, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-700/50 p-2 rounded-lg text-sm">
                                <div><span className="font-bold">{g.color}</span> ({g.ringId})</div>
                                <div className="flex items-center space-x-2">
                                    <span>{formatWeightLbsOz(g.weight, true)} / {g.ageMonths}m</span>
                                    <button onClick={() => handleDeleteStagedGallo(index)} className="p-1 text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4"/></button>
                                </div>
                            </div>
                        ))}
                         {(stagedGallos[activeTabCuerdaId]?.length || 0) === 0 && <p className="text-gray-500 text-center text-sm py-2">Aún no hay gallos para este frente.</p>}
                    </div>

                    {(() => {
                        const existingCount = gallosByCuerda.get(activeTabCuerdaId)?.length || 0;
                        const stagedCount = (stagedGallos[activeTabCuerdaId] || []).length;
                        const isLimitReached = torneo.roostersPerTeam > 0 && (existingCount + stagedCount) >= torneo.roostersPerTeam;
                        
                        return (
                            <div className="p-4 bg-gray-900/50 rounded-lg space-y-4">
                                <h4 className="font-bold text-amber-400">Añadir Gallo al Frente</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <InputField label="ID del Anillo" value={currentGalloForm.ringId} onChange={e => handleBulkFormChange('ringId', e.target.value)} required disabled={isLimitReached}/>
                                    <InputField label="Color del Gallo" value={currentGalloForm.color} onChange={e => handleBulkFormChange('color', e.target.value)} required disabled={isLimitReached}/>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <LbsOzInput label="Peso (Lb.Oz)" value={currentGalloForm.weight} onChange={v => handleBulkFormChange('weight', v)} disabled={isLimitReached}/>
                                    <InputField label="Tipo (Pollo/Gallo)" value={bulkAddTipoEdad} disabled />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                     <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Marca</label>
                                        <select value={currentGalloForm.marca} onChange={e => handleBulkFormChange('marca', e.target.value)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={isLimitReached}>
                                            <option value="" disabled>Seleccionar...</option>
                                            {Object.keys(AGE_OPTIONS_BY_MARCA).sort((a,b) => Number(a) - Number(b)).map(m => <option key={m} value={m}>Marca {m}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Edad</label>
                                        <select value={currentGalloForm.ageMonths} onChange={e => handleBulkFormChange('ageMonths', e.target.value)} required disabled={isLimitReached || !currentGalloForm.marca || ageOptionsForBulk.length <= 1} className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-600">
                                            <option value="" disabled>Seleccionar...</option>
                                            {ageOptionsForBulk.map(opt => <option key={opt.ageMonths} value={opt.ageMonths}>{opt.displayText}</option>)}
                                        </select>
                                    </div>
                                </div>
                                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-400 mb-1">Fenotipo</label>
                                        <select value={currentGalloForm.tipoGallo} onChange={e => handleBulkFormChange('tipoGallo', e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition" disabled={isLimitReached}>
                                            {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <InputField label="Número de Placa" value={currentGalloForm.markingId} onChange={e => handleBulkFormChange('markingId', e.target.value)} required disabled={isLimitReached}/>
                                </div>
                                <button type="button" onClick={handleAddStagedGallo} disabled={isLimitReached || !currentGalloForm.ringId || !currentGalloForm.color || !currentGalloForm.weight} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:bg-gray-500 disabled:cursor-not-allowed">
                                    {isLimitReached ? 'Límite de gallos alcanzado' : 'Añadir Gallo a este Frente'}
                                </button>
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

const PrintablePlanilla: React.FC<{ torneo: Torneo }> = ({ torneo }) => (
    <div id="printable-planilla" className="p-8 space-y-6 bg-white text-black text-lg">
        <div className="text-center border-b-2 border-black pb-4">
            <h1 className="text-4xl font-bold">{torneo.name}</h1>
            <p className="text-2xl mt-2">{torneo.tournamentManager ? `Responsable: ${torneo.tournamentManager}` : ''}</p>
            <p className="text-xl mt-1">{torneo.date}</p>
        </div>
        <div className="space-y-8 pt-4">
            {[
                "Nombre del Criadero:", "Dueño de los gallos:", "Frente:", "ID del Anillo:", "Número de Placa (Marcaje):", "Color del Gallo:",
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
    initialTorneo: Torneo;
    cuerdas: Cuerda[];
    onUpdateTorneo: (updatedTorneo: Torneo) => void;
    onPrintPlanilla: () => void;
}> = React.memo(({ initialTorneo, cuerdas, onUpdateTorneo, onPrintPlanilla }) => {
    
    const [formData, setFormData] = useState(initialTorneo);
    const [exceptionCuerda1, setExceptionCuerda1] = useState('');
    const [exceptionCuerda2, setExceptionCuerda2] = useState('');

    useEffect(() => {
        setFormData(initialTorneo);
    }, [initialTorneo]);

    const handleBlur = () => {
        onUpdateTorneo(formData);
    };

    const handleChange = (field: keyof Torneo, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleUpdate = (newFormData: Torneo) => {
        setFormData(newFormData);
        onUpdateTorneo(newFormData);
    };
    
    const handleAddException = () => {
        if (exceptionCuerda1 && exceptionCuerda2 && exceptionCuerda1 !== exceptionCuerda2) {
            const newException = { cuerda1Id: exceptionCuerda1, cuerda2Id: exceptionCuerda2 };
            const newFormData = { ...formData, exceptions: [...formData.exceptions, newException] };
            handleUpdate(newFormData);
            setExceptionCuerda1('');
            setExceptionCuerda2('');
        }
    };

    const handleRemoveException = (index: number) => {
        const newExceptions = formData.exceptions.filter((_, i) => i !== index);
        const newFormData = { ...formData, exceptions: newExceptions };
        handleUpdate(newFormData);
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
            <InputField label="Nombre del Torneo" value={formData.name} onChange={e => handleChange('name', e.target.value)} onBlur={handleBlur} />
            <InputField label="Responsable del Torneo" value={formData.tournamentManager || ''} onChange={e => handleChange('tournamentManager', e.target.value)} onBlur={handleBlur} />
            <InputField type="date" label="Fecha" value={formData.date} onChange={e => handleChange('date', e.target.value)} onBlur={handleBlur} />
            <div className="pt-2">
                <button onClick={onPrintPlanilla} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg">
                    Imprimir Planilla de Ingreso
                </button>
            </div>
            
           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Tolerancias</h4>
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <LbsOzInput 
                label="Tolerancia de Peso (± Onza)" 
                value={formData.weightTolerance} 
                onChange={v => handleChange('weightTolerance', v)} 
                onBlur={handleBlur} 
              />
              <InputField type="number" label="Tolerancia de Meses (±) (solo pollos)" value={formData.ageToleranceMonths} onChange={e => handleChange('ageToleranceMonths', parseInt(e.target.value) || 0)} onBlur={handleBlur} min="0"/>
           </div>
           
           <h4 className="text-md font-semibold text-amber-300 mt-4 border-t border-gray-700 pt-4">Pesos Permitidos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <LbsOzInput label="Mínimo (Lb.Oz)" value={formData.minWeight} onChange={v => handleChange('minWeight', v)} onBlur={handleBlur} />
               <LbsOzInput label="Máximo (Lb.Oz)" value={formData.maxWeight} onChange={v => handleChange('maxWeight', v)} onBlur={handleBlur} />
           </div>

           <div className="border-t border-gray-700 pt-4 mt-4">
                <h4 className="text-md font-semibold text-amber-300">Reglas del Torneo por Frentes</h4>
                <div className="space-y-4 mt-2">
                    <InputField type="number" label="Gallos por Frente" value={formData.roostersPerTeam} onChange={e => handleChange('roostersPerTeam', parseInt(e.target.value) || 0)} onBlur={handleBlur} min="0"/>
                    <InputField type="number" label="Puntos por Victoria" value={formData.pointsForWin} onChange={e => handleChange('pointsForWin', parseInt(e.target.value) || 0)} onBlur={handleBlur} min="0"/>
                    <InputField type="number" label="Puntos por Empate" value={formData.pointsForDraw} onChange={e => handleChange('pointsForDraw', parseInt(e.target.value) || 0)} onBlur={handleBlur} min="0"/>
                
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Excepciones (Cuerdas que no pelean entre sí)</label>
                        <div className="space-y-2">
                           {formData.exceptions.map((ex, index) => (
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
                    <SectionCard icon={<SettingsIcon />} title="Reglas Del Torneo">
                       <TournamentRulesForm
                           initialTorneo={torneo}
                           cuerdas={cuerdas}
                           onUpdateTorneo={onUpdateTorneo}
                           onPrintPlanilla={handlePrintPlanilla}
                       />
                    </SectionCard>
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
                        <button 
                            onClick={onStartMatchmaking} 
                            disabled={isMatchmaking || activeRoosterCount < 2}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-10 rounded-lg text-lg transition-all transform hover:scale-105 shadow-lg disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center mx-auto"
                        >
                           {isMatchmaking ? (
                                <>
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
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
            />
             <div className="printable-planilla-container">
                <PrintablePlanilla torneo={torneo} />
            </div>
        </div>
    );
};

export default SetupScreen;