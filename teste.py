from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
import base64
import cv2
import numpy as np

app = Flask(__name__)
CORS(app)

@app.route('/analyze-emotion', methods=['POST'])
def analyze_emotion():
    data = request.json
    image_data = data['image'].split(',')[1]
    image_bytes = base64.b64decode(image_data)
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    traducao_emocoes = {
        'angry': 'Raiva',
        'disgust': 'Nojo',
        'fear': 'Medo',
        'happy': 'Feliz',
        'sad': 'Triste',
        'surprise': 'Surpresa',
        'neutral': 'Neutro'
    }

    try:
        resultado = DeepFace.analyze(frame, actions=['emotion'])
        
        emocao_dominante = resultado[0]['dominant_emotion']
        emocoes_detalhadas = resultado[0]['emotion']
        face_rect = resultado[0]['region']

        emocao_dominante_pt = traducao_emocoes.get(emocao_dominante, 'Desconhecida')

        # Agora, o backend envia os dados originais (chaves em inglês)
        return jsonify({
            'emocao_dominante_pt': emocao_dominante_pt,
            'emocoes_detalhadas': emocoes_detalhadas,
            'face_rect': face_rect
        })
    except Exception as e:
        print(f"Erro na análise: {e}")
        return jsonify({'error': 'Não foi possível detectar a face.'})

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)