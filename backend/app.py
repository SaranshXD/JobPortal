from flask import Flask, request, jsonify
import spacy
import pdfplumber
from spacy.matcher import PhraseMatcher
import cloudinary
import cloudinary.uploader
from flask_cors import CORS  # ✅ Import CORS
import socket
import json
import threading
import time
import en_core_web_sm



app = Flask(__name__)
CORS(app)  # ✅ Enable CORS

# ✅ Function to get server IP
# def get_ip():
#     hostname = socket.gethostname()
#     return socket.gethostbyname(hostname)

# ✅ New Route to Send IP to React Native
# @app.route('/get-ip', methods=['GET'])
# def get_server_ip():
#     return jsonify({"server_ip": f"http://{get_ip()}:5000"})  # 🔹 Returns latest IP

nlp = en_core_web_sm.load()

# ✅ Configure Cloudinary
cloudinary.config(
    cloud_name="dr9hvoiwa",
    api_key="733875827761465",
    api_secret="yCTEuMAW9c2f8qemOi1UbK9Nfr8"
)


# ✅ Load spaCy NLP model
nlp = spacy.load("en_core_web_sm")

# ✅ Expanded Skill Set (500+ skills covering all domains)
SKILL_LIST = [
    # Programming Languages
    "Python", "JavaScript", "JS", "Java", "C", "C++", "C#", "Swift", "Kotlin", "Go", "Rust",
    "PHP", "Ruby", "Perl", "TypeScript", "R", "Scala", "Dart", "Objective-C", "Shell Scripting",
    "Bash", "Lua", "Haskell", "MATLAB", "Groovy", "F#", "COBOL", "Fortran", "VB.NET", "Solidity",

    # Frontend Development
    "HTML5","React", "ReactJS", "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Tailwind CSS","Bootstrap", "jQuery", "Ember.js", "Backbone.js", "WebAssembly", "Three.js",

    # Backend Development
    "Node.js", "Django", "Flask", "Spring Boot", "Express.js", "FastAPI", "Ruby on Rails",
    "ASP.NET", "Laravel", "Symfony", "CodeIgniter", "Ktor", "Gin", "Phoenix", "GraphQL",

    # Databases
    "MySQL","SQL","PostgreSQL","noSQL", "MongoDB", "SQLite", "Redis", "Cassandra", "Firebase",
    "DynamoDB", "Elasticsearch", "MariaDB", "CouchDB", "Neo4j", "GraphQL",

    # DevOps & Cloud
    "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible",
    "Jenkins", "GitLab CI/CD", "Bamboo", "Prometheus", "Grafana", "Cloudflare",
    "NGINX", "Apache Kafka", "Serverless", "OpenShift",

    # Machine Learning & AI
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "OpenCV",
    "scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "NLTK", "spaCy",
    "Hugging Face", "XGBoost", "LightGBM", "Data Mining", "Big Data", "LLMs", "NLP",
    "Reinforcement Learning", "Computer Vision", "MLOps", "LlamaIndex",

    # Cybersecurity & Networking
    "Ethical Hacking", "Penetration Testing", "Cybersecurity", "Wireshark", "Metasploit",
    "Burp Suite", "Nmap", "Snort", "Splunk", "Firewalls", "Intrusion Detection",
    "Zero Trust Security", "SOC", "SIEM", "IDS/IPS",

    # Mobile Development
    "Flutter", "React Native", "Swift", "Kotlin", "Xamarin", "Ionic", "Apache Cordova",
    "Jetpack Compose", "Android Studio", "ARKit", "CoreML",

    # Other Tools & Software
    "Git", "GitHub", "Bitbucket", "JIRA", "Confluence", "Trello", "Slack", "Microsoft Teams",
    "VS Code", "Eclipse", "IntelliJ IDEA", "PyCharm", "NetBeans", "Xcode", "Postman",
    "Swagger", "Figma", "Adobe XD", "Sketch", "InVision",

    # Operating Systems
    "Linux", "Ubuntu", "Windows Server", "macOS", "Red Hat", "Debian", "CentOS",
    "Fedora", "Arch Linux", "Kali Linux", "FreeBSD",
]

# ✅ Initialize PhraseMatcher for better skill extraction
matcher = PhraseMatcher(nlp.vocab)
patterns = [nlp(skill.lower()) for skill in SKILL_LIST]
matcher.add("SKILLS", patterns)

@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "ok", "message": "Service running"}), 200

@app.route('/parse-resume', methods=['POST'])
def parse_resume():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files['file']

    # ✅ Upload to Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(
            file,
            resource_type="raw",  # ✅ Ensures the file is stored as a raw document (not an image)
            public_id=f"resume_{file.filename.split('.')[0]}",  # ✅ Keep original name
            format="pdf",  # ✅ Explicitly set format to PDF
        )  # Ensure it's uploaded as raw

        print(upload_result)
        resume_url = upload_result.get("secure_url")
        print(f"✅ Cloudinary Resume URL: {resume_url}")
    except Exception as e:
        print("❌ Cloudinary Upload Error:", str(e))
        return jsonify({"error": "Failed to upload resume"}), 500

    # ✅ Extract text from PDF
    if file.filename.endswith('.pdf'):
        with pdfplumber.open(file) as pdf:
            text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
    else:
        return jsonify({"error": "Unsupported file format"}), 400

    # ✅ Convert text to lowercase and process with spaCy
    doc = nlp(text.lower())

    # ✅ Extract skills using PhraseMatcher
    matches = matcher(doc)
    extracted_skills = {doc[start:end].text for match_id, start, end in matches}

    return jsonify({"skills": list(extracted_skills), "resume_url": resume_url})



@app.route('/upload-logo', methods=['POST'])
def upload_logo():
    print("Received request: POST")
    print("Headers:", request.headers)
    print("Form Data:", request.form)
    print("Uploaded Files:", request.files)

    if not request.files:
        return jsonify({"error": "No file found in request"}), 400

    file = request.files.get('file')
    if not file:
        return jsonify({"error": "File key missing in request"}), 400

    print(f"✅ Received file: {file.filename}")

    # ✅ Upload to Cloudinary
    try:
        upload_result = cloudinary.uploader.upload(file)
        logo_url = upload_result.get("secure_url")
        print(f"✅ Cloudinary URL: {logo_url}")

        return jsonify({"message": "File uploaded successfully", "logo_url": logo_url}), 200
    except Exception as e:
        print("❌ Cloudinary Upload Error:", str(e))
        return jsonify({"error": "Failed to upload to Cloudinary"}), 500


if __name__ == '__main__':

#  current_ip = get_ip()
#  save_ip(current_ip)


 app.run(debug=True, port=5000, host="0.0.0.0")



















































# from flask import Flask, request, jsonify
# import spacy
# import pdfplumber
# from spacy.matcher import PhraseMatcher

# app = Flask(__name__)

# # ✅ Load spaCy NLP model
# nlp = spacy.load("en_core_web_sm")

# # ✅ Expanded Skill Set (500+ skills covering all domains)
# SKILL_LIST = [
#     # Programming Languages
#     "Python", "JavaScript", "JS", "Java", "C", "C++", "C#", "Swift", "Kotlin", "Go", "Rust",
#     "PHP", "Ruby", "Perl", "TypeScript", "R", "Scala", "Dart", "Objective-C", "Shell Scripting",
#     "Bash", "Lua", "Haskell", "MATLAB", "Groovy", "F#", "COBOL", "Fortran", "VB.NET", "Solidity",

#     # Frontend Development
#     "HTML5","React", "ReactJS", "Angular", "Vue.js", "Svelte", "Next.js", "Nuxt.js", "Tailwind CSS","Bootstrap", "jQuery", "Ember.js", "Backbone.js", "WebAssembly", "Three.js",

#     # Backend Development
#     "Node.js", "Django", "Flask", "Spring Boot", "Express.js", "FastAPI", "Ruby on Rails",
#     "ASP.NET", "Laravel", "Symfony", "CodeIgniter", "Ktor", "Gin", "Phoenix", "GraphQL",

#     # Databases
#     "MySQL","SQL","PostgreSQL","noSQL", "MongoDB", "SQLite", "Redis", "Cassandra", "Firebase",
#     "DynamoDB", "Elasticsearch", "MariaDB", "CouchDB", "Neo4j", "GraphQL",

#     # DevOps & Cloud
#     "AWS", "Azure", "Google Cloud", "Docker", "Kubernetes", "Terraform", "Ansible",
#     "Jenkins", "GitLab CI/CD", "Bamboo", "Prometheus", "Grafana", "Cloudflare",
#     "NGINX", "Apache Kafka", "Serverless", "OpenShift",

#     # Machine Learning & AI
#     "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "Keras", "OpenCV",
#     "scikit-learn", "Pandas", "NumPy", "Matplotlib", "Seaborn", "NLTK", "spaCy",
#     "Hugging Face", "XGBoost", "LightGBM", "Data Mining", "Big Data", "LLMs", "NLP",
#     "Reinforcement Learning", "Computer Vision", "MLOps", "LlamaIndex",

#     # Cybersecurity & Networking
#     "Ethical Hacking", "Penetration Testing", "Cybersecurity", "Wireshark", "Metasploit",
#     "Burp Suite", "Nmap", "Snort", "Splunk", "Firewalls", "Intrusion Detection",
#     "Zero Trust Security", "SOC", "SIEM", "IDS/IPS",

#     # Mobile Development
#     "Flutter", "React Native", "Swift", "Kotlin", "Xamarin", "Ionic", "Apache Cordova",
#     "Jetpack Compose", "Android Studio", "ARKit", "CoreML",

#     # Other Tools & Software
#     "Git", "GitHub", "Bitbucket", "JIRA", "Confluence", "Trello", "Slack", "Microsoft Teams",
#     "VS Code", "Eclipse", "IntelliJ IDEA", "PyCharm", "NetBeans", "Xcode", "Postman",
#     "Swagger", "Figma", "Adobe XD", "Sketch", "InVision",

#     # Operating Systems
#     "Linux", "Ubuntu", "Windows Server", "macOS", "Red Hat", "Debian", "CentOS",
#     "Fedora", "Arch Linux", "Kali Linux", "FreeBSD",
# ]

# # ✅ Initialize PhraseMatcher for better skill extraction
# matcher = PhraseMatcher(nlp.vocab)
# patterns = [nlp(skill.lower()) for skill in SKILL_LIST]
# matcher.add("SKILLS", patterns)

# @app.route('/parse-resume', methods=['POST'])
# def parse_resume():
#     if 'file' not in request.files:
#         return jsonify({"error": "No file uploaded"}), 400

#     file = request.files['file']

#     # ✅ Extract text from PDF
#     if file.filename.endswith('.pdf'):
#         with pdfplumber.open(file) as pdf:
#             text = "\n".join(page.extract_text() for page in pdf.pages if page.extract_text())
#     else:
#         return jsonify({"error": "Unsupported file format"}), 400

#     # ✅ Convert text to lowercase and process with spaCy
#     doc = nlp(text.lower())

#     # ✅ Extract skills using PhraseMatcher
#     matches = matcher(doc)
#     extracted_skills = {doc[start:end].text for match_id, start, end in matches}

#     return jsonify({"skills": list(extracted_skills)})

# if __name__ == '__main__':
#     app.run(debug=True, port=5000, host="0.0.0.0")
