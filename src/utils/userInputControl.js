function extractContacts(text) {
    // Prétraiter le texte pour enlever les espaces indésirables dans les adresses e-mail
    text = text.replace(/([a-zA-Z0-9._%+-]+)\s+(@\s*[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g, '$1$2');

    // Convertir les numéros écrits en toutes lettres en chiffres
    text = convertWordsToNumbers(text);

    // Définir les expressions régulières pour les numéros de téléphone et les adresses e-mail
    const phonePattern = /\+?\d{1,3}?[\s.-]?\(?\d{1,4}?\)?(?:[\s.-]?\d){6,14}/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Utiliser la méthode match pour trouver toutes les correspondances dans le texte
    const phoneNumbers = text.match(phonePattern);
    const emails = text.match(emailPattern);

    // Si aucune correspondance trouvée, retourner false
    if ((!phoneNumbers || phoneNumbers.length === 0) && (!emails || emails.length === 0)) {
        console.log("Aucun numéro de téléphone ou adresse e-mail trouvé.");
        return false;
    }

    // Formater et afficher les numéros de téléphone trouvés
    if (phoneNumbers && phoneNumbers.length > 0) {
        phoneNumbers.forEach((phoneNumber) => {
            const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
            console.log("Numéro de téléphone trouvé :", formattedPhoneNumber);
        });
    }

    // Afficher les adresses e-mail trouvées
    if (emails && emails.length > 0) {
        emails.forEach((email) => {
            console.log("Adresse e-mail trouvée :", email);
        });
    }

    // Retourner true indiquant que des contacts ont été trouvés
    return true;
}

function formatPhoneNumber(phoneNumber) {
    // Enlever tous les caractères non numériques sauf le signe plus en tête
    const cleaned = phoneNumber.replace(/[^\d+]/g, '');

    // Déterminer si le numéro commence par un signe plus
    const startsWithPlus = cleaned.startsWith('+');

    // Si le numéro commence par un plus, garder le plus, sinon commencer par une chaîne vide
    const prefix = startsWithPlus ? '+' : '';
    const number = startsWithPlus ? cleaned.slice(1) : cleaned;

    // Grouper les chiffres par paires et les joindre avec des espaces
    const grouped = number.match(/.{1,2}/g).join(' ');

    // Retourner le numéro formaté avec le préfixe original
    return prefix + grouped;
}

function convertWordsToNumbers(text) {
    const numbersMap = {
        "zero": "0", "un": "1", "deux": "2", "trois": "3", "quatre": "4", "cinq": "5", "six": "6", "sept": "7", "huit": "8", "neuf": "9"
    };

    // Convertir chaque mot en chiffre si trouvé dans le dictionnaire
    const words = text.split(/\b/);
    const convertedText = words.map(word => numbersMap[word.toLowerCase()] || word).join('');

    return convertedText;
}

// Exemple d'utilisation
const sampleText = "voici mon numéro de téléphone : +33 6 45 85 65 68, zero six neuf deux trois sept deux un zero sept, et mon adresse e-mail : test@example.com et une autre : contact@domaine.fr";
const hasContacts = extractContacts(sampleText);


