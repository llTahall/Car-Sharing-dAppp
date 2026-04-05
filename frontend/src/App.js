import React, { useState, useEffect } from 'react'; // Ajout de useEffect
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, STATUT_TEXTES } from './constants';

const sidebarButtonStyle = (isActive, activeColor) => ({
  padding: '15px',
  marginBottom: '15px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: isActive ? activeColor : 'transparent',
  color: 'white',
  textAlign: 'left',
  cursor: 'pointer',
  fontWeight: isActive ? 'bold' : 'normal',
  fontSize: '1rem',
  transition: 'all 0.2s ease'
});

const inputStyle = {
  padding: '12px',
  borderRadius: '6px',
  border: '1px solid #ccc',
  fontSize: '14px'
};

function App() {
  const [account, setAccount] = useState("");
  const [contract, setContract] = useState(null);
  const [trajets, setTrajets] = useState([]);
  const [view, setView] = useState('passager');
  const [form, setForm] = useState({ dep: "", arr: "", prix: "", places: "" });
  const [quantites, setQuantites] = useState({}); // Stocke {trajetId: nombre}

  // 🔄 Charger les trajets automatiquement à la connexion
  useEffect(() => {
    if (contract) {
      fetchTrajets();
    }
  }, [contract]);

  const connectWallet = async () => {
    try {
      const { ethereum } = window;
      if (!ethereum) return alert("Installe MetaMask !");

      const accounts = await ethereum.request({ method: "eth_requestAccounts" });
      setAccount(accounts[0]);

      const provider = new ethers.BrowserProvider(ethereum);
      const signer = await provider.getSigner();

      const contractInstance = new ethers.Contract(
        CONTRACT_ADDRESS,
        CONTRACT_ABI,
        signer
      );

      setContract(contractInstance);
      console.log("✅ Wallet connecté et Contrat prêt !");
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };

  const fetchTrajets = async () => {
    if (!contract) return;
    try {
      const tempTrajets = [];
      // On boucle pour tester les 10 premiers index
      for (let i = 0; i < 10; i++) {
        try {
          const t = await contract.trajets(i);
          const chauffeurAddr = t.chauffeur || t[0];

          // On vérifie que le trajet existe (adresse non vide)
          if (chauffeurAddr && chauffeurAddr !== "0x0000000000000000000000000000000000000000") {

            // 🔥 NOUVEAU : On récupère explicitement la liste des passagers
            let passagers = [];
            try {
              passagers = await contract.getListePassagers(i);
            } catch (err) {
              console.warn("Impossible de récupérer les passagers pour l'index", i);
            }

            tempTrajets.push({
              id: i,
              chauffeur: chauffeurAddr,
              departAdresse: t.departAdresse || t[1],
              arriveeAdresse: t.arriveeAdresse || t[2],
              prix: t.prix || t[4],
              placesDisponibles: t.placesDisponibles || t[6],
              statutA: t.statutA || t[7],
              listePassagers: passagers // 🔥 On ajoute la liste ici !
            });
          }
        } catch (e) {
          console.log("Fin de la liste à l'index", i);
          break;
        }
      }
      setTrajets(tempTrajets);
      console.log("Trajets chargés et nettoyés :", tempTrajets);
    } catch (error) {
      console.error("Erreur globale fetch:", error);
    }
  };

  const handleProposer = async (e) => {
    e.preventDefault();
    try {
      const prixEnWei = ethers.parseEther(form.prix);
      const dateFuture = Math.floor(Date.now() / 1000) + 3600;

      const tx = await contract.proposerTrajet(
        form.dep, form.arr, dateFuture, prixEnWei, parseInt(form.places)
      );

      await tx.wait();
      alert("Trajet publié !");
      fetchTrajets();
    } catch (error) {
      console.error(error);
      alert("Erreur : " + error.message);
    }
  };

  // --- NOUVELLE FONCTION : RÉSERVER ---
  const handleReserver = async (id, prixUnitaire, qte) => {
    try {
      const { ethereum } = window;
      if (!ethereum || !contract) return;

      // Calcul du prix total (BigInt est nécessaire pour les calculs de Wei)
      const prixTotal = ethers.toBigInt(prixUnitaire) * ethers.toBigInt(qte);

      console.log(`Réservation de ${qte} places pour un total de ${ethers.formatEther(prixTotal)} ETH`);

      const tx = await contract.reserverPlaces(id, qte, {
        value: prixTotal
      });

      await tx.wait();
      alert(`Succès ! ${qte} place(s) réservée(s).`);
      fetchTrajets();
    } catch (error) {
      console.error("Erreur:", error);
      alert("Erreur lors de la réservation. Vérifiez vos fonds ou le nombre de places.");
    }
  };

  // --- NOUVELLE FONCTION : GÉRER ---
  const handleGerer = (id) => {
    alert("Gestion du trajet #" + id + " (Annulation/Clôture bientôt disponible)");
  };
  const handleAnnulerReservation = async (id) => {
    try {
      const tx = await contract.annulerMaReservation(id);
      await tx.wait();
      alert("Réservation annulée. Votre argent a été remboursé !");
      fetchTrajets();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'annulation.");
    }
  };

  return (
    <div className="App" style={{ display: 'flex', minHeight: '100vh', fontFamily: 'Arial, sans-serif', backgroundColor: '#f4f7f6' }}>

      {/* --- SIDEBAR --- */}
      <nav style={{ width: '260px', backgroundColor: '#2c3e50', color: 'white', display: 'flex', flexDirection: 'column', padding: '30px 20px', position: 'fixed', height: '100vh' }}>
        <h2 style={{ marginBottom: '40px', textAlign: 'center' }}>🚗 Car-Sharing</h2>
        {!account ? (
          <button onClick={connectWallet} style={{ padding: '12px', cursor: 'pointer', borderRadius: '8px', backgroundColor: '#3498db', color: 'white', border: 'none' }}>Connecter Wallet</button>
        ) : (
          <>
            <div style={{ marginBottom: '30px', padding: '10px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '0.85rem' }}>
              <p style={{ margin: 0, color: '#2ecc71' }}>● Connecté</p>
              <p style={{ margin: '5px 0 0 0' }}>{account.substring(0, 12)}...</p>
            </div>
            <button onClick={() => setView('passager')} style={sidebarButtonStyle(view === 'passager', '#3498db')}>🌍 Espace Passager</button>
            <button onClick={() => setView('chauffeur')} style={sidebarButtonStyle(view === 'chauffeur', '#2ecc71')}>🚘 Espace Conducteur</button>
            <button onClick={fetchTrajets} style={{ marginTop: '20px', padding: '10px', cursor: 'pointer', borderRadius: '8px', backgroundColor: '#34495e', color: 'white', border: '1px solid #7f8c8d' }}>🔄 Actualiser</button>
          </>
        )}
      </nav>

      {/* --- MAIN --- */}
      <main style={{ marginLeft: '260px', flex: 1, padding: '40px' }}>
        {!account ? (
          <div style={{ textAlign: 'center', marginTop: '100px' }}><h1>Bienvenue</h1><p>Connectez MetaMask.</p></div>
        ) : (
          <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <header style={{ marginBottom: '30px', borderBottom: '2px solid #ddd' }}>
              <h1>{view === 'chauffeur' ? "Mes Annonces" : "Trouver un trajet"}</h1>
            </header>

            {view === 'chauffeur' && (
              <div style={{ border: '1px solid #ddd', padding: '25px', borderRadius: '15px', backgroundColor: '#fff', marginBottom: '40px' }}>
                <h3>➕ Nouveau trajet</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <input type="text" placeholder="Départ" onChange={(e) => setForm({ ...form, dep: e.target.value })} style={inputStyle} />
                  <input type="text" placeholder="Arrivée" onChange={(e) => setForm({ ...form, arr: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Prix ETH" onChange={(e) => setForm({ ...form, prix: e.target.value })} style={inputStyle} />
                  <input type="number" placeholder="Places" onChange={(e) => setForm({ ...form, places: e.target.value })} style={inputStyle} />
                  <button onClick={handleProposer} style={{ gridColumn: 'span 2', padding: '15px', backgroundColor: '#2ecc71', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}>🚀 Publier</button>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              {trajets
                .filter(t => {
                  if (!t || !t.chauffeur) return false;
                  const chauffeurAddr = t.chauffeur.toLowerCase();
                  const userAddr = account.toLowerCase();
                  return view === 'chauffeur' ? chauffeurAddr === userAddr : chauffeurAddr !== userAddr;
                })
                .map((t) => {
                  // On vérifie si l'utilisateur actuel est dans la liste des passagers
                  const aDejaUnePlace = t.listePassagers?.some(p => p.toLowerCase() === account.toLowerCase());

                  return (
                    <div key={t.id} style={{ border: '1px solid #ddd', padding: '20px', borderRadius: '12px', width: '280px', backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <h4 style={{ margin: 0 }}>Trajet #{t.id}</h4>
                        <span style={{ backgroundColor: STATUT_TEXTES[Number(t.statutA)]?.color, color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem' }}>
                          {STATUT_TEXTES[Number(t.statutA)]?.label}
                        </span>
                      </div>

                      <p>📍 <b>De:</b> {t.departAdresse}</p>
                      <p>🏁 <b>À:</b> {t.arriveeAdresse}</p>
                      <p>💰 <b>{ethers.formatEther(t.prix)} ETH</b></p>
                      <p>👥 Places dispos: {t.placesDisponibles.toString()}</p>

                      {/* --- LISTE PASSAGERS (Vue Chauffeur uniquement) --- */}
                      {view === 'chauffeur' && t.listePassagers?.length > 0 && (
                        <div style={{ marginTop: '10px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '6px', fontSize: '0.75rem' }}>
                          <b>Passagers :</b>
                          {[...new Set(t.listePassagers)].map((addr, idx) => (
                            <div key={idx} style={{ color: '#555' }}>• {addr.substring(0, 8)}...</div>
                          ))}
                        </div>
                      )}

                      {/* --- SÉLECTEUR DE PLACES (Vue Passager uniquement) --- */}
                      {view === 'passager' && !aDejaUnePlace && (
                        <div style={{ marginTop: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <label style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Places :</label>
                          <input
                            type="number" min="1" max={t.placesDisponibles.toString()}
                            value={quantites[t.id] || 1}
                            onChange={(e) => setQuantites({ ...quantites, [t.id]: e.target.value })}
                            style={{ width: '60px', padding: '5px', borderRadius: '4px', border: '1px solid #ccc' }}
                          />
                        </div>
                      )}

                      {/* --- BOUTONS D'ACTION --- */}
                      <div style={{ marginTop: 'auto', paddingTop: '15px' }}>
                        {view === 'chauffeur' ? (
                          <button onClick={() => handleGerer(t.id)} style={{ width: '100%', padding: '10px', backgroundColor: '#e67e22', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                            Gérer l'annonce
                          </button>
                        ) : (
                          <>
                            {aDejaUnePlace ? (
                              <button onClick={() => handleAnnulerReservation(t.id)} style={{ width: '100%', padding: '10px', backgroundColor: '#e74c3c', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>
                                ❌ Annuler ma place
                              </button>
                            ) : (
                              <button
                                disabled={t.placesDisponibles == 0}
                                onClick={() => handleReserver(t.id, t.prix, quantites[t.id] || 1)}
                                style={{
                                  width: '100%', padding: '10px',
                                  backgroundColor: t.placesDisponibles == 0 ? '#bdc3c7' : '#3498db',
                                  color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: t.placesDisponibles == 0 ? 'not-allowed' : 'pointer'
                                }}
                              >
                                {t.placesDisponibles == 0 ? "Complet" : `Réserver ${quantites[t.id] || 1} place(s)`}
                              </button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;