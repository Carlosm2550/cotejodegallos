


import React, { useState, useEffect, useMemo } from 'react';
import { Gallo, Cuerda, TipoGallo } from '../types';
import Modal from './Modal';
import { TrashIcon } from './Icons';

// --- UTILITY COMPONENTS & FUNCTIONS ---

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
const InputField: React.FC<InputFieldProps> = ({ label, id, type, ...props }) => {
  const inputId = id || `input-${label.replace(/\s+/g, '-')}`;
  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-gray-400 mb-1">{label}</label>
      <input id={inputId} type={type} {...props} className={`w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition disabled:bg-gray-800 disabled:cursor-not-allowed`} />
    </div>
  );
};

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


interface EditLeftoverGalloModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUpdate: (galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => void;
    onDeleteCuerda: (cuerdaId: string) => void;
    gallo: Gallo | null;
    cuerdas: Cuerda[];
}

const EditLeftoverGalloModal: React.FC<EditLeftoverGalloModalProps> = ({
    isOpen,
    onClose,
    onUpdate,
    onDeleteCuerda,
    gallo,
    cuerdas,
}) => {
    const [ringId, setRingId] = useState('');
    const [color, setColor] = useState('');
    const [ageMonths, setAgeMonths] = useState(1);
    const [markingId, setMarkingId] = useState('');
    const [tipoGallo, setTipoGallo] = useState<TipoGallo>(TipoGallo.LISO);
    const [confirmDeleteCuerda, setConfirmDeleteCuerda] = useState(false);
    const [marca, setMarca] = useState(0);
    const [weight, setWeight] = useState(0); // weight in total ounces

    const cuerda = useMemo(() => gallo ? cuerdas.find(c => c.id === gallo.cuerdaId) : null, [gallo, cuerdas]);

    useEffect(() => {
        if (isOpen && gallo) {
            setRingId(gallo.ringId || '');
            setColor(gallo.color || '');
            setWeight(gallo.weight || 0);
            setAgeMonths(gallo.ageMonths || 1);
            setMarkingId(gallo.markingId || '');
            setTipoGallo(gallo.tipoGallo || TipoGallo.LISO);
            setMarca(gallo.marca || 0);
            setConfirmDeleteCuerda(false); // Reset on open
        }
    }, [isOpen, gallo]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!gallo) return;
        
        onUpdate(
            { ringId, color, cuerdaId: gallo.cuerdaId, weight, ageMonths, markingId, tipoGallo, marca },
            gallo.id
        );
        onClose();
    };

    const handleDeleteClick = () => {
        if (!confirmDeleteCuerda || !cuerda) {
            console.error('Debe confirmar para eliminar la cuerda.');
            return;
        }
        onDeleteCuerda(cuerda.id);
        onClose();
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Editar Gallo: ${gallo?.color}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <InputField label="ID del Anillo" value={ringId} onChange={e => setRingId(e.target.value)} required />
                    <InputField label="Color del Gallo" value={color} onChange={e => setColor(e.target.value)} required />
                </div>
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-400 mb-1">Tipo de Gallo</label>
                        <select value={tipoGallo} onChange={e => setTipoGallo(e.target.value as TipoGallo)} required className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition">
                             {Object.values(TipoGallo).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                     <div>
                        <InputField label="Cuerda" value={cuerda?.name || 'N/A'} disabled />
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                     <InputField label="Peso" value={formatWeightLbsOz(weight)} disabled />
                     <InputField type="number" label="Meses" value={ageMonths} onChange={e => setAgeMonths(Number(e.target.value))} required min="1" />
                     <InputField label="Número de Placa (Marcaje)" value={markingId} onChange={e => setMarkingId(e.target.value)} />
                </div>
                
                <div className="border-t border-red-500/30 pt-4 mt-6 space-y-3">
                     <label htmlFor="deleteCuerda" className="flex items-center space-x-3 cursor-pointer">
                        <input
                            id="deleteCuerda"
                            type="checkbox"
                            checked={confirmDeleteCuerda}
                            onChange={(e) => setConfirmDeleteCuerda(e.target.checked)}
                            className="w-5 h-5 rounded text-red-600 bg-gray-900 border-gray-500 focus:ring-red-500 focus:ring-offset-gray-800"
                        />
                         <span className="text-sm text-gray-300">
                             Confirmas que deseas eliminar la cuerda <span className="font-bold text-red-400">{cuerda?.name}</span>. Esto eliminará a todos sus gallos, incluyendo a <span className="font-bold text-white">{gallo?.color}</span>, del torneo. Esta acción no se puede deshacer.
                         </span>
                     </label>
                </div>

                <div className="flex justify-between items-center pt-4 border-t border-gray-700">
                    <div>
                        <button 
                            type="button" 
                            onClick={handleDeleteClick}
                            disabled={!confirmDeleteCuerda}
                            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-600"
                        >
                            <TrashIcon className="w-5 h-5" />
                            Eliminar
                        </button>
                    </div>
                    <div className="flex space-x-2">
                        <button type="button" onClick={onClose} className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-gray-900 font-bold py-2 px-4 rounded-lg">Guardar Cambios</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default EditLeftoverGalloModal;