
import { RadarArc, RadarDesign } from './types';

/**
 * CONFIGURATION DU SYSTÈME - PANNEAU DE CONTRÔLE
 */

export const DEBUG_FLAGS = {
  IS_DEV_MODE: true, // Mettre "true" pour le Mode développeur (désactive la sauvegarde, permet UNLOCK_ALL) / Mettre "false" pour le mode joueur
  UNLOCK_ALL: true, // Mettre "true" en mode DEV, débloque tout. En mode JOUEUR, est forcé à 'false'.
};

export const COOLDOWN_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 jours en millisecondes

export const UI_TITLES = {
  // En-tête Global
  MAIN_APP_TITLE: "Dragon Ball Radar",

  // Bouton de Scan
  SCAN_BUTTON_IDLE: "LANCER LE SCAN",
  SCAN_BUTTON_LOADING: "SYNCHRONISATION...",
  SCAN_BUTTON_COOLDOWN: "BOULES DE PIERRE...",

  // Menu Latéral
  MENU_HEADER: "Menu",
  MENU_CURRENT_PROFILE: "Profil Actuel",
  MENU_SANCTUARY_LINK: "Sanctuaire",
  MENU_RESET_LABEL: "Réinitialiser",
  MENU_RESET_CONFIRM_MSG: "Voulez-vous vraiment réinitialiser toute votre progression ?",

  // Scouter
  SCOUTER_START: "SCOUTER AR",
  SCOUTER_STOP: "STOP SCOUTER",

  // Détails de la cible
  TARGET_LABEL: "Cible Détectée",
  DISTANCE_LABEL: "Distance",
  BACK_TO_RADAR: "RADAR",

  // Sanctuaire & Shenron
  SANCTUARY_TITLE: "Sanctuaire des Vœux",
  WISHES_REMAINING: "Vœux restants",
  SHENRON_TITLE: "SHENRON EST LÀ",
  SHENRON_SUBTITLE: "\"Tes vœux vont être exaucés !\"",
  SHENRON_ACTION_BUTTON: "Accéder au Sanctuaire",

  // Collections
  COLLECTION_BOOK_TITLE: "Livre de Collection",
  CHRONICLES_SECTION: "Section 2 : Les Chroniques (Livres)",
  RADARS_SECTION: "Section 1 : Les Radars",
  FORBIDDEN_WISHES_SECTION: "Section 3 : Vœux Interdits",

  SAGA_NAMES: {
    1: "Dragon Ball",
    2: "Dragon Ball Z",
    3: "Dragon Ball Super"
  }
};

export const ARCS_DATA: RadarArc[] = [
  {
    id: 'capsule_corp', 
    label: 'Capsule Corp.', 
    saga: 1, 
    radius: 0.050,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-capsule-corp1.png',
    colors: {
      main: '#AAFFAA',
      glow: 'rgba(170, 255, 170, 0.4)',
      bg: '#185826',
      grid: 'rgba(0, 0, 0, 1)',  // old : rgba(170, 255, 170, 0.63)
      scan: 'linear-gradient(to right, transparent 50%, rgba(170, 255, 170, 0.4) 100%)'
    },
    characters: [
      {
        subTitle: "À la Recherche des 7 Boules de Cristal",
        list: [
          { name: "Goku", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/goku-petit.png" },
          { name: "Bulma", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Bulma-jeune-tete1.png" },
          { name: "Tortue Géniale", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Tortue-géniale.png" },
          { name: "Yamcha", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Yamsha.png" },
          { name: "Pilaf", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/pilaf.png" },
          { name: "Shu", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/shu-tete.png" },
          { name: "Mai", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/mai-jeune.png" },
          { name: "Umigame", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/tortue.png" },
          { name: "Oolong", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/oolong1.png" },
          { name: "Puar", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Puar1.png" },
          { name: "Boss Rabbit", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/boss-rabbit-tete.png " },
          { name: "Gyumao", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Gyumao.png" },
          { name: "Chi-Chi", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/chichi-enfant.png" },
          { name: "Oozaru", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/gorille-tete.png" },
          { name: "Shenron", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/shenron-tete.png " }
        ]
      },
      {
        subTitle: "Entraînement",
        list: [
          { name: "Krillin", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Krilin-jeune-tete.png" },
          { name: "Lunch", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/lunchs-tete.png " } 
        ]
      },
      {
        subTitle: "21ème Tenkaichi Budokai",
        list: [          
          { name: "Jackie Chun", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/jackie-chun-tete.png" },
          { name: "Présentateur du tournoi", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Présentateur-tournoi-tete.png  " },
          { name: "Nam", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/nam-tete.png " }, 
          { name: "Ranfan", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ranfan-tete.png " },
          { name: "Giran", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/giran-tete.png  " },
          { name: "Bacterian", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/bacterian-tete.png " }  
        ]
      },
    ]
  },
  {
    id: 'red_ribbon', label: 'Ruban Rouge', saga: 1, radius: 0.040,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-RR1.png',
    colors: {
      main: '#CF272A', 
      glow: 'rgba(239, 68, 68, 0.4)',
      bg: '#8b0000', // old '#310000'
      grid: 'rgba(0, 0, 0, 1)', // old rgba(239, 68, 68, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(255, 255, 255, 0.90) 100%)' // old linear-gradient(to right, transparent 50%, rgba(239, 68, 68, 0.4) 100%)
    },
    characters: [
      {
        subTitle: "Muscle Tower",
        list: [
          { name: "C-8", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/c-8-tete.png " },
          { name: "Colonel Silver", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/colonel-silver-tete.png  " },
          { name: "Suno", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/suno-tete.png  "},
          { name: "Sergent Metallic", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/sergent-metallic-tete.png " },
          { name: "Ninja Murasaki", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/ninja-murasaki-tete.png " },
          { name: "Boing", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/boing-tete.png  " },
          { name: "Général White", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/general-white-tete.png  " }
        ]
      },
      {
        subTitle: "Le Général Blue",
        list: [
          { name: "Général Blue", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/general-blue-tete.png  " },
          { name: "Docteur Brief", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/dr-brief-tete.png   " },
          { name: "Mme Brief", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/mme-brief-tete.png   " },
          { name: "Robot Pirate", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/robot-pirate-tete.png  " },
          { name: "Arale", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/arale.png" }
        ]
      },
      {
        subTitle: "La Terre Sacrée de Karin",
        list: [
          { name: "Bora", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/bora-tete.png  " }, 
          { name: "Upa", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/upa-tete.png  " },
          { name: "Tao Pai Pai", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/tao-pai-pai-tete.png  " },
          { name: "Maitre Karin", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/maitre-karin-tete.png  " },
          { name: "Officier Black", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/officier-black-tete.png  " },
          { name: "Commandant Red", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/ruban-rouge/commandant-red-tete.png   " }
        ]
      },
      {
        subTitle: "Le Palais de Baba la voyante",
        list: [
          { name: "Baba la Voyante", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/baba-la-voyante-tete.png "},
          { name: "Devil Man", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/devil-man-tete.png  "},
          { name: "Son Gohan", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/songohan-grand-pere-tete.png  "},
          { name: "Le fantôme de baba", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/fantome-de-baba-tete.png  "},
          { name: "Dracula Man", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/draculaman-tete.png   "},
          { name: "Invisible Man", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/invisible-man-tete.png   "},
          { name: "Mummy Man", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/mummy-man-tete.png   "}
        ]
      },
      {
        subTitle: "22ème Tenkaichi Budokai",
        list: [
          { name: "Goku", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/goku-tete-22-tournoi.png "},
          { name: "Tenshinhan", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/tenshinhan-tete-22-tournoi.png  "},
          { name: "Chaoz", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/chaoz-tete-22-tournoi.png   "},
          { name: "Krilin", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/krilin-tete-22-tournoi.png  "},          
          { name: "Maitre des Grues", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/maitre-grues-tete-22-tournoi.png   "},
          { name: "Tortue Géniale", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/tortue-geniale-tete-22-tournoi.png  "},
          { name: "Yamsha", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/yamsha-22-tournoi-tete.png  "},
          { name: "Jackie Chun", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/jackie-chun-22-tournoi-tete.png  "},
          { name: "Man Wolf", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/man-wolf1-tete-22-tournoi.png  "},
          { name: "Pamputt", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Baba-la-voyante/pamputt-22-tournoi-tete.png  "}
        ]
      }
    ]
  },
  {
    id: 'daimao', label: 'Piccolo Daimao', saga: 1, radius: 0.030,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-piccolo-daimao.png ',
    colors: { 
      main: '#456f23', // old #4ade80
      glow: 'rgba(74, 222, 128, 0.3)', 
      bg: '#456f23', // old #052c16
      grid: 'rgba(60, 20, 80, 0.8)', // old rgba(74, 222, 128, 0.2)
      scan: 'linear-gradient(to right, transparent 40%, rgba(15, 42, 149, 0.98) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(74, 222, 128, 0.3) 100%)
    characters: [
      {
        subTitle: "Piccolo Daimao",
        list: [
          { name: "Tambourine", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/tambourine-tete.png "}, 
          { name: "Yajirobé", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/yajirobe-tete.png "},
          { name: "Piccolo Daimao", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/piccolo-daimao-tete.png "},
          { name: "Mr. Popo", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/Mr-Popo-tete.png "},
          { name: "Le Tout-Puissant", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/le-tout-puissant-tete.png "}, 
          { name: "Cymbal", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/cymbal-tete.png "},                     
          { name: "Piano", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/piano-tete.png  "},
          { name: "Le Roi de la terre", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/roi-terre-tete.png "},
          { name: "Drum", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/drum-tete.png "},
          { name: "Piccolo enfant", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/piccolo-enfant-tete.png "}         
        ]
      },
      {
        subTitle: "23ème Tenkaichi Budokai",
        list: [
          { name: "Goku", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/goku-ado-tete.png"},
          { name: "Krilin", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/krilin-tete-23-tournoi.png   "},
          { name: "Yamsha", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/yamsha-tete-23eme-tournoi.png  "},
          { name: "Tenshinhan", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/tenshinhan-tete-23-tournoi.png  "},
          { name: "Tao Pai Pai", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/taopaipai-cyborg-tete-23-tournoi.png  "},
          { name: "Chichi", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/chichi-ado-tete.png "},
          { name: "Shen", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/shen-tete-23-tournoi.png  "},
          { name: "Piccolo", isMain: true, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/piccolo-tete-23-tournoi.png  "},
          { name: "Le roi Chappa", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/roi-chappa-tete-23-tournoi.png "},
          { name: "Chaoz", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/chaoz-tete-23-tournoi.png "},
          { name: "Yajirobé", isMain: false, image: "https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-personnages/Piccolo-Daimao/yajirobe-tete-23-tournoi.png "}
        ]
      }
    ]
  },
  {
    id: 'saiyan', label: 'Saiyans', saga: 2, radius: 0.025,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-saiyan1.png',
    colors: { 
      main: '#ffef44', 
      glow: 'rgba(251, 191, 36, 0.3)', 
      bg: '#000000 ', // old #2d1a00 #2A1B3D
      grid: 'rgba(10, 0, 25, 1)', //old rgba(251, 191, 36, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(253, 238, 63, 1) 100%)' }, //old linear-gradient(to right, transparent 50%, rgba(255, 200, 50, 0.45) 100%)
    characters: [
      {
        subTitle: "Invasions",
        list: [
          { name: "Raditz", isMain: true }, { name: "Nappa", isMain: true }, { name: "Vegeta (Scouter)", isMain: true },
          { name: "Saibaiman", isMain: false }
        ]
      },
      {
        subTitle: "Défenseurs",
        list: [
          { name: "Goku (Kaioken)", isMain: true }, { name: "Piccolo", isMain: true }, { name: "Gohan Petit", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'frieza', label: 'Freezer', saga: 2, radius: 0.020,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-freezer1.png',
    colors: { 
      main: '#a855f7', 
      glow: 'rgba(168, 85, 247, 0.4)', 
      bg: '#e0e0e0', // old #1e0030
      grid: 'rgba(100, 0, 150, 0.6)', // old rgba(168, 85, 247, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(105, 51, 133, 1) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(168, 85, 247, 0.4) 100%)
    characters: [
      {
        subTitle: "L'Armée de Freezer",
        list: [
          { name: "Freezer", isMain: true }, { name: "Dodoria", isMain: true }, { name: "Zarbon", isMain: true }
        ]
      },
      {
        subTitle: "Commando Ginyu",
        list: [
          { name: "Ginyu", isMain: true }, { name: "Recoome", isMain: true }, { name: "Guldo", isMain: false }, { name: "Burter", isMain: false }, { name: "Jeice", isMain: false }
        ]
      },
      {
        subTitle: "Peuple de Namek",
        list: [
          { name: "Dendé", isMain: true }, { name: "Nail", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'cyborg', label: 'Cyborgs', saga: 2, radius: 0.015,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-cell1.png',
    colors: { 
      main: '#3B6120', 
      glow: 'rgba(74, 222, 128, 0.3)', 
      bg: '#3B6120', // old #052c16
      grid: 'rgba(179, 199, 128, 1)', // old rgba(74, 222, 128, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(121, 52, 136, 1) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(74, 222, 128, 0.3) 100%)
    characters: [
      {
        subTitle: "Créations du Dr Gero",
        list: [
          { name: "Cell", isMain: true }, { name: "C-17", isMain: true }, { name: "C-18", isMain: true },
          { name: "C-16", isMain: true }, { name: "C-20", isMain: true }, { name: "C-19", isMain: false }
        ]
      },
      {
        subTitle: "L'Avenir",
        list: [
          { name: "Trunks Futur", isMain: true }, { name: "Gohan SSJ2", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'buu', label: 'Boo', saga: 2, radius: 0.010,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-buu1.png',
    colors: { 
      main: '#f3a4b5', 
      glow: 'rgba(236, 72, 153, 0.4)', 
      bg: '#f3a4b5', // old #33001a
      grid: 'rgba(130, 0, 70, 0.5)', // old rgba(236, 72, 153, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(255, 255, 255, 0.5) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(236, 72, 153, 0.4) 100%)
    characters: [
      {
        subTitle: "Menace Magique",
        list: [
          { name: "Majin Buu", isMain: true }, { name: "Dabra", isMain: true }, { name: "Babidi", isMain: true }
        ]
      },
      {
        subTitle: "Fusions & Relève",
        list: [
          { name: "Gotenks", isMain: true }, { name: "Vegito", isMain: true }, { name: "Videl", isMain: true }, { name: "Hercule", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'god', label: 'Dieux', saga: 3, radius: 0.005,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-Dieux-de-la-destruction1.png',
    colors: { 
      main: '#9B73B0', 
      glow: 'rgba(248, 113, 113, 0.4)', 
      bg: '#9B73B0', // old #2d0a0a
      grid: 'rgba(253, 137, 2, 1)', // old rgba(248, 113, 113, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(13, 170, 238, 0.6) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(248, 113, 113, 0.4) 100%)
    characters: [
      {
        subTitle: "Univers 7",
        list: [
          { name: "Beerus", isMain: true }, { name: "Whis", isMain: true }, { name: "Goku SSJ God", isMain: true },
          { name: "Vegeta SSJ Blue", isMain: true }, { name: "Golden Freezer", isMain: true }, { name: "Jaco", isMain: true }, { name: "Oracle Fish", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'angels', label: 'Anges', saga: 3, radius: 0.004,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-anges1.png',
    colors: { 
      main: '#D4E4FF', 
      glow: 'rgba(251, 146, 60, 0.4)', 
      bg: '#D4E4FF', // old #2d1400 #aed6f1
      grid: 'rgba(255, 255, 255, 0.8)', // old rgba(251, 146, 60, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(135, 1, 77, 0.8) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(251, 146, 60, 0.4) 100%)
    characters: [
      {
        subTitle: "Univers 6",
        list: [
          { name: "Hit", isMain: true }, { name: "Champa", isMain: true }, { name: "Vados", isMain: true },
          { name: "Cabba", isMain: true }, { name: "Frost", isMain: true }, { name: "Magetta", isMain: true }, { name: "Botamo", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'black', label: 'Black Goku', saga: 3, radius: 0.003,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-black-goku.png',
    colors: { 
      main: '#c06260', 
      glow: 'rgba(56, 189, 248, 0.5)', 
      bg: '#747675', // old #001a2c
      grid: 'rgba(15, 15, 17, 0.9)', // old rgba(56, 189, 248, 0.2)
      scan: 'linear-gradient(to right, transparent 40%, rgba(192, 98, 96, 1) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(56, 189, 248, 0.5) 100%)
    characters: [
      {
        subTitle: "Justice Divine",
        list: [
          { name: "Goku Black", isMain: true }, { name: "Zamasu", isMain: true }, { name: "Gowasu", isMain: true },
          { name: "Zamasu Fusion", isMain: true }
        ]
      },
      {
        subTitle: "Futur",
        list: [
          { name: "Trunks (DBS)", isMain: true }, { name: "Zeno Sama", isMain: true }, { name: "Vegito Blue", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'tournament', label: 'Tournoi', saga: 3, radius: 0.002,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-arene-tournoi-pouvoir.png',
    colors: { 
      main: '#001F3F', 
      glow: 'rgba(244, 114, 182, 0.6)', 
      bg: '#001F3F ', // old #1a001a
      grid: 'rgba(0, 40, 80, 1)', // old rgba(244, 114, 182, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(255, 120, 255, 0.4) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(244, 114, 182, 0.6) 100%)
    characters: [
      {
        subTitle: "Univers 11",
        list: [
          { name: "Jiren", isMain: true }, { name: "Toppo", isMain: true }, { name: "Dyspo", isMain: true }
        ]
      },
      {
        subTitle: "Univers 6",
        list: [
          { name: "Caulifla", isMain: true }, { name: "Kale", isMain: true }, { name: "Kefla", isMain: true }
        ]
      },
      {
        subTitle: "Sommet",
        list: [
          { name: "Daishinkan", isMain: true }
        ]
      }
    ]
  },
  {
    id: 'zeno', label: 'Zeno', saga: 3, radius: 0.001,
    icon: 'https://cdn.jsdelivr.net/gh/phills76/images-dragon-ball-radar2/images-radar-sanctuaires-voeux/radar-zeno1.png',
    colors: { 
      main: '#56c6f4', 
      glow: 'rgba(244, 114, 182, 0.6)', 
      bg: '#56c6f4', // old #1a001a
      grid: 'rgba(235, 0, 191, 1)', // old rgba(244, 114, 182, 0.2)
      scan: 'linear-gradient(to right, transparent 50%, rgba(135, 44, 196, 1) 100%)' }, // old linear-gradient(to right, transparent 50%, rgba(244, 114, 182, 0.6) 100%)
    characters: [
      {
        subTitle: "Les Maîtres",
        list: [
          { name: "Grand Prêtre", isMain: true }, { name: "Zeno", isMain: true }
        ]
      }
    ]
  }
];
