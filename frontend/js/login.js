function basculerFormulaire(vers){
    document.getElementById('formConnexion').classList.toggle('d-none', vers === 'inscription');
    document.getElementById('formInscription').classList.toggle('d-none', vers === 'connexion');
}

document.getElementById('formConnexion').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('emailConnexion').value.trim();
    const mot_de_passe = document.getElementById('motDePasseConnexion').value;

    try {
        const donnees = await appelApi('/auth/connexion', 'POST', { email, mot_de_passe }, false);
        seConnecter(donnees.token, donnees.utilisateur);
        afficherMessage('Connexion reussie !');
        setTimeout(() => {
            window.location.href = donnees.utilisateur.role === 'admin' ? '/admin/dashboard.html' : '/3.html';
        }, 600);
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
});

document.getElementById('formInscription').addEventListener('submit', async (e) => {
    e.preventDefault();
    const corps = {
        nom: document.getElementById('nomInscription').value.trim(),
        prenom: document.getElementById('prenomInscription').value.trim(),
        email: document.getElementById('emailInscription').value.trim(),
        mot_de_passe: document.getElementById('motDePasseInscription').value,
        telephone: document.getElementById('telephoneInscription').value.trim(),
        sexe: document.getElementById('sexeInscription').value
    };

    try {
        const donnees = await appelApi('/auth/inscription', 'POST', corps, false);
        seConnecter(donnees.token, donnees.utilisateur);
        afficherMessage('Compte cree avec succes !');
        setTimeout(() => window.location.href = '/3.html', 600);
    } catch (erreur) {
        afficherMessage(erreur.message, 'danger');
    }
});
