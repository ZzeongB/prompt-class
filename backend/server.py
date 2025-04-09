from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000"])


@app.route("/generate", methods=["POST"])
def generate():
    data = request.get_json()
    print("Received data:", data)

    print("Sucessfully received data")

    return jsonify({"image": "hi"})


if __name__ == "__main__":
    app.run(debug=True, use_reloader=False)
