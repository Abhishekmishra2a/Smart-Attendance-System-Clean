import os

# Render par GPU disable aur memory usage kam
os.environ["CUDA_VISIBLE_DEVICES"] = "-1"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["OMP_NUM_THREADS"] = "1"
os.environ["TF_NUM_INTRAOP_THREADS"] = "1"
os.environ["TF_NUM_INTEROP_THREADS"] = "1"

from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from pymongo import MongoClient
from dotenv import load_dotenv
import base64
import tempfile
import urllib.request
import urllib.error
import json

load_dotenv()

app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": [
            "https://smart-attendance-system-clean.onrender.com"
        ]
    }
})

MONGO_URI = os.getenv("MONGO_URI")
NODE_API = os.getenv(
    "NODE_API",
    "https://smart-attendance-backend-te37.onrender.com"
)

if not MONGO_URI:
    raise ValueError("MONGO_URI environment variable is missing")

client = MongoClient(MONGO_URI)
db = client["attendance_system"]
students_collection = db["students"]


def save_base64_image(base64_image):
    if not base64_image:
        raise ValueError("Empty image received")

    if "," in base64_image:
        base64_image = base64_image.split(",", 1)[1]

    image_data = base64.b64decode(base64_image)

    temp_file = tempfile.NamedTemporaryFile(
        delete=False,
        suffix=".jpg"
    )
    temp_file.write(image_data)
    temp_file.close()

    return temp_file.name


def delete_temp_file(file_path):
    if file_path and os.path.exists(file_path):
        os.remove(file_path)


def mark_attendance(student_id):
    url = f"{NODE_API}/api/attendance/mark"

    data = json.dumps({
        "studentId": str(student_id)
    }).encode("utf-8")

    request_object = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            request_object,
            timeout=30
        ) as response:
            return json.loads(response.read().decode("utf-8"))

    except urllib.error.HTTPError as error:
        error_body = error.read().decode("utf-8")

        return {
            "success": False,
            "message": "Node API returned an error",
            "status": error.code,
            "error": error_body
        }

    except Exception as error:
        return {
            "success": False,
            "message": "Unable to connect to Node API",
            "error": str(error)
        }


@app.route("/", methods=["GET"])
def home():
    return jsonify({
        "message": "Python Face API Running 🚀"
    })


@app.route("/test", methods=["GET"])
def test():
    return jsonify({
        "message": "DeepFace API test route working ✅"
    })


@app.route("/recognize", methods=["POST"])
def recognize_face():
    live_image_path = None

    try:
        data = request.get_json(silent=True)

        if not data or not data.get("image"):
            return jsonify({
                "success": False,
                "message": "Image is required"
            }), 400

        live_image_path = save_base64_image(data["image"])


        students = list(students_collection.find({
            "image": {
                "$exists": True,
                "$nin": ["", None]
            }
        }))

        if not students:
            return jsonify({
                "success": False,
                "message": "No registered student images found"
            }), 404

        best_match = None
        best_distance = float("inf")

        for student in students:
            saved_image_path = None

            try:
                saved_image_path = save_base64_image(student["image"])

                result = DeepFace.verify(
                  img1_path=live_image_path,
                  img2_path=saved_image_path,
                  model_name="SFace",
                  detector_backend="skip",
                  distance_metric="cosine",
                  enforce_detection=False,
                  align=False,
                  silent=True
                )

                verified = result.get("verified", False)
                distance = float(result.get("distance", 999))

                print(
                    student.get("name"),
                    "verified:",
                    verified,
                    "distance:",
                    distance,
                    "threshold:",
                    result.get("threshold")
                )

                if verified and distance < best_distance:
                    best_distance = distance
                    best_match = student

            except Exception as error:
                print(
                    "Student compare error for",
                    student.get("name"),
                    ":",
                    str(error)
                )

            finally:
                delete_temp_file(saved_image_path)

        if not best_match:
            return jsonify({
                "success": False,
                "message": "Face not recognized. Register a clear front-facing photo and try again.",
                "distance": None
            }), 404

        attendance_response = mark_attendance(best_match["_id"])

        return jsonify({
            "success": True,
            "message": "Face recognized",
            "student": {
                "_id": str(best_match["_id"]),
                "name": best_match.get("name"),
                "rollNumber": best_match.get("rollNumber"),
                "email": best_match.get("email"),
                "department": best_match.get("department")
            },
            "distance": best_distance,
            "attendance": attendance_response
        })

    except Exception as error:
        print("Recognition error:", str(error))

        return jsonify({
            "success": False,
            "message": "Face recognition error",
            "error": str(error)
        }), 500

    finally:
        delete_temp_file(live_image_path)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False
    )