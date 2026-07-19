exigerConnexion();

let typeChoisi = null;
let destinationChoisie = null;

const TYPES_VOITURE = ['Standard', 'Premium'];

function creerOption(texte, groupe, callback){
    const div = document.createElement('div');
    div.className = 'vp-option';
    const icone = groupe === 'voiture' ? 'bi-car-front-fill' : 'bi-geo-alt-fill';
    div.innerHTML = `<span class="vp-radio"></span><i class="bi ${icone}"></i><span>${texte}</span>`;
    div.addEventListener('click', () => {
        document.querySelectorAll(`.vp-option[data-groupe="${groupe}"]`).forEach(el => el.classList.remove('selected'));
        div.classList.add('selected');
        callback(texte);
    });
    div.dataset.groupe = groupe;
    return div;
}

async function initialiser(){
    const conteneurVoitures = document.getElementById('listeVoitures');
    TYPES_VOITURE.forEach(type => {
        conteneurVoitures.appendChild(creerOption(type, 'voiture', (val) => { typeChoisi = val; }));
    });

    try {
        const destinations = await appelApi('/trajets/destinations', 'GET', null, false);
        const conteneurDestinations = document.getElementById('listeDestinations');
        destinations.forEach(dest => {
            conteneurDestinations.appendChild(creerOption(dest, 'destination', (val) => { destinationChoisie = val; }));
        });
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
}

document.getElementById('btnSuivant').addEventListener('click', async () => {
    if(!typeChoisi || !destinationChoisie){
        afficherMessage('Veuillez choisir une voiture et une destination.', 'danger');
        return;
    }
    try {
        const trajets = await appelApi(`/trajets?destination=${encodeURIComponent(destinationChoisie)}&type=${encodeURIComponent(typeChoisi)}`, 'GET', null, false);
        if(trajets.length === 0){
            afficherMessage('Aucun trajet disponible pour ce choix pour le moment.', 'danger');
            return;
        }

        sessionStorage.setItem('vp_trajet', JSON.stringify(trajets[0]));
        window.location.href = '5.html';
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
});

initialiser();
