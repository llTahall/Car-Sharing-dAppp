// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Covoiturage {
    
    enum StatutTrajet { EN_ATTENTE, CONFIRMEE, ANNULEE, TERMINEE }
    enum StatutAnnonce { ACTIVE, COMPLETE, ANNULEE, TERMINEE }
    
    // Mapping pour vérifier si une adresse a déjà noté
    mapping(uint256 => mapping(address => bool)) public aVote;
    
    // NOUVEAU : Mapping pour vérifier si une adresse a déjà réservé ce trajet
    mapping(uint256 => mapping(address => bool)) public aDejaReserve;

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
        
        // 1. Vérifications de sécurité
        require(t.statutA == StatutAnnonce.ACTIVE, "Annonce non active");
        require(_quantite > 0, "Minimum 1 place");
        require(t.placesDisponibles >= _quantite, "Pas assez de places");
        require(msg.sender != t.chauffeur, "Le chauffeur ne peut pas reserver");
        
        // EMPÊCHER LA DOUBLE RÉSERVATION
        require(!aDejaReserve[_index][msg.sender], "Vous avez deja une reservation pour ce trajet");

        // 2. Vérification du paiement
        uint256 prixTotal = t.prix * _quantite;
        require(msg.value == prixTotal, "Montant incorrect");

        // 3. Mise à jour des données
        t.placesDisponibles -= _quantite;
        t.montantCollecte += msg.value;
        
        // On enregistre le passager autant de fois qu'il a pris de places
        // Cela permet au remboursement de fonctionner par itération simple
        for(uint8 i = 0; i < _quantite; i++) {
            t.listePassagers.push(msg.sender);
        }

        // On marque l'utilisateur comme ayant déjà réservé
        aDejaReserve[_index][msg.sender] = true;

        if (t.placesDisponibles == 0) {
            t.statutA = StatutAnnonce.COMPLETE;
        }
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

        uint256 montant = t.montantCollecte;
        t.montantCollecte = 0; 
        (bool succes, ) = payable(t.chauffeur).call{value: montant}("");
        require(succes, "Echec transfert chauffeur");
    }

    function annulerAnnonce(uint256 _index) public seulementChauffeur(_index) {
        Trajet storage t = trajets[_index];
        require(t.statutT != StatutTrajet.TERMINEE && t.statutT != StatutTrajet.ANNULEE, "Impossible d'annuler");

        t.statutA = StatutAnnonce.ANNULEE;
        t.statutT = StatutTrajet.ANNULEE;

        // Remboursement : chaque entrée dans listePassagers reçoit le prix d'une place
        for (uint i = 0; i < t.listePassagers.length; i++) {
            address passager = t.listePassagers[i];
            (bool succes, ) = payable(passager).call{value: t.prix}("");
            require(succes, "Echec du remboursement");
            // On ne revert pas ici pour éviter de bloquer l'annulation si un transfert échoue
        }

        t.montantCollecte = 0;
    }

    function noterChauffeur(uint256 _index, uint8 _note) public {
        Trajet storage t = trajets[_index];
        require(t.statutT == StatutTrajet.TERMINEE, "Trajet non termine");
        require(_note >= 1 && _note <= 5, "Note invalide");
        require(!aVote[_index][msg.sender], "Deja note");
        require(aDejaReserve[_index][msg.sender], "Seuls les passagers peuvent noter");

        aVote[_index][msg.sender] = true;
    }

    // Fonction utilitaire pour voir la liste complète des passagers depuis le front
    function getListePassagers(uint256 _index) public view returns (address[] memory) {
        return trajets[_index].listePassagers;
    }
    function annulerMaReservation(uint256 _index) public {
    Trajet storage t = trajets[_index];
    
    // 1. Vérifications
    require(aDejaReserve[_index][msg.sender], "Vous n'avez pas de reservation");
    require(t.statutT == StatutTrajet.EN_ATTENTE, "Trop tard pour annuler");

    // 2. Calculer combien de places ce passager occupe
    uint8 placesLiberees = 0;
    
    // On parcourt la liste et on retire ses occurrences
    // On utilise un nouveau tableau temporaire pour reconstruire la liste sans lui
    address[] memory nouvelleListe = new address[](t.listePassagers.length);
    uint256 compteur = 0;
    
    for (uint i = 0; i < t.listePassagers.length; i++) {
        if (t.listePassagers[i] == msg.sender) {
            placesLiberees++;
        } else {
            nouvelleListe[compteur] = t.listePassagers[i];
            compteur++;
        }
    }

    // Mettre à jour la liste réelle (en réduisant sa taille)
    uint256 nouvelleTaille = t.listePassagers.length - placesLiberees;
    address[] memory listeFinale = new address[](nouvelleTaille);
    for(uint i = 0; i < nouvelleTaille; i++) {
        listeFinale[i] = nouvelleListe[i];
    }
    t.listePassagers = listeFinale;

    // 3. Remboursement et mise à jour des places
    uint256 montantARembourser = t.prix * placesLiberees;
    t.placesDisponibles += placesLiberees;
    t.montantCollecte -= montantARembourser;
    aDejaReserve[_index][msg.sender] = false; // Il peut maintenant re-réserver plus tard
    
    // Si l'annonce était complète, elle redevient active
    if (t.statutA == StatutAnnonce.COMPLETE) {
        t.statutA = StatutAnnonce.ACTIVE;
    }

    // 4. Envoi de l'argent
    (bool succes, ) = payable(msg.sender).call{value: montantARembourser}("");
    require(succes, "Remboursement echoue");
}
}