function formaterDate(dateStr){
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR');
}
