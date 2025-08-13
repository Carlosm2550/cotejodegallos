






import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Screen, Cuerda, Gallo, Pelea, Torneo, PesoUnit, Notification, MatchmakingResults } from './types';
import { TrophyIcon, PlayIcon } from './components/Icons';
import Toaster from './components/Toaster';

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
    const fights: Pelea[] = [];
    let availableRoosters = new Set(roostersToMatch);

    const sortedRoosters = [...roostersToMatch].sort((a, b) => {
        const weightA = convertToGrams(a.weight, a.weightUnit);
        const weightB = convertToGrams(b.weight, b.weightUnit);
        if (weightA !== weightB) return weightA - weightB;
        return (a.ageMonths || 0) - (b.ageMonths || 0);
    });

    for (const roosterA of sortedRoosters) {
        if (!availableRoosters.has(roosterA)) continue;

        let bestPartner: Gallo | null = null;
        let bestScore = Infinity;

        for (const roosterB of availableRoosters) {
            if (roosterA.id === roosterB.id) continue;
            
            const cuerdaA = cuerdas.find(c => c.id === roosterA.cuerdaId);
            const cuerdaB = cuerdas.find(c => c.id === roosterB.cuerdaId);
            
            // --- CRITICAL RULE: "The Golden Rule" ---
            // Determine the base team ID for each rooster. 
            // If it's a "front", use its baseCuerdaId. If not, use its own ID.
            const baseIdA = cuerdaA?.baseCuerdaId || cuerdaA?.id;
            const baseIdB = cuerdaB?.baseCuerdaId || cuerdaB?.id;

            // Roosters from the same base team (owner) can NEVER fight each other,
            // regardless of which "front" they belong to.
            // This also prevents roosters from the same exact front/cuerda from fighting.
            if (baseIdA && baseIdB && baseIdA === baseIdB) continue;

            // Check rules: exceptions are also checked using the base team ID.
            // An exception against a base team applies to all its fronts.
            const areExceptions = torneo.exceptions.some(pair =>
                (pair.includes(baseIdA) && pair.includes(baseIdB))
            );
            if (areExceptions) continue;

            const weightA = convertToGrams(roosterA.weight, roosterA.weightUnit);
            const weightB = convertToGrams(roosterB.weight, roosterB.weightUnit);
            const weightDiff = Math.abs(weightA - weightB);
            const ageDiff = Math.abs((roosterA.ageMonths || 1) - (roosterB.ageMonths || 1));

            if (weightDiff <= torneo.weightTolerance && ageDiff <= (torneo.ageToleranceMonths || 0)) {
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

    const leftovers = Array.from(availableRoosters);
    return { fights, leftovers };
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
    weightUnit: PesoUnit.GRAMS,
    rondas: { enabled: true, pointsForWin: 3, pointsForDraw: 1 },
    roostersPerTeam: 2,
  });
  
  const [matchmakingResults, setMatchmakingResults] = useState<MatchmakingResults | null>(null);
  const [isMatchmaking, setIsMatchmaking] = useState(false);
  const [tournamentPhase, setTournamentPhase] = useState<'main' | 'individual' | 'finished'>('main');
  const [isDataLoaded, setDataLoaded] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const showNotification = useCallback((message: string, type: Notification['type'] = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

    const populateInitialLocalData = useCallback(() => {
        showNotification("Cargando datos de demostración.", 'info');
        const newCuerdas: Cuerda[] = [];
        const newGallos: Gallo[] = [];
        const baseCuerdaMap = new Map<string, { id: string, owner: string }>();

        DEMO_GALLERAS.forEach(data => {
            const isFrontMatch = data.cuerdaName.match(/^(.*)\s\((\d+)\)$/);
            let newCuerda: Cuerda;
            const cuerdaId = `cuerda-${Date.now()}-${Math.random()}`;

            if (isFrontMatch) {
                const baseName = isFrontMatch[1].trim();
                const baseCuerdaInfo = baseCuerdaMap.get(baseName);
                
                if (!baseCuerdaInfo) {
                    console.error(`Cuerda base '${baseName}' no encontrada para el frente '${data.cuerdaName}'. Asegúrate de que las cuerdas base aparezcan antes que sus frentes en los datos.`);
                    newCuerda = {
                        id: cuerdaId,
                        name: data.cuerdaName,
                        owner: data.owner,
                    };
                } else {
                    newCuerda = {
                        id: cuerdaId,
                        name: data.cuerdaName,
                        owner: baseCuerdaInfo.owner,
                        baseCuerdaId: baseCuerdaInfo.id,
                    };
                }
            } else {
                newCuerda = {
                    id: cuerdaId,
                    name: data.cuerdaName,
                    owner: data.owner,
                };
                baseCuerdaMap.set(data.cuerdaName, { id: newCuerda.id, owner: newCuerda.owner });
            }

            newCuerdas.push(newCuerda);

            data.gallos.forEach(galloData => {
                newGallos.push({
                    id: `gallo-${Date.now()}-${Math.random()}`,
                    ringId: galloData.ringId,
                    color: galloData.color,
                    cuerdaId: newCuerda.id,
                    weight: galloData.weight,
                    weightUnit: PesoUnit.GRAMS,
                    ageMonths: galloData.ageMonths,
                    markingId: galloData.markingId,
                });
            });
        });

        setCuerdas(newCuerdas);
        setGallos(newGallos);
    }, [showNotification]);

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
            showNotification("Datos cargados desde la sesión anterior.", "success");
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
        showNotification("Error al guardar los datos en el navegador.", "error");
    }
  }, [cuerdas, gallos, torneo, isDataLoaded]);


  // --- DATA HANDLERS ---
   const handleSaveCuerda = (cuerdaData: Omit<Cuerda, 'id' | 'baseCuerdaId'>, currentCuerdaId: string | null) => {
    if (currentCuerdaId) {
        setCuerdas(prev => prev.map(p => p.id === currentCuerdaId ? { ...p, ...cuerdaData, id: p.id } : p));
        showNotification('Cuerda actualizada.', 'success');
    } else {
         if (cuerdaData.name.startsWith('__FRONT__')) {
            const baseCuerdaId = cuerdaData.name.replace('__FRONT__', '');
            const baseCuerda = cuerdas.find(c => c.id === baseCuerdaId);
            if (!baseCuerda) {
                showNotification('Error: Cuerda base no encontrada.', 'error');
                return;
            }

            const baseName = baseCuerda.name;
            const frontCount = cuerdas.filter(c => c.id === baseCuerdaId || c.baseCuerdaId === baseCuerdaId).length;
            const newFrontNumber = frontCount + 1;

            const newFrontCuerda: Cuerda = {
                id: `cuerda-${Date.now()}-${Math.random()}`,
                name: `${baseName} (${newFrontNumber})`,
                owner: baseCuerda.owner,
                baseCuerdaId: baseCuerdaId,
            };
            setCuerdas(prev => [...prev, newFrontCuerda]);
            showNotification(`Frente '${newFrontCuerda.name}' añadido.`, 'success');

        } else {
            const newCuerda: Cuerda = { ...cuerdaData, id: `cuerda-${Date.now()}-${Math.random()}` };
            setCuerdas(prev => [...prev, newCuerda]);
            showNotification('Cuerda añadida.', 'success');
        }
    }
  };

  const handleDeleteCuerda = (cuerdaId: string) => {
      const isBaseCuerda = cuerdas.some(c => c.baseCuerdaId === cuerdaId);
      if (isBaseCuerda) {
          showNotification('No se puede eliminar una cuerda que tiene frentes. Elimine los frentes primero.', 'error');
          return;
      }
      setCuerdas(prev => prev.filter(p => p.id !== cuerdaId));
      setGallos(prev => prev.filter(g => g.cuerdaId !== cuerdaId));
      
      // Also update matchmakingResults if it exists
      if (matchmakingResults) {
        setMatchmakingResults(prev => {
            if (!prev) return null;
            return {
                ...prev,
                unpairedRoosters: prev.unpairedRoosters.filter(g => g.cuerdaId !== cuerdaId),
            };
        });
      }

      showNotification('Cuerda y sus gallos eliminados.', 'success');
  };

  const handleSaveGallo = (galloData: Omit<Gallo, 'id'>, currentGalloId: string | null) => {
    if (currentGalloId) {
        setGallos(prev => prev.map(g => g.id === currentGalloId ? { ...g, ...galloData, id: g.id } : g));
        
        // Also update matchmakingResults if it exists
        if (matchmakingResults) {
            setMatchmakingResults(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    unpairedRoosters: prev.unpairedRoosters.map(g => {
                        if (g.id === currentGalloId) {
                            return { ...g, ...galloData, id: g.id };
                        }
                        return g;
                    })
                };
            });
        }
        
        showNotification('Gallo actualizado.', 'success');
    } else {
        const newGallo = { ...galloData, id: `gallo-${Date.now()}-${Math.random()}` };
        setGallos(prev => [...prev, newGallo]);
        showNotification('Gallo añadido.', 'success');
    }
  };
  
  const handleDeleteGallo = (galloId: string) => {
      setGallos(prev => prev.filter(g => g.id !== galloId));
      showNotification('Gallo eliminado.', 'success');
  };
  
  const handleUpdateTorneo = (updatedTorneo: Torneo) => {
      setTorneo(updatedTorneo);
  };

    const handleStartMatchmaking = async () => {
        if (gallos.length < 2) {
            showNotification("Se necesitan al menos 2 gallos para empezar.", 'error');
            return;
        }
        setIsMatchmaking(true);
    
        setTimeout(() => {
            try {
                let mainFights: Pelea[] = [];
                let initialUnpairedRoosters: Gallo[] = [];
                let contribution = 0;
                let mainTournamentRoostersCount = 0;
    
                if (torneo.rondas.enabled) {
                    const roosterCountPerTeam = torneo.roostersPerTeam;
                    const cuerdasConGallos = cuerdas.filter(p => gallos.some(g => g.cuerdaId === p.id));
                    
                    const compliantCuerdas = cuerdasConGallos.filter(c => {
                        const count = gallos.filter(g => g.cuerdaId === c.id).length;
                        return count === roosterCountPerTeam;
                    });

                    const nonCompliantCuerdas = cuerdasConGallos.filter(c => !compliantCuerdas.includes(c));

                    if (nonCompliantCuerdas.length > 0) {
                        const teamNames = nonCompliantCuerdas.map(c => c.name).join(', ');
                        showNotification(`Equipos no aptos para rondas (no tienen ${roosterCountPerTeam} gallos): ${teamNames}. Pasan a sobrantes.`, 'info');
                    }

                    if (compliantCuerdas.length < 2) {
                        showNotification("Se necesitan al menos 2 equipos (cuerdas o frentes) con la cantidad exacta de gallos para el torneo por rondas.", 'error');
                        setIsMatchmaking(false);
                        return;
                    }

                    contribution = roosterCountPerTeam;

                    const teamRoostersForMatching = gallos.filter(g => 
                        compliantCuerdas.some(c => c.id === g.cuerdaId)
                    );
                    mainTournamentRoostersCount = teamRoostersForMatching.length;
                    
                    const { fights, leftovers: unpairedFromTeamRound } = findMaximumPairsGreedy(teamRoostersForMatching, torneo, cuerdas);
                    mainFights = fights;
    
                    const roostersOutsideTeamSelection = gallos.filter(g => !compliantCuerdas.some(c => c.id === g.cuerdaId));
                    initialUnpairedRoosters = [...unpairedFromTeamRound, ...roostersOutsideTeamSelection];

                } else {
                    const { fights, leftovers } = findMaximumPairsGreedy(gallos, torneo, cuerdas);
                    mainFights = fights;
                    initialUnpairedRoosters = leftovers;
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
                showNotification("Ocurrió un error inesperado durante el cotejo.", "error");
            } finally {
                setIsMatchmaking(false);
            }
        }, 50);
    };

    const handleCreateManualFight = (roosterAId: string, roosterBId: string) => {
        if (!matchmakingResults) return;

        const roosterA = matchmakingResults.unpairedRoosters.find(r => r.id === roosterAId);
        const roosterB = matchmakingResults.unpairedRoosters.find(r => r.id === roosterBId);

        if (!roosterA || !roosterB) {
            showNotification("Uno o ambos gallos seleccionados no se encontraron en la lista de sobrantes.", "error");
            return;
        }

        if (roosterA.cuerdaId === roosterB.cuerdaId) {
             showNotification("No se pueden emparejar gallos de la misma cuerda.", "error");
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
        showNotification(`Pelea creada: ${roosterA.color} vs ${roosterB.color}`, "success");
    };

  const handleFinishFight = (fightId: string, winner: 'A' | 'B' | 'DRAW', duration: number) => {
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
  };
  
  const handleReset = () => {
    setCurrentScreen(Screen.SETUP);
    setMatchmakingResults(null);
    setTournamentPhase('main');
  };

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
                    onSaveGallo={handleSaveGallo}
                    onDeleteCuerda={handleDeleteCuerda}
                    showNotification={showNotification}
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
                showNotification={showNotification}
                onSaveCuerda={handleSaveCuerda}
                onDeleteCuerda={handleDeleteCuerda}
                onSaveGallo={handleSaveGallo}
                onDeleteGallo={handleDeleteGallo}
                isMatchmaking={isMatchmaking}
               />;
    }
  };

  const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>
      <Header />
      <main className="container mx-auto px-4 py-8">
        {children}
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
       <Toaster notifications={notifications} onDismiss={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
       <MainLayout>
           {renderScreen()}
       </MainLayout>
    </div>
  );
};

export default App;