exigerConnexion();

const trajet = JSON.parse(sessionStorage.getItem('vp_trajet') || 'null');
if(!trajet){
    window.location.href = '4.html';
}

document.getElementById('heure').value = trajet.heure_depart ? trajet.heure_depart.slice(0,5) : '';
document.getElementById('date').value = trajet.date_depart ? trajet.date_depart.slice(0,10) : '';
document.getElementById('lieuDepart').value = trajet.lieu_depart || 'Antananarivo';
document.getElementById('infoTrajet').textContent =
    `Destination : ${trajet.destination}  |  Vehicule : ${trajet.vehicule_nom} (${trajet.vehicule_type})  |  Prix : ${trajet.prix} Ar / place`;

const utilisateur = getUtilisateur();

document.getElementById('btnSuivant').addEventListener('click', () => {
    const nom = document.getElementById('nom').value.trim();
    const prenom = document.getElementById('prenom').value.trim();
    const sexe = document.getElementById('sexe').value;
    const telephone = document.getElementById('telephone').value.trim();
    const nombreSiege = parseInt(document.getElementById('nombreSiege').value, 10);

    if(!nom || !prenom || !telephone || !nombreSiege || nombreSiege < 1){
        afficherMessage('Veuillez remplir correctement tous les champs.', 'danger');
        return;
    }
    if(nombreSiege > trajet.nombre_places){
        afficherMessage(`Ce vehicule ne dispose que de ${trajet.nombre_places} places.`, 'danger');
        return;
    }

    sessionStorage.setItem('vp_reservation_infos', JSON.stringify({ nom, prenom, sexe, telephone, nombreSiege }));
    window.location.href = '6.html';
});
