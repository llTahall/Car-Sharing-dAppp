// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Covoiturage {
    
    enum StatutTrajet { EN_ATTENTE, CONFIRMEE, ANNULEE, TERMINEE }
    enum StatutAnnonce { ACTIVE, COMPLETE, ANNULEE, TERMINEE }
    mapping(uint256 => mapping(address => bool)) public aVote;

  struct Trajet {
    address chauffeur;
    string departAdresse;     
    string arriveeAdresse;    
    uint256 dateHeureDepart;  
    uint256 prix;             
    uint8 placesTotales;      
    uint8 placesDisponibles;  
    uint256 montantCollecte;  
    StatutTrajet statutT;     
    StatutAnnonce statutA;
    address[] listePassagers; 
}

    Trajet[] public trajets;

    // Modificateur pour vérifier que seul le chauffeur peut agir
    modifier seulementChauffeur(uint256 _index) {
        require(msg.sender == trajets[_index].chauffeur, "Seul le chauffeur peut faire ca");
        _;
    }

    function proposerTrajet(string memory _depart, string memory _arrivee, uint256 _date, uint256 _prix, uint8 _places) public {
        trajets.push(Trajet({
            chauffeur: msg.sender,
            departAdresse: _depart,
            arriveeAdresse: _arrivee,
            dateHeureDepart: _date,
            prix: _prix,
            placesTotales: _places,
            placesDisponibles: _places,
            montantCollecte: 0,
            statutT: StatutTrajet.EN_ATTENTE,
            statutA: StatutAnnonce.ACTIVE,
            listePassagers: new address[](0)
        }));
    }
function reserverPlaces(uint256 _index, uint8 _quantite) public payable {
    Trajet storage t = trajets[_index];
    
    // 1. Vérifications de base
    require(t.statutA == StatutAnnonce.ACTIVE, "Annonce non active");
    require(_quantite > 0, "Il faut reserver au moins 1 place");
    require(t.placesDisponibles >= _quantite, "Pas assez de places disponibles");

    // 2. Vérification du paiement total
    // On multiplie le prix unitaire par la quantité demandée
    uint256 prixTotal = t.prix * _quantite;
    require(msg.value == prixTotal, "Montant incorrect pour ce nombre de places");

    // 3. Mise a jour du trajet
    t.placesDisponibles -= _quantite;
    t.montantCollecte += msg.value;

    // 4. Si c'est plein, on ferme l'annonce
    if (t.placesDisponibles == 0) {
        t.statutA = StatutAnnonce.COMPLETE;
    }
    t.listePassagers.push(msg.sender); // On enregistre l'adresse de celui qui paie
}

    // --- FONCTIONS DE CONTRÔLE ---

    function confirmerDepart(uint256 _index) public seulementChauffeur(_index) {
        trajets[_index].statutT = StatutTrajet.CONFIRMEE;
    }

    function terminerLeTrajet(uint256 _index) public seulementChauffeur(_index) {
        Trajet storage t = trajets[_index];
        require(t.statutT == StatutTrajet.CONFIRMEE, "Le trajet doit avoir debute");
        
        t.statutT = StatutTrajet.TERMINEE;
        t.statutA = StatutAnnonce.TERMINEE;

        // Transfert de l'argent au chauffeur
        uint256 montant = t.montantCollecte;
        t.montantCollecte = 0; // Sécurité : on remet à zéro avant l'envoi
        (bool succes, ) = payable(t.chauffeur).call{value: montant}("");
        require(succes, "Le transfert au chauffeur a echoue");
    }

    // Fonction pour que le chauffeur annule son annonce
    function annulerAnnonce(uint256 _index) public seulementChauffeur(_index) {
    Trajet storage t = trajets[_index];
    
    require(t.statutT != StatutTrajet.TERMINEE, "Deja fini");
    require(t.statutT != StatutTrajet.ANNULEE, "Deja annule");

    // 1. On change le statut tout de suite pour bloquer d'autres actions
    t.statutA = StatutAnnonce.ANNULEE;
    t.statutT = StatutTrajet.ANNULEE;

    // 2. Boucle de remboursement
    // On parcourt la liste des adresses qui ont reserve
    for (uint i = 0; i < t.listePassagers.length; i++) {
        address passager = t.listePassagers[i];
        // On rend le prix d'une place au passager
        (bool rembourse, ) = payable(passager).call{value: t.prix}("");
        require(rembourse, "Le remboursement a echoue");
    }

    // 3. On remet le montant collecte a zero car tout est rendu
    t.montantCollecte = 0;
}
function noterChauffeur(uint256 _index, uint8 _note) public {
    Trajet storage t = trajets[_index];

    // 1. Vérifications
    require(t.statutT == StatutTrajet.TERMINEE, "Attendez la fin du voyage pour noter");
    require(_note >= 1 && _note <= 5, "La note doit etre entre 1 et 5");
    require(!aVote[_index][msg.sender], "Vous avez deja note ce trajet");

    // 2. Vérifier que l'appelant est bien un des passagers du trajet
    bool estPassager = false;
    for (uint i = 0; i < t.listePassagers.length; i++) {
        if (t.listePassagers[i] == msg.sender) {
            estPassager = true;
            break;
        }
    }
    require(estPassager, "Seuls les passagers peuvent noter");

    // 3. Enregistrer le vote
    aVote[_index][msg.sender] = true;
    
    // Note : Pour un projet simple, on affiche juste la note dans la console
    // Dans un vrai projet, on ferait la moyenne sur le profil du chauffeur.
}
    
}