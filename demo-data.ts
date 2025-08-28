import { Cuerda, Gallo, TipoGallo, TipoEdad } from './types';
import { AGE_OPTIONS_BY_MARCA } from './constants';

// Data provided by the user for testing
const rawDemoData = [
  {
    "Nombre de la cuerda": "Furia Roja (F1)",
    "Dueño": "Mateo Rojas",
    "Gallos": [
      {
        "ID del Anillo": "8812",
        "Color del Gallo": "El Ciclón",
        "Peso": 4.05,
        "ID de Marcaje": "10101",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "7439",
        "Color del Gallo": "Navaja",
        "Peso": 3.08,
        "ID de Marcaje": "20202",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Acero Fino (F1)",
    "Dueño": "Sebastián Cruz",
    "Gallos": [
      {
        "ID del Anillo": "6321",
        "Color del Gallo": "Fantasma",
        "Peso": 2.15,
        "ID de Marcaje": "30303",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "5505",
        "Color del Gallo": "Tornado",
        "Peso": 4.10,
        "ID de Marcaje": "40404",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Viento Negro (F1)",
    "Dueño": "Leonardo Soto",
    "Gallos": [
      {
        "ID del Anillo": "9191",
        "Color del Gallo": "Sombra",
        "Peso": 2.14,
        "ID de Marcaje": "50505",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "8282",
        "Color del Gallo": "Cuchillo",
        "Peso": 4.08,
        "ID de Marcaje": "60606",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Hacienda del Sol (F1)",
    "Dueño": "Diego Luna",
    "Gallos": [
      {
        "ID del Anillo": "7373",
        "Color del Gallo": "Alazán",
        "Peso": 3.11,
        "ID de Marcaje": "70707",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "6464",
        "Color del Gallo": "Moro",
        "Peso": 3.01,
        "ID de Marcaje": "80808",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Los Titanes (F1)",
    "Dueño": "Adrián Castillo",
    "Gallos": [
      {
        "ID del Anillo": "5555",
        "Color del Gallo": "Diablo",
        "Peso": 3.05,
        "ID de Marcaje": "90909",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "4646",
        "Color del Gallo": "Demonio",
        "Peso": 3.10,
        "ID de Marcaje": "12121",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Estrella del Sur (F1)",
    "Dueño": "Julián Herrera",
    "Gallos": [
      {
        "ID del Anillo": "3737",
        "Color del Gallo": "Cometa",
        "Peso": 4.12,
        "ID de Marcaje": "23232",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "2828",
        "Color del Gallo": "Meteoro",
        "Peso": 2.13,
        "ID de Marcaje": "34343",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Muro (F1)",
    "Dueño": "Emiliano Ponce",
    "Gallos": [
      {
        "ID del Anillo": "1919",
        "Color del Gallo": "Roca",
        "Peso": 4.07,
        "ID de Marcaje": "45454",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "1010",
        "Color del Gallo": "Acero",
        "Peso": 2.10,
        "ID de Marcaje": "56565",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Casta de Campeones (F1)",
    "Dueño": "Nicolás Ríos",
    "Gallos": [
      {
        "ID del Anillo": "1122",
        "Color del Gallo": "Rey",
        "Peso": 3.13,
        "ID de Marcaje": "67676",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "3344",
        "Color del Gallo": "Príncipe",
        "Peso": 4.15,
        "ID de Marcaje": "78787",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Legado (F1)",
    "Dueño": "Samuel Peña",
    "Gallos": [
      {
        "ID del Anillo": "5566",
        "Color del Gallo": "Indio",
        "Peso": 2.15,
        "ID de Marcaje": "89898",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "7788",
        "Color del Gallo": "Guerrero",
        "Peso": 4.04,
        "ID de Marcaje": "10001",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "La Dinastía (F1)",
    "Dueño": "Thiago Méndez",
    "Gallos": [
      {
        "ID del Anillo": "9900",
        "Color del Gallo": "Faraón",
        "Peso": 3.08,
        "ID de Marcaje": "21112",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "1231",
        "Color del Gallo": "Emperador",
        "Peso": 3.14,
        "ID de Marcaje": "32223",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Corazón Valiente (F1)",
    "Dueño": "Benjamín Flores",
    "Gallos": [
      {
        "ID del Anillo": "4564",
        "Color del Gallo": "León",
        "Peso": 4.01,
        "ID de Marcaje": "43334",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "7897",
        "Color del Gallo": "Tigre",
        "Peso": 3.06,
        "ID de Marcaje": "54445",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Fénix (F1)",
    "Dueño": "Lucas Navarro",
    "Gallos": [
      {
        "ID del Anillo": "1591",
        "Color del Gallo": "Ceniza",
        "Peso": 2.11,
        "ID de Marcaje": "65556",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "7537",
        "Color del Gallo": "Flama",
        "Peso": 4.03,
        "ID de Marcaje": "76667",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "La Leyenda (F1)",
    "Dueño": "Iker Guzmán",
    "Gallos": [
      {
        "ID del Anillo": "8528",
        "Color del Gallo": "Mito",
        "Peso": 2.12,
        "ID de Marcaje": "87778",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "9639",
        "Color del Gallo": "Héroe",
        "Peso": 5.00,
        "ID de Marcaje": "98889",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Sol de Oro (F1)",
    "Dueño": "Bruno Miranda",
    "Gallos": [
      {
        "ID del Anillo": "1471",
        "Color del Gallo": "Dorado",
        "Peso": 3.00,
        "ID de Marcaje": "11001",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "2582",
        "Color del Gallo": "Canelo Fino",
        "Peso": 2.15,
        "ID de Marcaje": "22112",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "La Joya (F1)",
    "Dueño": "Dante Paredes",
    "Gallos": [
      {
        "ID del Anillo": "3693",
        "Color del Gallo": "Diamante",
        "Peso": 4.06,
        "ID de Marcaje": "33223",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "4814",
        "Color del Gallo": "Rubí",
        "Peso": 4.01,
        "ID de Marcaje": "44334",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Cóndor (F1)",
    "Dueño": "Gael Campos",
    "Gallos": [
      {
        "ID del Anillo": "5925",
        "Color del Gallo": "Andino",
        "Peso": 2.15,
        "ID de Marcaje": "55445",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "7036",
        "Color del Gallo": "Serrano",
        "Peso": 3.15,
        "ID de Marcaje": "66556",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Alma Llanera (F1)",
    "Dueño": "Alan Núñez",
    "Gallos": [
      {
        "ID del Anillo": "8147",
        "Color del Gallo": "Sabana",
        "Peso": 2.11,
        "ID de Marcaje": "77667",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "9258",
        "Color del Gallo": "Morichal",
        "Peso": 4.04,
        "ID de Marcaje": "88778",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Trueno (F1)",
    "Dueño": "Marco Delgado",
    "Gallos": [
      {
        "ID del Anillo": "1369",
        "Color del Gallo": "Relámpago",
        "Peso": 3.09,
        "ID de Marcaje": "99889",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "2480",
        "Color del Gallo": "Centella",
        "Peso": 3.04,
        "ID de Marcaje": "11991",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Gallo de Plata (F1)",
    "Dueño": "Rafael Vega",
    "Gallos": [
      {
        "ID del Anillo": "3591",
        "Color del Gallo": "Plateado",
        "Peso": 4.02,
        "ID de Marcaje": "22002",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "4702",
        "Color del Gallo": "Cenizo Claro",
        "Peso": 4.03,
        "ID de Marcaje": "33113",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Patriota (F1)",
    "Dueño": "Cristian Soler",
    "Gallos": [
      {
        "ID del Anillo": "5813",
        "Color del Gallo": "Tricolor",
        "Peso": 2.15,
        "ID de Marcaje": "44224",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "6924",
        "Color del Gallo": "Bandera",
        "Peso": 4.07,
        "ID de Marcaje": "55335",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Fuerza Natural (F1)",
    "Dueño": "Iván Aguilar",
    "Gallos": [
      {
        "ID del Anillo": "8035",
        "Color del Gallo": "Terremoto",
        "Peso": 2.15,
        "ID de Marcaje": "66446",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "9146",
        "Color del Gallo": "Volcán",
        "Peso": 4.05,
        "ID de Marcaje": "77557",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Cacique (F1)",
    "Dueño": "Sergio Guerrero",
    "Gallos": [
      {
        "ID del Anillo": "1257",
        "Color del Gallo": "Jefe",
        "Peso": 3.07,
        "ID de Marcaje": "88668",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "2368",
        "Color del Gallo": "Líder",
        "Peso": 3.03,
        "ID de Marcaje": "99779",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Sangre Azteca (F1)",
    "Dueño": "Maximiliano Romero",
    "Gallos": [
      {
        "ID del Anillo": "3479",
        "Color del Gallo": "Águila",
        "Peso": 4.04,
        "ID de Marcaje": "11881",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "4590",
        "Color del Gallo": "Serpiente",
        "Peso": 3.12,
        "ID de Marcaje": "22992",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Los Gladiadores (F1)",
    "Dueño": "Rodrigo Morales",
    "Gallos": [
      {
        "ID del Anillo": "5701",
        "Color del Gallo": "Espartaco",
        "Peso": 2.15,
        "ID de Marcaje": "34003",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "6812",
        "Color del Gallo": "Máximo",
        "Peso": 4.06,
        "ID de Marcaje": "45114",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Invicto (F1)",
    "Dueño": "Patricio Domínguez",
    "Gallos": [
      {
        "ID del Anillo": "7923",
        "Color del Gallo": "Monarca",
        "Peso": 2.15,
        "ID de Marcaje": "56225",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 1
      },
      {
        "ID del Anillo": "9034",
        "Color del Gallo": "Soberano",
        "Peso": 4.00,
        "ID de Marcaje": "67336",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 1
      }
    ]
  },
  {
    "Nombre de la cuerda": "Furia Roja (F2)",
    "Dueño": "Mateo Rojas",
    "Gallos": [
      {
        "ID del Anillo": "1001",
        "Color del Gallo": "Tsunami",
        "Peso": 3.01,
        "ID de Marcaje": "98765",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "2002",
        "Color del Gallo": "Maremoto",
        "Peso": 4.03,
        "ID de Marcaje": "54321",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "Acero Fino (F2)",
    "Dueño": "Sebastián Cruz",
    "Gallos": [
      {
        "ID del Anillo": "3003",
        "Color del Gallo": "Espectro",
        "Peso": 3.08,
        "ID de Marcaje": "11224",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "4004",
        "Color del Gallo": "Huracán",
        "Peso": 4.02,
        "ID de Marcaje": "33446",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "Viento Negro (F2)",
    "Dueño": "Leonardo Soto",
    "Gallos": [
      {
        "ID del Anillo": "5005",
        "Color del Gallo": "Abismo",
        "Peso": 2.13,
        "ID de Marcaje": "55668",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "6006",
        "Color del Gallo": "Filo",
        "Peso": 4.07,
        "ID de Marcaje": "77880",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "Los Titanes (F2)",
    "Dueño": "Adrián Castillo",
    "Gallos": [
      {
        "ID del Anillo": "7007",
        "Color del Gallo": "Lucifer",
        "Peso": 3.10,
        "ID de Marcaje": "99002",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "8008",
        "Color del Gallo": "Belcebú",
        "Peso": 3.06,
        "ID de Marcaje": "11225",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Muro (F2)",
    "Dueño": "Emiliano Ponce",
    "Gallos": [
      {
        "ID del Anillo": "9009",
        "Color del Gallo": "Granito",
        "Peso": 4.15,
        "ID de Marcaje": "33447",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "1100",
        "Color del Gallo": "Hierro",
        "Peso": 2.10,
        "ID de Marcaje": "55669",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "Casta de Campeones (F2)",
    "Dueño": "Nicolás Ríos",
    "Gallos": [
      {
        "ID del Anillo": "2211",
        "Color del Gallo": "Duque",
        "Peso": 3.12,
        "ID de Marcaje": "77881",
        "tipo de gallo": "pava",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "3322",
        "Color del Gallo": "Barón",
        "Peso": 4.04,
        "ID de Marcaje": "99003",
        "tipo de gallo": "pava",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "El Fénix (F2)",
    "Dueño": "Lucas Navarro",
    "Gallos": [
      {
        "ID del Anillo": "4433",
        "Color del Gallo": "Brasa",
        "Peso": 2.15,
        "ID de Marcaje": "22114",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 10 (m10) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "5544",
        "Color del Gallo": "Fuego",
        "Peso": 4.00,
        "ID de Marcaje": "44336",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      }
    ]
  },
  {
    "Nombre de la cuerda": "La Leyenda (F2)",
    "Dueño": "Iker Guzmán",
    "Gallos": [
      {
        "ID del Anillo": "6655",
        "Color del Gallo": "Cuento",
        "Peso": 2.15,
        "ID de Marcaje": "66558",
        "tipo de gallo": "Liso",
        "clase": "pollo",
        "Marca": "Marca 11 (m11) - Año 2024",
        "Frente": 2
      },
      {
        "ID del Anillo": "7766",
        "Color del Gallo": "Gladiador",
        "Peso": 4.07,
        "ID de Marcaje": "88770",
        "tipo de gallo": "Liso",
        "clase": "gallo",
        "Marca": "Marca 9 (m9) - Año 2024",
        "Frente": 2
      }
    ]
  }
];

const OUNCES_PER_POUND = 16;
const fromLbsOz = (lbs: number, oz: number) => (lbs * OUNCES_PER_POUND) + oz;

const parseWeight = (weight: number): number => {
    if (typeof weight !== 'number') return 0;
    const lbs = Math.floor(weight);
    const oz = Math.round((weight - lbs) * 100);
    return fromLbsOz(lbs, oz);
};

const parseMarcaAndGetAge = (marcaStr: string): { marca: number; ageMonths: number } => {
    const marcaMatch = marcaStr.match(/Marca (\d+)/);
    if (!marcaMatch) return { marca: 0, ageMonths: 0 };
    
    const marcaNum = parseInt(marcaMatch[1], 10);
    const yearMatch = marcaStr.match(/Año (\d{4})/);
    const year = yearMatch ? yearMatch[1] : null;

    const ageOptions = AGE_OPTIONS_BY_MARCA[String(marcaNum)] || [];
    if (ageOptions.length === 0) return { marca: marcaNum, ageMonths: 0 };

    let ageOption;
    if (ageOptions.length > 1 && year) {
        ageOption = ageOptions.find(opt => opt.displayText.includes(`Año ${year}`));
    }
    
    // Fallback to the first option if no year matches or only one option exists
    if (!ageOption) {
        ageOption = ageOptions[0];
    }

    return {
        marca: marcaNum,
        ageMonths: ageOption.ageMonths,
    };
};

export const processDemoData = (): { cuerdas: Cuerda[], gallos: Gallo[] } => {
    let finalCuerdas: Cuerda[] = [];
    let finalGallos: Gallo[] = [];
    
    const groupedByBaseName: { [key: string]: any[] } = {};
    rawDemoData.forEach(data => {
        const baseName = data["Nombre de la cuerda"].replace(/\s\(F\d+\)$/, '');
        if (!groupedByBaseName[baseName]) {
            groupedByBaseName[baseName] = [];
        }
        groupedByBaseName[baseName].push(data);
    });

    for (const baseName in groupedByBaseName) {
        const frontsData = groupedByBaseName[baseName].sort((a, b) => 
            a["Nombre de la cuerda"].localeCompare(b["Nombre de la cuerda"], undefined, { numeric: true })
        );

        let baseCuerda: Cuerda | undefined = undefined;

        frontsData.forEach((cuerdaData, index) => {
            const id = `cuerda-demo-${Date.now()}-${baseName.replace(/\s/g, '')}-${index}`;
            const newCuerda: Cuerda = {
                id,
                name: cuerdaData["Nombre de la cuerda"],
                owner: cuerdaData["Dueño"],
                baseCuerdaId: baseCuerda ? baseCuerda.id : undefined,
            };
            
            if (!baseCuerda) {
                baseCuerda = newCuerda;
            }
            
            finalCuerdas.push(newCuerda);

            // Process gallos for this cuerda
            (cuerdaData.Gallos as any[]).forEach((galloData) => {
                const { marca, ageMonths } = parseMarcaAndGetAge(galloData.Marca);
                if (ageMonths === 0) {
                    console.warn(`Could not determine age for gallo ${galloData["Color del Gallo"]} with marca string "${galloData.Marca}"`);
                }

                const tipoEdad = ageMonths < 12 ? TipoEdad.POLLO : TipoEdad.GALLO;

                finalGallos.push({
                    id: `gallo-demo-${Date.now()}-${Math.random()}`,
                    ringId: galloData["ID del Anillo"],
                    color: galloData["Color del Gallo"],
                    cuerdaId: newCuerda.id,
                    weight: parseWeight(galloData.Peso),
                    ageMonths: ageMonths,
                    markingId: galloData["ID de Marcaje"],
                    tipoGallo: galloData["tipo de gallo"],
                    tipoEdad: tipoEdad,
                    marca: marca,
                });
            });
        });
    }

    return { cuerdas: finalCuerdas, gallos: finalGallos };
};