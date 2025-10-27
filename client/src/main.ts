/**
 * Beast Keepers - Main Bootstrap
 * Online version with authentication
 * 
 * VERSION: 2024-10-27 14:35 - FIXED GAME LOOP RENDERING
 */

// Log version immediately so we know if cache is working
console.log('%c🔥 BEAST KEEPERS - CÓDIGO NOVO CARREGADO! 🔥', 'background: #00ff00; color: #000; font-size: 20px; padding: 10px; font-weight: bold;');
console.log('%cVersão: 2024-10-27 14:35', 'background: #0f3460; color: #fff; font-size: 14px; padding: 5px;');
console.log('%cSe você não vê este log verde, ainda está com cache antigo!', 'color: #ff0000; font-size: 12px;');

import { GameUI } from './ui/game-ui';
import { BattleUI } from './ui/battle-ui';
import { TempleUI } from './ui/temple-ui';
import { DialogueUI } from './ui/dialogue-ui';
import { ShopUI } from './ui/shop-ui';
import { InventoryUI } from './ui/inventory-ui';
import { CraftUI } from './ui/craft-ui';
import { QuestsUI } from './ui/quests-ui';
import { AchievementsUI } from './ui/achievements-ui';
import { ModalUI } from './ui/modal-ui';
import { ExplorationUI } from './ui/exploration-ui';
import { AuthUI } from './ui/auth-ui';
import { GameInitUI } from './ui/game-init-ui';
import { Ranch3DUI } from './ui/ranch-3d-ui';
import { createNewGame, saveGame, loadGame, advanceGameWeek, addMoney } from './systems/game-state';
import { advanceWeek } from './systems/calendar';
import { isBeastAlive } from './systems/beast';
import { initiateBattle, executePlayerAction, executeEnemyTurn, applyBattleRewards } from './systems/combat';
import { generateTournamentOpponent, getTournamentPrize, getTournamentFee, canEnterTournament } from './systems/tournaments';
import { NPCS, getNPCDialogue, increaseAffinity } from './data/npcs';
import { processWeeklyEvents } from './systems/events';
import { useItem } from './systems/inventory';
import { calculateTournamentDrops } from './systems/drops';
import { trackAction, trackSpending, unlockQuests, getCompletedQuests } from './systems/quests';
import { startExploration, advanceExploration, defeatEnemy, collectMaterials, endExploration } from './systems/exploration';
import { executeCraft } from './systems/craft';
import { getItemById } from './data/shop';
import type { ExplorationState, ExplorationZone, WildEnemy } from './systems/exploration';
import type { GameState, WeeklyAction, CombatAction, TournamentRank, Beast, Item } from './types';
import { preloadBeastImages } from './utils/beast-images';
import { authApi } from './api/authApi';
import { gameApi } from './api/gameApi';
import { TECHNIQUES, getStartingTechniques } from './data/techniques';

// Elements
const canvas = document.getElementById('game') as HTMLCanvasElement;
const loadingEl = document.getElementById('loading') as HTMLDivElement;
const errorEl = document.getElementById('error') as HTMLDivElement;

if (!canvas) {
  throw new Error('Canvas element not found');
}

const ctx = canvas.getContext('2d');
if (!ctx) {
  throw new Error('Failed to get 2D context');
}

// Auth state
let isAuthenticated = false;
let authUI: AuthUI | null = null;
let gameInitUI: GameInitUI | null = null;
let inAuth = true; // Start with auth screen
let needsGameInit = false; // After registration, needs game init

// Game state
let gameState: GameState | null = null;
let gameUI: GameUI | null = null;
let battleUI: BattleUI | null = null;
let templeUI: TempleUI | null = null;
let dialogueUI: DialogueUI | null = null;
let shopUI: ShopUI | null = null;
let inventoryUI: InventoryUI | null = null;
let craftUI: CraftUI | null = null;
let questsUI: QuestsUI | null = null;
let achievementsUI: AchievementsUI | null = null;
let modalUI: ModalUI | null = null;
let explorationUI: ExplorationUI | null = null;
let ranch3DUI: Ranch3DUI | null = null;
let inBattle = false;
let inTemple = false;
let inDialogue = false;
let inShop = false;
let inInventory = false;
let inCraft = false;
let inQuests = false;
let inAchievements = false;
let inExploration = false;
let inRanch3D = false;
let explorationState: ExplorationState | null = null;
let isExplorationBattle = false; // Flag para diferenciar batalha de exploração
void isExplorationBattle; // Reservado para uso futuro

// Animation loop
let lastSaveTime = 0;
const AUTO_SAVE_INTERVAL = 10000; // 10 segundos

function startRenderLoop() {
  let frameCount = 0;
  function render(time: number) {
    frameCount++;
    
    // Clear canvas
    ctx.fillStyle = '#0f0f1e';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Debug log every 60 frames (1 second)
    if (frameCount % 60 === 0) {
      console.log('[Render] State:', {
        inDialogue,
        inShop,
        inInventory,
        inCraft,
        inQuests,
        inAchievements,
        inExploration,
        inBattle,
        inTemple,
        inRanch3D
      });
    }

    // Render based on state
    if (inAuth && authUI) {
      authUI.draw();
    } else if (needsGameInit && gameInitUI) {
      gameInitUI.draw();
    } else if (inBattle && battleUI) {
      battleUI.draw();
    } else if (inTemple && templeUI && gameState) {
      templeUI.draw(gameState);
    } else if (inDialogue && dialogueUI) {
      // Draw dialogue UI (Vila) - NO gameUI underneath!
      if (frameCount % 60 === 0) console.log('[Render] Drawing DIALOGUE ONLY');
      dialogueUI.draw();
    } else if (inShop && shopUI && gameState) {
      shopUI.draw(gameState);
    } else if (inInventory && inventoryUI && gameState) {
      inventoryUI.draw(gameState);
    } else if (inCraft && craftUI && gameState) {
      craftUI.draw(gameState);
    } else if (inQuests && questsUI && gameState) {
      questsUI.draw(gameState);
    } else if (inAchievements && achievementsUI && gameState) {
      achievementsUI.draw(gameState);
    } else if (inExploration && explorationUI) {
      explorationUI.draw(explorationState || undefined);
    } else if (inRanch3D && ranch3DUI) {
      ranch3DUI.render();
      // Clean up mini viewer when in full 3D mode
      if (gameUI) {
        gameUI.dispose();
      }
    } else if (gameUI && gameState) {
      // Only draw GameUI when NO other menu is active AND modal is not showing
      if (modalUI && modalUI.isShowing()) {
        // Skip drawing GameUI when modal is open (e.g., Vila menu)
        if (frameCount % 60 === 0) console.log('[Render] Skipping GAMEUI - Modal is open');
      } else {
        if (frameCount % 60 === 0) console.log('[Render] Drawing GAMEUI (Ranch)');
        gameUI.draw();
      }
    }

    // Draw modal UI on top of everything
    if (modalUI && modalUI.isShowing()) {
      modalUI.draw();
    }

    // Auto-save periodically (only if authenticated and has game)
    if (isAuthenticated && gameState && time - lastSaveTime > AUTO_SAVE_INTERVAL) {
      saveGame(gameState).catch(err => {
        console.error('[Save] Auto-save failed:', err);
      });
      lastSaveTime = time;
    }

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

async function init() {
  try {
    loadingEl.textContent = 'Carregando Beast Keepers...';

    // Setup canvas
    resizeCanvas();
    window.addEventListener('resize', () => {
      resizeCanvas();
      // Update 3D viewer position on resize
      if (gameUI) {
        gameUI.update3DViewerPosition();
      }
      // Update battle 3D viewers position on resize
      if (battleUI && inBattle) {
        battleUI.update3DViewersPosition();
      }
    });

    // Register Service Worker
    if ('serviceWorker' in navigator) {
      try {
        await navigator.serviceWorker.register('/sw.js');
        console.log('[SW] Service Worker registered');
      } catch (err) {
        console.warn('[SW] Registration failed:', err);
      }
    }

    // Create Modal UI first
    modalUI = new ModalUI(canvas);

    // Create Auth UI
    authUI = new AuthUI(canvas);
    gameInitUI = new GameInitUI(canvas);

    // Check for OAuth callback
    authUI.checkOAuthCallback();

    // Setup auth callbacks
    authUI.onLoginSuccess = async (token, user) => {
      console.log('[Auth] Login success:', user.displayName);
      isAuthenticated = true;
      inAuth = false;
      await loadGameFromServer();
    };

    authUI.onRegisterSuccess = async (token, user) => {
      console.log('[Auth] Register success:', user.displayName);
      isAuthenticated = true;
      inAuth = false;
      needsGameInit = true;
      // Reset game init UI to clear any previous data
      if (gameInitUI) {
        gameInitUI.reset();
      }
    };

    gameInitUI.onInitComplete = async (gameSave, initialBeast) => {
      console.log('[GameInit] Game initialized:', gameSave.playerName, 'with', initialBeast.line);
      needsGameInit = false;
      await loadGameFromServer();
    };

    // Start render loop early
    startRenderLoop();

    // Preload beast images in background
    preloadBeastImages();

    // Check if already authenticated
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const meResponse = await authApi.getMe();
        if (meResponse.success) {
          console.log('[Auth] Already logged in');
          isAuthenticated = true;
          inAuth = false;
          await loadGameFromServer();
        } else {
          // Invalid token
          localStorage.removeItem('auth_token');
        }
      } catch (error) {
        // Invalid token
        localStorage.removeItem('auth_token');
      }
    }

    // Hide loading, show game
    loadingEl.style.display = 'none';
    canvas.style.display = 'block';

  } catch (err) {
    console.error('[Init] Failed to initialize:', err);
    errorEl.textContent = 'Erro ao carregar o jogo. Recarregue a página.';
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

function handleLogout() {
  if (!modalUI) return;

  // Hide 3D viewer while logout modal is open
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Confirm logout
  modalUI.show({
    type: 'choice',
    title: '🚪 Sair',
    message: 'Deseja realmente sair?\n\nSeu progresso está salvo na nuvem.',
    choices: ['Sim, sair', 'Cancelar'],
    onConfirm: (choice) => {
      if (choice === 'Sim, sair') {
        // Clear token
        localStorage.removeItem('auth_token');
        
        // Clear game state
        gameState = null;
        gameUI = null;
        
        // Show auth screen
        isAuthenticated = false;
        inAuth = true;
        needsGameInit = false;
        
        console.log('[Auth] Logged out');
        
        // Reload page to reset everything
        window.location.reload();
      }
    },
    onCancel: () => {
      // Show 3D viewer again if user cancels
      if (gameUI) {
        gameUI.show3DViewer();
      }
    }
  });
}

async function loadGameFromServer() {
  try {
    loadingEl.textContent = 'Carregando seu jogo...';
    loadingEl.style.display = 'block';

    const response = await gameApi.getGameSave();
    
    if (response.success && response.data) {
      const serverData = response.data;
      
      // Convert server data to GameState
      gameState = createNewGame(serverData.gameSave.player_name);
      
      // Update with server game save data
      gameState.week = serverData.gameSave.week || 1;
      gameState.economy.coronas = serverData.gameSave.coronas || 500;
      gameState.guardian.victories = serverData.gameSave.victories || 0;
      gameState.guardian.title = serverData.gameSave.current_title || 'Guardião Iniciante';
      
      // Load the active Beast from server
      if (serverData.beasts && serverData.beasts.length > 0) {
        const serverBeast = serverData.beasts.find((b: any) => b.is_active) || serverData.beasts[0];
        
        // Map server beast to client Beast format
        gameState.activeBeast = {
          id: serverBeast.id,
          name: serverBeast.name,
          line: serverBeast.line,
          blood: serverBeast.blood || 'common',
          affinity: serverBeast.affinity || 'earth',
          attributes: {
            might: serverBeast.might,
            wit: serverBeast.wit,
            focus: serverBeast.focus,
            agility: serverBeast.agility,
            ward: serverBeast.ward,
            vitality: serverBeast.vitality
          },
          secondaryStats: {
            fatigue: serverBeast.fatigue || 0,
            stress: serverBeast.stress || 0,
            loyalty: serverBeast.loyalty || 50,
            age: serverBeast.age || 0,
            maxAge: serverBeast.max_age || 100
          },
          traits: Array.isArray(serverBeast.traits) ? serverBeast.traits : 
                 (typeof serverBeast.traits === 'string' ? JSON.parse(serverBeast.traits) : []),
          techniques: (() => {
            // Parse techniques from server
            let techIds: string[] = [];
            if (Array.isArray(serverBeast.techniques)) {
              techIds = serverBeast.techniques;
            } else if (typeof serverBeast.techniques === 'string') {
              try {
                techIds = JSON.parse(serverBeast.techniques);
              } catch {
                techIds = [];
              }
            }
            
            console.log('[Beast] Technique IDs from server:', serverBeast.techniques);
            console.log('[Beast] Parsed IDs:', techIds);
            
            // Convert technique IDs to full Technique objects
            let techniques = techIds
              .map(id => TECHNIQUES[id])
              .filter(tech => tech !== undefined);
            
            // FALLBACK: If no techniques, give starting technique for the beast line
            if (techniques.length === 0) {
              console.warn('[Beast] ⚠️ No techniques found in server data! Using fallback...');
              console.log('[Beast] Beast line:', serverBeast.line);
              techniques = getStartingTechniques(serverBeast.line);
              console.log('[Beast] Fallback techniques assigned:', techniques);
            }
            
            console.log('[Beast] Final techniques:', techniques);
            
            return techniques;
          })(),
          currentHp: serverBeast.current_hp,
          maxHp: serverBeast.max_hp,
          essence: serverBeast.essence,
          maxEssence: serverBeast.max_essence,
          level: serverBeast.level || 1,
          experience: serverBeast.experience || 0,
          activeBuffs: []
        };
        
        console.log('[Game] Loaded Beast from server:', gameState.activeBeast.name, `(${gameState.activeBeast.line})`);
      }
      
      console.log('[Game] Loaded from server:', gameState.guardian.name);
      
      await setupGame();
    } else {
      // No game save found - should trigger game init
      needsGameInit = true;
    }
  } catch (error: any) {
    console.error('[Game] Failed to load from server:', error);
    if (error.message.includes('No game save found')) {
      needsGameInit = true;
    } else {
      errorEl.textContent = 'Erro ao carregar jogo do servidor';
      errorEl.style.display = 'block';
    }
  } finally {
    loadingEl.style.display = 'none';
  }
}

async function setupGame() {
  try {
    // gameState already loaded from server in loadGameFromServer()
    // Don't overwrite it with localStorage!
    
    if (!gameState) {
      console.error('[Game] ERROR: gameState is null in setupGame - this should not happen!');
      return;
    }
    
    console.log('[Game] Setting up game with:', gameState.guardian.name, 'and Beast:', gameState.activeBeast?.name);

    // Create UI
    gameUI = new GameUI(canvas, gameState!);
    
    // Setup 3D viewer callback
    gameUI.onView3D = () => {
      if (!gameState || !gameState.activeBeast) return;
      
      console.log('[3D] Opening 3D viewer...');
      inRanch3D = true;
      
      // Create Ranch3D UI
      ranch3DUI = new Ranch3DUI(canvas, gameState.activeBeast);
      
      // Setup exit callback
      ranch3DUI.onExit3D = () => {
        console.log('[3D] Exiting 3D mode...');
        inRanch3D = false;
        ranch3DUI?.dispose();
        ranch3DUI = null;
      };
    };
    
    // Setup temple callback
    gameUI.onOpenTemple = () => {
      openTemple();
    };
    
    // Setup village callback
    gameUI.onOpenVillage = () => {
      openVillage();
    };
    
    // Setup inventory callback
    gameUI.onOpenInventory = () => {
      openInventory();
    };

    // Setup craft callback
    gameUI.onOpenCraft = () => {
      openCraft();
    };

    // Setup quests callback
    gameUI.onOpenQuests = () => {
      openQuests();
    };

    // Setup achievements callback
    gameUI.onOpenAchievements = () => {
      openAchievements();
    };

    // Setup exploration callback
    gameUI.onOpenExploration = () => {
      openExploration();
    };

    // Setup navigate callback
    gameUI.onNavigate = (screen: string) => {
      console.log('[Game] Navigate to:', screen);
      // Ranch é a tela padrão, apenas fecha outras UIs
      closeAllOverlays();
    };

    // Setup logout callback
    gameUI.onLogout = () => {
      handleLogout();
    };
    
    // Setup week advance callback
    gameUI.onAdvanceWeek = async (action: WeeklyAction) => {
      if (!gameState || !gameState.activeBeast) return;

      // Check if tournament
      if (action === 'tournament') {
        startTournament();
        return;
      }

      // Execute action and advance week
      const result = advanceWeek(gameState.activeBeast, action, gameState.currentWeek);
      
      // Add money if gained
      if (result.moneyGain) {
        addMoney(gameState, result.moneyGain);
      }

      // Advance game week
      advanceGameWeek(gameState);

      // Process weekly events
      const events = processWeeklyEvents(gameState);
      
      // Check if beast is still alive
      if (!isBeastAlive(gameState.activeBeast)) {
        showMessage(
          `${gameState.activeBeast.name} chegou ao fim de sua vida... 😢\n\nVocê pode criar uma nova besta no Templo dos Ecos.`,
          '💔 Fim da Jornada'
        );
      }

      // Show result message
      showMessage(result.message);
      
      // Show event messages if any
      for (const event of events) {
        showMessage(`⚡ ${event.message}`);
      }

      // Auto-save
      await saveGame(gameState);
      
      // Update UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }

      console.log('[Game] Week advanced', result);
    };

    // Hide loading
    loadingEl.style.display = 'none';

    console.log('[Game] Beast Keepers initialized!');
  } catch (err) {
    console.error('[Game] Init failed:', err);
    errorEl.textContent = `Erro ao inicializar: ${err}`;
    errorEl.style.display = 'block';
    loadingEl.style.display = 'none';
  }
}

// ===== TEMPLE SYSTEM =====

function openTemple() {
  if (!gameState) return;

  // Hide 3D viewer when opening Temple
  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Main] Temple opened - 3D viewer hidden');
  }

  // Create Temple UI
  templeUI = new TempleUI(canvas);

  // Setup callbacks
  templeUI.onCreateBeast = (beast: Beast) => {
    if (!gameState) return;

    // Check if ranch is full
    if (gameState.ranch.beasts.length >= gameState.ranch.maxBeasts) {
      showMessage('Seu rancho está cheio! Você não pode criar mais bestas.', '⚠️ Rancho Cheio');
      return;
    }

    // Add beast to ranch
    gameState.ranch.beasts.push(beast);

    // Set as active if first beast
    if (!gameState.activeBeast) {
      gameState.activeBeast = beast;
    }

    showMessage(`✨ ${beast.name} foi criado das Relíquias de Eco!`);

    // Save and return
    saveGame(gameState);
    closeTemple();
  };

  templeUI.onCancel = () => {
    closeTemple();
  };

  inTemple = true;
}

function closeTemple() {
  templeUI = null;
  inTemple = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
    console.log('[Main] Temple closed - 3D viewer shown');
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== NPC & DIALOGUE SYSTEM =====

function openVillage() {
  if (!gameState || !modalUI) return;

  // Hide 3D viewer when opening Vila modal
  if (gameUI) {
    gameUI.hide3DViewer();
    console.log('[Main] Vila opened - 3D viewer hidden');
  }

  // Show NPC selection usando modal
  const npcs = Object.values(NPCS).filter(npc => npc.unlocked);
  const npcChoices = npcs.map(npc => `${npc.name} - ${npc.title}`);

  modalUI.show({
    type: 'choice',
    title: '🏘️ Vila',
    message: 'Quem você quer visitar na vila?',
    choices: npcChoices,
    onConfirm: (choice) => {
      if (choice !== undefined) {
        // Find NPC by matching the choice text
        const npcIndex = npcChoices.indexOf(choice);
        if (npcIndex >= 0 && npcIndex < npcs.length) {
          openDialogueWith(npcs[npcIndex].id);
        }
      }
    },
    onCancel: () => {
      // Show 3D viewer when returning to ranch
      if (gameUI) {
        gameUI.show3DViewer();
        console.log('[Main] Vila closed - 3D viewer shown');
      }
    },
  });
}

function openDialogueWith(npcId: string) {
  if (!gameState) return;

  const npc = NPCS[npcId];
  if (!npc || !npc.unlocked) {
    showMessage('NPC não disponível!', '⚠️ Erro');
    return;
  }

  console.log('[Main] Opening dialogue with', npcId, '- Hiding 3D viewer');
  
  // Hide 3D viewer when opening dialogue (Vila)
  if (gameUI) {
    gameUI.hide3DViewer();
  }
  
  console.log('[Main] inDialogue will be set to TRUE (at end of function)');

  // Create dialogue UI if not exists
  if (!dialogueUI) {
    dialogueUI = new DialogueUI(canvas);
    dialogueUI.onClose = () => {
      closeDialogue();
    };
  }

  // Track NPC interaction for quests
  if (gameState) {
    trackAction(gameState.quests, 'talk_npc');
    unlockQuests(gameState.quests);
  }

  // Get greeting dialogue
  const greeting = getNPCDialogue(npcId, 'greeting');

  // Create dialogue options based on NPC
  const options = [];

  // Advice option (if available)
  if (npc.dialogues.advice && npc.dialogues.advice.length > 0) {
    options.push({
      label: '💬 Pedir conselho',
      action: () => {
        const advice = getNPCDialogue(npcId, 'advice');
        dialogueUI?.setDialogue(npc, advice, [
          {
            label: '← Voltar',
            action: () => openDialogueWith(npcId),
          },
          {
            label: '✖ Fechar',
            action: () => closeDialogue(),
          },
        ]);
        increaseAffinity(npcId, 2);
      },
    });
  }

  // Lore option (if available)
  if (npc.dialogues.lore && npc.dialogues.lore.length > 0) {
    options.push({
      label: '📜 Perguntar sobre história',
      action: () => {
        const lore = getNPCDialogue(npcId, 'lore');
        dialogueUI?.setDialogue(npc, lore, [
          {
            label: '← Voltar',
            action: () => openDialogueWith(npcId),
          },
          {
            label: '✖ Fechar',
            action: () => closeDialogue(),
          },
        ]);
        increaseAffinity(npcId, 1);
      },
    });
  }

  // Shop option (Dalan only)
  if (npcId === 'dalan' && npc.dialogues.shop) {
    options.push({
      label: '🛒 Ver loja',
      action: () => {
        closeDialogue();
        openShop();
      },
    });
  }

  // Close option
  options.push({
    label: '👋 Despedir-se',
    action: () => {
      closeDialogue();
    },
  });

  // Set dialogue
  dialogueUI.setDialogue(npc, greeting, options);
  inDialogue = true;
}

function closeDialogue() {
  console.log('[Main] Closing dialogue - Showing 3D viewer');
  inDialogue = false;
  if (dialogueUI) {
    dialogueUI.close();
  }

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }
  console.log('[Main] inDialogue set to FALSE');
}

// ===== SHOP SYSTEM =====

function openShop() {
  if (!gameState) return;

  // Hide 3D viewer when opening shop
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Shop UI
  shopUI = new ShopUI(canvas);

  // Setup callbacks
  shopUI.onBuyItem = (item: Item) => {
    if (!gameState) return;

    // Check if player can afford
    if (gameState.economy.coronas < item.price) {
      showMessage('Você não tem dinheiro suficiente!', '💰 Sem Dinheiro');
      return;
    }

    // Deduct money
    gameState.economy.coronas -= item.price;

    // Track spending for quests
    trackSpending(gameState.quests, item.price);

    // Add item to inventory
    const existingItem = gameState.inventory.find(i => i.id === item.id);
    if (existingItem && existingItem.quantity !== undefined) {
      existingItem.quantity += 1;
    } else {
      gameState.inventory.push({ ...item, quantity: 1 });
    }

    // Show message
    showMessage(`✅ ${item.name} comprado por ${item.price} Coronas!`);

    // Increase affinity with Dalan
    increaseAffinity('dalan', 2);

    // Check for completed quests
    const completedQuests = getCompletedQuests(gameState.quests);
    if (completedQuests.length > 0) {
      showMessage(`🎯 ${completedQuests.length} quest(s) completada(s)!`);
    }

    // Save game
    saveGame(gameState);

    // Update shop UI
    if (shopUI) {
      shopUI.draw(gameState);
    }
  };

  shopUI.onClose = () => {
    closeShop();
  };

  inShop = true;
}

function closeShop() {
  shopUI = null;
  inShop = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== INVENTORY SYSTEM =====

function openInventory() {
  if (!gameState) return;

  // Hide 3D viewer when opening inventory
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Inventory UI
  inventoryUI = new InventoryUI(canvas);

  // Setup callbacks
  inventoryUI.onUseItem = (item: Item) => {
    if (!gameState || !gameState.activeBeast) return;

    // Use the item
    const result = useItem(gameState, item, gameState.activeBeast);

    if (result.success) {
      showMessage(`✅ ${result.message}`);

      // Show detailed changes
      if (result.changes) {
        const changes = [];
        if (result.changes.fatigue) changes.push(`Fadiga ${result.changes.fatigue > 0 ? '+' : ''}${result.changes.fatigue}`);
        if (result.changes.stress) changes.push(`Stress ${result.changes.stress > 0 ? '+' : ''}${result.changes.stress}`);
        if (result.changes.hp) changes.push(`HP ${result.changes.hp > 0 ? '+' : ''}${result.changes.hp}`);
        if (result.changes.essence) changes.push(`Essência ${result.changes.essence > 0 ? '+' : ''}${result.changes.essence}`);
        if (result.changes.mood) changes.push(`Humor: ${result.changes.mood}`);

        if (changes.length > 0) {
          showMessage(`📊 Mudanças: ${changes.join(', ')}`);
        }
      }

      // Save game
      saveGame(gameState);

      // Update inventory UI
      if (inventoryUI) {
        inventoryUI.draw(gameState);
      }

      // Update main UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }
    } else {
      showMessage(result.message, '⚠️ Item');
    }
  };

  inventoryUI.onShowConfirmation = (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => {
    modalUI.show({
      type: 'choice',
      title,
      message,
      choices: ['Confirmar', 'Cancelar'],
      onConfirm: () => {
        onConfirm();
      },
      onCancel: onCancel || (() => {}),
    });
  };

  inventoryUI.onClose = () => {
    closeInventory();
  };

  inInventory = true;
}

function closeInventory() {
  inventoryUI = null;
  inInventory = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== CRAFT SYSTEM =====

function openCraft() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();

  // Hide 3D viewer when opening craft
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Craft UI
  craftUI = new CraftUI(canvas);

  // Setup callbacks
  craftUI.onCraftItem = (recipe) => {
    if (!gameState) return;

    const result = executeCraft(recipe, gameState.inventory);

    if (result.success && result.result) {
      // Add result to inventory
      const existingItem = gameState.inventory.find(i => i.id === result.result!.id);
      if (existingItem && existingItem.quantity) {
        existingItem.quantity += result.result.quantity || 1;
      } else {
        const item = getItemById(result.result.id);
        if (item) {
          gameState.inventory.push({ ...item, quantity: result.result.quantity || 1 });
        }
      }

      showMessage(result.message);

      // Save game
      saveGame(gameState);

      // Update craft UI
      if (craftUI) {
        craftUI.draw(gameState);
      }

      // Update main UI
      if (gameUI) {
        gameUI.updateGameState(gameState);
      }
    } else {
      showMessage(result.message, '⚠️ Item');
    }
  };

  craftUI.onClose = () => {
    closeCraft();
  };

  inCraft = true;
}

function closeCraft() {
  if (craftUI) {
    craftUI.close();
  }
  craftUI = null;
  inCraft = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== QUESTS SYSTEM =====

function openQuests() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();

  // Hide 3D viewer when opening quests
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Quests UI
  questsUI = new QuestsUI(canvas);

  // Setup callbacks
  questsUI.onClaimReward = (quest) => {
    if (!gameState) return;

    // Add rewards to game state
    if (quest.rewards.coronas) {
      gameState.economy.coronas += quest.rewards.coronas;
    }

    if (quest.rewards.items) {
      quest.rewards.items.forEach(reward => {
        import('./data/shop').then(({ getItemById }) => {
          const item = getItemById(reward.itemId);
          if (item) {
            const existingItem = gameState!.inventory.find(i => i.id === reward.itemId);
            if (existingItem && existingItem.quantity) {
              existingItem.quantity += reward.quantity;
            } else {
              gameState!.inventory.push({ ...item, quantity: reward.quantity });
            }
          }
        });
      });
    }

    // Remove quest from list
    const questIndex = gameState.quests.findIndex(q => q.id === quest.id);
    if (questIndex !== -1) {
      gameState.quests.splice(questIndex, 1);
    }

    showMessage(`🎁 Recompensas coletadas! +${quest.rewards.coronas || 0}💰`);

    // Save game
    saveGame(gameState);

    // Update quests UI
    if (questsUI) {
      questsUI.draw(gameState);
    }

    // Update main UI
    if (gameUI) {
      gameUI.updateGameState(gameState);
    }
  };

  questsUI.onClose = () => {
    closeQuests();
  };

  inQuests = true;
}

function closeQuests() {
  if (questsUI) {
    questsUI.close();
  }
  questsUI = null;
  inQuests = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== ACHIEVEMENTS SYSTEM =====

function openAchievements() {
  if (!gameState) return;

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();

  // Hide 3D viewer when opening achievements
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Achievements UI
  achievementsUI = new AchievementsUI(canvas);

  // Setup callbacks
  achievementsUI.onClose = () => {
    closeAchievements();
  };

  inAchievements = true;
}

function closeAchievements() {
  if (achievementsUI) {
    achievementsUI.close();
  }
  achievementsUI = null;
  inAchievements = false;

  // Show 3D viewer when returning to ranch
  if (gameUI) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== EXPLORATION SYSTEM =====

function openExploration() {
  if (!gameState || !gameState.activeBeast) {
    showMessage('Você precisa de uma besta ativa para explorar!', '⚠️ Sem Besta');
    return;
  }

  // Close other UIs
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();

  // Hide 3D viewer when opening exploration
  if (gameUI) {
    gameUI.hide3DViewer();
  }

  // Create Exploration UI
  explorationUI = new ExplorationUI(canvas);

  // Setup callbacks
  explorationUI.onZoneSelected = (zone: ExplorationZone) => {
    startExplorationInZone(zone);
  };

  explorationUI.onWalk = () => {
    walkExploration();
  };

  explorationUI.onBattleStart = (enemy: WildEnemy) => {
    startExplorationBattle(enemy);
  };

  explorationUI.onTreasureCollect = (treasure: Item[]) => {
    collectTreasureInExploration(treasure);
  };

  explorationUI.onEventContinue = () => {
    continueEventExploration();
  };

  explorationUI.onReturn = () => {
    finishExploration();
  };

  explorationUI.onClose = () => {
    closeExploration();
  };

  inExploration = true;
}

function startExplorationInZone(zone: ExplorationZone) {
  if (!explorationUI) return;

  explorationState = startExploration(zone);
  explorationUI.updateState(explorationState);
}

function walkExploration() {
  if (!explorationState || !explorationUI) return;

  const encounter = advanceExploration(explorationState, 100);
  explorationUI.updateState(explorationState);
}

function startExplorationBattle(enemy: WildEnemy) {
  if (!gameState || !gameState.activeBeast || !explorationState) {
    return;
  }

  // Salvar o inimigo atual para usar depois no callback
  const currentEnemy = enemy;

  // Criar besta inimiga a partir do WildEnemy
  const enemyBeast: Beast = {
    id: enemy.id,
    name: enemy.name,
    line: enemy.line as any,
    blood: 'common',
    affinity: 'earth',
    attributes: enemy.stats,
    secondaryStats: {
      fatigue: 0,
      stress: 0,
      loyalty: 100,
      age: enemy.level,
      maxAge: 200,
    },
    traits: [],
    mood: 'neutral',
    techniques: [
      // Técnicas padrão - dano reduzido para level baixo
      { id: 'tackle', name: 'Investida', essenceCost: 5, damage: 8 + enemy.level * 2, type: 'physical', description: 'Ataque físico básico' },
      { id: 'scratch', name: 'Arranhar', essenceCost: 3, damage: 5 + enemy.level, type: 'physical', description: 'Ataque rápido' },
      { id: 'roar', name: 'Rugido', essenceCost: 8, damage: 12 + enemy.level * 3, type: 'mystical', description: 'Intimidar o oponente' },
    ],
    // HP e Essência balanceados:
    // Level 1: ~50-75 HP, 30 Essência
    // Level 2: ~65-95 HP, 35 Essência
    // Level 5: ~110-155 HP, 50 Essência
    currentHp: enemy.stats.vitality * 5 + enemy.level * 5,
    maxHp: enemy.stats.vitality * 5 + enemy.level * 5,
    essence: 30 + enemy.level * 5,
    maxEssence: 30 + enemy.level * 5,
    birthWeek: 0,
    lifeEvents: [],
    victories: 0,
    defeats: 0,
  };

  // Iniciar batalha
  const battle = initiateBattle(gameState.activeBeast, enemyBeast, false);
  battle.phase = 'player_turn';

  gameState.currentBattle = battle;

  // Marcar como batalha de exploração
  isExplorationBattle = true;

  // Create battle UI
  battleUI = new BattleUI(canvas, battle);

  // Setup callbacks (same as tournament)
  battleUI.onPlayerAction = (action: CombatAction) => {
    if (!gameState?.currentBattle) return;

    const result = executePlayerAction(gameState.currentBattle, action);

    if (result && battleUI) {
      battleUI.updateBattle(gameState.currentBattle);

      // CORREÇÃO: Se a batalha terminou, chamar onBattleEnd manualmente
      if (gameState.currentBattle.winner) {
        battleUI.onBattleEnd();
        return;
      }

      // If enemy turn, execute automatically after delay
      if (gameState.currentBattle.phase === 'enemy_turn') {
        setTimeout(() => {
          if (!gameState?.currentBattle || !battleUI) return;

          executeEnemyTurn(gameState.currentBattle);
          battleUI.updateBattle(gameState.currentBattle);

          // CORREÇÃO: Se a batalha terminou após turno do inimigo, chamar onBattleEnd manualmente
          if (gameState.currentBattle.winner) {
            battleUI.onBattleEnd();
            return;
          }

          // Check if auto-battle is active and it's player turn now
          if (gameState.currentBattle.phase === 'player_turn') {
            setTimeout(() => {
              if (battleUI) {
                battleUI.checkAutoBattle();
              }
            }, 500);
          }
        }, 1500);
      }
    }
  };

  battleUI.onBattleEnd = () => {
    if (!gameState?.currentBattle || !explorationState) return;

    const battle = gameState.currentBattle;
    
    // CORREÇÃO: Só processa se o winner estiver definido
    if (!battle.winner) {
      return;
    }

    // Apply results
    if (battle.winner === 'player') {
    // Derrotou inimigo na exploração
    const drops = defeatEnemy(explorationState, currentEnemy);

    // Mostrar drops
    const dropsList = drops.map(d => `${d.name} x${d.quantity}`).join(', ');
    showMessage(`Vitória na batalha! Materiais coletados: ${dropsList}`, '⚔️ Vitória na Batalha');

    // Track quest
    trackAction(gameState.quests, 'win_battle');
    unlockQuests(gameState.quests);

    } else if (battle.winner === 'enemy') {
      gameState.defeats++;
      gameState.activeBeast!.defeats++;
      
      // Update beast HP/Essence
      if (gameState.activeBeast) {
        gameState.activeBeast.currentHp = battle.player.currentHp;
        gameState.activeBeast.essence = battle.player.currentEssence;
      }

      // Clear battle FIRST
      gameState.currentBattle = undefined;
      if (battleUI) {
        battleUI.dispose(); // Cleanup 3D viewers
      }
      battleUI = null;
      inBattle = false;
      isExplorationBattle = false;
      
      // DON'T show 3D viewer yet - modal will be open
      console.log('[Main] Defeat - keeping 3D hidden until modal closes');
      
      // Show message and close exploration
      showMessage('Você foi derrotado! Retornando ao rancho...', '💀 Derrota', () => {
        // Show 3D viewer AFTER modal is closed
        if (gameUI) {
          gameUI.show3DViewer();
          console.log('[Main] Defeat modal closed - showing 3D viewer now');
        }
      });
      
      // Force close exploration after a short delay to ensure message is shown
      setTimeout(() => {
        closeExploration();
      }, 100);
      
      return;
    }

    // Update beast HP/Essence
    if (gameState.activeBeast) {
      gameState.activeBeast.currentHp = battle.player.currentHp;
      gameState.activeBeast.essence = battle.player.currentEssence;
    }

    // Clear battle
    gameState.currentBattle = undefined;
    if (battleUI) {
      battleUI.dispose(); // Cleanup 3D viewers
    }
    battleUI = null;
    inBattle = false;
    isExplorationBattle = false;

    // Volta para exploração
    if (explorationUI && explorationState) {
      inExploration = true; // ← CORREÇÃO: Reativa a exploração
      
      // Continuar exploração após vitória (só se venceu)
      if (battle.winner === 'player') {
        // Limpar o encontro atual para continuar explorando
        explorationState.currentEncounter = -1;
      }
      
      // Sempre atualizar a UI após qualquer resultado
      explorationUI.updateState(explorationState);
    }

    // Save
    saveGame(gameState);
  };

  inBattle = true;
  inExploration = false; // Temporariamente sai da exploração
}

function collectTreasureInExploration(treasure: Item[]) {
  if (!explorationState || !explorationUI) return;
  
  collectMaterials(explorationState, treasure);
  
  // Limpar o encontro atual para continuar explorando
  explorationState.currentEncounter = -1;
  
  explorationUI.updateState(explorationState);

  const treasureList = treasure.map(t => `${t.name} x${t.quantity}`).join(', ');
  showMessage(`Tesouro coletado: ${treasureList}`, '💎 Tesouro');

  // Continua explorando
  continueExploration();
}

function processEventEffect(message: string, gameState: GameState) {
  if (!gameState.activeBeast || !message) {
    return;
  }
  
  const beast = gameState.activeBeast;
  
  // Fonte mágica - Recupera HP e Essência
  if (message.includes('fonte mágica')) {
    const hpRecovery = Math.floor(beast.maxHp * 0.2);
    const essenceRecovery = Math.floor(beast.maxEssence * 0.2);
    
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecovery);
    beast.essence = Math.min(beast.maxEssence, beast.essence + essenceRecovery);
    
    showMessage(
      `🌟 Fonte mágica encontrada!\n` +
      `❤️ HP recuperado: +${hpRecovery}\n` +
      `💙 Essência recuperada: +${essenceRecovery}`,
      '🌟 Fonte Mágica'
    );
  }
  
  // Depósito de cristais - Ganha materiais raros
  else if (message.includes('depósito de cristais')) {
    const crystalMaterials = [
      { id: 'crystal_shard', name: 'Fragmento de Cristal', quantity: 2 },
      { id: 'magic_dust', name: 'Pó Mágico', quantity: 1 },
      { id: 'energy_core', name: 'Núcleo de Energia', quantity: 1 }
    ];
    
    // Adicionar materiais ao inventário
    for (const material of crystalMaterials) {
      const existing = gameState.inventory.find(i => i.id === material.id);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + material.quantity;
      } else {
        gameState.inventory.push({ ...material });
      }
    }
    
    const materialsList = crystalMaterials.map(m => `${m.name} x${m.quantity}`).join(', ');
    showMessage(
      `💎 Depósito de cristais descoberto!\n` +
      `Materiais coletados: ${materialsList}`,
      '💎 Depósito de Cristais'
    );
  }
  
  // Baú do viajante - Materiais extras
  else if (message.includes('baú')) {
    const treasureMaterials = [
      { id: 'gold_coin', name: 'Moeda de Ouro', quantity: 3 },
      { id: 'rare_herb', name: 'Erva Rara', quantity: 2 },
      { id: 'ancient_scroll', name: 'Pergaminho Antigo', quantity: 1 }
    ];
    
    // Adicionar materiais ao inventário
    for (const material of treasureMaterials) {
      const existing = gameState.inventory.find(i => i.id === material.id);
      if (existing) {
        existing.quantity = (existing.quantity || 0) + material.quantity;
      } else {
        gameState.inventory.push({ ...material });
      }
    }
    
    const materialsList = treasureMaterials.map(m => `${m.name} x${m.quantity}`).join(', ');
    showMessage(
      `🎁 Baú do viajante encontrado!\n` +
      `Materiais coletados: ${materialsList}`,
      '🎁 Baú do Viajante'
    );
  }
  
  // Plantas medicinais - Recupera HP
  else if (message.includes('plantas medicinais') || message.includes('Plantas medicinais')) {
    const hpRecovery = Math.floor(beast.maxHp * 0.15);
    beast.currentHp = Math.min(beast.maxHp, beast.currentHp + hpRecovery);
    
    showMessage(
      `🌿 Plantas medicinais encontradas!\n` +
      `❤️ HP recuperado: +${hpRecovery}`,
      '🌿 Plantas Medicinais'
    );
  }
  
  // Ave guia - Bônus de movimento
  else if (message.includes('ave guia')) {
    // Este evento não precisa de processamento especial
    showMessage(
      `🦅 Uma ave guia você!\n` +
      `Você se sente mais ágil e pode se mover mais rápido.`,
      '🦅 Ave Guia'
    );
  }
  
  // Tempestade - Nenhum efeito (já está na mensagem)
  else if (message.includes('tempestade')) {
    showMessage(
      `⚠️ Tempestade súbita!\n` +
      `Nenhum material encontrado aqui.`,
      '⚠️ Tempestade'
    );
  }
  
  // Salvar após aplicar efeitos
  saveGame(gameState);
}

function continueEventExploration() {
  if (!explorationState || !explorationUI || !gameState) {
    return;
  }
  
  // Verificar se já está no estado correto para evitar chamadas duplicadas
  if (explorationState.currentEncounter === -1) {
    explorationUI.updateState(explorationState);
    return;
  }
  
  // Processar efeito do evento antes de limpar
  const currentEncounter = explorationState.encounters[explorationState.currentEncounter];
  if (currentEncounter && currentEncounter.type === 'event' && currentEncounter.eventMessage) {
    processEventEffect(currentEncounter.eventMessage, gameState);
  }
  
  // Limpar o encontro atual para continuar explorando
  explorationState.currentEncounter = -1;
  
  // Atualizar UI
  explorationUI.updateState(explorationState);
}

function continueExploration() {
  if (!explorationState || !explorationUI) {
    return;
  }
  
  // Não limpar o currentEncounter aqui - deixar para a lógica específica
  explorationUI.updateState(explorationState);
}

function finishExploration() {
  if (!explorationState || !gameState) return;

  const rewards = endExploration(explorationState);

  // Adicionar materiais ao inventário
  for (const material of rewards.materials) {
    const existing = gameState.inventory.find(i => i.id === material.id);
    if (existing) {
      existing.quantity = (existing.quantity || 0) + (material.quantity || 0);
    } else {
      gameState.inventory.push({ ...material });
    }
  }

  // Mostrar resumo
  const materialCount = rewards.materials.length;
  showMessage(
    `Exploração concluída!\n` +
    `📍 Distância: ${rewards.totalDistance}m\n` +
    `⚔️ Inimigos: ${rewards.enemiesDefeated}\n` +
    `💎 Materiais: ${materialCount} tipos coletados`,
    '🗺️ Exploração Finalizada'
  );

  // Save
  saveGame(gameState);

  // Close exploration
  closeExploration();
}

function closeExploration() {
  if (explorationUI) {
    explorationUI.close();
  }
  explorationUI = null;
  explorationState = null;
  inExploration = false;
  isExplorationBattle = false;

  // Show 3D viewer when returning to ranch (but only if no modal is open)
  if (gameUI && (!modalUI || !modalUI.isShowing())) {
    gameUI.show3DViewer();
  }

  // Update main UI
  if (gameUI && gameState) {
    gameUI.updateGameState(gameState);
  }
}

// ===== NAVIGATION =====

function closeAllOverlays() {
  if (inBattle) return; // Não fecha batalha automaticamente
  if (inShop) closeShop();
  if (inInventory) closeInventory();
  if (inCraft) closeCraft();
  if (inQuests) closeQuests();
  if (inAchievements) closeAchievements();
  if (inExploration) closeExploration();
  if (inDialogue) closeDialogue();
  // Temple não fecha, pois é uma ação importante
}

// ===== COMBAT SYSTEM =====

function startTournament() {
  if (!gameState || !gameState.activeBeast || !modalUI) return;
  
  // Choose tournament rank usando modal
  const ranks: TournamentRank[] = ['bronze', 'silver', 'gold', 'mythic'];
  const rankNames = ['Bronze (Grátis)', 'Prata (300💰)', 'Ouro (800💰)', 'Mítico (2000💰)'];
  
  modalUI.show({
    type: 'choice',
    title: '🏆 Escolha o Torneio',
    message: `Você tem: ${gameState.economy.coronas}💰 | Vitórias: ${gameState.victories}`,
    choices: rankNames,
    onConfirm: (choice) => {
      if (choice === undefined || !gameState || !gameState.activeBeast) return;
      
      // Find rank by matching the choice text
      const rankIndex = rankNames.indexOf(choice);
      if (rankIndex < 0 || rankIndex >= ranks.length) return;
      
      const rank = ranks[rankIndex];
      
      // Check if can enter
      if (!canEnterTournament(rank, gameState.victories, gameState.economy.coronas)) {
        showMessage(
          'Você não pode participar deste torneio! Verifique se você tem dinheiro suficiente e vitórias necessárias.',
          '⚠️ Torneio Bloqueado'
        );
        return;
      }
      
      // Continue com o torneio
      startTournamentBattle(rank);
    },
    onCancel: () => {
      // Volta
    },
  });
}

function startTournamentBattle(rank: TournamentRank) {
  if (!gameState || !gameState.activeBeast) return;
  
  // Pay fee
  const fee = getTournamentFee(rank);
  gameState.economy.coronas -= fee;
  
  // Generate opponent
  const playerLevel = gameState.activeBeast.secondaryStats.age;
  const enemy = generateTournamentOpponent(rank, playerLevel);
  
  // Start battle
  const battle = initiateBattle(gameState.activeBeast, enemy, false);
  battle.phase = 'player_turn';
  
  // Apply rewards on victory
  const prize = getTournamentPrize(rank);
  applyBattleRewards(battle, prize);
  
  gameState.currentBattle = battle;
  
  // Create battle UI
  battleUI = new BattleUI(canvas, battle);
  
  // Setup callbacks
  battleUI.onPlayerAction = (action: CombatAction) => {
    if (!gameState?.currentBattle) return;
    
    const result = executePlayerAction(gameState.currentBattle, action);
    
    if (result && battleUI) {
      battleUI.updateBattle(gameState.currentBattle);
      
      // If enemy turn, execute automatically after delay
      if (gameState.currentBattle.phase === 'enemy_turn') {
        setTimeout(() => {
          if (!gameState?.currentBattle || !battleUI) return;
          
          executeEnemyTurn(gameState.currentBattle);
          battleUI.updateBattle(gameState.currentBattle);
          
          // Check if auto-battle is active and it's player turn now
          if (gameState.currentBattle.phase === 'player_turn') {
            setTimeout(() => {
              if (battleUI) {
                battleUI.checkAutoBattle();
              }
            }, 500); // Small delay before next auto action
          }
        }, 1500); // 1.5s delay
      }
    }
  };
  
  battleUI.onBattleEnd = () => {
    if (!gameState?.currentBattle) return;
    
    const battle = gameState.currentBattle;
    
    // Apply results
    if (battle.winner === 'player') {
      gameState.victories++;
      gameState.activeBeast!.victories++;
      
      // Track quest progress
      trackAction(gameState.quests, 'win_battle');
      unlockQuests(gameState.quests);
      
      // Add rewards
      if (battle.rewards) {
        gameState.economy.coronas += battle.rewards.coronas;
        showMessage(`Vitória! +${battle.rewards.coronas}💰`);

        // Calculate and add item drops
        if (battle.rewards.rank && gameState) {
          const drops = calculateTournamentDrops(battle.rewards.rank);
          
          if (drops.items.length > 0) {
            // Add items to inventory
            drops.items.forEach(item => {
              if (!gameState) return;
              const existingItem = gameState.inventory.find(i => i.id === item.id);
              if (existingItem && existingItem.quantity) {
                existingItem.quantity += 1;
              } else {
                gameState.inventory.push({ ...item, quantity: 1 });
              }
            });
            
            showMessage(drops.message);
          } else {
            showMessage('💰 Apenas prêmio em dinheiro desta vez.');
          }
        }
      }

      // Check for completed quests
      const completed = getCompletedQuests(gameState.quests);
      if (completed.length > 0) {
        showMessage(`🎯 ${completed.length} quest(s) completada(s)! Verifique suas missões.`);
      }
    } else if (battle.winner === 'enemy') {
      gameState.defeats++;
      gameState.activeBeast!.defeats++;
      showMessage('Você foi derrotado!', '💀 Derrota', () => {
        // Show 3D viewer AFTER modal is closed
        if (gameUI) {
          gameUI.show3DViewer();
          console.log('[Main] Tournament defeat modal closed - showing 3D viewer');
        }
      });
    } else {
      showMessage('Você fugiu da batalha.');
    }
    
    // Update beast HP/Essence
    if (gameState.activeBeast) {
      gameState.activeBeast.currentHp = battle.player.currentHp;
      gameState.activeBeast.essence = battle.player.currentEssence;
    }
    
    // Advance week
    advanceGameWeek(gameState);
    
    // Clear battle
    gameState.currentBattle = undefined;
    if (battleUI) {
      battleUI.dispose(); // Cleanup 3D viewers
    }
    battleUI = null;
    inBattle = false;
    
    // Save
    saveGame(gameState);
    
    // Update UI
    if (gameUI) {
      gameUI.updateGameState(gameState);
    }
  };
  
  inBattle = true;
  showMessage(`Torneio ${rank.toUpperCase()} iniciado!`);
}

function resizeCanvas() {
  // Fixed logical resolution
  const logicalWidth = 1400;
  const logicalHeight = 800;
  const aspectRatio = logicalWidth / logicalHeight;

  // Available space
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight;
  const containerAspect = containerWidth / containerHeight;

  let renderWidth = containerWidth;
  let renderHeight = containerHeight;

  // Maintain aspect ratio
  if (containerAspect > aspectRatio) {
    renderWidth = containerHeight * aspectRatio;
  } else {
    renderHeight = containerWidth / aspectRatio;
  }

  canvas.style.width = `${renderWidth}px`;
  canvas.style.height = `${renderHeight}px`;

  // Keep logical resolution
  canvas.width = logicalWidth;
  canvas.height = logicalHeight;
}

function showMessage(message: string, title: string = '💬 Beast Keepers', onClose?: () => void) {
  // Hide 3D viewer when showing message modal
  if (gameUI) {
    gameUI.hide3DViewer();
  }
  
  if (modalUI) {
    modalUI.show({
      type: 'message',
      title,
      message,
      onConfirm: () => {
        modalUI.hide();
        
        // Show 3D viewer again after modal closes
        if (gameUI) {
          gameUI.show3DViewer();
        }
        
        // Call onClose callback if provided
        if (onClose) {
          onClose();
        }
      },
    });
  }
}

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInOut {
    0% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
    15% { opacity: 1; transform: translateX(-50%) translateY(0); }
    85% { opacity: 1; transform: translateX(-50%) translateY(0); }
    100% { opacity: 0; transform: translateX(-50%) translateY(-20px); }
  }
`;
document.head.appendChild(style);

// Pause when page not visible
document.addEventListener('visibilitychange', async () => {
  if (document.visibilityState === 'hidden' && gameState) {
    await saveGame(gameState);
    console.log('[Game] Saved on visibility change');
  }
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // S = Save
  if (e.key === 's' && gameState) {
    saveGame(gameState).then(() => {
      showMessage('Jogo salvo!');
    });
  }
  
  // R = Reset (debug)
  if (e.key === 'r' && e.ctrlKey) {
    if (confirm('Resetar o jogo? (isso apagará todo o progresso)')) {
      localStorage.clear();
      indexedDB.deleteDatabase('beast_keepers');
      location.reload();
    }
  }
});

// Start
init();
