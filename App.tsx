



import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen, Cuerda, Gallo, Pelea, Torneo, PesoUnit, MatchmakingResults, TipoGallo, TipoEdad } from './types';
import { TrophyIcon, PlayIcon } from './components/Icons';

import { DEMO_GALLERAS } from './constants';
import SetupScreen from './components/SetupScreen';
import MatchmakingScreen from './components/MatchmakingScreen';
import LiveFightScreen from './components/LiveFightScreen';
import ResultsScreen from './components/ResultsScreen';


// --- UTILITY FUNCTIONS ---
const convertToGrams = (weight: number, unit: PesoUnit): number => {
    switch (unit) {
        case PesoUnit.POUNDS: return weight * 453.592;
        case PesoUnit.OUNCES: return weight * 28.3495;
        case PesoUnit.GRAMS:
        default: return weight;
    }
};

const findMaximumPairsGreedy = (
    roostersToMatch: Gallo[],
    torneo: Torneo,
    cuerdas: Cuerda[]
): { fights: Pelea[], leftovers: Gallo[] } => {

    // Internal function to perform matching on a given set of roosters and rules
    const performMatchingForGroup = (
        groupRoosters: Gallo[],
        groupTorneo: Torneo
    ): { fights: Pelea[], leftovers: Gallo[] } => {
        const fights: Pelea[] = [];
        let availableRoosters = new Set(groupRoosters);

        const sortedRoosters = [...groupRoosters].sort((a, b) => {
            const weightA = convertToGrams(a.weight, a.weightUnit);
            const weightB = convertToGrams(b.weight, b.weightUnit);
            if (weightA !== weightB) return weightA - weightB;
            return a.ageMonths - b.ageMonths;
        });

        for (const roosterA of sortedRoosters) {
            if (!availableRoosters.has(roosterA)) continue;

            let bestPartner: Gallo | null = null;
            let bestScore = Infinity;

            for (const roosterB of availableRoosters) {
                if (roosterA.id === roosterB.id) continue;

                if (roosterA.tipoGallo !== roosterB.tipoGallo) continue;
                if (roosterA.tipoEdad !== roosterB.tipoEdad) continue; // Should be impossible if groups are separated, but safe

                const cuerdaA = cuerdas.find(c => c.id === roosterA.cuerdaId);
                const cuerdaB = cuerdas.find(c => c.id === roosterB.cuerdaId);
                
                const baseIdA = cuerdaA?.baseCuerdaId || cuerdaA?.id;
                const baseIdB = cuerdaB?.baseCuerdaId || cuerdaB?.id;

                if (baseIdA && baseIdB && baseIdA === baseIdB) continue;

                const areExceptions = groupTorneo.exceptions.some(pair =>
                    (pair.includes(baseIdA) && pair.includes(baseIdB))
                );
                if (areExceptions) continue;

                const weightA = convertToGrams(roosterA.weight, roosterA.weightUnit);
                const weightB = convertToGrams(roosterB.weight, roosterB.weightUnit);
                const weightDiff = Math.abs(weightA - weightB);
                const ageDiff = Math.abs(roosterA.ageMonths - roosterB.ageMonths);
                
                // Use the age tolerance from the specific tournament config for the group
                if (weightDiff <= groupTorneo.weightTolerance && ageDiff <= groupTorneo.ageToleranceMonths) {
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
                availableRoosters.delete(roosterA);
                availableRoosters.delete(bestPartner);
            }
        }

        return { fights, leftovers: Array.from(availableRoosters) };
    };

    // 1. Separate roosters into Pollos and Gallos
    const pollos = roostersToMatch.filter(r => r.tipoEdad === TipoEdad.POLLO);
    const gallos = roostersToMatch.filter(r => r.tipoEdad === TipoEdad.GALLO);

    // 2. Create a specific config for Gallos where age tolerance is ignored
    const torneoForGallos: Torneo = {
        ...torneo,
        ageToleranceMonths: 999, // Effectively infinite tolerance for Gallos
    };

    // 3. Run matching for each group
    const { fights: polloFights, leftovers: polloLeftovers } = performMatchingForGroup(pollos, torneo); // Use original torneo for pollos
    const { fights: galloFights, leftovers: galloLeftovers } = performMatchingForGroup(gallos, torneoForGallos); // Use modified for gallos
    
    // 4. Combine results
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
    name: "Torneo de Amigos",
    date: new Date().toISOString().split('T')[0],
    weightTolerance: 50,
    ageToleranceMonths: 2,
    exceptions: [],
    weightUnit: PesoUnit.POUNDS,
    minWeight: convertToGrams(2.15, PesoUnit.POUNDS), // 2.15 lbs in grams
    maxWeight: convertToGrams(4.5, PesoUnit.POUNDS), // 4.5 lbs in grams
    rondas: { enabled: true, pointsForWin: 3, pointsForDraw: 1 },
    roostersPerTeam: 2,
  });
  
  const [matchmakingResults, setMatchmakingResults] = useState<MatchmakingResults | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [tournamentPhase, setTournamentPhase] = useState<'main' | 'individual' | 'finished'>('main');
  const [isDataLoaded, setDataLoaded] = useState(false);

    const populateInitialLocalData = useCallback(() => {
        console.log("Cargando datos de demostración.");
        const newCuerdas: Cuerda[] = [];
        const newGallos: Gallo[] = [];
        const baseCuerdaMap = new Map<string, { id: string, owner: string }>();

        DEMO_GALLERAS.forEach((data: any) => {
            const cuerdaName = data["Nombre de la cuerda"];
            const owner = data["Dueño"];
            const isFrontMatch = cuerdaName.match(/^(.*)\s\((\d+)\)$/);
            let newCuerda: Cuerda;
            const cuerdaId = `cuerda-${Date.now()}-${Math.random()}`;

            if (isFrontMatch) {
                const baseName = isFrontMatch[1].trim();
                const baseCuerdaInfo = baseCuerdaMap.get(baseName);
                
                if (!baseCuerdaInfo) {
                    console.error(`Cuerda base '${baseName}' no encontrada para el frente '${cuerdaName}'. Asegúrate de que las cuerdas base aparezcan antes que sus frentes en los datos.`);
                    newCuerda = {
                        id: cuerdaId,
                        name: cuerdaName,
                        owner: owner,
                    };
                } else {
                    newCuerda = {
                        id: cuerdaId,
                        name: cuerdaName,
                        owner: baseCuerdaInfo.owner,
                        baseCuerdaId: baseCuerdaInfo.id,
                    };
                }
            } else {
                newCuerda = {
                    id: cuerdaId,
                    name: cuerdaName,
                    owner: owner,
                };
                baseCuerdaMap.set(cuerdaName, { id: newCuerda.id, owner: newCuerda.owner });
            }

            newCuerdas.push(newCuerda);

            data.Gallos.forEach((galloData: any) => {
                 const tipoEdad = galloData["clase"] === 'pollo' ? TipoEdad.POLLO : TipoEdad.GALLO;

                newGallos.push({
                    id: `gallo-${Date.now()}-${Math.random()}`,
                    ringId: galloData["ID del Anillo"],
                    color: galloData["Color del Gallo"],
                    cuerdaId: newCuerda.id,
                    weight: galloData["Peso (lb)"],
                    weightUnit: PesoUnit.POUNDS,
                    ageMonths: galloData["meses de edad"],
                    markingId: galloData["ID de Marcaje"],
                    tipoGallo: galloData["tipo de gallo"] === 'pava' ? TipoGallo.PAVA : TipoGallo.LISO,
                    tipoEdad,
                    marca: galloData["Marca"],
                });
            });
        });

        setCuerdas(newCuerdas);
        setGallos(newGallos);
    }, []);

  // Load data from localStorage on mount
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
            populateInitialLocalData();
        }
    } catch (error) {
        console.error("Failed to load data from local storage", error);
        populateInitialLocalData();
    }
    setDataLoaded(true);
  }, [populateInitialLocalData]);

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
        setCuerdas(prev => prev.map(p => p.id === currentCuerdaId ? { ...p, name: cuerdaData.name, owner: cuerdaData.owner } : p));
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
  }, [cuerdas]);


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
                const roostersWithinWeight = gallos.filter(g => {
                    const weightInGrams = convertToGrams(g.weight, g.weightUnit);
                    return weightInGrams >= torneo.minWeight && weightInGrams <= torneo.maxWeight;
                });
                const roostersOutsideWeight = gallos.filter(g => !roostersWithinWeight.includes(g));

                if (roostersOutsideWeight.length > 0) {
                    const names = roostersOutsideWeight.map(r => r.color).join(', ');
                    console.log(`Gallos con peso fuera de rango enviados a sobrantes: ${names}`);
                }

                let mainFights: Pelea[] = [];
                let initialUnpairedRoosters: Gallo[] = [...roostersOutsideWeight];
                let contribution = 0;
                let mainTournamentRoostersCount = 0;
    
                if (torneo.rondas.enabled) {
                    const roosterCountPerTeam = torneo.roostersPerTeam;
                    
                    const compliantCuerdas = cuerdas.filter(c => {
                        const count = roostersWithinWeight.filter(g => g.cuerdaId === c.id).length;
                        return count === roosterCountPerTeam;
                    });

                    const nonCompliantCuerdas = cuerdas.filter(c => roostersWithinWeight.some(g => g.cuerdaId === c.id) && !compliantCuerdas.includes(c));

                    if (nonCompliantCuerdas.length > 0) {
                        const teamNames = nonCompliantCuerdas.map(c => c.name).join(', ');
                        console.log(`Equipos no aptos para rondas (no tienen ${roosterCountPerTeam} gallos con peso válido): ${teamNames}. Pasan a sobrantes.`);
                    }

                    if (compliantCuerdas.length < 2) {
                        console.warn("Se necesitan al menos 2 equipos con la cantidad exacta de gallos y peso válido para el torneo por rondas.");
                        setIsMatchmaking(false);
                        return;
                    }

                    contribution = roosterCountPerTeam;

                    const teamRoostersForMatching = roostersWithinWeight.filter(g => 
                        compliantCuerdas.some(c => c.id === g.cuerdaId)
                    );
                    mainTournamentRoostersCount = teamRoostersForMatching.length;
                    
                    const { fights, leftovers: unpairedFromTeamRound } = findMaximumPairsGreedy(teamRoostersForMatching, torneo, cuerdas);
                    mainFights = fights;
    
                    const roostersOutsideTeamSelection = roostersWithinWeight.filter(g => !compliantCuerdas.some(c => c.id === g.cuerdaId));
                    initialUnpairedRoosters = [...initialUnpairedRoosters, ...unpairedFromTeamRound, ...roostersOutsideTeamSelection];

                } else {
                    const { fights, leftovers } = findMaximumPairsGreedy(roostersWithinWeight, torneo, cuerdas);
                    mainFights = fights;
                    initialUnpairedRoosters = [...initialUnpairedRoosters, ...leftovers];
                    mainTournamentRoostersCount = mainFights.length * 2;
                }
    
                setMatchmakingResults({
                    mainFights: mainFights.map((fight, index) => ({ ...fight, fightNumber: index + 1, isRoundFight: torneo.rondas.enabled })),
                    individualFights: [],
                    unpairedRoosters: initialUnpairedRoosters,
                    stats: {
                        contribution,
                        rounds: contribution,
                        mainTournamentRoostersCount,
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

        if (roosterA.cuerdaId === roosterB.cuerdaId) {
             console.error("No se pueden emparejar gallos de la misma cuerda.");
             return;
        }

        const newFight: Pelea = {
            id: `fight-manual-${Date.now()}`,
            fightNumber: matchmakingResults.mainFights.length + matchmakingResults.individualFights.length + 1,
            roosterA,
            roosterB,
            winner: null,
            duration: null,
            isRoundFight: false,
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
    }, [matchmakingResults]);

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
            <svg className="animate-spin h-10 w-10 text-amber-500" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
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