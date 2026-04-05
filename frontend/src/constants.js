// src/constants.js

//export const CONTRACT_ADDRESS = "0xaa5A6FE2D404D56D197CDB8FF68f50034398b2C4";
export const CONTRACT_ADDRESS = "0x318d0fD0990E11f6c8ed57309B70FdeFe3F995fc";

export const STATUT_TEXTES = {
    0: { label: "Active", color: "#28a745" },   // Vert
    1: { label: "Complète", color: "#ffc107" }, // Orange
    2: { label: "Annulée", color: "#dc3545" },  // Rouge
    3: { label: "Terminée", color: "#6c757d" }  // Gris
};

export const CONTRACT_ABI = [
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "annulerAnnonce",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "annulerMaReservation",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "confirmerDepart",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_note",
                "type": "uint8"
            }
        ],
        "name": "noterChauffeur",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "_depart",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "_arrivee",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "_date",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "_prix",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_places",
                "type": "uint8"
            }
        ],
        "name": "proposerTrajet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "_quantite",
                "type": "uint8"
            }
        ],
        "name": "reserverPlaces",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "terminerLeTrajet",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "aDejaReserve",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "aVote",
        "outputs": [
            {
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_index",
                "type": "uint256"
            }
        ],
        "name": "getListePassagers",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "trajets",
        "outputs": [
            {
                "internalType": "address",
                "name": "chauffeur",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "departAdresse",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "arriveeAdresse",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "dateHeureDepart",
                "type": "uint256"
            },
            {
                "internalType": "uint256",
                "name": "prix",
                "type": "uint256"
            },
            {
                "internalType": "uint8",
                "name": "placesTotales",
                "type": "uint8"
            },
            {
                "internalType": "uint8",
                "name": "placesDisponibles",
                "type": "uint8"
            },
            {
                "internalType": "uint256",
                "name": "montantCollecte",
                "type": "uint256"
            },
            {
                "internalType": "enum Covoiturage.StatutTrajet",
                "name": "statutT",
                "type": "uint8"
            },
            {
                "internalType": "enum Covoiturage.StatutAnnonce",
                "name": "statutA",
                "type": "uint8"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];