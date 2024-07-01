import re
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import make_pipeline

# Prétraitement des données
def preprocess_text(text):
    # Suppression des caractères spéciaux, sauf ceux pertinents pour les numéros de téléphone
    text = re.sub(r'[^0-9\s\+\-\(\)]', '', text)
    # Normalisation des espaces
    text = ' '.join(text.split())
    return text

# Règles de détection de base avec regex
def regex_phone_detection(text):
    phone_patterns = [
        r'\+?\d[\d -]{8,}\d',  # Ex: +1234567890, 123-456-7890
        r'\(\d{3}\)\s*\d{3}-\d{4}',  # Ex: (123) 456-7890
        r'\d{2,4}[\s-]\d{2,4}[\s-]\d{2,4}'  # Ex: 1234-567-890
    ]
    
    phones = []
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        phones.extend(matches)
    return phones

# Exemple de jeu de données pour le modèle de machine learning
texts = ["Call me at +1234567890", "My number is (123) 456-7890", "This is not a phone number"]
labels = [1, 1, 0]  # 1 pour numéro de téléphone, 0 sinon

# Préparation des données
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

# Entraînement du modèle
model = LogisticRegression()
model.fit(X, labels)

# Pipeline de prédiction
pipeline = make_pipeline(vectorizer, model)

# Détection avec modèle de machine learning
def ml_phone_detection(text):
    text_segments = text.split()
    predictions = pipeline.predict(text_segments)
    detected_phones = [seg for seg, pred in zip(text_segments, predictions) if pred == 1]
    return detected_phones

# Validation des numéros de téléphone
def validate_phone_number(phone):
    # Ajouter des règles supplémentaires pour valider les numéros de téléphone
    return re.match(r'^\+?\d[\d\s\-\(\)]{8,}\d$', phone) is not None

# Détection combinée des numéros de téléphone
def detect_phone_numbers(text):
    preprocessed_text = preprocess_text(text)
    
    # Détection avec regex
    regex_phones = regex_phone_detection(preprocessed_text)
    
    # Détection avec modèle de ML
    ml_phones = ml_phone_detection(preprocessed_text)
    
    # Combiner les résultats et valider
    all_phones = set(regex_phones + ml_phones)
    valid_phones = [phone for phone in all_phones if validate_phone_number(phone)]
    
    return valid_phones

# Exemple d'utilisation
text = "06 45 98 96 65"
detected_numbers = detect_phone_numbers(text)
print(detected_numbers)


