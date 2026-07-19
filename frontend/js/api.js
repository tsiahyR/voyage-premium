const API_BASE = window.location.origin.includes('localhost')
    ? 'http://localhost:5000/api'
    : 'https://voyage-premium.onrender.com/api';

function getToken(){
    return localStorage.getItem('vp_token');
}
function getUtilisateur(){
    const donnees = localStorage.getItem('vp_utilisateur');
    return donnees ? JSON.parse(donnees) : null;
}
function seConnecter(token, utilisateur){
    localStorage.setItem('vp_token', token);
    localStorage.setItem('vp_utilisateur', JSON.stringify(utilisateur));
}
function seDeconnecter(){
    localStorage.removeItem('vp_token');
    localStorage.removeItem('vp_utilisateur');
    sessionStorage.clear();

    window.location.href = '/1.html';
}
function estConnecte(){
    return !!getToken();
}
function exigerConnexion(){
    if(!estConnecte()){
        window.location.href = '/2.html';
    }
}
function exigerAdmin(){
    const u = getUtilisateur();
    if(!estConnecte() || !u || u.role !== 'admin'){
        window.location.href = '/2.html';
    }
}

window.addEventListener('pageshow', function(evenement){
    if(evenement.persisted){
        window.location.reload();
    }
});

async function appelApi(endpoint, methode = 'GET', corps = null, avecToken = true){
    const options = {
        method: methode,
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store'
    };
    if(avecToken && getToken()){
        options.headers['Authorization'] = 'Bearer ' + getToken();
    }
    if(corps){
        options.body = JSON.stringify(corps);
    }

    const reponse = await fetch(`${API_BASE}${endpoint}`, options);
    const donnees = await reponse.json().catch(() => ({}));

    if(!reponse.ok){
        throw new Error(donnees.message || 'Une erreur est survenue.');
    }
    return donnees;
}

function afficherMessage(texte, type = 'success'){
    const conteneur = document.createElement('div');
    conteneur.className = `alert alert-${type === 'success' ? 'success' : 'danger'} vp-toast shadow`;
    conteneur.style.fontFamily = "'Baloo 2', sans-serif";
    conteneur.style.fontWeight = '700';
    conteneur.textContent = texte;
    document.body.appendChild(conteneur);
    setTimeout(() => conteneur.remove(), 3500);
}
