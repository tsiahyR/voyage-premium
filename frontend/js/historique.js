exigerConnexion();

async function chargerHistorique(){
    const conteneur = document.getElementById('listeHistorique');
    const btnEffacer = document.getElementById('btnEffacerHistorique');
    try {
        const reservations = await appelApi('/reservations/historique');

        if(btnEffacer) btnEffacer.style.display = reservations.length === 0 ? 'none' : 'inline-flex';

        if(reservations.length === 0){
            conteneur.innerHTML = '<p class="text-center" style="font-weight:700;">Aucune reservation pour le moment.</p>';
            return;
        }

        conteneur.innerHTML = reservations.map(r => `
            <div class="vp-card d-flex justify-content-between align-items-center flex-wrap gap-2">
                <div>
                    <div style="font-weight:800; color:#1c5d3a; font-size:1.2rem;">${r.destination}</div>
                    <div>Vehicule : ${r.vehicule_nom} (${r.vehicule_type})</div>
                    <div>Date : ${r.date_depart ? r.date_depart.slice(0,10) : ''} &agrave; ${r.heure_depart ? r.heure_depart.slice(0,5) : ''}</div>
                    <div>Si&egrave;ges : ${r.numeros_sieges || '-'}</div>
                    <div>Passager : ${r.nom} ${r.prenom}</div>
                </div>
                <div class="text-end">
                    <span class="${r.statut === 'Confirmee' ? 'vp-badge-premium' : 'vp-badge-standard'}">${r.statut === 'Confirmee' ? 'Confirmée' : 'Annulée'}</span>
                    <div class="mt-2 d-flex gap-2 justify-content-end">
                        ${r.statut === 'Confirmee' ? `<button class="vp-btn vp-btn-orange" style="padding:.4rem 1.2rem; font-size:.9rem;" onclick="annuler(${r.id})">Annuler</button>` : ''}
                        <button class="vp-btn" style="padding:.4rem .8rem; font-size:.9rem; background:#fff; color:var(--text-dark); border-color:var(--border);" title="Effacer cette entree" onclick="supprimerEntree(${r.id})"><i class="bi bi-trash3"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

async function annuler(id){
    if(!confirm('Voulez-vous vraiment annuler cette reservation ?')) return;
    try {
        await appelApi(`/reservations/${id}/annuler`, 'PUT');
        afficherMessage('Reservation annulee.');
        chargerHistorique();
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

async function supprimerEntree(id){
    if(!confirm('Effacer definitivement cette entree de l\'historique ?')) return;
    try {
        await appelApi(`/reservations/${id}`, 'DELETE');
        afficherMessage('Entree effacee de l\'historique.');
        chargerHistorique();
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

async function effacerHistorique(){
    if(!confirm('Effacer tout votre historique de reservation ? Cette action est irreversible.')) return;
    try {
        await appelApi('/reservations/historique', 'DELETE');
        afficherMessage('Historique efface.');
        chargerHistorique();
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

const btnEffacerHistorique = document.getElementById('btnEffacerHistorique');
if(btnEffacerHistorique){
    btnEffacerHistorique.addEventListener('click', effacerHistorique);
}

chargerHistorique();
