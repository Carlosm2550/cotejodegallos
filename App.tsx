import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen, Cuerda, Gallo, Pelea, Torneo, MatchmakingResults, TipoGallo, TipoEdad } from './types';
import { TrophyIcon, PlayIcon } from './components/Icons';

import SetupScreen from './components/SetupScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import LiveFightScreen from './components/LiveFightScreen';
import ResultsScreen from './components/ResultsScreen';


// --- UTILITY FUNCTIONS ---
// New weight conversion: 1 pound = 16 ounces
const fromLbsOz = (lbs: number, oz: number) => (lbs * 16) + oz;

const findMaximumPairsGreedy = (
    roostersToMatch: Gallo[],
    torneo: Torneo,
    cuerdas: Cuerda[]
): { fights: Pelea[], leftovers: Gallo[] } => {

    /**
     * Internal function to perform matching on a specific group of roosters (e.g., only pollos or only gallos).
     * @param groupRoosters - The list of roosters to match within this group.
     * @param ageTolerance - The specific age tolerance in months for this group.
     */
    const performMatchingForGroup = (
        groupRoosters: Gallo[],
        ageTolerance: number
    ): { fights: Pelea[], leftovers: Gallo[] } => {
        const fights: Pelea[] = [];
        let availableRoosters = new Set(groupRoosters);

        // Sort roosters to make the greedy algorithm deterministic and efficient.
        const sortedRoosters = [...groupRoosters].sort((a, b) => {
            if (a.weight !== b.weight) return a.weight - b.weight;
            return a.ageMonths - b.ageMonths;
        });

        for (const roosterA of sortedRoosters) {
            // Skip if this rooster has already been paired.
            if (!availableRoosters.has(roosterA)) continue;

            let bestPartner: Gallo | null = null;
            let bestScore = Infinity;

            for (const roosterB of availableRoosters) {
                // A rooster cannot fight itself.
                if (roosterA.id === roosterB.id) continue;

                // --- APPLYING MATCHMAKING RULES ---

                // RULE: Phenotype must match (Liso vs Liso, Pava vs Pava).
                if (roosterA.tipoGallo !== roosterB.tipoGallo) continue;

                // RULE: Age class must match (Pollo vs Pollo, Gallo vs Gallo).
                // This is already ensured by pre-filtering, but kept for safety.
                if (roosterA.tipoEdad !== roosterB.tipoEdad) continue;

                // RULE: Roosters from the same base cuerda (or its fronts) cannot fight each other.
                const cuerdaA = cuerdas.find(c => c.id === roosterA.cuerdaId);
                const cuerdaB = cuerdas.find(c => c.id === roosterB.cuerdaId);
                const baseIdA = cuerdaA?.baseCuerdaId || cuerdaA?.id;
                const baseIdB = cuerdaB?.baseCuerdaId || cuerdaB?.id;
                if (baseIdA && baseIdB && baseIdA === baseIdB) continue;

                // RULE: Respect explicit exceptions (cuerdas that cannot fight each other).
                const isException = torneo.exceptions.some(ex =>
                    (ex.cuerda1Id === baseIdA && ex.cuerda2Id === baseIdB) ||
                    (ex.cuerda1Id === baseIdB && ex.cuerda2Id === baseIdA)
                );
                if (isException) continue;

                const weightDiff = Math.abs(roosterA.weight - roosterB.weight);
                const ageDiff = Math.abs(roosterA.ageMonths - roosterB.ageMonths);
                
                // RULE: Weight and Age must be within the defined tolerance.
                if (weightDiff <= torneo.weightTolerance && ageDiff <= ageTolerance) {
                    // This is a valid potential match. Find the best one based on score.
                    // The score prioritizes the smallest weight difference, then smallest age difference.
                    const score = weightDiff + (ageDiff * 100);
                    if (score < bestScore) {
                        bestScore = score;
                        bestPartner = roosterB;
                    }
                }
            }

            if (bestPartner) {
                fights.push({
                    id: `fight-${Date.now()}-${Math.random()}`,
                    fightNumber: 0,
                    roosterA: roosterA,
                    roosterB: bestPartner,
                    winner: null,
                    duration: null,
                });
                // Remove both roosters from the pool of available fighters.
                availableRoosters.delete(roosterA);
                availableRoosters.delete(bestPartner);
            }
        }

        return { fights, leftovers: Array.from(availableRoosters) };
    };

    // --- MAIN LOGIC ---
    // First, separate roosters by age class (Pollo vs Gallo) as they cannot fight each other.
    const pollos = roostersToMatch.filter(r => r.tipoEdad === TipoEdad.POLLO);
    const gallos = roostersToMatch.filter(r => r.tipoEdad === TipoEdad.GALLO);

    // Run matching for Pollos with the specific age tolerance from tournament rules.
    const { fights: polloFights, leftovers: polloLeftovers } = performMatchingForGroup(pollos, torneo.ageToleranceMonths);
    
    // Run matching for Gallos. Per standard rules, there is no age limit between them.
    // We use a very high number to simulate infinite tolerance.
    const { fights: galloFights, leftovers: galloLeftovers } = performMatchingForGroup(gallos, 999);
    
    // Combine the results from both groups.
    const allFights = [...polloFights, ...galloFights];
    const allLeftovers = [...polloLeftovers, ...galloLeftovers];

    return { fights: allFights, leftovers: allLeftovers };
};


// --- LAYOUT COMPONENTS ---
const Header: React.FC = () => (
    <header className="bg-gray-900/50 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-40 print-hide">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-3">
                <TrophyIcon className="w-8 h-8 text-amber-400" />
                <h1 className="text-xl md:text-2xl font-bold text-white tracking-wider">GalleraPro</h1>
            </div>
        </div>
    </header>
);

const Footer: React.FC = () => (
  <footer className="text-center py-6 text-gray-500 text-sm print-hide">
    <p>&copy; {new Date().getFullYear()} GalleraPro. Todos los derechos reservados.</p>
  </footer>
);

export interface CuerdaFormData {
  name: string;
  owner: string;
  frontCount?: number;
}

// --- MAIN APP COMPONENT ---
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.SETUP);
  const [cuerdas, setCuerdas] = useState<Cuerda[]>([]);
  const [gallos, setGallos] = useState<Gallo[]>([]);
  const [torneo, setTorneo] = useState<Torneo>({
    name: "Nuevo Torneo",
    tournamentManager: "",
    date: new Date().toISOString().split('T')[0],
    weightTolerance: 1, 
    ageToleranceMonths: 2,
    minWeight: fromLbsOz(2, 15), // 2.15 lbs in total ounces
    maxWeight: fromLbsOz(4, 8), // 4.08 lbs in total ounces
    roostersPerTeam: 2,
    pointsForWin: 3,
    pointsForDraw: 1,
    exceptions: [],
  });
  
  const [matchmakingResults, setMatchmakingResults] = useState<MatchmakingResults | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [tournamentPhase, setTournamentPhase] = useState<'main' | 'individual' | 'finished'>('main');
  const [isDataLoaded, setDataLoaded] = useState(false);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
        const savedCuerdas = localStorage.getItem('galleraPro_cuerdas');
        const savedGallos = localStorage.getItem('galleraPro_gallos');
        const savedTorneo = localStorage.getItem('galleraPro_torneo');

        if (savedCuerdas && savedGallos && savedTorneo) {
            setCuerdas(JSON.parse(savedCuerdas));
            setGallos(JSON.parse(savedGallos));
            
            const loadedTorneo = JSON.parse(savedTorneo);
            const defaults = {
                roostersPerTeam: 2,
                pointsForWin: 3,
                pointsForDraw: 1,
                exceptions: [],
            };
            setTorneo(prev => ({ ...prev, ...defaults, ...loadedTorneo }));
        }
        // If there's no saved data, the app will start with the initial empty state.
    } catch (error) {
        console.error("Failed to load data from local storage, starting fresh.", error);
        // Clear potentially corrupted data to prevent future errors
        localStorage.removeItem('galleraPro_cuerdas');
        localStorage.removeItem('galleraPro_gallos');
        localStorage.removeItem('galleraPro_torneo');
    }
    setDataLoaded(true);
  }, []);

  // Save data to localStorage on change
  useEffect(() => {
    if (!isDataLoaded) return; // Prevent saving initial empty state

    try {
        localStorage.setItem('galleraPro_cuerdas', JSON.stringify(cuerdas));
        localStorage.setItem('galleraPro_gallos', JSON.stringify(gallos));
        localStorage.setItem('galleraPro_torneo', JSON.stringify(torneo));
    } catch (error) {
        console.error("Failed to save data to local storage", error);
    }
  }, [cuerdas, gallos, torneo, isDataLoaded]);


  // --- DATA HANDLERS ---
  const handleSaveCuerda = useCallback((cuerdaData: CuerdaFormData, currentCuerdaId: string | null) => {
    if (currentCuerdaId) { // Editing
        const editedCuerda = cuerdas.find(c => c.id === currentCuerdaId);
        if (!editedCuerda) return;

        const originalBaseName = editedCuerda.name.replace(/\s\(F\d+\)$/, '');
        const allRelatedCuerdas = cuerdas
            .filter(c => c.name.startsWith(originalBaseName + " (F"))
            .sort((a,b) => a.name.localeCompare(b.name, undefined, {numeric: true}));

        const currentFrontCount = allRelatedCuerdas.length;
        const newFrontCount = cuerdaData.frontCount || currentFrontCount;
        const newBaseName = cuerdaData.name;
        const newOwner = cuerdaData.owner;

        let finalCuerdas = [...cuerdas];
        let finalGallos = [...gallos];

        // Handle reduction
        if (newFrontCount < currentFrontCount) {
            const cuerdasToDelete = allRelatedCuerdas.slice(newFrontCount);
            const idsToDelete = new Set(cuerdasToDelete.map(c => c.id));
            finalCuerdas = finalCuerdas.filter(c => !idsToDelete.has(c.id));
            finalGallos = finalGallos.filter(g => !idsToDelete.has(g.cuerdaId));
        }

        // Update remaining/all cuerdas
        const baseCuerdaId = allRelatedCuerdas[0]?.id;
        finalCuerdas = finalCuerdas.map(c => {
            const relatedIndex = allRelatedCuerdas.findIndex(rc => rc.id === c.id);
            if (relatedIndex !== -1 && relatedIndex < newFrontCount) {
                return {
                    ...c,
                    name: `${newBaseName} (F${relatedIndex + 1})`,
                    owner: newOwner,
                    baseCuerdaId: relatedIndex === 0 ? undefined : baseCuerdaId
                };
            }
            return c;
        });
        
        // Handle increase
        if (newFrontCount > currentFrontCount) {
            const newFronts: Cuerda[] = [];
            for (let i = currentFrontCount; i < newFrontCount; i++) {
                newFronts.push({
                    id: `cuerda-${Date.now()}-${i}`,
                    name: `${newBaseName} (F${i + 1})`,
                    owner: newOwner,
                    baseCuerdaId: baseCuerdaId,
                });
            }
            finalCuerdas.push(...newFronts);
        }
        
        setCuerdas(finalCuerdas);
        setGallos(finalGallos);

    } else { // Adding new
        const baseNameExists = cuerdas.some(c => c.name.startsWith(cuerdaData.name + " (F"));
        if (baseNameExists) {
            console.error('Ya existe una cuerda con ese nombre base.');
            return;
        }

        const frontCount = cuerdaData.frontCount || 1;
        const newCuerdas: Cuerda[] = [];
        const timestamp = Date.now();

        const baseCuerda: Cuerda = {
            id: `cuerda-${timestamp}-0`,
            name: `${cuerdaData.name} (F1)`,
            owner: cuerdaData.owner,
        };
        newCuerdas.push(baseCuerda);

        for (let i = 1; i < frontCount; i++) {
            const frontCuerda: Cuerda = {
                id: `cuerda-${timestamp}-${i}`,
                name: `${cuerdaData.name} (F${i + 1})`,
                owner: cuerdaData.owner,
                baseCuerdaId: baseCuerda.id,
            };
            newCuerdas.push(frontCuerda);
        }
        setCuerdas(prev => [...prev, ...newCuerdas]);
    }
  }, [cuerdas, gallos]);


  const handleDeleteCuerda = useCallback((cuerdaId: string) => {
      const isBaseCuerdaWithFronts = cuerdas.some(c => c.baseCuerdaId === cuerdaId);
      if (isBaseCuerdaWithFronts) {
          console.error('No se puede eliminar una cuerda que tiene frentes. Elimine los frentes primero.');
          return;
      }
      setCuerdas(prev => prev.filter(p => p.id !== cuerdaId));
      setGallos(prev => prev.filter(g => g.cuerdaId !== cuerdaId));
      
      if (matchmakingResults) {
        setMatchmakingResults(prev => {
            if (!prev) return null;
            return {
                ...prev,
                unpairedRoosters: prev.unpairedRoosters.filter(g => g.cuerdaId !== cuerdaId),
            };
        });
      }
  }, [cuerdas, matchmakingResults]);

  const handleSaveGallo = useCallback((galloData: Omit<Gallo, 'id' | 'tipoEdad'>, currentGalloId: string | null) => {
    const tipoEdad = galloData.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
    const finalGalloData = { ...galloData, tipoEdad };
    
    if (currentGalloId) {
        setGallos(prev => prev.map(g => g.id === currentGalloId ? { ...finalGalloData, id: g.id } : g));
        
        if (matchmakingResults) {
            setMatchmakingResults(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    unpairedRoosters: prev.unpairedRoosters.map(g => {
                        if (g.id === currentGalloId) {
                            return { ...finalGalloData, id: g.id };
                        }
                        return g;
                    })
                };
            });
        }
    } else {
        const newGallo = { ...finalGalloData, id: `gallo-${Date.now()}-${Math.random()}` };
        setGallos(prev => [...prev, newGallo]);
    }
  }, [matchmakingResults]);

  const handleAddBulkGallos = useCallback((gallosToAdd: (Omit<Gallo, 'id' | 'tipoEdad'>)[]) => {
      const newGallosWithIds = gallosToAdd.map(galloData => {
          const tipoEdad = galloData.ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;
          return {
              ...galloData,
              tipoEdad,
              id: `gallo-${Date.now()}-${Math.random()}`
          };
      });
      setGallos(prev => [...prev, ...newGallosWithIds]);
  }, []);
  
  const handleDeleteGallo = useCallback((galloId: string) => {
      setGallos(prev => prev.filter(g => g.id !== galloId));
  }, []);
  
  const handleUpdateTorneo = useCallback((updatedTorneo: Torneo) => {
      setTorneo(updatedTorneo);
  }, []);

    const handleStartMatchmaking = useCallback(() => {
        if (gallos.length < 2) {
            console.warn("Se necesitan al menos 2 gallos para empezar.");
            return;
        }
        setIsMatchmaking(true);
    
        setTimeout(() => {
            try {
                // 1. Filter roosters within weight range
                const roostersWithinWeight = gallos.filter(g => g.weight >= torneo.minWeight && g.weight <= torneo.maxWeight);
                const roostersOutsideWeight = gallos.filter(g => !roostersWithinWeight.includes(g));

                // 2. Group roosters by base cuerda
                const roostersByBaseCuerda = new Map<string, Gallo[]>();
                const cuerdaIdToBaseIdMap = new Map<string, string>();
                cuerdas.forEach(c => {
                    const baseId = c.baseCuerdaId || c.id;
                    cuerdaIdToBaseIdMap.set(c.id, baseId);
                });
                roostersWithinWeight.forEach(gallo => {
                    const baseId = cuerdaIdToBaseIdMap.get(gallo.cuerdaId);
                    if (baseId) {
                        if (!roostersByBaseCuerda.has(baseId)) roostersByBaseCuerda.set(baseId, []);
                        roostersByBaseCuerda.get(baseId)!.push(gallo);
                    }
                });

                // 3. Select roosters for the main tournament
                const mainTournamentRoosters: Gallo[] = [];
                const individualRoosters: Gallo[] = [];
                roostersByBaseCuerda.forEach((teamRoosters) => {
                    const sortedTeamRoosters = teamRoosters.sort((a, b) => a.weight - b.weight);
                    const limit = torneo.roostersPerTeam > 0 ? torneo.roostersPerTeam : Infinity;
                    mainTournamentRoosters.push(...sortedTeamRoosters.slice(0, limit));
                    individualRoosters.push(...sortedTeamRoosters.slice(limit));
                });
                
                // 4. Run matchmaking on main tournament roosters
                const { fights: mainFightsResult, leftovers: mainLeftovers } = findMaximumPairsGreedy(mainTournamentRoosters, torneo, cuerdas);
                
                const initialUnpairedRoosters = [
                    ...roostersOutsideWeight,
                    ...individualRoosters,
                    ...mainLeftovers
                ].sort((a, b) => a.weight - b.weight);
    
                setMatchmakingResults({
                    mainFights: mainFightsResult.map((fight, index) => ({ ...fight, fightNumber: index + 1 })),
                    individualFights: [],
                    unpairedRoosters: initialUnpairedRoosters,
                    stats: {
                        contribution: 0,
                        rounds: 0,
                        mainTournamentRoostersCount: mainFightsResult.length * 2,
                    }
                });
                setCurrentScreen(Screen.MATCHMAKING);
    
            } catch (error) {
                console.error("Error during matchmaking:", error);
            } finally {
                setIsMatchmaking(false);
            }
        }, 50);
    }, [gallos, torneo, cuerdas]);

    const handleCreateManualFight = useCallback((roosterAId: string, roosterBId: string) => {
        if (!matchmakingResults) return;

        const roosterA = matchmakingResults.unpairedRoosters.find(r => r.id === roosterAId);
        const roosterB = matchmakingResults.unpairedRoosters.find(r => r.id === roosterBId);

        if (!roosterA || !roosterB) {
            console.error("Uno o ambos gallos seleccionados no se encontraron en la lista de sobrantes.");
            return;
        }

        const cuerdaA = cuerdas.find(c => c.id === roosterA.cuerdaId);
        const cuerdaB = cuerdas.find(c => c.id === roosterB.cuerdaId);

        const baseIdA = cuerdaA?.baseCuerdaId || cuerdaA?.id;
        const baseIdB = cuerdaB?.baseCuerdaId || cuerdaB?.id;

        if (baseIdA && baseIdB && baseIdA === baseIdB) {
             console.error("No se pueden emparejar gallos de la misma cuerda base.");
             return;
        }

        const newFight: Pelea = {
            id: `fight-manual-${Date.now()}`,
            fightNumber: matchmakingResults.mainFights.length + matchmakingResults.individualFights.length + 1,
            roosterA,
            roosterB,
            winner: null,
            duration: null,
        };

        setMatchmakingResults(prev => {
            if (!prev) return null;
            const updatedUnpaired = prev.unpairedRoosters.filter(r => r.id !== roosterAId && r.id !== roosterBId);
            return {
                ...prev,
                individualFights: [...prev.individualFights, newFight],
                unpairedRoosters: updatedUnpaired,
            };
        });
    }, [matchmakingResults, cuerdas]);

  const handleFinishFight = useCallback((fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => {
      setMatchmakingResults(prev => {
        if (!prev) return null;
        
        const updateFights = (fights: Pelea[]) => 
            fights.map(p => p.id === fightId ? { ...p, winner, duration } : p);

        return {
            ...prev,
            mainFights: updateFights(prev.mainFights),
            individualFights: updateFights(prev.individualFights),
        };
    });
  }, []);
  
  const handleReset = useCallback(() => {
    setCurrentScreen(Screen.SETUP);
    setMatchmakingResults(null);
    setTournamentPhase('main');
  }, []);

  const renderScreen = () => {
    switch(currentScreen) {
      case Screen.MATCHMAKING:
        return matchmakingResults ? <MatchmakingScreen 
                    results={matchmakingResults}
                    torneo={torneo}
                    cuerdas={cuerdas}
                    onStartTournament={() => {
                        setTournamentPhase('main');
                        setCurrentScreen(Screen.LIVE_FIGHT)
                    }}
                    onBack={() => {
                      setMatchmakingResults(null);
                      setCurrentScreen(Screen.SETUP);
                    }}
                    onCreateManualFight={handleCreateManualFight}
                    onUpdateGallo={handleSaveGallo}
                    onDeleteCuerda={handleDeleteCuerda}
               /> : null;
      case Screen.LIVE_FIGHT: {
        const mainFights = matchmakingResults?.mainFights || [];
        const individualFights = matchmakingResults?.individualFights || [];
        
        const pendingMainFights = mainFights.filter(p => p.winner === null);
        const pendingIndividualFights = individualFights.filter(p => p.winner === null);

        let fightsForThisPhase: Pelea[] = [];
        if (tournamentPhase === 'main') {
            fightsForThisPhase = pendingMainFights;
        } else if (tournamentPhase === 'individual') {
            fightsForThisPhase = pendingIndividualFights;
        }

        if (fightsForThisPhase.length > 0) {
            return <LiveFightScreen 
                peleas={fightsForThisPhase}
                onFinishFight={handleFinishFight}
                onFinishTournament={() => setCurrentScreen(Screen.RESULTS)}
            />
        } else {
            // No more fights in current phase, move to next phase or results
             if (tournamentPhase === 'main' && pendingIndividualFights.length > 0) {
                setTournamentPhase('individual'); // This will re-render and check again
                return <ResultsScreen 
                    peleas={[...mainFights.filter(p => p.winner !== null), ...individualFights.filter(p => p.winner !== null)]}
                    torneo={torneo}
                    cuerdas={cuerdas}
                    onReset={handleReset}
                    tournamentPhase={'individual'}
                    onStartIndividualFights={() => setCurrentScreen(Screen.LIVE_FIGHT)}
                    hasIndividualFights={pendingIndividualFights.length > 0}
                />;
            }
            setTournamentPhase('finished');
            setCurrentScreen(Screen.RESULTS);
            return null; // or loading spinner
        }
      }
      case Screen.RESULTS:
        const allFinishedFights = [...(matchmakingResults?.mainFights || []), ...(matchmakingResults?.individualFights || [])].filter(p => p.winner);
        const hasPendingIndividualFights = (matchmakingResults?.individualFights || []).some(p => p.winner === null);

        return <ResultsScreen 
                peleas={allFinishedFights}
                torneo={torneo}
                cuerdas={cuerdas}
                onReset={handleReset}
                tournamentPhase={hasPendingIndividualFights ? 'individual' : 'finished'}
                onStartIndividualFights={() => {
                    setTournamentPhase('individual');
                    setCurrentScreen(Screen.LIVE_FIGHT);
                }}
                hasIndividualFights={hasPendingIndividualFights}
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
               />;
    }
  };

  const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="print-target">
            {children}
        </div>
      </main>
      <Footer />
    </>
  )

  if (!isDataLoaded) {
    return (
        <div className="swirl-bg min-h-screen flex justify-center items-center">
            <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    )
  }

  return (
    <div className="swirl-bg text-gray-200 min-h-screen">
       <MainLayout>
           {renderScreen()}
       </MainLayout>
    </div>
  );
};

export default App;