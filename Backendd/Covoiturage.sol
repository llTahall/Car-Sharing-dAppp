// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Covoiturage {

    // ─── ENUMS ───────────────────────────────────────────────────────────────

    enum StatutTrajet      { EN_ATTENTE, CONFIRMEE, EN_ATTENTE_LIBERATION, EN_LITIGE, ANNULEE, TERMINEE }
    enum StatusAnnonce     { PUBLIEE, COMPLETE, ANNULEE, TERMINEE }
    enum StatusReservation { EN_ATTENTE, ACCEPTEE, REFUSEE_CONDUCTEUR, ANNULEE_PASSAGER, ANNULEE_CONDUCTEUR }

    // ─── EVENTS ──────────────────────────────────────────────────────────────

    event UtilisateurInscrit(address indexed utilisateur, string pseudo, bool estConducteur);
    event TrajetPropose(uint256 indexed id, address indexed chauffeur, string departNom, string arriveeNom, uint256 prix, uint8 places);
    event ReservationDemandee(uint256 indexed trajetId, uint256 indexed reservationId, address indexed passager, uint8 quantite, uint256 pointsUtilises);
    event ReservationAcceptee(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationRefusee(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationAnnuleePassager(uint256 indexed trajetId, uint256 indexed reservationId);
    event ReservationAnnuleeConducteur(uint256 indexed trajetId, uint256 indexed reservationId);
    event DepartConfirme(uint256 indexed id);
    event ArriveeValidee(uint256 indexed id, uint256 expirationTimestamp);
    event ChauffeurFraude(uint256 indexed trajetId, address indexed chauffeur, uint256 distanceCarree);
    event TrajetConfirmeParPassager(uint256 indexed trajetId, address indexed passager);
    event TrajetConteste(uint256 indexed trajetId, address indexed plaignant, string raison);
    event PaiementLibere(uint256 indexed trajetId, uint256 montant);
    event LitigeResolu(uint256 indexed trajetId, bool enFaveurChauffeur);
    event TrajetTermine(uint256 indexed id, uint256 montantVerseChauffeur);
    event AnnonceAnnulee(uint256 indexed id);
    event ChauffeurNote(uint256 indexed trajetId, address indexed passager, uint8 note);
    event PointsGagnes(address indexed utilisateur, uint256 montant, string raison);
    event PointsUtilises(address indexed utilisateur, uint256 montant);

    // ─── STRUCTS ─────────────────────────────────────────────────────────────

    struct Utilisateur {
        string pseudo;
        bool estEnregistre;
        bool estConducteur;
        uint256 dateInscription;
        uint256 trajetsPassager;
        uint256 trajetsConducteur;
    }

    struct Reservation {
        address passager;
        uint8 quantite;
        uint256 montantPaye;
        uint256 pointsUtilises;
        StatusReservation statut;
    }

    struct Trajet {
        address chauffeur;
        string departNom;       // "Paris, Gare de Lyon"
        string arriveeNom;      // "Lyon, Part-Dieu"
        int256 departLat;       // 48854200 = 48.8542° (× 10^6)
        int256 departLng;
        int256 arriveeLat;
        int256 arriveeLng;
        uint256 dateHeureDepart;
        uint256 prix;
        uint8 placesTotales;
        uint8 placesDisponibles;
        uint256 montantCollecte;
        StatutTrajet statutT;
        StatusAnnonce statutA;
    }

    struct Litige {
        uint256 trajetId;
        address plaignant;
        string raison;
        int256 latChauffeur;    // coords soumises par le chauffeur à confirmerArrivee
        int256 lngChauffeur;    // admin compare avec arriveeLat/Lng du trajet
        uint256 dateOuverture;
        bool resolu;
    }

    // ─── STORAGE ─────────────────────────────────────────────────────────────

    address public admin;

    mapping(address => Utilisateur)                        public utilisateurs;
    Trajet[]                                               public trajets;
    mapping(uint256 => Reservation[])                      public reservations;
    mapping(uint256 => mapping(address => bool))           public aUneReservationActive;
    mapping(uint256 => mapping(address => bool))           public aVote;
    mapping(uint256 => Litige)                             public litiges;
    mapping(uint256 => uint256)                            public timestampArrivee;
    mapping(uint256 => int256)                             public latChauffeurSoumise;
    mapping(uint256 => int256)                             public lngChauffeurSoumise;

    mapping(address => uint256) public totalEtoiles;
    mapping(address => uint256) public nombreNotes;
    mapping(address => uint256) public nombreFraudes;
    mapping(address => uint256) public ridePoints;

    uint256 public constant POINTS_PAR_AVIS              = 50;
    uint256 public constant POINTS_PAR_TRAJET_PASSAGER   = 100;
    uint256 public constant POINTS_PAR_TRAJET_CONDUCTEUR = 150;
    uint256 public constant POINTS_PAR_TRANCHE           = 100;
    uint256 public constant WEI_PAR_TRANCHE              = 1e14;    // 100 points = 0.0001 ETH
    uint256 public constant DELAI_CONTESTATION           = 24 hours;
    uint256 public constant SEUIL_1KM_CARRE              = 80_694_289; // 8983² unités

    // ─── CONSTRUCTOR ─────────────────────────────────────────────────────────

    constructor() {
        admin = msg.sender;
    }

    // ─── MODIFIERS ───────────────────────────────────────────────────────────

    modifier seulementInscrit() {
        require(utilisateurs[msg.sender].estEnregistre, "Vous devez etre inscrit");
        _;
    }

    modifier seulementChauffeur(uint256 _id) {
        require(msg.sender == trajets[_id].chauffeur, "Seul le chauffeur peut faire ca");
        _;
    }

    modifier seulementAdmin() {
        require(msg.sender == admin, "Seul l'admin peut faire ca");
        _;
    }

    // ─── AUTH ────────────────────────────────────────────────────────────────

    function sEnregistrer(string memory _pseudo, bool _estConducteur) external {
        require(!utilisateurs[msg.sender].estEnregistre, "Deja inscrit");
        require(bytes(_pseudo).length > 0, "Pseudo invalide");

        utilisateurs[msg.sender] = Utilisateur({
            pseudo: _pseudo,
            estEnregistre: true,
            estConducteur: _estConducteur,
            dateInscription: block.timestamp,
            trajetsPassager: 0,
            trajetsConducteur: 0
        });

        emit UtilisateurInscrit(msg.sender, _pseudo, _estConducteur);
    }

    // ─── PROPOSER TRAJET ─────────────────────────────────────────────────────

    function proposerTrajet(
        string memory _departNom,
        string memory _arriveeNom,
        int256 _departLat,
        int256 _departLng,
        int256 _arriveeLat,
        int256 _arriveeLng,
        uint256 _date,
        uint256 _prix,
        uint8 _places
    ) external seulementInscrit {
        require(utilisateurs[msg.sender].estConducteur, "Vous devez etre conducteur");
        require(_places > 0, "Au moins 1 place");
        require(_prix > 0, "Prix invalide");
        require(_date > block.timestamp, "Date invalide");

        trajets.push(Trajet({
            chauffeur: msg.sender,
            departNom: _departNom,
            arriveeNom: _arriveeNom,
            departLat: _departLat,
            departLng: _departLng,
            arriveeLat: _arriveeLat,
            arriveeLng: _arriveeLng,
            dateHeureDepart: _date,
            prix: _prix,
            placesTotales: _places,
            placesDisponibles: _places,
            montantCollecte: 0,
            statutT: StatutTrajet.EN_ATTENTE,
            statutA: StatusAnnonce.PUBLIEE
        }));

        emit TrajetPropose(trajets.length - 1, msg.sender, _departNom, _arriveeNom, _prix, _places);
    }

    // ─── RESERVATIONS ────────────────────────────────────────────────────────

    function demanderReservation(
        uint256 _trajetId,
        uint8 _quantite,
        uint256 _pointsAUtiliser
    ) external payable seulementInscrit {
        Trajet storage t = trajets[_trajetId];

        require(t.statutA == StatusAnnonce.PUBLIEE, "Annonce non disponible");
        require(_quantite > 0, "Minimum 1 place");
        require(t.placesDisponibles >= _quantite, "Pas assez de places");
        require(msg.sender != t.chauffeur, "Le chauffeur ne peut pas reserver");
        require(!aUneReservationActive[_trajetId][msg.sender], "Reservation deja en cours");

        uint256 prixTotal = t.prix * _quantite;
        uint256 reduction = 0;

        if (_pointsAUtiliser > 0) {
            require(_pointsAUtiliser <= ridePoints[msg.sender], "Pas assez de points");
            require(_pointsAUtiliser % POINTS_PAR_TRANCHE == 0, "Multiples de 100 uniquement");
            reduction = (_pointsAUtiliser / POINTS_PAR_TRANCHE) * WEI_PAR_TRANCHE;
            require(reduction < prixTotal, "Reduction ne peut pas couvrir le prix total");
            ridePoints[msg.sender] -= _pointsAUtiliser;
            emit PointsUtilises(msg.sender, _pointsAUtiliser);
        }

        require(msg.value == prixTotal - reduction, "Montant incorrect");

        aUneReservationActive[_trajetId][msg.sender] = true;
        reservations[_trajetId].push(Reservation({
            passager: msg.sender,
            quantite: _quantite,
            montantPaye: msg.value,
            pointsUtilises: _pointsAUtiliser,
            statut: StatusReservation.EN_ATTENTE
        }));

        emit ReservationDemandee(_trajetId, reservations[_trajetId].length - 1, msg.sender, _quantite, _pointsAUtiliser);
    }

    function accepterReservation(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.statut == StatusReservation.EN_ATTENTE, "Reservation non en attente");
        require(t.placesDisponibles >= r.quantite, "Plus assez de places");

        r.statut = StatusReservation.ACCEPTEE;
        t.placesDisponibles -= r.quantite;
        t.montantCollecte += r.montantPaye;

        if (t.placesDisponibles == 0) t.statutA = StatusAnnonce.COMPLETE;

        emit ReservationAcceptee(_trajetId, _reservationId);
    }

    function refuserReservation(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Reservation storage r = reservations[_trajetId][_reservationId];
        require(r.statut == StatusReservation.EN_ATTENTE, "Reservation non en attente");

        uint256 montant = r.montantPaye;
        address passager = r.passager;
        uint256 pointsARestituer = r.pointsUtilises;

        r.montantPaye = 0;
        r.pointsUtilises = 0;
        r.statut = StatusReservation.REFUSEE_CONDUCTEUR;
        aUneReservationActive[_trajetId][passager] = false;

        if (pointsARestituer > 0) ridePoints[passager] += pointsARestituer;

        (bool succes, ) = payable(passager).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationRefusee(_trajetId, _reservationId);
    }

    function annulerMaReservation(uint256 _trajetId, uint256 _reservationId) external seulementInscrit {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.passager == msg.sender, "Ce n'est pas votre reservation");
        require(
            r.statut == StatusReservation.EN_ATTENTE || r.statut == StatusReservation.ACCEPTEE,
            "Reservation non annulable"
        );
        require(t.statutT != StatutTrajet.TERMINEE, "Trajet deja termine");

        uint256 montant = r.montantPaye;
        uint256 pointsARestituer = r.pointsUtilises;
        bool etaitAcceptee = (r.statut == StatusReservation.ACCEPTEE);

        r.montantPaye = 0;
        r.pointsUtilises = 0;
        r.statut = StatusReservation.ANNULEE_PASSAGER;
        aUneReservationActive[_trajetId][msg.sender] = false;

        if (etaitAcceptee) {
            t.placesDisponibles += r.quantite;
            t.montantCollecte -= montant;
            if (t.statutA == StatusAnnonce.COMPLETE) t.statutA = StatusAnnonce.PUBLIEE;
        }

        if (pointsARestituer > 0) ridePoints[msg.sender] += pointsARestituer;

        (bool succes, ) = payable(msg.sender).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationAnnuleePassager(_trajetId, _reservationId);
    }

    function annulerReservationPassager(uint256 _trajetId, uint256 _reservationId) external seulementChauffeur(_trajetId) {
        Trajet storage t = trajets[_trajetId];
        Reservation storage r = reservations[_trajetId][_reservationId];

        require(r.statut == StatusReservation.ACCEPTEE, "Reservation non acceptee");
        require(t.statutT == StatutTrajet.EN_ATTENTE, "Trajet deja en cours");

        uint256 montant = r.montantPaye;
        address passager = r.passager;
        uint256 pointsARestituer = r.pointsUtilises;

        r.montantPaye = 0;
        r.pointsUtilises = 0;
        r.statut = StatusReservation.ANNULEE_CONDUCTEUR;
        aUneReservationActive[_trajetId][passager] = false;
        t.placesDisponibles += r.quantite;
        t.montantCollecte -= montant;

        if (t.statutA == StatusAnnonce.COMPLETE) t.statutA = StatusAnnonce.PUBLIEE;
        if (pointsARestituer > 0) ridePoints[passager] += pointsARestituer;

        (bool succes, ) = payable(passager).call{value: montant}("");
        require(succes, "Remboursement echoue");

        emit ReservationAnnuleeConducteur(_trajetId, _reservationId);
    }

    // ─── LIFECYCLE ───────────────────────────────────────────────────────────

    function confirmerDepart(uint256 _id) external seulementChauffeur(_id) {
        require(trajets[_id].statutT == StatutTrajet.EN_ATTENTE, "Statut invalide");
        trajets[_id].statutT = StatutTrajet.CONFIRMEE;
        emit DepartConfirme(_id);
    }

    // Chauffeur confirme arrivée — le frontend extrait automatiquement le GPS
    function confirmerArrivee(
        uint256 _id,
        int256 _latChauffeur,
        int256 _lngChauffeur
    ) external seulementChauffeur(_id) {
        Trajet storage t = trajets[_id];
        require(t.statutT == StatutTrajet.CONFIRMEE, "Trajet non en cours");

        uint256 distanceCarre = _calculerDistanceCarre(
            t.arriveeLat, t.arriveeLng,
            _latChauffeur, _lngChauffeur
        );

        if (distanceCarre > SEUIL_1KM_CARRE) {
            // Trop loin → remboursement automatique + fraude enregistrée
            nombreFraudes[msg.sender]++;
            t.statutT = StatutTrajet.ANNULEE;
            t.statutA = StatusAnnonce.ANNULEE;
            t.montantCollecte = 0;

            Reservation[] storage liste = reservations[_id];
            for (uint256 i = 0; i < liste.length; i++) {
                if (liste[i].statut == StatusReservation.ACCEPTEE) {
                    uint256 montant = liste[i].montantPaye;
                    liste[i].montantPaye = 0;
                    (bool succes, ) = payable(liste[i].passager).call{value: montant}("");
                    require(succes, "Remboursement echoue");
                }
            }

            emit ChauffeurFraude(_id, msg.sender, distanceCarre);

        } else {
            // À destination → timer 24h démarre
            t.statutT = StatutTrajet.EN_ATTENTE_LIBERATION;
            timestampArrivee[_id] = block.timestamp;
            latChauffeurSoumise[_id] = _latChauffeur;
            lngChauffeurSoumise[_id] = _lngChauffeur;

            emit ArriveeValidee(_id, block.timestamp + DELAI_CONTESTATION);
        }
    }

    // Passager confirme → paiement instantané, pas besoin d'attendre 24h
    function confirmerTrajetPassager(uint256 _id) external seulementInscrit {
        require(trajets[_id].statutT == StatutTrajet.EN_ATTENTE_LIBERATION, "Pas en attente de liberation");

        bool estPassager = _estPassagerAccepte(_id, msg.sender);
        require(estPassager, "Seuls les passagers confirmes peuvent valider");

        emit TrajetConfirmeParPassager(_id, msg.sender);
        _finaliserTrajet(_id, true);
    }

    // Passager conteste dans les 24h → ticket admin créé
    function contesterTrajet(uint256 _id, string memory _raison) external seulementInscrit {
        Trajet storage t = trajets[_id];
        require(t.statutT == StatutTrajet.EN_ATTENTE_LIBERATION, "Pas en attente de liberation");
        require(block.timestamp <= timestampArrivee[_id] + DELAI_CONTESTATION, "Delai de contestation expire");
        require(bytes(_raison).length > 0, "Raison obligatoire");
        require(litiges[_id].dateOuverture == 0, "Litige deja ouvert");

        bool estPassager = _estPassagerAccepte(_id, msg.sender);
        require(estPassager, "Seuls les passagers confirmes peuvent contester");

        t.statutT = StatutTrajet.EN_LITIGE;
        litiges[_id] = Litige({
            trajetId: _id,
            plaignant: msg.sender,
            raison: _raison,
            latChauffeur: latChauffeurSoumise[_id],
            lngChauffeur: lngChauffeurSoumise[_id],
            dateOuverture: block.timestamp,
            resolu: false
        });

        emit TrajetConteste(_id, msg.sender, _raison);
    }

    // N'importe qui peut déclencher après 24h sans contestation
    function libererPaiement(uint256 _id) external {
        require(trajets[_id].statutT == StatutTrajet.EN_ATTENTE_LIBERATION, "Pas en attente de liberation");
        require(block.timestamp > timestampArrivee[_id] + DELAI_CONTESTATION, "24h pas encore ecoulees");

        uint256 montant = trajets[_id].montantCollecte;
        _finaliserTrajet(_id, true);
        emit PaiementLibere(_id, montant);
    }

    // Admin résout le litige
    function resoudreLitige(uint256 _id, bool _enFaveurChauffeur) external seulementAdmin {
        require(trajets[_id].statutT == StatutTrajet.EN_LITIGE, "Pas de litige actif");
        require(!litiges[_id].resolu, "Litige deja resolu");

        litiges[_id].resolu = true;
        _finaliserTrajet(_id, _enFaveurChauffeur);

        emit LitigeResolu(_id, _enFaveurChauffeur);
    }

    function annulerAnnonce(uint256 _id) external seulementChauffeur(_id) {
        Trajet storage t = trajets[_id];
        require(
            t.statutT == StatutTrajet.EN_ATTENTE || t.statutT == StatutTrajet.CONFIRMEE,
            "Impossible d'annuler"
        );

        t.statutT = StatutTrajet.ANNULEE;
        t.statutA = StatusAnnonce.ANNULEE;
        t.montantCollecte = 0;

        Reservation[] storage liste = reservations[_id];
        for (uint256 i = 0; i < liste.length; i++) {
            Reservation storage r = liste[i];
            if (r.statut == StatusReservation.ACCEPTEE || r.statut == StatusReservation.EN_ATTENTE) {
                uint256 montant = r.montantPaye;
                address passager = r.passager;
                uint256 pointsARestituer = r.pointsUtilises;

                r.montantPaye = 0;
                r.pointsUtilises = 0;
                r.statut = StatusReservation.ANNULEE_CONDUCTEUR;
                aUneReservationActive[_id][passager] = false;

                if (pointsARestituer > 0) ridePoints[passager] += pointsARestituer;

                (bool succes, ) = payable(passager).call{value: montant}("");
                require(succes, "Remboursement echoue");
            }
        }

        emit AnnonceAnnulee(_id);
    }

    // ─── NOTATION ────────────────────────────────────────────────────────────

    function noterChauffeur(uint256 _trajetId, uint8 _note) external seulementInscrit {
        Trajet storage t = trajets[_trajetId];
        require(t.statutT == StatutTrajet.TERMINEE, "Trajet non termine");
        require(_note >= 1 && _note <= 5, "Note entre 1 et 5");
        require(!aVote[_trajetId][msg.sender], "Deja note");
        require(_estPassagerAccepte(_trajetId, msg.sender), "Seuls les passagers confirmes peuvent noter");

        aVote[_trajetId][msg.sender] = true;
        totalEtoiles[t.chauffeur] += _note;
        nombreNotes[t.chauffeur]++;
        ridePoints[msg.sender] += POINTS_PAR_AVIS;

        emit PointsGagnes(msg.sender, POINTS_PAR_AVIS, "Avis laisse");
        emit ChauffeurNote(_trajetId, msg.sender, _note);
    }

    // ─── INTERNAL ────────────────────────────────────────────────────────────

    function _finaliserTrajet(uint256 _id, bool _payerChauffeur) internal {
        Trajet storage t = trajets[_id];
        uint256 montant = t.montantCollecte;

        t.montantCollecte = 0;
        t.statutT = StatutTrajet.TERMINEE;
        t.statutA = StatusAnnonce.TERMINEE;

        if (_payerChauffeur) {
            utilisateurs[t.chauffeur].trajetsConducteur++;
            ridePoints[t.chauffeur] += POINTS_PAR_TRAJET_CONDUCTEUR;
            emit PointsGagnes(t.chauffeur, POINTS_PAR_TRAJET_CONDUCTEUR, "Trajet conducteur");

            Reservation[] storage liste = reservations[_id];
            for (uint256 i = 0; i < liste.length; i++) {
                if (liste[i].statut == StatusReservation.ACCEPTEE) {
                    address passager = liste[i].passager;
                    utilisateurs[passager].trajetsPassager++;
                    ridePoints[passager] += POINTS_PAR_TRAJET_PASSAGER;
                    emit PointsGagnes(passager, POINTS_PAR_TRAJET_PASSAGER, "Trajet passager");
                }
            }

            (bool succes, ) = payable(t.chauffeur).call{value: montant}("");
            require(succes, "Transfert chauffeur echoue");
            emit TrajetTermine(_id, montant);

        } else {
            Reservation[] storage liste = reservations[_id];
            for (uint256 i = 0; i < liste.length; i++) {
                if (liste[i].statut == StatusReservation.ACCEPTEE) {
                    uint256 remboursement = liste[i].montantPaye;
                    liste[i].montantPaye = 0;
                    (bool succes, ) = payable(liste[i].passager).call{value: remboursement}("");
                    require(succes, "Remboursement passager echoue");
                }
            }
        }
    }

    function _calculerDistanceCarre(
        int256 _lat1, int256 _lng1,
        int256 _lat2, int256 _lng2
    ) internal pure returns (uint256) {
        int256 dLat = _lat1 - _lat2;
        int256 dLng = _lng1 - _lng2;
        return uint256(dLat * dLat) + uint256(dLng * dLng);
    }

    function _estPassagerAccepte(uint256 _trajetId, address _adresse) internal view returns (bool) {
        Reservation[] storage liste = reservations[_trajetId];
        for (uint256 i = 0; i < liste.length; i++) {
            if (liste[i].passager == _adresse && liste[i].statut == StatusReservation.ACCEPTEE) {
                return true;
            }
        }
        return false;
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

    function getMonProfil() external view returns (Utilisateur memory) {
        return utilisateurs[msg.sender];
    }

    function getMesPoints() external view returns (uint256) {
        return ridePoints[msg.sender];
    }

    function getLitige(uint256 _trajetId) external view returns (Litige memory) {
        return litiges[_trajetId];
    }
}
