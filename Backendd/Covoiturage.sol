// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Covoiturage {

    // ─── ENUMS ───────────────────────────────────────────────────────────────

    enum StatutTrajet      { EN_ATTENTE, CONFIRMEE, ANNULEE, TERMINEE }
    enum StatusAnnonce     { PUBLIEE, COMPLETE, ANNULEE, TERMINEE }
    enum StatusReservation { EN_ATTENTE, ACCEPTEE, REFUSEE_CONDUCTEUR, ANNULEE_PASSAGER, ANNULEE_CONDUCTEUR }

    // ─── EVENTS ──────────────────────────────────────────────────────────────

    event TrajetPropose(uint256 indexed id, address indexed chauffeur, string depart, string arrivee, uint256 prix, uint8 places);  S
    event ReservationDemandee(uint256 indexed trajetId, uint256 indexed reservationId, address indexed passager, uint8 quantite);
    event ReservationAcceptee(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationRefusee(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationAnnuleePassager(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationAnnuleeConducteur(uint256 indexed trajetId, uint256 indexed reservationId);
    event DepartConfirme(uint256 indexed id);
    event TrajetTermine(uint256 indexed id, uint256 montantVerseChauffeur);
    event AnnonceAnnulee(uint256 indexed id);
    event ChauffeurNote(uint256 indexed trajetId, address indexed passager, uint8 note);

    // ─── STRUCTS ─────────────────────────────────────────────────────────────

    struct Reservation {
        address passager;
        uint8 quantite;
        uint256 montantPaye;
        StatusReservation statut;
    }

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
        StatusAnnonce statutA;
    }

    // ─── STORAGE ─────────────────────────────────────────────────────────────

    Trajet[] public trajets;

    // trajetId => liste des reservations
    mapping(uint256 => Reservation[]) public reservations;

    // trajetId => passager => a deja une reservation active (EN_ATTENTE ou ACCEPTEE)
    mapping(uint256 => mapping(address => bool)) public aUneReservationActive;

    // trajetId => passager => a vote
    mapping(uint256 => mapping(address => bool)) public aVote;

    // reputation des chauffeurs
    mapping(address => uint256) public totalEtoiles;
    mapping(address => uint256) public nombreNotes;

    // ─── MODIFIER ────────────────────────────────────────────────────────────

    modifier seulementChauffeur(uint256 _id) {
        require(msg.sender == trajets[_id].chauffeur, "Seul le chauffeur peut faire ca");
        _;
    }

    // ─── FONCTIONS PRINCIPALES ───────────────────────────────────────────────

    function proposerTrajet(
        string memory _depart,
        string memory _arrivee,
        uint256 _date,
        uint256 _prix,
        uint8 _places
    ) external {
        require(_places > 0, "Au moins 1 place");
        require(_prix > 0, "Prix invalide");
        require(_date > block.timestamp, "Date invalide");

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
            statutA: StatusAnnonce.PUBLIEE
        }));

        emit TrajetPropose(trajets.length - 1, msg.sender, _depart, _arrivee, _prix, _places);
    }

    // Passager envoie une demande de réservation + paiement en escrow
    function demanderReservation(uint256 _trajetId, uint8 _quantite) external payable {
        Trajet storage t = trajets[_trajetId];

        require(t.statutA == StatusAnnonce.PUBLIEE, "Annonce non disponible");
        require(_quantite > 0, "Minimum 1 place");
        require(t.placesDisponibles >= _quantite, "Pas assez de places disponibles");
        require(msg.sender != t.chauffeur, "Le chauffeur ne peut pas reserver son propre trajet");
        require(!aUneReservationActive[_trajetId][msg.sender], "Vous avez deja une reservation en cours");

        uint256 prixTotal = t.prix * _quantite;
        require(msg.value == prixTotal, "Montant incorrect");

        // ETH bloque en escrow dans le contrat jusqu'a acceptation/refus
        reservations[_trajetId].push(Reservation({
            passager: msg.sender,
            quantite: _quantite,
            montantPaye: msg.value,
            statut: StatusReservation.EN_ATTENTE
        }));

        aUneReservationActive[_trajetId][msg.sender] = true;

        uint256 reservationId = reservations[_trajetId].length - 1;
        emit ReservationDemandee(_trajetId, reservationId, msg.sender, _quantite);
    }

    // Conducteur accepte une demande
    function accepterReservation(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.statut == StatusReservation.EN_ATTENTE, "Reservation non en attente");
        require(t.placesDisponibles >= r.quantite, "Plus assez de places");

        // CHECKS → EFFECTS → INTERACTIONS
        r.statut = StatusReservation.ACCEPTEE;
        t.placesDisponibles -= r.quantite;
        t.montantCollecte += r.montantPaye;

        if (t.placesDisponibles == 0) {
            t.statutA = StatusAnnonce.COMPLETE;
        }

        emit ReservationAcceptee(_trajetId, _reservationId);
    }

    // Conducteur refuse une demande → remboursement automatique
    function refuserReservation(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.statut == StatusReservation.EN_ATTENTE, "Reservation non en attente");

        // CHECKS → EFFECTS → INTERACTIONS
        uint256 montant = r.montantPaye;
        r.montantPaye = 0;
        r.statut = StatusReservation.REFUSEE_CONDUCTEUR;
        aUneReservationActive[_trajetId][r.passager] = false;

        (bool succes, ) = payable(r.passager).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationRefusee(_trajetId, _reservationId);
    }

    // Passager annule sa propre demande
    function annulerMaReservation(uint256 _trajetId, uint256 _reservationId) external {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.passager == msg.sender, "Ce n'est pas votre reservation");
        require(
            r.statut == StatusReservation.EN_ATTENTE || r.statut == StatusReservation.ACCEPTEE,
            "Reservation non annulable"
        );
        require(t.statutT != StatutTrajet.TERMINEE, "Trajet deja termine");

        // CHECKS → EFFECTS → INTERACTIONS
        uint256 montant = r.montantPaye;
        r.montantPaye = 0;
        r.statut = StatusReservation.ANNULEE_PASSAGER;
        aUneReservationActive[_trajetId][msg.sender] = false;

        if (r.statut == StatusReservation.ACCEPTEE) {
            t.placesDisponibles += r.quantite;
            t.montantCollecte -= montant;
            if (t.statutA == StatusAnnonce.COMPLETE) {
                t.statutA = StatusAnnonce.PUBLIEE;
            }
        }

        (bool succes, ) = payable(msg.sender).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationAnnuleePassager(_trajetId, _reservationId);
    }

    // Conducteur annule une réservation spécifique déjà acceptée
    function annulerReservationPassager(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.statut == StatusReservation.ACCEPTEE, "Reservation non acceptee");
        require(t.statutT == StatutTrajet.EN_ATTENTE, "Trajet deja en cours ou termine");

        // CHECKS → EFFECTS → INTERACTIONS
        uint256 montant = r.montantPaye;
        r.montantPaye = 0;
        r.statut = StatusReservation.ANNULEE_CONDUCTEUR;
        aUneReservationActive[_trajetId][r.passager] = false;

        t.placesDisponibles += r.quantite;
        t.montantCollecte -= montant;

        if (t.statutA == StatusAnnonce.COMPLETE) {
            t.statutA = StatusAnnonce.PUBLIEE;
        }

        (bool succes, ) = payable(r.passager).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationAnnuleeConducteur(_trajetId, _reservationId);
    }

    function confirmerDepart(uint256 _id) external seulementChauffeur(_id) {
        require(trajets[_id].statutT == StatutTrajet.EN_ATTENTE, "Statut invalide");
        trajets[_id].statutT = StatutTrajet.CONFIRMEE;
        emit DepartConfirme(_id);
    }

    function terminerLeTrajet(uint256 _id) external seulementChauffeur(_id) {
        Trajet storage t = trajets[_id];
        require(t.statutT == StatutTrajet.CONFIRMEE, "Le trajet doit etre confirme d'abord");

        // CHECKS → EFFECTS → INTERACTIONS
        uint256 montant = t.montantCollecte;
        t.montantCollecte = 0;
        t.statutT = StatutTrajet.TERMINEE;
        t.statutA = StatusAnnonce.TERMINEE;

        (bool succes, ) = payable(t.chauffeur).call{value: montant}("");
        require(succes, "Transfert chauffeur echoue");

        emit TrajetTermine(_id, montant);
    }

    // Annuler toute l'annonce → rembourser tous les passagers ACCEPTES
    function annulerAnnonce(uint256 _id) external seulementChauffeur(_id) {
        Trajet storage t = trajets[_id];
        require(
            t.statutT == StatutTrajet.EN_ATTENTE || t.statutT == StatutTrajet.CONFIRMEE,
            "Impossible d'annuler"
        );

        // EFFECTS d'abord
        t.statutT = StatutTrajet.ANNULEE;
        t.statutA = StatusAnnonce.ANNULEE;
        t.montantCollecte = 0;

        // INTERACTIONS : rembourser chaque réservation acceptée ou en attente
        Reservation[] storage liste = reservations[_id];
        for (uint256 i = 0; i < liste.length; i++) {
            Reservation storage r = liste[i];
            if (r.statut == StatusReservation.ACCEPTEE || r.statut == StatusReservation.EN_ATTENTE) {
                uint256 montant = r.montantPaye;
                r.montantPaye = 0;
                r.statut = StatusReservation.ANNULEE_CONDUCTEUR;
                aUneReservationActive[_id][r.passager] = false;
                (bool succes, ) = payable(r.passager).call{value: montant}("");
                require(succes, "Remboursement echoue");
            }
        }

        emit AnnonceAnnulee(_id);
    }

    function noterChauffeur(uint256 _trajetId, uint8 _note) external {
        Trajet storage t = trajets[_trajetId];
        require(t.statutT == StatutTrajet.TERMINEE, "Trajet non termine");
        require(_note >= 1 && _note <= 5, "Note entre 1 et 5");
        require(!aVote[_trajetId][msg.sender], "Deja note");
        require(aUneReservationActive[_trajetId][msg.sender] == false, "");

        // Verifier que le passager a bien une reservation ACCEPTEE sur ce trajet
        bool estPassager = false;
        Reservation[] storage liste = reservations[_trajetId];
        for (uint256 i = 0; i < liste.length; i++) {
            if (liste[i].passager == msg.sender && liste[i].statut == StatusReservation.ACCEPTEE) {
                estPassager = true;
                break;
            }
        }
        require(estPassager, "Seuls les passagers confirmes peuvent noter");

        aVote[_trajetId][msg.sender] = true;
        totalEtoiles[t.chauffeur] += _note;
        nombreNotes[t.chauffeur]++;

        emit ChauffeurNote(_trajetId, msg.sender, _note);
    }

    // ─── GETTERS ─────────────────────────────────────────────────────────────

    function getNombreTrajets() external view returns (uint256) {
        return trajets.length;
    }

    function getReservations(uint256 _trajetId) external view returns (Reservation[] memory) {
        return reservations[_trajetId];
    }

    function getMoyenneNote(address _chauffeur) external view returns (uint256 moyenne, uint256 total) {
        total = nombreNotes[_chauffeur];
        if (total == 0) return (0, 0);
        moyenne = totalEtoiles[_chauffeur] / total;
    }
}
