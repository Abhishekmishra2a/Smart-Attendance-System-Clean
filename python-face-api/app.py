from flask import Flask, request, jsonify
from flask_cors import CORS
from deepface import DeepFace
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import base64
import tempfile
import urllib.request
import json

load_dotenv()

app = Flask(__name__)
CORS(app)

MONGO_URI = os.getenv("MONGO_URI")
NODE_API = os.getenv("NODE_API", "http://localhost:5000")

client = MongoClient(MONGO_URI)
db = client["attendance_system"]
students_collection = db["students"]


def save_base64_image(base64_image):
    if "," in base64_image:
        base64_image = base64_image.split(",")[1]

    image_data = base64.b64decode(base64_image)
    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".jpg")
    temp_file.write(image_data)
    temp_file.close()
    return temp_file.name


def mark_attendance(student_id):
    url = f"{NODE_API}/api/attendance/mark"

    data = json.dumps({"studentId": str(student_id)}).encode("utf-8")

    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST"
    )

    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode("utf-8"))
    except Exception as error:
        return {
            "message": "Attendance already marked for today or Node API error",
            "error": str(error)
        }


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "Python Face API Running 🚀"})


@app.route("/test", methods=["GET"])
def test():
    return jsonify({"message": "DeepFace API test route working ✅"})


@app.route("/recognize", methods=["POST"])
def recognize_face():
    live_image_path = None

    try:
        data = request.get_json()

        if not data or "image" not in data:
            return jsonify({
                "success": False,
                "message": "Image is required"
            }), 400

        live_image_path = save_base64_image(data["image"])

        # First check: live camera image me face hai ya nahi
        try:
            DeepFace.extract_faces(
                img_path=live_image_path,
                detector_backend="opencv",
                enforce_detection=True
            )
        except Exception:
            if live_image_path and os.path.exists(live_image_path):
                os.remove(live_image_path)

            return jsonify({
                "success": False,
                "message": "No face detected. Please stand in front of camera."
            }), 404

        students = list(students_collection.find({
            "image": {"$exists": True, "$ne": ""}
        }))

        if len(students) == 0:
            if live_image_path and os.path.exists(live_image_path):
                os.remove(live_image_path)

            return jsonify({
                "success": False,
                "message": "No registered student images found"
            }), 404

        best_match = None
        best_distance = 999

        for student in students:
            saved_image_path = None

            try:
                saved_image_path = save_base64_image(student["image"])

                result = DeepFace.verify(
                    img1_path=live_image_path,
                    img2_path=saved_image_path,
                    model_name="VGG-Face",
                    detector_backend="opencv",
                    enforce_detection=True
                )

                verified = result.get("verified", False)
                distance = result.get("distance", 999)

                print(student.get("name"), "verified:", verified, "distance:", distance)

                if verified and distance < best_distance:
                    best_distance = distance
                    best_match = student

            except Exception as error:
                print("Student compare error:", error)

            finally:
                if saved_image_path and os.path.exists(saved_image_path):
                    os.remove(saved_image_path)

        if live_image_path and os.path.exists(live_image_path):
            os.remove(live_image_path)

        if best_match and best_distance < 0.40:
            attendance_response = mark_attendance(best_match["_id"])

            return jsonify({
                "success": True,
                "message": "Attendance marked successfully",
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

        return jsonify({
            "success": False,
            "message": "Face not recognized. Please try again.",
            "distance": best_distance
        }), 404

    except Exception as error:
        print("Recognition error:", error)

        if live_image_path and os.path.exists(live_image_path):
            os.remove(live_image_path)

        return jsonify({
            "success": False,
            "message": "Face recognition error",
            "error": str(error)
        }), 500


if __name__ == "__main__":
    app.run(port=8000, debug=True)