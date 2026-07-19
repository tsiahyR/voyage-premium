exigerConnexion();

const trajetSieges = JSON.parse(sessionStorage.getItem('vp_trajet') || 'null');
const infosReservation = JSON.parse(sessionStorage.getItem('vp_reservation_infos') || 'null');

if(!trajetSieges || !infosReservation){
    window.location.href = '4.html';
}

document.getElementById('nombreDemande').textContent = infosReservation.nombreSiege;

let siegesSelectionnes = [];

async function chargerSieges(){
    try {
        const sieges = await appelApi(`/sieges/trajet/${trajetSieges.id}`, 'GET', null, false);
        dessinerPlan(sieges);
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

function dessinerPlan(sieges){
    const conteneur = document.getElementById('planSieges');
    conteneur.innerHTML = '';

    const plan = document.createElement('div');
    plan.className = 'plan-vehicule';

    const conducteur = document.createElement('div');
    conducteur.className = 'siege-conducteur';
    conducteur.innerHTML = '<span>Conducteur</span>';
    plan.appendChild(conducteur);

    const grille = document.createElement('div');
    grille.className = 'grille-sieges';

    sieges.forEach(siege => {
        const el = document.createElement('div');
        el.className = `siege ${siege.statut === 'reserve' ? 'reserve' : 'libre'}`;
        el.style.gridColumn = siege.colonne;
        el.style.gridRow = siege.ligne;
        el.dataset.id = siege.id;
        el.innerHTML = '<span class="siege-cercle"></span>';

        if(siege.statut !== 'reserve'){
            el.addEventListener('click', () => basculerSiege(siege.id, el));
        }
        grille.appendChild(el);
    });

    plan.appendChild(grille);
    conteneur.appendChild(plan);

    const legende = document.createElement('div');
    legende.className = 'siege-legende';
    legende.innerHTML = `
        <span class="item"><span class="puce libre"></span> Libre</span>
        <span class="item"><span class="puce reserve"></span> R&eacute;serv&eacute;</span>
        <span class="item"><span class="puce choisi"></span> S&eacute;lectionn&eacute;</span>
    `;
    conteneur.appendChild(legende);
}

function basculerSiege(id, element){
    const index = siegesSelectionnes.indexOf(id);
    if(index >= 0){
        siegesSelectionnes.splice(index, 1);
        element.classList.remove('selectionne');
    } else {
        if(siegesSelectionnes.length >= infosReservation.nombreSiege){
            afficherMessage(`Vous avez demande ${infosReservation.nombreSiege} siege(s) seulement.`, 'danger');
            return;
        }
        siegesSelectionnes.push(id);
        element.classList.add('selectionne');
    }
    document.getElementById('compteurSieges').textContent = siegesSelectionnes.length;
}

document.getElementById('btnSuivant').addEventListener('click', async () => {
    if(siegesSelectionnes.length !== infosReservation.nombreSiege){
        afficherMessage(`Veuillez selectionner exactement ${infosReservation.nombreSiege} siege(s).`, 'danger');
        return;
    }

    try {
        const resultat = await appelApi('/reservations', 'POST', {
            trajet_id: trajetSieges.id,
            nom: infosReservation.nom,
            prenom: infosReservation.prenom,
            sexe: infosReservation.sexe,
            telephone: infosReservation.telephone,
            sieges: siegesSelectionnes
        });

        sessionStorage.removeItem('vp_trajet');
        sessionStorage.removeItem('vp_reservation_infos');
        sessionStorage.setItem('vp_derniere_reservation', JSON.stringify(resultat));

        window.location.href = 'confirmation.html';
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
        chargerSieges();
    }
});

chargerSieges();
