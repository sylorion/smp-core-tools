import re
import numpy as np
from sklearn.feature_extraction.text import CountVectorizer
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import make_pipeline
from sklearn.model_selection import train_test_split, cross_val_score

# Prétraitement des données
def preprocess_text(text):
    text = re.sub(r'[^0-9\s\+\-\(\)]', '', text)  # Supprimer les caractères non pertinents
    text = ' '.join(text.split())  # Normaliser les espaces
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

# Jeu de données élargi pour le modèle de machine learning
texts = [
    "Call me at +1234567890", 
    "My number is (123) 456-7890", 
    "This is not a phone number",
    "Reach me at 123-456-7890",
    "No phone number here!",
    "Contact: +44 7911 123456",
    "Fax number is 098-765-4321",
    "Emergency: (555) 123-4567",
    "Another number: 1800-123-456",
    "Nothing here either",
    "+49 170 1234567 is my German number",
    "You can reach me at 202-555-0173",
    "Here's another one: (333) 333-3333",
    "No valid phone in this one!",
    "My phone is 555 444 3333",
    "Your number 123 321 1234 was called",
    "987-654-3210 is not in service",
    "Dial +1 (800) 555-1212 for information",
    "No phone here",
    "555-123-4567 and 555-765-4321 are both valid",
    "Another invalid text"
]
labels = [
    1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 0
]  # 1 pour numéro de téléphone, 0 sinon

# Préparation des données
vectorizer = CountVectorizer()
X = vectorizer.fit_transform(texts)

# Entraînement du modèle plus complexe
model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X, labels)

# Pipeline de prédiction
pipeline = make_pipeline(vectorizer, model)

# Validation croisée pour évaluer la performance du modèle
scores = cross_val_score(pipeline, texts, labels, cv=5)
print(f"Cross-validation scores: {scores}")
print(f"Average cross-validation score: {np.mean(scores)}")

# Détection avec modèle de machine learning
def ml_phone_detection(text):
    preprocessed_text = preprocess_text(text)
    prediction = pipeline.predict([preprocessed_text])
    if prediction[0] == 1:
        return [preprocessed_text]
    return []

# Validation des numéros de téléphone
def validate_phone_number(phone):
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
text = "Contactez-moi au +1234567890 ou (123) 456-7890. Ce n'est pas un numéro : 123-ABC-7890, et enfin voici le mien : +33 6 4b7 8^^9 6/2 7_8"
detected_numbers = detect_phone_numbers(text)
print(detected_numbers)
