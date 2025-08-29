

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen, Cuerda, Gallo, Pelea, Torneo, MatchmakingResults, TipoGallo, TipoEdad, Notification } from './types';
import { TrophyIcon } from './components/Icons';

import SetupScreen from './components/SetupScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import LiveFightScreen from './components/LiveFightScreen';
import ResultsScreen from './components/ResultsScreen';
import { processDemoData } from './demo-data';
import Toaster from './components/Toaster';

// --- TYPE DEFINITIONS ---
export interface CuerdaFormData {
    name: string;
    owner: string;
    frontCount: number;
}

// --- UTILITY FUNCTIONS ---
const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => (lbs * OUNCES_PER_POUND) + oz;

// --- MATCHMAKING ALGORITHM ---
const findMaximumPairs = (
    roostersToMatch: Gallo[],
    torneo: Torneo,
    cuerdas: Cuerda[]
): { fights: Pelea[], leftovers: Gallo[] } => {
    
    const getBaseCuerdaId = (cuerdaId: string): string => {
        const cuerda = cuerdas.find(c => c.id === cuerdaId);
        return cuerda?.baseCuerdaId || cuerda?.id || '';
    };

    const areExceptions = (cuerdaId1: string, cuerdaId2: string): boolean => {
        const baseId1 = getBaseCuerdaId(cuerdaId1);
        const baseId2 = getBaseCuerdaId(cuerdaId2);
        return torneo.exceptions.some(ex => 
            (ex.cuerda1Id === baseId1 && ex.cuerda2Id === baseId2) ||
            (ex.cuerda1Id === baseId2 && ex.cuerda2Id === baseId1)
        );
    };

    const potentialFights: { roosterA: Gallo; roosterB: Gallo; weightDiff: number; ageDiff: number }[] = [];

    for (let i = 0; i < roostersToMatch.length; i++) {
        for (let j = i + 1; j < roostersToMatch.length; j++) {
            const roosterA = roostersToMatch[i];
            const roosterB = roostersToMatch[j];

            if (roosterA.tipoGallo !== roosterB.tipoGallo) continue;

            const baseCuerdaA = getBaseCuerdaId(roosterA.cuerdaId);
            const baseCuerdaB = getBaseCuerdaId(roosterB.cuerdaId);
            if (baseCuerdaA === baseCuerdaB) continue;

            if (areExceptions(roosterA.cuerdaId, roosterB.cuerdaId)) continue;
            
            const weightDiff = Math.abs(roosterA.weight - roosterB.weight);
            if (weightDiff > torneo.weightTolerance) continue;

            const ageDiff = Math.abs(roosterA.ageMonths - roosterB.ageMonths);
            if (ageDiff > torneo.ageToleranceMonths) continue;
            
            potentialFights.push({ roosterA, roosterB, weightDiff, ageDiff });
        }
    }

    potentialFights.sort((a, b) => {
        if (a.weightDiff !== b.weightDiff) return a.weightDiff - b.weightDiff;
        return a.ageDiff - b.ageDiff;
    });

    const fights: Pelea[] = [];
    const pairedRoosterIds = new Set<string>();
    let fightNumberCounter = 1;

    for (const potentialFight of potentialFights) {
        const { roosterA, roosterB } = potentialFight;
        
        if (!pairedRoosterIds.has(roosterA.id) && !pairedRoosterIds.has(roosterB.id)) {
            fights.push({
                id: `pelea-${roosterA.id}-${roosterB.id}`,
                fightNumber: fightNumberCounter++,
                roosterA,
                roosterB,
                winner: null,
                duration: null,
            });
            pairedRoosterIds.add(roosterA.id);
            pairedRoosterIds.add(roosterB.id);
        }
    }

    const leftovers = roostersToMatch.filter(g => !pairedRoosterIds.has(g.id));

    return { fights, leftovers };
};

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
    const [screen, setScreen] = useState<Screen>(Screen.SETUP);
    const [cuerdas, setCuerdas] = useState<Cuerda[]>([]);
    const [gallos, setGallos] = useState<Gallo[]>([]);
    const [torneo, setTorneo] = useState<Torneo>({
        name: 'Nuevo Torneo',
        date: new Date().toISOString().split('T')[0],
        weightTolerance: 1, // 1 ounce
        ageToleranceMonths: 1,
        minWeight: fromLbsOz(2, 10),
        maxWeight: fromLbsOz(5, 0),
        roostersPerTeam: 2,
        pointsForWin: 3,
        pointsForDraw: 1,
        exceptions: [],
    });
    const [peleas, setPeleas] = useState<Pelea[]>([]);
    const [matchmakingResults, setMatchmakingResults] = useState<MatchmakingResults | null>(null);
    const [isMatchmaking, setIsMatchmaking] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    
    const addNotification = useCallback((message: string, type: Notification['type'] = 'info', duration = 3000) => {
        const id = Date.now() + Math.random();
        setNotifications(prev => [...prev, { id, message, type }]);
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, duration);
    }, []);

    const dismissNotification = (id: number) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    useEffect(() => {
        try {
            const savedCuerdas = localStorage.getItem('galleraPro_cuerdas');
            const savedGallos = localStorage.getItem('galleraPro_gallos');
            const savedTorneo = localStorage.getItem('galleraPro_torneo');
            
            if (savedCuerdas && savedGallos && savedTorneo) {
                setCuerdas(JSON.parse(savedCuerdas));
                setGallos(JSON.parse(savedGallos));
                setTorneo(JSON.parse(savedTorneo));
            } else {
                const { cuerdas: demoCuerdas, gallos: demoGallos } = processDemoData();
                setCuerdas(demoCuerdas);
                setGallos(demoGallos);
            }
        } catch (error) {
            console.error("Failed to load data from localStorage", error);
            addNotification('Error al cargar los datos.', 'error');
        }
    }, [addNotification]);
    
    useEffect(() => {
        localStorage.setItem('galleraPro_cuerdas', JSON.stringify(cuerdas));
        localStorage.setItem('galleraPro_gallos', JSON.stringify(gallos));
        localStorage.setItem('galleraPro_torneo', JSON.stringify(torneo));
    }, [cuerdas, gallos, torneo]);

    const handleUpdateTorneo = useCallback((updatedTorneo: Torneo) => setTorneo(updatedTorneo), []);

    const handleSaveCuerda = useCallback((cuerdaData: CuerdaFormData, currentCuerdaId: string | null) => {
        const { name, owner, frontCount } = cuerdaData;
        
        if (currentCuerdaId) { // Editing
            const baseCuerdaToEdit = cuerdas.find(c => c.id === currentCuerdaId);
            if (!baseCuerdaToEdit) return;
            const baseCuerdaId = baseCuerdaToEdit.baseCuerdaId || baseCuerdaToEdit.id;
            
            const existingFronts = cuerdas.filter(c => (c.id === baseCuerdaId && !c.baseCuerdaId) || c.baseCuerdaId === baseCuerdaId)
                                        .sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));
            
            let updatedCuerdas = [...cuerdas];
            // Remove surplus fronts
            if (frontCount < existingFronts.length) {
                const frontsToRemove = existingFronts.slice(frontCount);
                const frontIdsToRemove = new Set(frontsToRemove.map(f => f.id));
                 if (gallos.some(g => frontIdsToRemove.has(g.cuerdaId))) {
                    addNotification('No se pueden eliminar frentes que ya tienen gallos asignados.', 'error');
                    return;
                }
                updatedCuerdas = updatedCuerdas.filter(c => !frontIdsToRemove.has(c.id));
            }

            // Update existing and add new fronts
            let finalCuerdas = [...updatedCuerdas];
            const baseCuerdaInFinal = finalCuerdas.find(c => c.id === baseCuerdaId);
            if(!baseCuerdaInFinal) return;

            for (let i = 0; i < frontCount; i++) {
                const frontName = `${name} (F${i + 1})`;
                if (i < existingFronts.length) {
                    const existingId = existingFronts[i].id;
                    const index = finalCuerdas.findIndex(c => c.id === existingId);
                    if (index !== -1) {
                         finalCuerdas[index] = { ...finalCuerdas[index], name: frontName, owner };
                    }
                } else {
                     finalCuerdas.push({
                        id: `cuerda-${Date.now()}-${i}`,
                        name: frontName,
                        owner,
                        baseCuerdaId: baseCuerdaInFinal.id
                    });
                }
            }
             setCuerdas(finalCuerdas);
             addNotification('Cuerda actualizada.', 'success');

        } else { // Adding
            const baseId = `cuerda-${Date.now()}`;
            const newCuerdas: Cuerda[] = [{ id: baseId, name: `${name} (F1)`, owner }];
            for (let i = 1; i < frontCount; i++) {
                newCuerdas.push({
                    id: `cuerda-${Date.now()}-${i}`,
                    name: `${name} (F${i + 2})`,
                    owner,
                    baseCuerdaId: baseId
                });
            }
            setCuerdas(prev => [...prev, ...newCuerdas]);
            addNotification('Cuerda añadida.', 'success');
        }
    }, [cuerdas, gallos, addNotification]);
    
    const handleDeleteCuerda = useCallback((cuerdaId: string) => {
        const cuerdaToDelete = cuerdas.find(c => c.id === cuerdaId);
        if (!cuerdaToDelete) return;

        const baseCuerdaId = cuerdaToDelete.baseCuerdaId || cuerdaToDelete.id;
        const relatedCuerdaIds = cuerdas.filter(c => c.id === baseCuerdaId || c.baseCuerdaId === baseCuerdaId).map(c => c.id);
        
        if (gallos.some(g => relatedCuerdaIds.includes(g.cuerdaId))) {
            addNotification('No se puede eliminar una cuerda con gallos asignados.', 'error');
            return;
        }
        setCuerdas(prev => prev.filter(c => c.id !== baseCuerdaId && c.baseCuerdaId !== baseCuerdaId));
        addNotification('Cuerda y todos sus frentes eliminados.', 'success');
    }, [cuerdas, gallos, addNotification]);

    const handleSaveGallo = useCallback((galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string) => {
        const tipoEdad = galloData.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
        const finalGalloData = { ...galloData, tipoEdad };
        const updatedGallo: Gallo = { ...finalGalloData, id: currentGalloId };

        setGallos(prev => {
            const index = prev.findIndex(g => g.id === currentGalloId);
            if (index > -1) {
                const updatedGallos = [...prev];
                updatedGallos[index] = updatedGallo;
                return updatedGallos;
            }
            return prev;
        });
        
        // Also update the matchmaking results if they exist to reflect changes instantly
        setMatchmakingResults(prevResults => {
            if (!prevResults) return prevResults;

            return {
                ...prevResults,
                unpairedRoosters: prevResults.unpairedRoosters.map(g => 
                    g.id === currentGalloId ? updatedGallo : g
                )
            };
        });

        addNotification('Gallo actualizado.', 'success');
    }, [addNotification]);

    const handleAddBulkGallos = useCallback((gallosData: Omit<Gallo, 'id' | 'tipoEdad'>[]) => {
        const newGallos = gallosData.map(g => ({
            ...g,
            id: `gallo-${Date.now()}-${Math.random()}`,
            tipoEdad: g.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO,
        }));
        setGallos(prev => [...prev, ...newGallos]);
        addNotification(`${newGallos.length} gallos añadidos.`, 'success');
    }, [addNotification]);
    
    const handleDeleteGallo = useCallback((galloId: string) => {
        setGallos(prev => prev.filter(g => g.id !== galloId));
        addNotification('Gallo eliminado.', 'success');
    }, [addNotification]);

    const handleStartMatchmaking = useCallback(() => {
        setIsMatchmaking(true);
        setTimeout(() => {
            const roostersInRange = gallos.filter(g => g.weight >= torneo.minWeight && g.weight <= torneo.maxWeight);

            const { fights: mainFights, leftovers } = findMaximumPairs(roostersInRange, torneo, cuerdas);
            
            const results: MatchmakingResults = {
                mainFights,
                individualFights: [], // Individual fights are now added to mainFights directly
                unpairedRoosters: leftovers,
                stats: {
                    contribution: 0,
                    rounds: 0,
                    mainTournamentRoostersCount: roostersInRange.length
                }
            };

            setMatchmakingResults(results);
            setIsMatchmaking(false);
            setScreen(Screen.MATCHMAKING);
        }, 500);
    }, [gallos, torneo, cuerdas]);

    const handleCreateManualFight = useCallback((roosterAId: string, roosterBId: string) => {
        if (!matchmakingResults) return;
        
        const roosterA = gallos.find(g => g.id === roosterAId);
        const roosterB = gallos.find(g => g.id === roosterBId);

        if (!roosterA || !roosterB) {
            addNotification('No se encontraron los gallos seleccionados.', 'error');
            return;
        }

        const newFight: Pelea = {
            id: `pelea-manual-${roosterAId}-${roosterBId}`,
            fightNumber: matchmakingResults.mainFights.length + 1,
            roosterA,
            roosterB,
            winner: null,
            duration: null,
        };
        
        setMatchmakingResults(prev => {
            if (!prev) return null;
            return {
                ...prev,
                mainFights: [...prev.mainFights, newFight],
                unpairedRoosters: prev.unpairedRoosters.filter(g => g.id !== roosterAId && g.id !== roosterBId),
            };
        });
        addNotification('Pelea manual creada y añadida a la cartelera.', 'success');
    }, [matchmakingResults, gallos, addNotification]);

    const handleBackToSetup = useCallback(() => setScreen(Screen.SETUP), []);
    
    const handleStartTournament = useCallback(() => {
        if (!matchmakingResults) return;
        setPeleas(matchmakingResults.mainFights);
        setScreen(Screen.LIVE_FIGHT);
    }, [matchmakingResults]);
    
    const handleFinishTournament = useCallback(() => {
        setScreen(Screen.RESULTS);
    }, []);

    const handleFinishFight = useCallback((fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => {
        setPeleas(prev => {
            const updatedPeleas = prev.map(p => p.id === fightId ? { ...p, winner, duration } : p);
            
            const unfinishedFights = updatedPeleas.filter(p => p.winner === null);

            if (unfinishedFights.length === 0) {
                 setTimeout(() => handleFinishTournament(), 100);
            }
            
            return updatedPeleas;
        });
    }, [handleFinishTournament]);

    const handleReset = useCallback(() => {
        if(window.confirm('¿Estás seguro de que quieres empezar un nuevo torneo? Se borrarán todos los datos actuales.')) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);

    const handleRematch = useCallback(() => {
        if (window.confirm('¿Quieres iniciar una contienda con los mismos gallos y cuerdas? Los resultados de este torneo se reiniciarán.')) {
            setPeleas([]);
            setMatchmakingResults(null);
            setScreen(Screen.SETUP);
            addNotification('Listo para la siguiente contienda. Verifica los datos y comienza el cotejo.', 'info');
        }
    }, [addNotification]);

    const handleFullReset = useCallback(() => {
        if(window.confirm('¿Estás seguro de que quieres reiniciar la aplicación? Se borrarán permanentemente todos los datos guardados (cuerdas, gallos y reglas).')) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);


    const handleBackToMatchmaking = useCallback(() => setScreen(Screen.MATCHMAKING), []);
    const handleResumeTournament = useCallback(() => setScreen(Screen.LIVE_FIGHT), []);
    
    const finishedFights = useMemo(() => peleas.filter(p => p.winner !== null), [peleas]);
    const isTournamentInProgress = useMemo(() => peleas.length > 0 && peleas.some(p => p.winner === null), [peleas]);
    const isTournamentFinished = useMemo(() => peleas.length > 0 && peleas.every(p => p.winner !== null), [peleas]);
    
    const renderScreen = () => {
        switch (screen) {
            case Screen.MATCHMAKING:
                return matchmakingResults && <MatchmakingScreen 
                    results={matchmakingResults} 
                    torneo={torneo} 
                    cuerdas={cuerdas}
                    gallos={gallos}
                    onStartTournament={handleStartTournament} 
                    onBack={handleBackToSetup}
                    onCreateManualFight={handleCreateManualFight}
                    onUpdateGallo={handleSaveGallo}
                    isTournamentInProgress={isTournamentInProgress}
                    isTournamentFinished={isTournamentFinished}
                    onGoToResults={() => setScreen(Screen.RESULTS)}
                    onResumeTournament={handleResumeTournament}
                />;
            case Screen.LIVE_FIGHT:
                return <LiveFightScreen 
                    peleas={peleas.filter(p => p.winner === null)} 
                    onFinishFight={handleFinishFight} 
                    onFinishTournament={handleFinishTournament}
                    onBack={handleBackToMatchmaking}
                    totalFightsInPhase={peleas.length}
                    addNotification={addNotification}
                />;
            case Screen.RESULTS:
                 return <ResultsScreen 
                    peleas={finishedFights} 
                    torneo={torneo} 
                    cuerdas={cuerdas} 
                    onReset={handleReset}
                    onRematch={handleRematch}
                    onBack={handleBackToMatchmaking}
                />;
            case Screen.SETUP:
            default:
                return <SetupScreen
                    cuerdas={cuerdas}
                    gallos={gallos}
                    torneo={torneo}
                    onUpdateTorneo={handleUpdateTorneo}
                    onStartMatchmaking={handleStartMatchmaking}
                    onSaveCuerda={handleSaveCuerda}
                    onDeleteCuerda={handleDeleteCuerda}
                    onSaveGallo={handleSaveGallo}
                    onAddBulkGallos={handleAddBulkGallos}
                    onDeleteGallo={handleDeleteGallo}
                    isMatchmaking={isMatchmaking}
                    onFullReset={handleFullReset}
                    isTournamentFinished={isTournamentFinished}
                    onGoToResults={() => setScreen(Screen.RESULTS)}
                />;
        }
    };

    return (
        <div className="bg-gray-900 text-gray-200 min-h-screen swirl-bg">
            <Toaster notifications={notifications} onDismiss={dismissNotification} />
            <div className="container mx-auto p-4 sm:p-6 lg:p-8">
                <header className="flex items-center space-x-4 mb-8">
                    <TrophyIcon className="w-10 h-10 text-amber-400" />
                    <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-wider">GalleraPro <span className="text-amber-500 font-light">- 100% Peleas de gallos</span></h1>
                </header>
                <main>
                    {renderScreen()}
                </main>
                 <footer className="text-center text-gray-500 text-sm mt-12 pb-4">
                    © {new Date().getFullYear()} GalleraPro. Todos los derechos reservados.
                </footer>
            </div>
        </div>
    );
};

export default App;